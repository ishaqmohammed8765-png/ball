import { ArenaSimulation } from "../src/sim.js";

const steps = 10000;
const sim = new ArenaSimulation();
sim.stepMany(steps);
const hash = sim.hashState();

console.log(`steps=${steps}`);
console.log(`alive=${sim.getSnapshot().aliveCount}`);
console.log(`hash=${hash}`);
