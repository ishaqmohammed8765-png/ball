const arenaApi = globalThis.__ARENA_SIM__;
if (!arenaApi) {
  throw new Error("Simulation API is not loaded. Ensure sim.js runs before main.js.");
}

const { ArenaSimulation, ABILITY_ORDER, ABILITY_LABEL, CLASS_PROFILE } = arenaApi;

const canvas = document.getElementById("arenaCanvas");
const ctx = canvas.getContext("2d");
const resetBtn = document.getElementById("resetBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stepBtn = document.getElementById("stepBtn");
const ballCountInput = document.getElementById("ballCountInput");
const arenaSizeSelect = document.getElementById("arenaSizeSelect");
const fastForwardToggle = document.getElementById("fastForwardToggle");
const autoResetToggle = document.getElementById("autoResetToggle");
const debugToggle = document.getElementById("debugToggle");
const determinismBtn = document.getElementById("determinismBtn");
const statusLine = document.getElementById("statusLine");
const classLegend = document.getElementById("classLegend");
const classPicker = document.getElementById("classPicker");
const presetSelect = document.getElementById("presetSelect");
const applyPresetBtn = document.getElementById("applyPresetBtn");
const winnerLine = document.getElementById("winnerLine");
const debugPanel = document.getElementById("debugPanel");

const maxPerClass = 30;
const defaultPerClass = 3;

const ARENA_PRESETS = Object.freeze({
  small: Object.freeze({ width: 560, height: 320, label: "Small" }),
  medium: Object.freeze({ width: 920, height: 600, label: "Medium" }),
  large: Object.freeze({ width: 1180, height: 760, label: "Large" })
});

function blankLoadout() {
  const loadout = {};
  for (const abilityType of ABILITY_ORDER) {
    loadout[abilityType] = 0;
  }
  return loadout;
}

function defaultLoadout() {
  const loadout = blankLoadout();
  for (const abilityType of ABILITY_ORDER) {
    loadout[abilityType] = defaultPerClass;
  }
  return loadout;
}

const LOADOUT_PRESETS = Object.freeze({
  balanced: Object.freeze(defaultLoadout()),
  aggressive: Object.freeze({
    ...blankLoadout(),
    SPIKY: 6,
    DASH: 6,
    BERSERKER: 6,
    BRUISER: 6,
    VAMPIRIC: 3,
    SHIELDED: 2,
    TANK: 2,
    REGEN: 1,
    SLOW_ON_HIT: 1
  }),
  defensive: Object.freeze({
    ...blankLoadout(),
    TANK: 7,
    SHIELDED: 7,
    REGEN: 6,
    SLOW_ON_HIT: 4,
    BRUISER: 3,
    VAMPIRIC: 3,
    DASH: 2,
    SPIKY: 1,
    BERSERKER: 1
  }),
  duel: Object.freeze({
    ...blankLoadout(),
    BERSERKER: 1,
    SHIELDED: 1
  })
});

let classLoadout = defaultLoadout();
let roundWins = {};
let winnerMessage = "";
let roundResolved = false;
let autoResetDeadlineMs = null;
let isPaused = false;
let smoothedFps = 60;
let frameCounter = 0;
let debugHash = "n/a";

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

function updatePauseLabel() {
  pauseBtn.textContent = isPaused ? "Resume" : "Pause";
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
    SLOW_ON_HIT: "slow",
    BERSERKER: "berserker",
    REGEN: "regen",
    BRUISER: "bruiser"
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

function applyPreset(name) {
  const preset = LOADOUT_PRESETS[name] ?? LOADOUT_PRESETS.balanced;
  classLoadout = { ...preset };
  renderClassPicker();
  const { ballCount } = getCurrentComposition();
  updateStatus(`Preset '${name}' loaded (${ballCount} balls). Press Reset to apply.`);
}

function updateWinnerLine() {
  winnerLine.textContent = winnerMessage;
}

function formatWins() {
  const entries = Object.entries(roundWins);
  if (entries.length === 0) return "none";
  entries.sort((a, b) => b[1] - a[1]);
  return entries.slice(0, 4).map(([k, v]) => `${k}:${v}`).join(" | ");
}

function resolveRound(state, nowMs) {
  if (roundResolved) return;
  if (state.aliveCount > 1) return;

  roundResolved = true;
  autoResetDeadlineMs = autoResetToggle.checked ? nowMs + 1600 : null;

  if (state.aliveCount === 1) {
    const winner = state.balls[0].abilityType;
    roundWins[winner] = (roundWins[winner] ?? 0) + 1;
    winnerMessage = `Winner: ${winner} | Wins: ${formatWins()}`;
  } else {
    winnerMessage = "Draw round.";
  }
  updateWinnerLine();
}

function maybeAutoReset(nowMs) {
  if (autoResetDeadlineMs === null) return false;
  if (nowMs < autoResetDeadlineMs) return false;
  resetSimulation();
  return true;
}

function updateDebugPanel(state, updatesThisFrame, elapsedMs) {
  if (!debugToggle.checked) return;

  const instantaneousFps = elapsedMs > 0 ? (1000 / elapsedMs) : 60;
  smoothedFps = (smoothedFps * 0.9) + (instantaneousFps * 0.1);
  frameCounter += 1;
  if (frameCounter % 20 === 0) {
    debugHash = sim.hashState();
  }

  debugPanel.textContent = [
    `paused=${isPaused}`,
    `fps=${smoothedFps.toFixed(1)}`,
    `updates/frame=${updatesThisFrame}`,
    `step=${state.stepCount}`,
    `alive=${state.aliveCount}`,
    `round_resolved=${roundResolved}`,
    `wins=${formatWins()}`,
    `accumulator_ms=${accumulatorMs.toFixed(2)}`,
    `hash=${debugHash}`
  ].join("\n");
}

const PIXEL_SIZE = 4;

const CLASS_SPRITES = Object.freeze({
  TANK: Object.freeze({
    rows: [".......", ".11111.", ".12221.", ".12221.", ".12221.", ".11111.", "......."],
    palette: Object.freeze({ "1": "#1f2937", "2": "#94a3b8" })
  }),
  SPIKY: Object.freeze({
    rows: [".3...3.", "3311133", ".31113.", "3111113", ".31113.", "3311133", ".3...3."],
    palette: Object.freeze({ "1": "#f97316", "3": "#7c2d12" })
  }),
  VAMPIRIC: Object.freeze({
    rows: [".4...4.", "4441444", "4411144", ".11111.", "4411144", "4441444", ".4...4."],
    palette: Object.freeze({ "1": "#991b1b", "4": "#fecaca" })
  }),
  SHIELDED: Object.freeze({
    rows: [".55555.", "55...55", "5.111.5", "5.111.5", "5.111.5", "55...55", ".55555."],
    palette: Object.freeze({ "1": "#1d4ed8", "5": "#93c5fd" })
  }),
  DASH: Object.freeze({
    rows: [".......", "..666..", ".66166.", "6611166", ".66166.", "..666..", "......."],
    palette: Object.freeze({ "1": "#0369a1", "6": "#38bdf8" })
  }),
  SLOW_ON_HIT: Object.freeze({
    rows: [".7...7.", "..777..", ".77177.", "7711177", ".77177.", "..777..", ".7...7."],
    palette: Object.freeze({ "1": "#047857", "7": "#a7f3d0" })
  }),
  BERSERKER: Object.freeze({
    rows: [".8...8.", "8811188", ".81118.", "8111118", ".81118.", "8811188", ".8...8."],
    palette: Object.freeze({ "1": "#b91c1c", "8": "#fca5a5" })
  }),
  REGEN: Object.freeze({
    rows: [".9...9.", ".99199.", "9911199", ".11111.", "9911199", ".99199.", ".9...9."],
    palette: Object.freeze({ "1": "#15803d", "9": "#86efac" })
  }),
  BRUISER: Object.freeze({
    rows: [".a...a.", "aa111aa", ".a111a.", "a11111a", ".a111a.", "aa111aa", ".a...a."],
    palette: Object.freeze({ "1": "#78350f", "a": "#fbbf24" })
  })
});

function snapPx(value) {
  return Math.round(value / PIXEL_SIZE) * PIXEL_SIZE;
}

function drawSprite(ball, sprite) {
  const rows = sprite.rows;
  const width = rows[0].length;
  const height = rows.length;
  const originX = snapPx(ball.x) - Math.floor((width * PIXEL_SIZE) / 2);
  const originY = snapPx(ball.y) - Math.floor((height * PIXEL_SIZE) / 2);

  for (let y = 0; y < rows.length; y += 1) {
    const row = rows[y];
    for (let x = 0; x < row.length; x += 1) {
      const token = row[x];
      if (token === ".") continue;
      const color = sprite.palette[token];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(originX + (x * PIXEL_SIZE), originY + (y * PIXEL_SIZE), PIXEL_SIZE, PIXEL_SIZE);
    }
  }
}

function drawBall(ball) {
  const bodyColor = colorForId(ball.id);
  const hpPct = Math.max(0, Math.min(1, ball.hp / ball.maxHp));
  const size = Math.max(18, Math.floor((ball.radius * 2) / PIXEL_SIZE) * PIXEL_SIZE);
  const left = snapPx(ball.x - (size / 2));
  const top = snapPx(ball.y - (size / 2));

  ctx.fillStyle = bodyColor;
  ctx.fillRect(left, top, size, size);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  for (let i = 0; i < size; i += PIXEL_SIZE * 2) {
    ctx.fillRect(left + i, top + i, PIXEL_SIZE, PIXEL_SIZE);
  }
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 1;
  ctx.strokeRect(left, top, size, size);

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
}

function drawAbilityArt(ball) {
  const sprite = CLASS_SPRITES[ball.abilityType];
  if (sprite) {
    drawSprite(ball, sprite);
  }
}

function render(state) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "10px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const ball of state.balls) {
    drawBall(ball);
  }
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
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
  roundResolved = false;
  autoResetDeadlineMs = null;
  winnerMessage = "";
  updateWinnerLine();
  updateStatus(`Simulation reset with ${composition.ballCount} balls on ${preset.label} arena.`);
}

function setFastForward(enabled) {
  stepsPerFrame = enabled ? fastStepsPerFrame : normalStepsPerFrame;
}

function togglePause() {
  isPaused = !isPaused;
  updatePauseLabel();
  updateStatus(isPaused ? "Paused." : "Resumed.");
}

function runOneStep() {
  if (roundResolved) return;
  sim.stepMany(1);
  const now = performance.now();
  const state = sim.getRenderState();
  resolveRound(state, now);
  render(state);
  updateDebugPanel(state, 1, fixedDtMs);
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

function frame(now) {
  const elapsed = Math.min(250, now - lastTimestamp);
  lastTimestamp = now;

  let updateCount = 0;
  if (!isPaused && !roundResolved) {
    accumulatorMs += elapsed;
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
      accumulatorMs %= fixedDtMs;
    }
  }

  const state = sim.getRenderState();
  resolveRound(state, now);

  if (!maybeAutoReset(now)) {
    render(state);
    updateDebugPanel(state, updateCount, elapsed);
  }

  requestAnimationFrame(frame);
}

resetBtn.addEventListener("click", resetSimulation);
pauseBtn.addEventListener("click", togglePause);
stepBtn.addEventListener("click", runOneStep);

fastForwardToggle.addEventListener("change", () => {
  setFastForward(fastForwardToggle.checked);
  updateStatus(`Fast-forward ${fastForwardToggle.checked ? "enabled" : "disabled"}.`);
});

autoResetToggle.addEventListener("change", () => {
  updateStatus(`Auto-reset ${autoResetToggle.checked ? "enabled" : "disabled"}.`);
});

debugToggle.addEventListener("change", () => {
  debugPanel.classList.toggle("is-visible", debugToggle.checked);
  updateStatus(`Debug panel ${debugToggle.checked ? "shown" : "hidden"}.`);
});

applyPresetBtn.addEventListener("click", () => {
  applyPreset(presetSelect.value);
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
  } else if (key === "p") {
    togglePause();
  } else if (key === "n") {
    runOneStep();
  } else if (key === " ") {
    event.preventDefault();
    togglePause();
  }
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    lastTimestamp = performance.now();
    accumulatorMs = 0;
  }
});

ballCountInput.readOnly = true;
updatePauseLabel();
renderClassPicker();
renderClassLegend();
applyCanvasSize(initialPreset.width, initialPreset.height);
updateWinnerLine();
updateStatus(`Simulation running with ${initialComposition.ballCount} balls.`);
requestAnimationFrame(frame);
