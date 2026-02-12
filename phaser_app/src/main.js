import Phaser from "phaser";
import { hashState } from "./sim/hash.js";
import { createInitialState, SIM_DT, SIM_CONSTANTS } from "./sim/state.js";
import { stepSimulation } from "./sim/step.js";
import { createHud } from "./ui/hud.js";
import { createRenderer } from "./ui/render.js";

class GameScene extends Phaser.Scene {
  constructor() {
    super("game");
    this.simState = createInitialState();
    this.accumulator = 0;
    this.fastForward = false;
    this.hud = null;
    this.renderer = null;
  }

  create() {
    this.hud = createHud();
    this.renderer = createRenderer(this, this.simState);

    this.bindUiEvents();
    this.hud.setStats(this.simState.stepCount, this.simState.balls.length);
    this.hud.setHash("-");
  }

  bindUiEvents() {
    const resetBtn = document.getElementById("reset-btn");
    const ffBtn = document.getElementById("ff-btn");
    const hashBtn = document.getElementById("hash-btn");

    resetBtn.addEventListener("click", () => this.resetSimulation());
    ffBtn.addEventListener("click", () => this.toggleFastForward());
    hashBtn.addEventListener("click", () => this.runDeterminismTest());

    this.input.keyboard.on("keydown-R", () => this.resetSimulation());
    this.input.keyboard.on("keydown-F", () => this.toggleFastForward());
    this.input.keyboard.on("keydown-H", () => this.runDeterminismTest());
  }

  resetSimulation() {
    this.simState = createInitialState();
    this.accumulator = 0;
    this.renderer.setState(this.simState);
    this.hud.setStats(this.simState.stepCount, this.simState.balls.length);
    this.hud.setHash("-");
  }

  toggleFastForward() {
    this.fastForward = !this.fastForward;
    this.hud.setFastForward(this.fastForward);
  }

  runDeterminismTest() {
    const testState = createInitialState();
    for (let i = 0; i < 10000; i += 1) {
      stepSimulation(testState, SIM_DT);
    }
    const hash = hashState(testState);
    this.hud.setHash(hash);
    console.log(`Determinism hash after 10,000 steps: ${hash}`);
  }

  update(_time, deltaMs) {
    const dtSeconds = Math.min(deltaMs / 1000, 0.25);
    const speedMultiplier = this.fastForward ? 8 : 1;
    this.accumulator += dtSeconds * speedMultiplier;

    let guard = 0;
    while (this.accumulator >= SIM_DT && guard < 2000) {
      stepSimulation(this.simState, SIM_DT);
      this.accumulator -= SIM_DT;
      guard += 1;
    }

    this.renderer.render();
    this.hud.setStats(this.simState.stepCount, this.simState.balls.length);
  }
}

const gameConfig = {
  type: Phaser.AUTO,
  width: SIM_CONSTANTS.width,
  height: SIM_CONSTANTS.height,
  backgroundColor: "#ffffff",
  parent: "game-root",
  scene: [GameScene]
};

new Phaser.Game(gameConfig);
