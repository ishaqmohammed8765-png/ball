import { CLASS_DEFS, CLASS_KEYS } from "../src/sim/constants.js";

function effectiveScore(classKey) {
  const def = CLASS_DEFS[classKey];
  const regen = def.regenPerSecond ?? 0;
  const lifesteal = def.lifesteal ?? 0;
  const shield = def.shieldReductionMult ? (1 - def.shieldReductionMult) * 0.18 : 0;
  const offense = def.outgoingDamageMult * (1 + lifesteal * 0.4);
  const defense = (1 / def.incomingDamageMult) * (1 + regen * 0.06 + shield);
  const mobility = (def.speed / 220) * (def.wallBounceMult ?? 1);
  const bulk = (def.maxHp / 100) * (def.mass / 1.0);
  return offense * 0.34 + defense * 0.32 + mobility * 0.18 + bulk * 0.16;
}

function run() {
  const ranking = CLASS_KEYS.map((classKey) => ({
    classKey,
    label: CLASS_DEFS[classKey].label,
    score: Number(effectiveScore(classKey).toFixed(4))
  })).sort((a, b) => b.score - a.score);

  console.log("Deterministic Balance Harness");
  console.log("=============================");
  for (const row of ranking) {
    console.log(`${row.label.padEnd(10)} score=${row.score}`);
  }

  const spread = ranking[0].score - ranking[ranking.length - 1].score;
  console.log("-----------------------------");
  console.log(`Spread: ${spread.toFixed(4)} (lower is more balanced)`);
}

run();
