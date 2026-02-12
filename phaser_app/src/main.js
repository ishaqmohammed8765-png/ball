import Phaser from "phaser";

const BORDER_THICKNESS = 8;
const FIXED_DT = 1 / 120;
const POSITION_ROUNDING = 1_000_000;
const MAX_SPEED = 700;

const RESTITUTION = 0.98;
const BASE_DAMAGE = 1.3;
const DAMAGE_SCALE = 0.11;
const MIN_DAMAGE = 0.35;
const MAX_DAMAGE = 20;

const FAST_FORWARD_STEPS = 4;
const NORMAL_STEPS = 1;

const CLASS_KEYS = ["tank", "striker", "medic", "trickster"];

const CLASS_DEFS = {
  tank: {
    label: "Tank",
    color: 0x2f6fdb,
    radius: 22,
    mass: 1.6,
    maxHp: 150,
    speed: 165,
    outgoingDamageMult: 0.85,
    incomingDamageMult: 0.72,
    wallBounceMult: 0.9
  },
  striker: {
    label: "Striker",
    color: 0xe64b3c,
    radius: 17,
    mass: 1.0,
    maxHp: 100,
    speed: 250,
    outgoingDamageMult: 1.35,
    incomingDamageMult: 1.0,
    wallBounceMult: 1.0
  },
  medic: {
    label: "Medic",
    color: 0x23b46e,
    radius: 18,
    mass: 1.05,
    maxHp: 110,
    speed: 205,
    outgoingDamageMult: 1.0,
    incomingDamageMult: 0.95,
    wallBounceMult: 1.0,
    regenPerSecond: 4.5
  },
  trickster: {
    label: "Trickster",
    color: 0xf0b429,
    radius: 16,
    mass: 0.8,
    maxHp: 90,
    speed: 240,
    outgoingDamageMult: 1.05,
    incomingDamageMult: 1.08,
    wallBounceMult: 1.08,
    dashCooldown: 2.8,
    dashMultiplier: 1.45
  }
};

const DEFAULT_SETUP = {
  arenaWidth: 900,
  arenaHeight: 600,
  classCounts: {
    tank: 5,
    striker: 6,
    medic: 4,
    trickster: 5
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

function sanitizeCount(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return 0;
  }
  return clamp(parsed, 0, 80);
}

function sanitizeDimension(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return fallback;
  }
  return clamp(parsed, 420, 2000);
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
      tricksterDashTimer: def.dashCooldown ?? 0
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
  const marginX = Math.max(50, Math.min(120, setup.arenaWidth * 0.12));
  const marginY = Math.max(50, Math.min(120, setup.arenaHeight * 0.12));
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
    #ball-controls {
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 50;
      width: 230px;
      background: rgba(12, 12, 18, 0.86);
      color: #f3f4f6;
      border-radius: 10px;
      padding: 12px;
      font-family: "Segoe UI", Tahoma, sans-serif;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
      user-select: none;
    }
    #ball-controls h2 {
      margin: 0 0 10px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.35px;
    }
    #ball-controls .row {
      display: grid;
      grid-template-columns: 1fr 70px;
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
      border-radius: 6px;
      padding: 5px 6px;
      font-size: 12px;
      background: #111827;
      color: #f9fafb;
    }
    #ball-controls .actions {
      display: grid;
      grid-template-columns: 1fr;
      gap: 6px;
      margin-top: 8px;
    }
    #ball-controls button {
      border: 0;
      border-radius: 7px;
      padding: 8px 9px;
      cursor: pointer;
      font-weight: 700;
      font-size: 12px;
      background: #f59e0b;
      color: #111827;
    }
    #ball-controls .hint {
      margin-top: 8px;
      font-size: 11px;
      color: #d1d5db;
      line-height: 1.3;
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

  root.innerHTML = `
    <h2>Arena + Classes</h2>
    <div class="row">
      <label for="arenaWidth">Arena Width</label>
      <input id="arenaWidth" type="number" min="420" max="2000" />
    </div>
    <div class="row">
      <label for="arenaHeight">Arena Height</label>
      <input id="arenaHeight" type="number" min="420" max="2000" />
    </div>
    <div class="row">
      <label for="countTank">Tank Balls</label>
      <input id="countTank" type="number" min="0" max="80" />
    </div>
    <div class="row">
      <label for="countStriker">Striker Balls</label>
      <input id="countStriker" type="number" min="0" max="80" />
    </div>
    <div class="row">
      <label for="countMedic">Medic Balls</label>
      <input id="countMedic" type="number" min="0" max="80" />
    </div>
    <div class="row">
      <label for="countTrickster">Trickster Balls</label>
      <input id="countTrickster" type="number" min="0" max="80" />
    </div>
    <div class="actions">
      <button id="applySetupBtn" type="button">Apply Setup + Reset</button>
    </div>
    <div class="hint">R = reset | F = fast-forward</div>
  `;

  const arenaWidthEl = root.querySelector("#arenaWidth");
  const arenaHeightEl = root.querySelector("#arenaHeight");
  const countTankEl = root.querySelector("#countTank");
  const countStrikerEl = root.querySelector("#countStriker");
  const countMedicEl = root.querySelector("#countMedic");
  const countTricksterEl = root.querySelector("#countTrickster");
  const applyBtn = root.querySelector("#applySetupBtn");

  arenaWidthEl.value = String(scene.setup.arenaWidth);
  arenaHeightEl.value = String(scene.setup.arenaHeight);
  countTankEl.value = String(scene.setup.classCounts.tank);
  countStrikerEl.value = String(scene.setup.classCounts.striker);
  countMedicEl.value = String(scene.setup.classCounts.medic);
  countTricksterEl.value = String(scene.setup.classCounts.trickster);

  applyBtn.addEventListener("click", () => {
    scene.applySetup({
      arenaWidth: sanitizeDimension(arenaWidthEl.value, scene.setup.arenaWidth),
      arenaHeight: sanitizeDimension(arenaHeightEl.value, scene.setup.arenaHeight),
      classCounts: {
        tank: sanitizeCount(countTankEl.value),
        striker: sanitizeCount(countStrikerEl.value),
        medic: sanitizeCount(countMedicEl.value),
        trickster: sanitizeCount(countTricksterEl.value)
      }
    });

    arenaWidthEl.value = String(scene.setup.arenaWidth);
    arenaHeightEl.value = String(scene.setup.arenaHeight);
    countTankEl.value = String(scene.setup.classCounts.tank);
    countStrikerEl.value = String(scene.setup.classCounts.striker);
    countMedicEl.value = String(scene.setup.classCounts.medic);
    countTricksterEl.value = String(scene.setup.classCounts.trickster);
  });
}

class MainScene extends Phaser.Scene {
  constructor() {
    super("main");
    this.graphics = null;
    this.hudText = null;
    this.accumulator = 0;
    this.stepCounter = 0;
    this.fastForward = false;
    this.initialState = [];
    this.balls = [];
    this.setup = structuredClone(DEFAULT_SETUP);
  }

  create() {
    this.cameras.main.setBackgroundColor(0xffffff);
    this.graphics = this.add.graphics();
    this.hudText = this.add.text(12, 12, "", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#000000"
    });
    this.hudText.setDepth(10);

    this.input.keyboard.on("keydown-R", () => {
      this.resetSimulation();
    });
    this.input.keyboard.on("keydown-F", () => {
      this.fastForward = !this.fastForward;
    });

    buildControls(this);
    this.rebuildInitialState();
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
    this.stepCounter = 0;
    this.accumulator = 0;
    this.fastForward = false;
    this.renderScene();
  }

  update(_time, delta) {
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

    for (const ball of aliveBalls) {
      this.applyPerStepAbilities(ball, dt);
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      this.resolveWallCollision(ball);
    }

    for (let i = 0; i < aliveBalls.length; i += 1) {
      for (let j = i + 1; j < aliveBalls.length; j += 1) {
        this.resolveBallCollision(aliveBalls[i], aliveBalls[j], pendingDamage);
      }
    }

    for (const ball of aliveBalls) {
      const damage = pendingDamage.get(ball.id) ?? 0;
      ball.hp -= damage;
      if (ball.hp <= 0) {
        ball.hp = 0;
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

    this.stepCounter += 1;
  }

  applyPerStepAbilities(ball, dt) {
    const def = CLASS_DEFS[ball.classKey];

    if (def.regenPerSecond) {
      ball.hp = Math.min(ball.maxHp, ball.hp + def.regenPerSecond * dt);
    }

    if (ball.classKey === "trickster") {
      ball.abilityState.tricksterDashTimer -= dt;
      if (ball.abilityState.tricksterDashTimer <= 0) {
        ball.vx *= def.dashMultiplier;
        ball.vy *= def.dashMultiplier;
        ball.abilityState.tricksterDashTimer = def.dashCooldown;
      }
    }
  }

  resolveWallCollision(ball) {
    const minX = ball.r;
    const maxX = this.setup.arenaWidth - ball.r;
    const minY = ball.r;
    const maxY = this.setup.arenaHeight - ball.r;
    const wallBounceMult = CLASS_DEFS[ball.classKey].wallBounceMult ?? 1;

    if (ball.x < minX) {
      ball.x = minX;
      ball.vx = Math.abs(ball.vx) * wallBounceMult;
    } else if (ball.x > maxX) {
      ball.x = maxX;
      ball.vx = -Math.abs(ball.vx) * wallBounceMult;
    }

    if (ball.y < minY) {
      ball.y = minY;
      ball.vy = Math.abs(ball.vy) * wallBounceMult;
    } else if (ball.y > maxY) {
      ball.y = maxY;
      ball.vy = -Math.abs(ball.vy) * wallBounceMult;
    }
  }

  resolveBallCollision(a, b, pendingDamage) {
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
    const baseDamage = clamp(BASE_DAMAGE + DAMAGE_SCALE * impact, MIN_DAMAGE, MAX_DAMAGE);

    const damageToA =
      baseDamage *
      CLASS_DEFS[b.classKey].outgoingDamageMult *
      CLASS_DEFS[a.classKey].incomingDamageMult;
    const damageToB =
      baseDamage *
      CLASS_DEFS[a.classKey].outgoingDamageMult *
      CLASS_DEFS[b.classKey].incomingDamageMult;

    pendingDamage.set(a.id, (pendingDamage.get(a.id) ?? 0) + damageToA);
    pendingDamage.set(b.id, (pendingDamage.get(b.id) ?? 0) + damageToB);

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

  drawClassArt(ball) {
    const cx = ball.x;
    const cy = ball.y;
    const r = ball.r;

    this.graphics.lineStyle(2, 0x111111, 0.95);
    if (ball.classKey === "tank") {
      this.graphics.strokeRect(cx - r * 0.45, cy - r * 0.45, r * 0.9, r * 0.9);
      this.graphics.lineBetween(cx - r * 0.7, cy, cx + r * 0.7, cy);
    } else if (ball.classKey === "striker") {
      this.graphics.lineBetween(cx - r * 0.6, cy + r * 0.6, cx + r * 0.6, cy - r * 0.6);
      this.graphics.lineBetween(cx - r * 0.1, cy + r * 0.6, cx + r * 0.6, cy - r * 0.1);
    } else if (ball.classKey === "medic") {
      this.graphics.lineBetween(cx - r * 0.5, cy, cx + r * 0.5, cy);
      this.graphics.lineBetween(cx, cy - r * 0.5, cx, cy + r * 0.5);
      this.graphics.strokeCircle(cx, cy, r * 0.45);
    } else if (ball.classKey === "trickster") {
      this.graphics.strokeTriangle(
        cx,
        cy - r * 0.6,
        cx - r * 0.6,
        cy + r * 0.55,
        cx + r * 0.6,
        cy + r * 0.55
      );
    }
  }

  renderScene() {
    this.graphics.clear();
    this.graphics.lineStyle(BORDER_THICKNESS, 0x000000, 1);
    this.graphics.strokeRect(
      BORDER_THICKNESS / 2,
      BORDER_THICKNESS / 2,
      this.setup.arenaWidth - BORDER_THICKNESS,
      this.setup.arenaHeight - BORDER_THICKNESS
    );

    for (const ball of this.balls) {
      this.graphics.fillStyle(ball.color, 1);
      this.graphics.fillCircle(ball.x, ball.y, ball.r);
      this.graphics.lineStyle(2, 0x111111, 0.9);
      this.graphics.strokeCircle(ball.x, ball.y, ball.r);
      this.drawClassArt(ball);

      const barWidth = ball.r * 2;
      const barHeight = 5;
      const hpRatio = clamp(ball.hp / ball.maxHp, 0, 1);
      const barX = ball.x - barWidth / 2;
      const barY = ball.y - ball.r - 12;

      this.graphics.fillStyle(0x111111, 1);
      this.graphics.fillRect(barX, barY, barWidth, barHeight);
      this.graphics.fillStyle(0x35c94a, 1);
      this.graphics.fillRect(barX + 1, barY + 1, (barWidth - 2) * hpRatio, barHeight - 2);
      this.graphics.lineStyle(1, 0x000000, 1);
      this.graphics.strokeRect(barX, barY, barWidth, barHeight);
    }

    const classSummary = CLASS_KEYS.map(
      (classKey) => `${CLASS_DEFS[classKey].label}:${this.setup.classCounts[classKey]}`
    ).join(" ");

    this.hudText.setText(
      `step: ${this.stepCounter}\nalive: ${this.balls.length}\nsize: ${this.setup.arenaWidth}x${this.setup.arenaHeight}\n${classSummary}\nfast-forward: ${
        this.fastForward ? "ON" : "OFF"
      }`
    );
  }
}

const config = {
  type: Phaser.AUTO,
  width: DEFAULT_SETUP.arenaWidth,
  height: DEFAULT_SETUP.arenaHeight,
  backgroundColor: "#ffffff",
  scene: MainScene
};

new Phaser.Game(config);
