import Phaser from "phaser";

const ARENA_WIDTH = 900;
const ARENA_HEIGHT = 600;
const BORDER_THICKNESS = 8;

const BALL_COUNT = 20;
const BALL_RADIUS = 18;
const BALL_MASS = 1;
const MAX_HP = 100;

const FIXED_DT = 1 / 120;
const POSITION_ROUNDING = 1_000_000;
const MAX_SPEED = 600;

const RESTITUTION = 0.98;
const BASE_DAMAGE = 1.5;
const DAMAGE_SCALE = 0.12;
const MIN_DAMAGE = 0.5;
const MAX_DAMAGE = 18;

const FAST_FORWARD_STEPS = 4;
const NORMAL_STEPS = 1;

const VELOCITY_VECTORS = [
  [180, 120],
  [-180, 120],
  [180, -120],
  [-180, -120],
  [220, 80],
  [-220, 80],
  [220, -80],
  [-220, -80],
  [140, 200],
  [-140, 200]
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round6 = (value) => Math.round(value * POSITION_ROUNDING) / POSITION_ROUNDING;

function colorFromId(id) {
  const hue = ((id * 137) % 360) / 360;
  return Phaser.Display.Color.HSLToColor(hue, 0.75, 0.55).color;
}

function createInitialBalls() {
  const cols = 5;
  const rows = 4;
  const marginX = 100;
  const marginY = 100;
  const spanX = ARENA_WIDTH - marginX * 2;
  const spanY = ARENA_HEIGHT - marginY * 2;

  const balls = [];

  for (let id = 0; id < BALL_COUNT; id += 1) {
    const col = id % cols;
    const row = Math.floor(id / cols);
    const x = cols > 1 ? marginX + (spanX * col) / (cols - 1) : ARENA_WIDTH / 2;
    const y = rows > 1 ? marginY + (spanY * row) / (rows - 1) : ARENA_HEIGHT / 2;

    const [vx, vy] = VELOCITY_VECTORS[id % VELOCITY_VECTORS.length];

    balls.push({
      id,
      r: BALL_RADIUS,
      mass: BALL_MASS,
      x,
      y,
      vx,
      vy,
      hp: MAX_HP,
      maxHp: MAX_HP,
      color: colorFromId(id),
      alive: true
    });
  }

  return balls;
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
  }

  create() {
    this.cameras.main.setBackgroundColor(0xffffff);

    this.graphics = this.add.graphics();
    this.hudText = this.add.text(12, 12, "", {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#000000"
    });

    this.input.keyboard.on("keydown-R", () => {
      this.resetSimulation();
    });

    this.input.keyboard.on("keydown-F", () => {
      this.fastForward = !this.fastForward;
    });

    this.initialState = createInitialBalls();
    this.resetSimulation();
  }

  resetSimulation() {
    this.balls = this.initialState.map((ball) => ({ ...ball }));
    this.stepCounter = 0;
    this.accumulator = 0;
    this.fastForward = false;
    this.renderScene();
  }

  update(_time, delta) {
    this.accumulator += delta / 1000;
    this.accumulator = Math.min(this.accumulator, 0.25);

    let steps = 0;
    const maxStepsThisFrame = this.fastForward ? FAST_FORWARD_STEPS : NORMAL_STEPS;

    while (this.accumulator >= FIXED_DT && steps < maxStepsThisFrame) {
      this.simulateStep(FIXED_DT);
      this.accumulator -= FIXED_DT;
      steps += 1;
    }

    this.renderScene();
  }

  simulateStep(dt) {
    const aliveBalls = this.balls.filter((ball) => ball.alive).sort((a, b) => a.id - b.id);
    const pendingDamage = new Array(BALL_COUNT).fill(0);

    for (const ball of aliveBalls) {
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
      ball.hp -= pendingDamage[ball.id];
      if (ball.hp <= 0) {
        ball.hp = 0;
        ball.alive = false;
      }
    }

    const deadIds = this.balls
      .filter((ball) => !ball.alive)
      .map((ball) => ball.id)
      .sort((a, b) => a - b);

    if (deadIds.length > 0) {
      const deadSet = new Set(deadIds);
      this.balls = this.balls.filter((ball) => !deadSet.has(ball.id));
    }

    for (const ball of this.balls) {
      this.capSpeed(ball);
      ball.x = round6(ball.x);
      ball.y = round6(ball.y);
      ball.vx = round6(ball.vx);
      ball.vy = round6(ball.vy);
    }

    this.stepCounter += 1;
  }

  resolveWallCollision(ball) {
    const minX = ball.r;
    const maxX = ARENA_WIDTH - ball.r;
    const minY = ball.r;
    const maxY = ARENA_HEIGHT - ball.r;

    if (ball.x < minX) {
      ball.x = minX;
      ball.vx = Math.abs(ball.vx);
    } else if (ball.x > maxX) {
      ball.x = maxX;
      ball.vx = -Math.abs(ball.vx);
    }

    if (ball.y < minY) {
      ball.y = minY;
      ball.vy = Math.abs(ball.vy);
    } else if (ball.y > maxY) {
      ball.y = maxY;
      ball.vy = -Math.abs(ball.vy);
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
    const damage = clamp(BASE_DAMAGE + DAMAGE_SCALE * impact, MIN_DAMAGE, MAX_DAMAGE);
    pendingDamage[a.id] += damage;
    pendingDamage[b.id] += damage;

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

  renderScene() {
    this.graphics.clear();

    this.graphics.lineStyle(BORDER_THICKNESS, 0x000000, 1);
    this.graphics.strokeRect(
      BORDER_THICKNESS / 2,
      BORDER_THICKNESS / 2,
      ARENA_WIDTH - BORDER_THICKNESS,
      ARENA_HEIGHT - BORDER_THICKNESS
    );

    for (const ball of this.balls) {
      this.graphics.fillStyle(ball.color, 1);
      this.graphics.fillCircle(ball.x, ball.y, ball.r);
      this.graphics.lineStyle(2, 0x000000, 1);
      this.graphics.strokeCircle(ball.x, ball.y, ball.r);

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

    this.hudText.setText(
      `step: ${this.stepCounter}\nalive: ${this.balls.length}\nfast-forward: ${this.fastForward ? "ON" : "OFF"}\nR: reset  F: toggle`
    );
  }
}

const config = {
  type: Phaser.AUTO,
  width: ARENA_WIDTH,
  height: ARENA_HEIGHT,
  backgroundColor: "#ffffff",
  scene: MainScene
};

new Phaser.Game(config);

