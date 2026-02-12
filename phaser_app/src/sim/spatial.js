import { COLLISION_CELL_SIZE } from "./constants.js";

function rangeForBall(ball, cellSize) {
  return {
    minX: Math.floor((ball.x - ball.r) / cellSize),
    maxX: Math.floor((ball.x + ball.r) / cellSize),
    minY: Math.floor((ball.y - ball.r) / cellSize),
    maxY: Math.floor((ball.y + ball.r) / cellSize)
  };
}

export function buildCollisionPairs(balls, cellSize = COLLISION_CELL_SIZE) {
  const cells = new Map();

  for (let i = 0; i < balls.length; i += 1) {
    const bounds = rangeForBall(balls[i], cellSize);
    for (let cx = bounds.minX; cx <= bounds.maxX; cx += 1) {
      for (let cy = bounds.minY; cy <= bounds.maxY; cy += 1) {
        const key = `${cx}:${cy}`;
        const bucket = cells.get(key);
        if (bucket) {
          bucket.push(i);
        } else {
          cells.set(key, [i]);
        }
      }
    }
  }

  const seenPairs = new Set();
  const pairs = [];

  for (const bucket of cells.values()) {
    if (bucket.length < 2) {
      continue;
    }
    for (let i = 0; i < bucket.length; i += 1) {
      for (let j = i + 1; j < bucket.length; j += 1) {
        const a = bucket[i];
        const b = bucket[j];
        const key = a < b ? `${a}:${b}` : `${b}:${a}`;
        if (seenPairs.has(key)) {
          continue;
        }
        seenPairs.add(key);
        pairs.push([a, b]);
      }
    }
  }

  return pairs;
}
