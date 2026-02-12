const arenaApi = globalThis.__ARENA_SIM__;
if (!arenaApi) {
  throw new Error("Simulation API is not loaded. Ensure sim.js runs before main.js.");
}

const { ArenaSimulation, ABILITY_ORDER, ABILITY_LABEL, CLASS_PROFILE } = arenaApi;

const canvas = document.getElementById("arenaCanvas");
const ctx = canvas.getContext("2d");
const resetBtn = document.getElementById("resetBtn");
const ballCountInput = document.getElementById("ballCountInput");
const arenaSizeSelect = document.getElementById("arenaSizeSelect");
const fastForwardToggle = document.getElementById("fastForwardToggle");
const determinismBtn = document.getElementById("determinismBtn");
const statusLine = document.getElementById("statusLine");
const classLegend = document.getElementById("classLegend");
const classPicker = document.getElementById("classPicker");

const maxPerClass = 30;
const defaultPerClass = 3;

const ARENA_PRESETS = Object.freeze({
  small: Object.freeze({ width: 560, height: 320, label: "Small" }),
  medium: Object.freeze({ width: 920, height: 600, label: "Medium" }),
  large: Object.freeze({ width: 1180, height: 760, label: "Large" })
});

function defaultLoadout() {
  const loadout = {};
  for (const abilityType of ABILITY_ORDER) {
    loadout[abilityType] = defaultPerClass;
  }
  return loadout;
}

let classLoadout = defaultLoadout();

function getArenaPreset() {
  const key = arenaSizeSelect?.value ?? "medium";
  const preset = ARENA_PRESETS[key] ?? ARENA_PRESETS.medium;
  return { key, preset };
}

function buildAbilitySequence() {
  const sequence = [];
  for (const abilityType of ABILITY_ORDER) {
    const count = classLoadout[abilityType] ?? 0;
    for (let i = 0; i < count; i += 1) {
      sequence.push(abilityType);
    }
  }

  if (sequence.length === 0) {
    sequence.push(ABILITY_ORDER[0]);
  }

  return sequence;
}

function getCurrentComposition() {
  const abilitySequence = buildAbilitySequence();
  const ballCount = abilitySequence.length;
  ballCountInput.value = String(ballCount);
  return { abilitySequence, ballCount };
}

const initialPreset = getArenaPreset().preset;
const initialComposition = getCurrentComposition();
let sim = new ArenaSimulation({
  ballCount: initialComposition.ballCount,
  abilitySequence: initialComposition.abilitySequence,
  arenaWidth: initialPreset.width,
  arenaHeight: initialPreset.height
});

const fixedDtMs = sim.config.fixedDt * 1000;
const normalStepsPerFrame = 2;
const fastStepsPerFrame = 8;
const maxFixedUpdatesPerFrame = 12;
const maxUpdateBudgetMs = 8;
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

function applyCanvasSize(width, height) {
  canvas.width = width;
  canvas.height = height;
  canvas.style.aspectRatio = `${width} / ${height}`;
}

function renderClassLegend() {
  const iconSuffix = {
    TANK: "tank",
    SPIKY: "spiky",
    VAMPIRIC: "vampiric",
    SHIELDED: "shielded",
    DASH: "dash",
    SLOW_ON_HIT: "slow"
  };
  classLegend.innerHTML = ABILITY_ORDER.map((abilityType) => {
    const profile = CLASS_PROFILE[abilityType];
    const iconClass = iconSuffix[abilityType] ?? "tank";
    return `<span class="legend-item"><span class="class-icon class-icon--${iconClass}" aria-hidden="true"></span><strong>${profile.className}</strong> (${ABILITY_LABEL[abilityType]}): ${profile.ability}</span>`;
  }).join("");
}

function renderClassPicker() {
  classPicker.innerHTML = ABILITY_ORDER.map((abilityType) => {
    const profile = CLASS_PROFILE[abilityType];
    const value = classLoadout[abilityType] ?? 0;
    return `<label class="class-picker-item" for="classCount-${abilityType}"><span>${profile.className}</span><input id="classCount-${abilityType}" data-ability="${abilityType}" type="number" min="0" max="${maxPerClass}" step="1" value="${value}" /></label>`;
  }).join("");
}

function syncLoadoutFromInputs() {
  const inputs = classPicker.querySelectorAll("input[data-ability]");
  for (const input of inputs) {
    const ability = input.dataset.ability;
    const parsed = Number.parseInt(input.value, 10);
    const value = Number.isFinite(parsed) ? Math.max(0, Math.min(maxPerClass, parsed)) : 0;
    classLoadout[ability] = value;
    input.value = String(value);
  }
  const { ballCount } = getCurrentComposition();
  updateStatus(`Class loadout updated. Total balls: ${ballCount}. Press Reset to apply.`);
}

function drawHud(stepCount, aliveCount) {
  ctx.fillStyle = "#000";
  ctx.font = "14px Courier New";
  ctx.fillText(`Step: ${stepCount}`, 10, 20);
  ctx.fillText(`Alive: ${aliveCount}`, 10, 38);
  ctx.fillText(`Mode: ${stepsPerFrame === fastStepsPerFrame ? "Fast (8x)" : "Normal (2x)"}`, 10, 56);
  ctx.fillText(`Time ramp: x${(1 + Math.min(sim.config.maxTimeDamageBonus, sim.config.damageRampPerSecond * sim.time)).toFixed(2)}`, 10, 74);
}

function drawBall(ball) {
  const color = colorForId(ball.id);
  const hpPct = Math.max(0, Math.min(1, ball.hp / ball.maxHp));

  const fill = ctx.createRadialGradient(ball.x - 5, ball.y - 6, 4, ball.x, ball.y, ball.radius);
  fill.addColorStop(0, "rgba(255,255,255,0.95)");
  fill.addColorStop(0.32, color);
  fill.addColorStop(1, "rgba(10,10,10,0.86)");

  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#111";
  ctx.stroke();

  drawAbilityArt(ball);

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
  ctx.fillText(ABILITY_LABEL[ball.abilityType], ball.x, ball.y);

  if (ball.damageStack > 0.05) {
    ctx.font = "9px Courier New";
    ctx.fillStyle = "#7c2d12";
    ctx.fillText(`x${(1 + ball.damageStack).toFixed(2)}`, ball.x, ball.y + (ball.radius + 9));
  }
}

function drawTankArt(ball) {
  ctx.strokeStyle = "rgba(15,23,42,0.95)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius + 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(15,23,42,0.62)";
  ctx.fillRect(ball.x - 5, ball.y - 4, 10, 8);
}

function drawSpikyArt(ball) {
  const spikes = 12;
  ctx.strokeStyle = "rgba(120,53,15,0.98)";
  ctx.lineWidth = 2;
  for (let i = 0; i < spikes; i += 1) {
    const angle = (i / spikes) * Math.PI * 2;
    const inner = ball.radius - 2;
    const outer = ball.radius + 7;
    const sx = ball.x + (Math.cos(angle) * inner);
    const sy = ball.y + (Math.sin(angle) * inner);
    const ex = ball.x + (Math.cos(angle) * outer);
    const ey = ball.y + (Math.sin(angle) * outer);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
}

function drawVampiricArt(ball) {
  const orbiters = 4;
  const orbitRadius = ball.radius + 5;
  for (let i = 0; i < orbiters; i += 1) {
    const angle = (sim.time * 3.4) + ((i / orbiters) * Math.PI * 2) + (ball.id * 0.12);
    const x = ball.x + (Math.cos(angle) * orbitRadius);
    const y = ball.y + (Math.sin(angle) * orbitRadius);
    ctx.beginPath();
    ctx.arc(x, y, 2.6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(153,27,27,0.96)";
    ctx.fill();
  }
}

function drawShieldedArt(ball) {
  const shimmer = 0.7 + (Math.sin(sim.time * 6 + ball.id) * 0.25);
  ctx.strokeStyle = `rgba(30,64,175,${shimmer.toFixed(3)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius + 6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(147,197,253,0.85)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ball.x - 3, ball.y - 3, ball.radius + 3, Math.PI * 1.1, Math.PI * 1.62);
  ctx.stroke();
}

function drawDashArt(ball) {
  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed < 1e-6) return;
  const ux = ball.vx / speed;
  const uy = ball.vy / speed;
  ctx.lineWidth = 2;
  for (let i = 1; i <= 4; i += 1) {
    const startDist = ball.radius + (i * 4);
    const endDist = startDist + 7;
    ctx.strokeStyle = `rgba(2,132,199,${0.42 - (i * 0.08)})`;
    ctx.beginPath();
    ctx.moveTo(ball.x - (ux * startDist), ball.y - (uy * startDist));
    ctx.lineTo(ball.x - (ux * endDist), ball.y - (uy * endDist));
    ctx.stroke();
  }
}

function drawSlowArt(ball) {
  const rings = [ball.radius + 1.5, ball.radius + 4.5];
  ctx.strokeStyle = "rgba(6,95,70,0.92)";
  for (const r of rings) {
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.lineWidth = 1.7;
  for (let i = 0; i < 3; i += 1) {
    const angle = (Math.PI / 3) * i;
    const x1 = ball.x + (Math.cos(angle) * (ball.radius + 5));
    const y1 = ball.y + (Math.sin(angle) * (ball.radius + 5));
    const x2 = ball.x - (Math.cos(angle) * (ball.radius + 5));
    const y2 = ball.y - (Math.sin(angle) * (ball.radius + 5));
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

function drawAbilityArt(ball) {
  switch (ball.abilityType) {
    case "TANK":
      drawTankArt(ball);
      break;
    case "SPIKY":
      drawSpikyArt(ball);
      break;
    case "VAMPIRIC":
      drawVampiricArt(ball);
      break;
    case "SHIELDED":
      drawShieldedArt(ball);
      break;
    case "DASH":
      drawDashArt(ball);
      break;
    case "SLOW_ON_HIT":
      drawSlowArt(ball);
      break;
    default:
      break;
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const state = sim.getRenderState();
  drawHud(state.stepCount, state.aliveCount);
  ctx.font = "10px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const ball of state.balls) {
    drawBall(ball);
  }
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
}

function frame(now) {
  const elapsed = Math.min(250, now - lastTimestamp);
  lastTimestamp = now;
  accumulatorMs += elapsed;

  let updateCount = 0;
  const updateStart = performance.now();
  while (accumulatorMs >= fixedDtMs && updateCount < maxFixedUpdatesPerFrame) {
    sim.stepMany(stepsPerFrame);
    accumulatorMs -= fixedDtMs;
    updateCount += 1;
    if ((performance.now() - updateStart) >= maxUpdateBudgetMs) {
      break;
    }
  }

  if (accumulatorMs >= fixedDtMs) {
    // Drop stale accumulated time so the render loop does not spiral under load.
    accumulatorMs %= fixedDtMs;
  }

  render();
  requestAnimationFrame(frame);
}

function resetSimulation() {
  const { preset } = getArenaPreset();
  const composition = getCurrentComposition();
  applyCanvasSize(preset.width, preset.height);
  sim = new ArenaSimulation({
    ballCount: composition.ballCount,
    abilitySequence: composition.abilitySequence,
    arenaWidth: preset.width,
    arenaHeight: preset.height
  });
  accumulatorMs = 0;
  lastTimestamp = performance.now();
  updateStatus(`Simulation reset with ${composition.ballCount} balls on ${preset.label} arena.`);
}

function setFastForward(enabled) {
  stepsPerFrame = enabled ? fastStepsPerFrame : normalStepsPerFrame;
}

function runDeterminismHash() {
  const { preset } = getArenaPreset();
  const composition = getCurrentComposition();
  const testSim = new ArenaSimulation({
    ballCount: composition.ballCount,
    abilitySequence: composition.abilitySequence,
    arenaWidth: preset.width,
    arenaHeight: preset.height
  });
  testSim.stepMany(10000);
  const hash = testSim.hashState();
  updateStatus(`10,000-step hash (${composition.ballCount} balls, ${preset.label}): ${hash}`);
}

resetBtn.addEventListener("click", resetSimulation);
fastForwardToggle.addEventListener("change", () => {
  setFastForward(fastForwardToggle.checked);
  updateStatus(`Fast-forward ${fastForwardToggle.checked ? "enabled" : "disabled"}.`);
});
determinismBtn.addEventListener("click", runDeterminismHash);
arenaSizeSelect.addEventListener("change", () => {
  const { preset } = getArenaPreset();
  updateStatus(`Arena set to ${preset.label}. Press Reset to apply.`);
});

classPicker.addEventListener("change", syncLoadoutFromInputs);
classPicker.addEventListener("input", syncLoadoutFromInputs);

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

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    lastTimestamp = performance.now();
    accumulatorMs = 0;
  }
});

ballCountInput.readOnly = true;
renderClassPicker();
renderClassLegend();
applyCanvasSize(initialPreset.width, initialPreset.height);
updateStatus(`Simulation running with ${initialComposition.ballCount} balls.`);
requestAnimationFrame(frame);

