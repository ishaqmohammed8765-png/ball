function q(value) {
  return value.toFixed(6);
}

function fnv1a32(input) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function hashState(state) {
  const living = state.balls.filter((b) => b.hp > 0).sort((a, b) => a.id - b.id);
  const rows = [`step=${state.stepCount}`];
  for (let i = 0; i < living.length; i += 1) {
    const b = living[i];
    rows.push(
      `${b.id}|${q(b.x)}|${q(b.y)}|${q(b.vx)}|${q(b.vy)}|${q(b.hp)}|${b.abilityType}|${q(b.cooldowns.shieldReadyIn)}|${q(
        b.cooldowns.dashIn
      )}|${q(b.status.slowTimer)}`
    );
  }
  return fnv1a32(rows.join("\n"));
}
