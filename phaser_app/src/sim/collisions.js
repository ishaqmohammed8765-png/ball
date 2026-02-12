function pairSort(a, b) {
  if (a.idA !== b.idA) {
    return a.idA - b.idA;
  }
  return a.idB - b.idB;
}

export function collectCollisions(balls) {
  const pairs = [];
  for (let i = 0; i < balls.length; i += 1) {
    const a = balls[i];
    for (let j = i + 1; j < balls.length; j += 1) {
      const b = balls[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const minDist = a.radius + b.radius;
      const distSq = dx * dx + dy * dy;
      if (distSq <= minDist * minDist) {
        pairs.push({
          idA: a.id,
          idB: b.id
        });
      }
    }
  }
  pairs.sort(pairSort);
  return pairs;
}

export function getCollisionNormal(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-12) {
    return { nx: 1, ny: 0, dist: 0 };
  }
  return { nx: dx / dist, ny: dy / dist, dist };
}

export function resolveCircleCollision(a, b, constants, normal) {
  const invMassA = 1 / a.mass;
  const invMassB = 1 / b.mass;
  const minDist = a.radius + b.radius;
  const dist = normal.dist;
  const penetration = minDist - dist;

  if (penetration > 0) {
    const correctionMagnitude =
      (Math.max(penetration - constants.slop, 0) / (invMassA + invMassB)) * constants.positionalPercent;
    const cx = correctionMagnitude * normal.nx;
    const cy = correctionMagnitude * normal.ny;
    a.x -= cx * invMassA;
    a.y -= cy * invMassA;
    b.x += cx * invMassB;
    b.y += cy * invMassB;
  }

  const relativeAlongNormal = (a.vx - b.vx) * normal.nx + (a.vy - b.vy) * normal.ny;
  if (relativeAlongNormal <= 0) {
    return;
  }

  const impulseMagnitude = ((1 + constants.restitution) * relativeAlongNormal) / (invMassA + invMassB);
  const impulseX = impulseMagnitude * normal.nx;
  const impulseY = impulseMagnitude * normal.ny;

  a.vx -= impulseX * invMassA;
  a.vy -= impulseY * invMassA;
  b.vx += impulseX * invMassB;
  b.vy += impulseY * invMassB;
}
