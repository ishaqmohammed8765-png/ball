import Phaser from "phaser";

const BORDER_THICKNESS = 8;
const FIXED_DT = 1 / 120;
const POSITION_ROUNDING = 1_000_000;
const MAX_SPEED = 760;
const PIXEL_SIZE = 3;

const RESTITUTION = 0.98;
const BASE_DAMAGE = 1.2;
const DAMAGE_SCALE = 0.1;
const MIN_DAMAGE = 0.35;
const MAX_DAMAGE = 24;
const IMPACT_DAMAGE_THRESHOLD = 18;
const SPEED_DAMAGE_SCALE = 1.2;
const SPEED_DAMAGE_BONUS_CAP = 1.25;
const COLLISION_DAMAGE_COOLDOWN = 0.09;
const COLLISION_DAMAGE_CACHE_TTL = 2.2;
const MAX_EFFECTS = 1100;

const FAST_FORWARD_STEPS = 4;
const NORMAL_STEPS = 1;

const CLASS_KEYS = ["tank", "striker", "medic", "trickster", "sniper", "vampire", "bulwark"];

const CLASS_DEFS = {
  tank: {
    label: "Tank",
    description: "Heavy body. Very durable but slower and lower damage.",
    color: 0x2f6fdb,
    radius: 22,
    mass: 1.65,
    maxHp: 155,
    speed: 165,
    outgoingDamageMult: 0.84,
    incomingDamageMult: 0.7,
    wallBounceMult: 0.9
  },
  striker: {
    label: "Striker",
    description: "Aggressive burst damage class with high impact attacks.",
    color: 0xe64b3c,
    radius: 17,
    mass: 1.0,
    maxHp: 100,
    speed: 255,
    outgoingDamageMult: 1.35,
    incomingDamageMult: 1.0,
    wallBounceMult: 1.0
  },
  medic: {
    label: "Medic",
    description: "Regenerates health over time, excels in long fights.",
    color: 0x23b46e,
    radius: 18,
    mass: 1.05,
    maxHp: 112,
    speed: 210,
    outgoingDamageMult: 1.0,
    incomingDamageMult: 0.95,
    wallBounceMult: 1.0,
    regenPerSecond: 4.7
  },
  trickster: {
    label: "Trickster",
    description: "Dashes periodically and gains speed from wall rebounds.",
    color: 0xf0b429,
    radius: 16,
    mass: 0.8,
    maxHp: 92,
    speed: 240,
    outgoingDamageMult: 1.06,
    incomingDamageMult: 1.08,
    wallBounceMult: 1.08,
    dashCooldown: 2.8,
    dashMultiplier: 1.45
  },
  sniper: {
    label: "Sniper",
    description: "Glass cannon. High impact collisions deal extra precision damage.",
    color: 0x8f47ff,
    radius: 15,
    mass: 0.9,
    maxHp: 88,
    speed: 230,
    outgoingDamageMult: 1.2,
    incomingDamageMult: 1.08,
    wallBounceMult: 1.02,
    impactThreshold: 210,
    impactBonusMult: 1.55
  },
  vampire: {
    label: "Vampire",
    description: "Lifesteal class. Heals from damage dealt to enemies.",
    color: 0x8d123f,
    radius: 17,
    mass: 1.02,
    maxHp: 105,
    speed: 218,
    outgoingDamageMult: 1.1,
    incomingDamageMult: 1.0,
    wallBounceMult: 1.0,
    lifesteal: 0.28
  },
  bulwark: {
    label: "Bulwark",
    description: "Periodic shield and damage reflection (thorns).",
    color: 0x54717a,
    radius: 20,
    mass: 1.35,
    maxHp: 130,
    speed: 185,
    outgoingDamageMult: 0.96,
    incomingDamageMult: 0.92,
    wallBounceMult: 0.96,
    shieldCooldown: 4.4,
    shieldDuration: 1.2,
    shieldReductionMult: 0.45,
    thorns: 0.2
  }
};

const DEFAULT_SETUP = {
  arenaWidth: 980,
  arenaHeight: 640,
  classCounts: {
    tank: 4,
    striker: 5,
    medic: 3,
    trickster: 4,
    sniper: 3,
    vampire: 3,
    bulwark: 3
  }
};

const DIRECTION_VECTORS = [
  [1, 0.6],
  [1, -0.6],
  [-1, 0.6],
  [-1, -0.6],
  [0.6, 1],
  [-0.6, 1],
  [0.6, -1],
  [-0.6, -1],
  [0.25, 1],
  [-0.25, 1]
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round6 = (value) => Math.round(value * POSITION_ROUNDING) / POSITION_ROUNDING;
const classColorHex = (classKey) => `#${CLASS_DEFS[classKey].color.toString(16).padStart(6, "0")}`;

function safeEncodeBase64(value) {
  return btoa(unescape(encodeURIComponent(value))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function safeDecodeBase64(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return decodeURIComponent(escape(atob(normalized + padding)));
}

function encodeSetupToken(setup) {
  const payload = {
    w: sanitizeDimension(setup.arenaWidth, DEFAULT_SETUP.arenaWidth),
    h: sanitizeDimension(setup.arenaHeight, DEFAULT_SETUP.arenaHeight),
    c: CLASS_KEYS.reduce((acc, classKey) => {
      acc[classKey] = sanitizeCount(setup.classCounts[classKey]);
      return acc;
    }, {})
  };
  return safeEncodeBase64(JSON.stringify(payload));
}

function decodeSetupToken(token) {
  try {
    const parsed = JSON.parse(safeDecodeBase64(token));
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const classCounts = {};
    for (const classKey of CLASS_KEYS) {
      classCounts[classKey] = sanitizeCount(parsed.c?.[classKey]);
    }
    return {
      arenaWidth: sanitizeDimension(parsed.w, DEFAULT_SETUP.arenaWidth),
      arenaHeight: sanitizeDimension(parsed.h, DEFAULT_SETUP.arenaHeight),
      classCounts
    };
  } catch {
    return null;
  }
}

function loadSetupFromUrl() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get("setup");
  if (!token) {
    return null;
  }
  return decodeSetupToken(token);
}

const INITIAL_SETUP = loadSetupFromUrl() ?? structuredClone(DEFAULT_SETUP);

function sanitizeCount(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return 0;
  }
  return clamp(parsed, 0, 90);
}

function sanitizeDimension(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return fallback;
  }
  return clamp(parsed, 420, 2200);
}

function createBall(id, classKey, x, y, vx, vy) {
  const def = CLASS_DEFS[classKey];
  return {
    id,
    classKey,
    classLabel: def.label,
    r: def.radius,
    mass: def.mass,
    x,
    y,
    vx,
    vy,
    hp: def.maxHp,
    maxHp: def.maxHp,
    color: def.color,
    alive: true,
    abilityState: {
      tricksterDashTimer: def.dashCooldown ?? 0,
      bulwarkShieldCooldown: def.shieldCooldown ?? 0,
      bulwarkShieldTimeLeft: 0
    }
  };
}

function createClassPool(classCounts) {
  const classPool = [];
  for (const classKey of CLASS_KEYS) {
    const count = sanitizeCount(classCounts[classKey]);
    for (let i = 0; i < count; i += 1) {
      classPool.push(classKey);
    }
  }
  return classPool;
}

function createInitialBalls(setup) {
  const classPool = createClassPool(setup.classCounts);
  if (classPool.length === 0) {
    classPool.push("tank");
  }

  const total = classPool.length;
  const cols = Math.max(1, Math.ceil(Math.sqrt(total * (setup.arenaWidth / setup.arenaHeight))));
  const rows = Math.max(1, Math.ceil(total / cols));
  const marginX = Math.max(50, Math.min(130, setup.arenaWidth * 0.12));
  const marginY = Math.max(50, Math.min(130, setup.arenaHeight * 0.12));
  const spanX = Math.max(0, setup.arenaWidth - marginX * 2);
  const spanY = Math.max(0, setup.arenaHeight - marginY * 2);

  const balls = [];
  for (let id = 0; id < total; id += 1) {
    const classKey = classPool[id];
    const classDef = CLASS_DEFS[classKey];
    const col = id % cols;
    const row = Math.floor(id / cols);
    const x = cols > 1 ? marginX + (spanX * col) / (cols - 1) : setup.arenaWidth / 2;
    const y = rows > 1 ? marginY + (spanY * row) / (rows - 1) : setup.arenaHeight / 2;

    const [dx, dy] = DIRECTION_VECTORS[id % DIRECTION_VECTORS.length];
    const vectorMag = Math.hypot(dx, dy) || 1;
    const vx = (dx / vectorMag) * classDef.speed;
    const vy = (dy / vectorMag) * classDef.speed;
    balls.push(createBall(id, classKey, x, y, vx, vy));
  }

  return balls;
}

function addStyles() {
  if (document.getElementById("ball-controls-style")) {
    return;
  }

  const styleTag = document.createElement("style");
  styleTag.id = "ball-controls-style";
  styleTag.textContent = `
    body {
      background:
        linear-gradient(0deg, rgba(25, 26, 35, 0.72), rgba(25, 26, 35, 0.72)),
        repeating-linear-gradient(
          0deg,
          #2b2f3b 0 6px,
          #232733 6px 12px
        );
    }
    canvas {
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }
    #ball-controls {
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 50;
      width: 292px;
      max-height: calc(100vh - 20px);
      overflow: auto;
      background: rgba(11, 13, 18, 0.92);
      color: #f3f4f6;
      border: 2px solid #4b5563;
      border-radius: 8px;
      padding: 12px;
      font-family: "Consolas", "Courier New", monospace;
      box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4);
      user-select: none;
    }
    #ball-controls .status {
      margin-bottom: 8px;
      border: 1px solid #374151;
      border-radius: 6px;
      background: linear-gradient(180deg, rgba(29, 40, 59, 0.9), rgba(17, 24, 39, 0.9));
      padding: 8px;
      font-size: 12px;
      line-height: 1.35;
    }
    #ball-controls .status strong {
      color: #fef08a;
    }
    #ball-controls h2 {
      margin: 0 0 10px;
      font-size: 15px;
      font-weight: 700;
    }
    #ball-controls .row {
      display: grid;
      grid-template-columns: 1fr 80px;
      gap: 8px;
      align-items: center;
      margin-bottom: 6px;
    }
    #ball-controls label {
      font-size: 12px;
      opacity: 0.93;
    }
    #ball-controls input {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #374151;
      border-radius: 4px;
      padding: 5px 6px;
      font-size: 12px;
      background: #111827;
      color: #f9fafb;
      font-family: inherit;
    }
    #ball-controls .actions {
      display: grid;
      margin-top: 8px;
      margin-bottom: 10px;
      gap: 6px;
    }
    #ball-controls button {
      border: 0;
      border-radius: 6px;
      padding: 8px 9px;
      cursor: pointer;
      font-weight: 700;
      font-size: 12px;
      background: #f59e0b;
      color: #111827;
      font-family: inherit;
    }
    #ball-controls .hint {
      margin-top: 8px;
      font-size: 11px;
      color: #d1d5db;
      line-height: 1.3;
    }
    #ball-controls .subsection {
      margin-top: 10px;
      margin-bottom: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #a5f3fc;
    }
    #ball-controls .drop-zone {
      min-height: 48px;
      border: 2px dashed #4b5563;
      border-radius: 8px;
      padding: 6px;
      background: rgba(15, 23, 42, 0.7);
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 8px;
    }
    #ball-controls .drop-zone.active {
      border-color: #22d3ee;
      background: rgba(12, 74, 110, 0.4);
    }
    #ball-controls .chip {
      display: inline-flex;
      align-items: center;
      border: 1px solid #111827;
      border-radius: 12px;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 700;
      color: #e5e7eb;
      cursor: grab;
      white-space: nowrap;
    }
    #ball-controls .chip.saved {
      cursor: pointer;
      border-color: #e5e7eb;
    }
    #ball-controls .link-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 6px;
      margin-bottom: 8px;
    }
    #ball-controls .link-row input {
      background: #030712;
      border-color: #4b5563;
      font-size: 11px;
    }
    #ball-controls .mini {
      background: #67e8f9;
      color: #0f172a;
      padding: 6px 8px;
      font-size: 11px;
    }
    #ball-controls .desc-title {
      margin-top: 6px;
      margin-bottom: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #fde68a;
    }
    #ball-controls .class-desc {
      margin: 0 0 6px;
      font-size: 11px;
      line-height: 1.35;
      color: #d1d5db;
    }
    #ball-controls .swatch {
      display: inline-block;
      width: 9px;
      height: 9px;
      border: 1px solid #111827;
      margin-right: 6px;
      vertical-align: middle;
    }
  `;
  document.head.appendChild(styleTag);
}

function buildControls(scene) {
  addStyles();
  let root = document.getElementById("ball-controls");
  if (!root) {
    root = document.createElement("div");
    root.id = "ball-controls";
    document.body.appendChild(root);
  }

  const classRows = CLASS_KEYS.map(
    (classKey) => `
      <div class="row">
        <label for="count_${classKey}">${CLASS_DEFS[classKey].label}</label>
        <input id="count_${classKey}" data-class-key="${classKey}" type="number" min="0" max="90" />
      </div>
    `
  ).join("");

  const descRows = CLASS_KEYS.map(
    (classKey) =>
      `<p class="class-desc"><span class="swatch" style="background:${classColorHex(classKey)}"></span><strong>${CLASS_DEFS[classKey].label}:</strong> ${CLASS_DEFS[classKey].description}</p>`
  ).join("");

  root.innerHTML = `
    <h2>Pixel Arena Controls</h2>
    <div id="roundStatus" class="status">Round running...</div>
    <div class="row">
      <label for="arenaWidth">Arena Width</label>
      <input id="arenaWidth" type="number" min="420" max="2200" />
    </div>
    <div class="row">
      <label for="arenaHeight">Arena Height</label>
      <input id="arenaHeight" type="number" min="420" max="2200" />
    </div>
    ${classRows}
    <div class="actions">
      <button id="applySetupBtn" type="button">Apply Setup + Reset</button>
      <button id="resetRoundBtn" type="button">Reset Round</button>
    </div>
    <div class="subsection">Round Survivors (drag)</div>
    <div id="survivorPool" class="drop-zone"></div>
    <div class="subsection">Next Round Box (drop here)</div>
    <div id="nextRoundBox" class="drop-zone"></div>
    <div class="actions">
      <button id="useNextRoundBtn" type="button">Use Box For Next Round</button>
    </div>
    <div class="subsection">Share Setup Link</div>
    <div class="link-row">
      <input id="shareLinkOut" type="text" readonly />
      <button id="copyLinkBtn" class="mini" type="button">Copy</button>
    </div>
    <div class="actions">
      <button id="generateLinkBtn" type="button">Generate Link</button>
    </div>
    <div class="desc-title">Class Descriptions</div>
    ${descRows}
    <div class="hint">R = reset | F = fast-forward | P = pause</div>
    <div class="hint">Tip: drag survivor chips into Next Round Box, then press Use Box For Next Round.</div>
  `;

  const arenaWidthEl = root.querySelector("#arenaWidth");
  const arenaHeightEl = root.querySelector("#arenaHeight");
  const roundStatusEl = root.querySelector("#roundStatus");
  const survivorPoolEl = root.querySelector("#survivorPool");
  const nextRoundBoxEl = root.querySelector("#nextRoundBox");
  const shareLinkOutEl = root.querySelector("#shareLinkOut");
  const applyBtn = root.querySelector("#applySetupBtn");
  const resetRoundBtn = root.querySelector("#resetRoundBtn");
  const useNextRoundBtn = root.querySelector("#useNextRoundBtn");
  const generateLinkBtn = root.querySelector("#generateLinkBtn");
  const copyLinkBtn = root.querySelector("#copyLinkBtn");
  const countInputs = root.querySelectorAll("[data-class-key]");

  scene.ui = {
    root,
    arenaWidthEl,
    arenaHeightEl,
    roundStatusEl,
    survivorPoolEl,
    nextRoundBoxEl,
    shareLinkOutEl,
    countInputs
  };

  scene.syncControlInputs();

  const activateDropZone = () => nextRoundBoxEl.classList.add("active");
  const deactivateDropZone = () => nextRoundBoxEl.classList.remove("active");

  nextRoundBoxEl.addEventListener("dragover", (event) => {
    event.preventDefault();
    activateDropZone();
  });
  nextRoundBoxEl.addEventListener("dragleave", () => {
    deactivateDropZone();
  });
  nextRoundBoxEl.addEventListener("drop", (event) => {
    event.preventDefault();
    const classKey = event.dataTransfer?.getData("text/classKey");
    if (!classKey || !CLASS_DEFS[classKey]) {
      deactivateDropZone();
      return;
    }
    scene.addClassToNextRoundBox(classKey);
    deactivateDropZone();
  });

  applyBtn.addEventListener("click", () => {
    const nextClassCounts = {};
    for (const input of countInputs) {
      nextClassCounts[input.dataset.classKey] = sanitizeCount(input.value);
    }
    scene.applySetup({
      arenaWidth: sanitizeDimension(arenaWidthEl.value, scene.setup.arenaWidth),
      arenaHeight: sanitizeDimension(arenaHeightEl.value, scene.setup.arenaHeight),
      classCounts: nextClassCounts
    });
    scene.syncControlInputs();
  });

  resetRoundBtn.addEventListener("click", () => {
    scene.resetSimulation();
    scene.syncControlInputs();
  });

  useNextRoundBtn.addEventListener("click", () => {
    scene.applyNextRoundBox();
    scene.syncControlInputs();
  });

  generateLinkBtn.addEventListener("click", () => {
    shareLinkOutEl.value = scene.generateShareLink();
    shareLinkOutEl.select();
  });

  copyLinkBtn.addEventListener("click", async () => {
    if (!shareLinkOutEl.value) {
      shareLinkOutEl.value = scene.generateShareLink();
    }
    try {
      await navigator.clipboard.writeText(shareLinkOutEl.value);
      roundStatusEl.innerHTML = `${roundStatusEl.innerHTML}<br /><strong>Link copied.</strong>`;
    } catch {
      shareLinkOutEl.select();
      document.execCommand("copy");
    }
  });

  scene.updateRoundPanels();
}

class MainScene extends Phaser.Scene {
  constructor() {
    super("main");
    this.graphics = null;
    this.hudText = null;
    this.winnerText = null;
    this.accumulator = 0;
    this.stepCounter = 0;
    this.fastForward = false;
    this.paused = false;
    this.initialState = [];
    this.balls = [];
    this.setup = structuredClone(INITIAL_SETUP);
    this.effects = [];
    this.simTime = 0;
    this.lastDamageTimesByPair = new Map();
    this.lastPairPruneAt = 0;
    this.roundFinished = false;
    this.winnerClassKey = null;
    this.nextRoundBoxClasses = [];
    this.ui = null;
    this.pixelMaskCache = new Map();
  }

  create() {
    this.cameras.main.setBackgroundColor(0x1a1d26);
    this.graphics = this.add.graphics();
    this.hudText = this.add.text(12, 12, "", {
      fontFamily: "Consolas, monospace",
      fontSize: "15px",
      color: "#f3f4f6"
    });
    this.hudText.setDepth(10);
    this.winnerText = this.add.text(0, 0, "", {
      fontFamily: "Consolas, monospace",
      fontSize: "26px",
      color: "#f8fafc",
      fontStyle: "bold"
    });
    this.winnerText.setDepth(12);
    this.winnerText.setOrigin(0.5, 0.5);
    this.winnerText.setVisible(false);

    this.input.keyboard.on("keydown-R", () => {
      this.resetSimulation();
    });
    this.input.keyboard.on("keydown-F", () => {
      this.fastForward = !this.fastForward;
    });
    this.input.keyboard.on("keydown-P", () => {
      this.paused = !this.paused;
    });

    buildControls(this);
    this.rebuildInitialState();
  }

  syncControlInputs() {
    if (!this.ui) {
      return;
    }
    this.ui.arenaWidthEl.value = String(this.setup.arenaWidth);
    this.ui.arenaHeightEl.value = String(this.setup.arenaHeight);
    for (const input of this.ui.countInputs) {
      input.value = String(this.setup.classCounts[input.dataset.classKey] ?? 0);
    }
  }

  getCurrentClassCounts() {
    const counts = Object.fromEntries(CLASS_KEYS.map((classKey) => [classKey, 0]));
    for (const ball of this.balls) {
      counts[ball.classKey] += 1;
    }
    return counts;
  }

  evaluateWinnerState() {
    if (this.roundFinished) {
      return;
    }
    if (this.balls.length === 0) {
      this.roundFinished = true;
      this.winnerClassKey = null;
      this.paused = true;
      this.updateRoundPanels();
      return;
    }
    const classSet = new Set(this.balls.map((ball) => ball.classKey));
    if (classSet.size <= 1) {
      this.roundFinished = true;
      this.winnerClassKey = this.balls[0].classKey;
      this.paused = true;
      this.effects.push({
        type: "ring",
        x: this.balls[0].x,
        y: this.balls[0].y,
        color: this.balls[0].color,
        life: 0.7,
        radius: this.balls[0].r + 6
      });
      this.updateRoundPanels();
    }
  }

  getSurvivorDraftPool() {
    if (!this.roundFinished) {
      return [];
    }
    return [...this.balls]
      .sort((a, b) => b.hp - a.hp || a.id - b.id)
      .map((ball) => ({
        id: ball.id,
        classKey: ball.classKey,
        label: `${CLASS_DEFS[ball.classKey].label} #${ball.id} (${Math.round(ball.hp)})`
      }));
  }

  addClassToNextRoundBox(classKey) {
    if (!CLASS_DEFS[classKey] || this.nextRoundBoxClasses.length >= 90) {
      return;
    }
    this.nextRoundBoxClasses.push(classKey);
    this.updateRoundPanels();
  }

  applyNextRoundBox() {
    if (this.nextRoundBoxClasses.length === 0) {
      return;
    }
    const classCounts = Object.fromEntries(CLASS_KEYS.map((classKey) => [classKey, 0]));
    for (const classKey of this.nextRoundBoxClasses) {
      classCounts[classKey] += 1;
    }
    this.nextRoundBoxClasses = [];
    this.applySetup({
      arenaWidth: this.setup.arenaWidth,
      arenaHeight: this.setup.arenaHeight,
      classCounts
    });
    this.updateRoundPanels();
  }

  generateShareLink() {
    const token = encodeSetupToken(this.setup);
    const url = new URL(window.location.href);
    url.searchParams.set("setup", token);
    const link = url.toString();
    window.history.replaceState({}, "", link);
    if (this.ui?.shareLinkOutEl) {
      this.ui.shareLinkOutEl.value = link;
    }
    return link;
  }

  updateRoundPanels() {
    if (!this.ui) {
      return;
    }

    if (this.roundFinished) {
      if (this.winnerClassKey) {
        this.ui.roundStatusEl.innerHTML = `Winner: <strong style="color:${classColorHex(this.winnerClassKey)}">${CLASS_DEFS[this.winnerClassKey].label}</strong> (${this.balls.length} left)`;
      } else {
        this.ui.roundStatusEl.innerHTML = "<strong>Draw:</strong> everyone eliminated";
      }
    } else {
      this.ui.roundStatusEl.textContent = `Round running... alive ${this.balls.length}`;
    }

    this.ui.survivorPoolEl.innerHTML = "";
    const survivorPool = this.getSurvivorDraftPool();
    if (survivorPool.length === 0) {
      const msg = document.createElement("span");
      msg.textContent = this.roundFinished ? "No survivors to draft." : "Survivors unlock when round ends.";
      msg.style.fontSize = "11px";
      msg.style.color = "#94a3b8";
      this.ui.survivorPoolEl.appendChild(msg);
    } else {
      for (const survivor of survivorPool) {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = survivor.label;
        chip.style.background = classColorHex(survivor.classKey);
        chip.draggable = true;
        chip.addEventListener("dragstart", (event) => {
          event.dataTransfer?.setData("text/classKey", survivor.classKey);
          event.dataTransfer.effectAllowed = "copy";
        });
        this.ui.survivorPoolEl.appendChild(chip);
      }
    }

    this.ui.nextRoundBoxEl.innerHTML = "";
    if (this.nextRoundBoxClasses.length === 0) {
      const msg = document.createElement("span");
      msg.textContent = "Drop survivor chips here.";
      msg.style.fontSize = "11px";
      msg.style.color = "#94a3b8";
      this.ui.nextRoundBoxEl.appendChild(msg);
    } else {
      for (let i = 0; i < this.nextRoundBoxClasses.length; i += 1) {
        const classKey = this.nextRoundBoxClasses[i];
        const chip = document.createElement("span");
        chip.className = "chip saved";
        chip.textContent = `${CLASS_DEFS[classKey].label} ${i + 1}`;
        chip.style.background = classColorHex(classKey);
        chip.title = "Click to remove";
        chip.addEventListener("click", () => {
          this.nextRoundBoxClasses.splice(i, 1);
          this.updateRoundPanels();
        });
        this.ui.nextRoundBoxEl.appendChild(chip);
      }
    }

    if (!this.ui.shareLinkOutEl.value) {
      this.ui.shareLinkOutEl.value = this.generateShareLink();
    }
  }

  applySetup(newSetup) {
    const safeClassCounts = {};
    for (const classKey of CLASS_KEYS) {
      safeClassCounts[classKey] = sanitizeCount(newSetup.classCounts[classKey]);
    }

    const totalBalls = CLASS_KEYS.reduce((sum, key) => sum + safeClassCounts[key], 0);
    if (totalBalls === 0) {
      safeClassCounts.tank = 1;
    }

    this.setup = {
      arenaWidth: sanitizeDimension(newSetup.arenaWidth, DEFAULT_SETUP.arenaWidth),
      arenaHeight: sanitizeDimension(newSetup.arenaHeight, DEFAULT_SETUP.arenaHeight),
      classCounts: safeClassCounts
    };

    this.scale.resize(this.setup.arenaWidth, this.setup.arenaHeight);
    this.cameras.main.setSize(this.setup.arenaWidth, this.setup.arenaHeight);
    this.rebuildInitialState();
    this.generateShareLink();
  }

  rebuildInitialState() {
    this.initialState = createInitialBalls(this.setup);
    this.resetSimulation();
  }

  resetSimulation() {
    this.balls = this.initialState.map((ball) => ({
      ...ball,
      abilityState: { ...ball.abilityState }
    }));
    this.effects = [];
    this.stepCounter = 0;
    this.accumulator = 0;
    this.fastForward = false;
    this.paused = false;
    this.simTime = 0;
    this.lastDamageTimesByPair.clear();
    this.lastPairPruneAt = 0;
    this.roundFinished = false;
    this.winnerClassKey = null;
    this.renderScene();
    this.updateRoundPanels();
  }

  update(_time, delta) {
    if (this.paused) {
      this.renderScene();
      return;
    }

    this.accumulator += delta / 1000;
    this.accumulator = Math.min(this.accumulator, 0.25);

    const maxStepsThisFrame = this.fastForward ? FAST_FORWARD_STEPS : NORMAL_STEPS;
    let steps = 0;
    while (this.accumulator >= FIXED_DT && steps < maxStepsThisFrame) {
      this.simulateStep(FIXED_DT);
      this.accumulator -= FIXED_DT;
      steps += 1;
    }

    this.renderScene();
  }

  simulateStep(dt) {
    const aliveBalls = this.balls.filter((ball) => ball.alive).sort((a, b) => a.id - b.id);
    const pendingDamage = new Map();
    const pendingHealing = new Map();
    this.simTime += dt;

    for (const ball of aliveBalls) {
      this.applyPerStepAbilities(ball, dt);
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      this.resolveWallCollision(ball);
      this.spawnTrail(ball);
    }

    for (let i = 0; i < aliveBalls.length; i += 1) {
      for (let j = i + 1; j < aliveBalls.length; j += 1) {
        this.resolveBallCollision(aliveBalls[i], aliveBalls[j], pendingDamage, pendingHealing);
      }
    }

    for (const ball of aliveBalls) {
      const damage = pendingDamage.get(ball.id) ?? 0;
      const healing = pendingHealing.get(ball.id) ?? 0;
      ball.hp = clamp(ball.hp - damage + healing, 0, ball.maxHp);
      if (ball.hp <= 0) {
        ball.alive = false;
      }
    }

    this.balls = this.balls.filter((ball) => ball.alive);
    for (const ball of this.balls) {
      this.capSpeed(ball);
      ball.x = round6(ball.x);
      ball.y = round6(ball.y);
      ball.vx = round6(ball.vx);
      ball.vy = round6(ball.vy);
    }

    this.pruneCollisionDamageCache();
    this.evaluateWinnerState();
    this.updateEffects(dt);
    this.stepCounter += 1;
    if (this.stepCounter % 15 === 0) {
      this.updateRoundPanels();
    }
  }

  applyPerStepAbilities(ball, dt) {
    const def = CLASS_DEFS[ball.classKey];

    if (def.regenPerSecond) {
      ball.hp = Math.min(ball.maxHp, ball.hp + def.regenPerSecond * dt);
      if ((this.stepCounter + ball.id) % 28 === 0) {
        this.effects.push({
          type: "plus",
          x: ball.x,
          y: ball.y - ball.r - 7,
          color: 0x66f39a,
          life: 0.22
        });
      }
    }

    if (ball.classKey === "trickster") {
      ball.abilityState.tricksterDashTimer -= dt;
      if (ball.abilityState.tricksterDashTimer <= 0) {
        ball.vx *= def.dashMultiplier;
        ball.vy *= def.dashMultiplier;
        ball.abilityState.tricksterDashTimer = def.dashCooldown;
        this.effects.push({
          type: "ring",
          x: ball.x,
          y: ball.y,
          color: 0xffdd66,
          life: 0.35,
          radius: ball.r
        });
      }
    }

    if (ball.classKey === "bulwark") {
      if (ball.abilityState.bulwarkShieldTimeLeft > 0) {
        ball.abilityState.bulwarkShieldTimeLeft = Math.max(
          0,
          ball.abilityState.bulwarkShieldTimeLeft - dt
        );
      } else {
        ball.abilityState.bulwarkShieldCooldown -= dt;
        if (ball.abilityState.bulwarkShieldCooldown <= 0) {
          ball.abilityState.bulwarkShieldTimeLeft = def.shieldDuration;
          ball.abilityState.bulwarkShieldCooldown = def.shieldCooldown;
          this.effects.push({
            type: "ring",
            x: ball.x,
            y: ball.y,
            color: 0xb6f1ff,
            life: 0.42,
            radius: ball.r + 2
          });
        }
      }
    }
  }

  resolveWallCollision(ball) {
    const minX = ball.r;
    const maxX = this.setup.arenaWidth - ball.r;
    const minY = ball.r;
    const maxY = this.setup.arenaHeight - ball.r;
    const wallBounceMult = CLASS_DEFS[ball.classKey].wallBounceMult ?? 1;
    let bounced = false;

    if (ball.x < minX) {
      ball.x = minX;
      ball.vx = Math.abs(ball.vx) * wallBounceMult;
      bounced = true;
    } else if (ball.x > maxX) {
      ball.x = maxX;
      ball.vx = -Math.abs(ball.vx) * wallBounceMult;
      bounced = true;
    }

    if (ball.y < minY) {
      ball.y = minY;
      ball.vy = Math.abs(ball.vy) * wallBounceMult;
      bounced = true;
    } else if (ball.y > maxY) {
      ball.y = maxY;
      ball.vy = -Math.abs(ball.vy) * wallBounceMult;
      bounced = true;
    }

    if (bounced) {
      this.effects.push({
        type: "spark",
        x: ball.x,
        y: ball.y,
        color: 0xd8dee9,
        life: 0.2
      });
    }
  }

  resolveBallCollision(a, b, pendingDamage, pendingHealing) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const minDist = a.r + b.r;
    const distSq = dx * dx + dy * dy;

    if (distSq >= minDist * minDist) {
      return;
    }

    let dist = Math.sqrt(distSq);
    let nx = 1;
    let ny = 0;
    if (dist > 0) {
      nx = dx / dist;
      ny = dy / dist;
    } else {
      dist = 0;
    }

    const penetration = minDist - dist;
    if (penetration > 0) {
      const invMassA = 1 / a.mass;
      const invMassB = 1 / b.mass;
      const invMassSum = invMassA + invMassB;

      a.x -= nx * penetration * (invMassA / invMassSum);
      a.y -= ny * penetration * (invMassA / invMassSum);
      b.x += nx * penetration * (invMassB / invMassSum);
      b.y += ny * penetration * (invMassB / invMassSum);
    }

    const rvx = b.vx - a.vx;
    const rvy = b.vy - a.vy;
    const relVelN = rvx * nx + rvy * ny;
    const impact = Math.max(0, -relVelN);

    const aForwardSpeed = Math.max(0, a.vx * nx + a.vy * ny);
    const bForwardSpeed = Math.max(0, -(b.vx * nx + b.vy * ny));
    const aSpeedBonus = clamp((aForwardSpeed / MAX_SPEED) * SPEED_DAMAGE_SCALE, 0, SPEED_DAMAGE_BONUS_CAP);
    const bSpeedBonus = clamp((bForwardSpeed / MAX_SPEED) * SPEED_DAMAGE_SCALE, 0, SPEED_DAMAGE_BONUS_CAP);

    const pairKey = this.getPairKey(a.id, b.id);
    const canDealDamage = this.canDealCollisionDamage(pairKey);

    let damageFromA = 0;
    let damageFromB = 0;
    if (canDealDamage && impact >= IMPACT_DAMAGE_THRESHOLD) {
      const impactDamage = clamp(BASE_DAMAGE + DAMAGE_SCALE * impact, MIN_DAMAGE, MAX_DAMAGE);
      damageFromA = impactDamage * (1 + aSpeedBonus);
      damageFromB = impactDamage * (1 + bSpeedBonus);
    }

    if (a.classKey === "sniper" && impact >= CLASS_DEFS.sniper.impactThreshold) {
      damageFromA *= CLASS_DEFS.sniper.impactBonusMult;
    }
    if (b.classKey === "sniper" && impact >= CLASS_DEFS.sniper.impactThreshold) {
      damageFromB *= CLASS_DEFS.sniper.impactBonusMult;
    }

    if (a.classKey === "striker" && a.hp / a.maxHp < 0.35) {
      damageFromA *= 1.2;
    }
    if (b.classKey === "striker" && b.hp / b.maxHp < 0.35) {
      damageFromB *= 1.2;
    }

    let damageToB =
      damageFromA *
      CLASS_DEFS[a.classKey].outgoingDamageMult *
      CLASS_DEFS[b.classKey].incomingDamageMult;
    let damageToA =
      damageFromB *
      CLASS_DEFS[b.classKey].outgoingDamageMult *
      CLASS_DEFS[a.classKey].incomingDamageMult;

    if (a.classKey === "bulwark" && a.abilityState.bulwarkShieldTimeLeft > 0) {
      damageToA *= CLASS_DEFS.bulwark.shieldReductionMult;
    }
    if (b.classKey === "bulwark" && b.abilityState.bulwarkShieldTimeLeft > 0) {
      damageToB *= CLASS_DEFS.bulwark.shieldReductionMult;
    }

    if (canDealDamage && (damageToA > 0 || damageToB > 0)) {
      this.lastDamageTimesByPair.set(pairKey, this.simTime);
      pendingDamage.set(a.id, (pendingDamage.get(a.id) ?? 0) + damageToA);
      pendingDamage.set(b.id, (pendingDamage.get(b.id) ?? 0) + damageToB);
    }

    if (canDealDamage && a.classKey === "vampire") {
      pendingHealing.set(
        a.id,
        (pendingHealing.get(a.id) ?? 0) + damageToB * CLASS_DEFS.vampire.lifesteal
      );
    }
    if (canDealDamage && b.classKey === "vampire") {
      pendingHealing.set(
        b.id,
        (pendingHealing.get(b.id) ?? 0) + damageToA * CLASS_DEFS.vampire.lifesteal
      );
    }

    if (canDealDamage && a.classKey === "bulwark" && a.abilityState.bulwarkShieldTimeLeft > 0) {
      pendingDamage.set(b.id, (pendingDamage.get(b.id) ?? 0) + damageToA * CLASS_DEFS.bulwark.thorns);
    }
    if (canDealDamage && b.classKey === "bulwark" && b.abilityState.bulwarkShieldTimeLeft > 0) {
      pendingDamage.set(a.id, (pendingDamage.get(a.id) ?? 0) + damageToB * CLASS_DEFS.bulwark.thorns);
    }

    this.effects.push({
      type: "spark",
      x: (a.x + b.x) * 0.5,
      y: (a.y + b.y) * 0.5,
      color: 0xffffff,
      life: clamp(0.14 + impact / 900, 0.14, 0.36)
    });

    if (relVelN < 0) {
      const invMassA = 1 / a.mass;
      const invMassB = 1 / b.mass;
      const impulse = (-(1 + RESTITUTION) * relVelN) / (invMassA + invMassB);

      const impulseX = impulse * nx;
      const impulseY = impulse * ny;
      a.vx -= impulseX * invMassA;
      a.vy -= impulseY * invMassA;
      b.vx += impulseX * invMassB;
      b.vy += impulseY * invMassB;
    }
  }

  capSpeed(ball) {
    const speedSq = ball.vx * ball.vx + ball.vy * ball.vy;
    const maxSpeedSq = MAX_SPEED * MAX_SPEED;
    if (speedSq > maxSpeedSq) {
      const speed = Math.sqrt(speedSq);
      const scale = MAX_SPEED / speed;
      ball.vx *= scale;
      ball.vy *= scale;
    }
  }

  getPairKey(idA, idB) {
    return idA < idB ? `${idA}:${idB}` : `${idB}:${idA}`;
  }

  canDealCollisionDamage(pairKey) {
    const lastHitTime = this.lastDamageTimesByPair.get(pairKey);
    if (lastHitTime == null) {
      return true;
    }
    return this.simTime - lastHitTime >= COLLISION_DAMAGE_COOLDOWN;
  }

  pruneCollisionDamageCache() {
    if (this.simTime - this.lastPairPruneAt < 0.6) {
      return;
    }
    this.lastPairPruneAt = this.simTime;
    for (const [pairKey, lastHitTime] of this.lastDamageTimesByPair.entries()) {
      if (this.simTime - lastHitTime > COLLISION_DAMAGE_CACHE_TTL) {
        this.lastDamageTimesByPair.delete(pairKey);
      }
    }
  }

  spawnTrail(ball) {
    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed < 200) {
      return;
    }
    if ((this.stepCounter + ball.id) % 3 !== 0) {
      return;
    }
    this.effects.push({
      type: "trail",
      x: ball.x,
      y: ball.y,
      color: ball.color,
      life: 0.18
    });
  }

  updateEffects(dt) {
    for (const fx of this.effects) {
      fx.life -= dt;
    }
    this.effects = this.effects.filter((fx) => fx.life > 0);
    if (this.effects.length > MAX_EFFECTS) {
      this.effects = this.effects.slice(this.effects.length - MAX_EFFECTS);
    }
  }

  getPixelMask(radius) {
    if (this.pixelMaskCache.has(radius)) {
      return this.pixelMaskCache.get(radius);
    }
    const points = [];
    for (let py = -radius; py <= radius; py += PIXEL_SIZE) {
      for (let px = -radius; px <= radius; px += PIXEL_SIZE) {
        if (px * px + py * py <= radius * radius) {
          points.push([px, py]);
        }
      }
    }
    this.pixelMaskCache.set(radius, points);
    return points;
  }

  drawPixelBall(ball) {
    const r = ball.r;
    const shade = Phaser.Display.Color.IntegerToColor(ball.color);
    const highlight = Phaser.Display.Color.GetColor(
      clamp(shade.red + 48, 0, 255),
      clamp(shade.green + 48, 0, 255),
      clamp(shade.blue + 48, 0, 255)
    );
    const shadow = Phaser.Display.Color.GetColor(
      clamp(shade.red - 42, 0, 255),
      clamp(shade.green - 42, 0, 255),
      clamp(shade.blue - 42, 0, 255)
    );

    const points = this.getPixelMask(r);
    for (const [px, py] of points) {
      let color = ball.color;
      if (px + py < -r * 0.25) {
        color = highlight;
      } else if (px + py > r * 0.4) {
        color = shadow;
      }
      this.graphics.fillStyle(color, 1);
      this.graphics.fillRect(ball.x + px, ball.y + py, PIXEL_SIZE, PIXEL_SIZE);
    }

    const edge = 0x111111;
    this.graphics.fillStyle(edge, 1);
    this.graphics.fillRect(ball.x - r, ball.y - r, r * 2, 1);
    this.graphics.fillRect(ball.x - r, ball.y + r - 1, r * 2, 1);
    this.graphics.fillRect(ball.x - r, ball.y - r, 1, r * 2);
    this.graphics.fillRect(ball.x + r - 1, ball.y - r, 1, r * 2);
  }

  drawClassArt(ball) {
    const cx = Math.round(ball.x);
    const cy = Math.round(ball.y);
    const r = ball.r;
    const ink = 0x0b0f18;
    this.graphics.fillStyle(ink, 0.95);

    if (ball.classKey === "tank") {
      this.graphics.fillRect(cx - 4, cy - 4, 8, 8);
      this.graphics.fillRect(cx - 8, cy - 1, 16, 2);
    } else if (ball.classKey === "striker") {
      this.graphics.fillRect(cx + 2, cy - 7, 2, 6);
      this.graphics.fillRect(cx - 4, cy - 1, 10, 2);
      this.graphics.fillRect(cx - 8, cy + 5, 2, 2);
    } else if (ball.classKey === "medic") {
      this.graphics.fillRect(cx - 1, cy - 6, 2, 12);
      this.graphics.fillRect(cx - 6, cy - 1, 12, 2);
    } else if (ball.classKey === "trickster") {
      this.graphics.fillRect(cx - 6, cy + 2, 12, 2);
      this.graphics.fillRect(cx - 2, cy - 6, 2, 8);
      this.graphics.fillRect(cx + 2, cy - 6, 2, 8);
    } else if (ball.classKey === "sniper") {
      this.graphics.fillRect(cx - 7, cy - 1, 14, 2);
      this.graphics.fillRect(cx + 6, cy - 2, 2, 4);
    } else if (ball.classKey === "vampire") {
      this.graphics.fillRect(cx - 5, cy - 4, 3, 8);
      this.graphics.fillRect(cx + 2, cy - 4, 3, 8);
      this.graphics.fillRect(cx - 2, cy + 2, 4, 4);
    } else if (ball.classKey === "bulwark") {
      this.graphics.fillRect(cx - 6, cy - 5, 12, 10);
      this.graphics.fillStyle(0xbfd4da, 0.9);
      this.graphics.fillRect(cx - 1, cy - 3, 2, 6);
    }
  }

  drawEffects() {
    for (const fx of this.effects) {
      const alpha = clamp(fx.life * 4, 0, 1);
      if (fx.type === "trail") {
        this.graphics.fillStyle(fx.color, alpha * 0.5);
        this.graphics.fillRect(fx.x - 2, fx.y - 2, 4, 4);
      } else if (fx.type === "spark") {
        this.graphics.fillStyle(fx.color, alpha);
        this.graphics.fillRect(fx.x - 1, fx.y - 1, 3, 3);
        this.graphics.fillRect(fx.x - 5, fx.y - 1, 2, 2);
        this.graphics.fillRect(fx.x + 3, fx.y - 1, 2, 2);
        this.graphics.fillRect(fx.x - 1, fx.y - 5, 2, 2);
        this.graphics.fillRect(fx.x - 1, fx.y + 3, 2, 2);
      } else if (fx.type === "ring") {
        this.graphics.lineStyle(2, fx.color, alpha);
        this.graphics.strokeCircle(fx.x, fx.y, (fx.radius ?? 10) + (1 - alpha) * 6);
      } else if (fx.type === "plus") {
        this.graphics.fillStyle(fx.color, alpha);
        this.graphics.fillRect(fx.x - 1, fx.y - 4, 2, 8);
        this.graphics.fillRect(fx.x - 4, fx.y - 1, 8, 2);
      }
    }
  }

  renderScene() {
    this.graphics.clear();

    this.graphics.fillStyle(0x202430, 1);
    this.graphics.fillRect(0, 0, this.setup.arenaWidth, this.setup.arenaHeight);
    this.graphics.fillStyle(0x232838, 1);
    for (let y = 0; y < this.setup.arenaHeight; y += 24) {
      for (let x = (y / 24) % 2 === 0 ? 0 : 12; x < this.setup.arenaWidth; x += 24) {
        this.graphics.fillRect(x, y, 12, 12);
      }
    }

    this.graphics.lineStyle(BORDER_THICKNESS, 0xbec5d0, 1);
    this.graphics.strokeRect(
      BORDER_THICKNESS / 2,
      BORDER_THICKNESS / 2,
      this.setup.arenaWidth - BORDER_THICKNESS,
      this.setup.arenaHeight - BORDER_THICKNESS
    );
    this.graphics.fillStyle(0x0b1220, 0.2);
    this.graphics.fillRect(0, 0, this.setup.arenaWidth, 40);
    this.graphics.fillRect(0, this.setup.arenaHeight - 40, this.setup.arenaWidth, 40);

    for (const ball of this.balls) {
      this.drawPixelBall(ball);
      this.drawClassArt(ball);

      if (ball.classKey === "bulwark" && ball.abilityState.bulwarkShieldTimeLeft > 0) {
        this.graphics.lineStyle(2, 0xa8f0ff, 0.8);
        this.graphics.strokeCircle(ball.x, ball.y, ball.r + 4);
      }

      const barWidth = ball.r * 2;
      const barHeight = 4;
      const hpRatio = clamp(ball.hp / ball.maxHp, 0, 1);
      const barX = ball.x - barWidth / 2;
      const barY = ball.y - ball.r - 11;

      this.graphics.fillStyle(0x101316, 1);
      this.graphics.fillRect(barX, barY, barWidth, barHeight);
      const hpColor = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0xdd3c3c),
        Phaser.Display.Color.ValueToColor(0x35c94a),
        100,
        Math.floor(hpRatio * 100)
      );
      this.graphics.fillStyle(Phaser.Display.Color.GetColor(hpColor.r, hpColor.g, hpColor.b), 1);
      this.graphics.fillRect(barX + 1, barY + 1, (barWidth - 2) * hpRatio, barHeight - 2);
    }

    this.drawEffects();

    if (this.roundFinished) {
      const bannerWidth = Math.min(520, this.setup.arenaWidth - 60);
      const bannerHeight = 54;
      const bx = (this.setup.arenaWidth - bannerWidth) / 2;
      const by = 20;
      this.graphics.fillStyle(0x060b16, 0.82);
      this.graphics.fillRect(bx, by, bannerWidth, bannerHeight);
      this.graphics.lineStyle(2, this.winnerClassKey ? CLASS_DEFS[this.winnerClassKey].color : 0xf8fafc, 1);
      this.graphics.strokeRect(bx, by, bannerWidth, bannerHeight);
      this.graphics.fillStyle(0xf8fafc, 1);
      this.graphics.fillRect(bx + 18, by + 20, bannerWidth - 36, 2);
      const winnerLabel = this.winnerClassKey ? `${CLASS_DEFS[this.winnerClassKey].label} WINS` : "DRAW";
      this.winnerText.setVisible(true);
      this.winnerText.setText(winnerLabel);
      this.winnerText.setColor(this.winnerClassKey ? classColorHex(this.winnerClassKey) : "#f8fafc");
      this.winnerText.setPosition(this.setup.arenaWidth / 2, by + bannerHeight / 2);
    } else {
      this.winnerText.setVisible(false);
    }

    const setupSummary = CLASS_KEYS.map(
      (classKey) => `${CLASS_DEFS[classKey].label}:${this.setup.classCounts[classKey]}`
    ).join(" ");

    const aliveCounts = this.getCurrentClassCounts();
    const aliveSummary = CLASS_KEYS.map((classKey) => `${CLASS_DEFS[classKey].label}:${aliveCounts[classKey]}`).join(
      " "
    );

    this.hudText.setText(
      `step:${this.stepCounter}  alive:${this.balls.length}  size:${this.setup.arenaWidth}x${this.setup.arenaHeight}\nsetup:${setupSummary}\nalive:${aliveSummary}\nfast-forward:${
        this.fastForward ? "ON" : "OFF"
      }  paused:${this.paused ? "ON" : "OFF"}${
        this.roundFinished
          ? `\nwinner:${this.winnerClassKey ? CLASS_DEFS[this.winnerClassKey].label : "Draw"}`
          : ""
      }`
    );
  }
}

const config = {
  type: Phaser.AUTO,
  width: INITIAL_SETUP.arenaWidth,
  height: INITIAL_SETUP.arenaHeight,
  backgroundColor: "#1a1d26",
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  scene: MainScene
};

new Phaser.Game(config);
