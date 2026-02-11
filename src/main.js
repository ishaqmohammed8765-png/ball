import { ArenaSimulation, ABILITY_LABEL } from "./sim.js";

const canvas = document.getElementById("arenaCanvas");
const ctx = canvas.getContext("2d");
const resetBtn = document.getElementById("resetBtn");
const fastForwardToggle = document.getElementById("fastForwardToggle");
const determinismBtn = document.getElementById("determinismBtn");
const statusLine = document.getElementById("statusLine");

const sim = new ArenaSimulation();

const fixedDtMs = sim.config.fixedDt * 1000;
const normalStepsPerFrame = 1;
const fastStepsPerFrame = 8;
let stepsPerFrame = normalStepsPerFrame;
let accumulatorMs = 0;
let lastTimestamp = performance.now();

const ballColors = [
  "#f97316",
  "#16a34a",
  "#0ea5e9",
  "#dc2626",
  "#9333ea",
  "#ca8a04"
];

function colorForId(id) {
  return ballColors[id % ballColors.length];
}

function updateStatus(text) {
  statusLine.textContent = text;
}

function drawHud(snapshot) {
  ctx.fillStyle = "#000";
  ctx.font = "14px Courier New";
  ctx.fillText(`Step: ${snapshot.stepCount}`, 10, 20);
  ctx.fillText(`Alive: ${snapshot.aliveCount}`, 10, 38);
  ctx.fillText(`Mode: ${stepsPerFrame === fastStepsPerFrame ? "Fast" : "Normal"}`, 10, 56);
}

function drawBall(ball) {
  const color = colorForId(ball.id);
  const hpPct = Math.max(0, Math.min(1, ball.hp / ball.maxHp));

  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#111";
  ctx.stroke();

  const barWidth = ball.radius * 2;
  const barHeight = 4;
  const barX = ball.x - ball.radius;
  const barY = ball.y - ball.radius - 10;
  ctx.fillStyle = "#ddd";
  ctx.fillRect(barX, barY, barWidth, barHeight);
  ctx.fillStyle = hpPct > 0.4 ? "#16a34a" : "#b91c1c";
  ctx.fillRect(barX, barY, barWidth * hpPct, barHeight);
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  ctx.fillStyle = "#111";
  ctx.font = "10px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(ABILITY_LABEL[ball.abilityType], ball.x, ball.y);
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const snapshot = sim.getSnapshot();
  drawHud(snapshot);
  for (const ball of snapshot.balls) {
    drawBall(ball);
  }
}

function frame(now) {
  const elapsed = Math.min(250, now - lastTimestamp);
  lastTimestamp = now;
  accumulatorMs += elapsed;

  while (accumulatorMs >= fixedDtMs) {
    sim.stepMany(stepsPerFrame);
    accumulatorMs -= fixedDtMs;
  }

  render();
  requestAnimationFrame(frame);
}

function resetSimulation() {
  sim.reset();
  accumulatorMs = 0;
  lastTimestamp = performance.now();
  updateStatus("Simulation reset to deterministic initial state.");
}

function setFastForward(enabled) {
  stepsPerFrame = enabled ? fastStepsPerFrame : normalStepsPerFrame;
}

function runDeterminismHash() {
  const testSim = new ArenaSimulation();
  testSim.stepMany(10000);
  const hash = testSim.hashState();
  updateStatus(`10,000-step hash: ${hash}`);
}

resetBtn.addEventListener("click", resetSimulation);
fastForwardToggle.addEventListener("change", () => {
  setFastForward(fastForwardToggle.checked);
  updateStatus(`Fast-forward ${fastForwardToggle.checked ? "enabled" : "disabled"}.`);
});
determinismBtn.addEventListener("click", runDeterminismHash);

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (key === "r") {
    resetSimulation();
  } else if (key === "f") {
    fastForwardToggle.checked = !fastForwardToggle.checked;
    setFastForward(fastForwardToggle.checked);
    updateStatus(`Fast-forward ${fastForwardToggle.checked ? "enabled" : "disabled"}.`);
  } else if (key === "h") {
    runDeterminismHash();
  }
});

updateStatus("Simulation running.");
requestAnimationFrame(frame);
