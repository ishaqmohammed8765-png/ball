import { CLASS_DEFS, CLASS_KEYS } from "../sim/constants.js";

// ─── Pixel font: 5×7 bitmap for uppercase + digits + punctuation ───
const CHAR_W = 5;
const CHAR_H = 7;
const FONT_DATA = {
  A: [0x04,0x0a,0x11,0x1f,0x11,0x11,0x11],
  B: [0x1e,0x11,0x11,0x1e,0x11,0x11,0x1e],
  C: [0x0e,0x11,0x10,0x10,0x10,0x11,0x0e],
  D: [0x1e,0x11,0x11,0x11,0x11,0x11,0x1e],
  E: [0x1f,0x10,0x10,0x1e,0x10,0x10,0x1f],
  F: [0x1f,0x10,0x10,0x1e,0x10,0x10,0x10],
  G: [0x0e,0x11,0x10,0x17,0x11,0x11,0x0f],
  H: [0x11,0x11,0x11,0x1f,0x11,0x11,0x11],
  I: [0x0e,0x04,0x04,0x04,0x04,0x04,0x0e],
  J: [0x07,0x02,0x02,0x02,0x02,0x12,0x0c],
  K: [0x11,0x12,0x14,0x18,0x14,0x12,0x11],
  L: [0x10,0x10,0x10,0x10,0x10,0x10,0x1f],
  M: [0x11,0x1b,0x15,0x15,0x11,0x11,0x11],
  N: [0x11,0x19,0x15,0x13,0x11,0x11,0x11],
  O: [0x0e,0x11,0x11,0x11,0x11,0x11,0x0e],
  P: [0x1e,0x11,0x11,0x1e,0x10,0x10,0x10],
  Q: [0x0e,0x11,0x11,0x11,0x15,0x12,0x0d],
  R: [0x1e,0x11,0x11,0x1e,0x14,0x12,0x11],
  S: [0x0e,0x11,0x10,0x0e,0x01,0x11,0x0e],
  T: [0x1f,0x04,0x04,0x04,0x04,0x04,0x04],
  U: [0x11,0x11,0x11,0x11,0x11,0x11,0x0e],
  V: [0x11,0x11,0x11,0x11,0x0a,0x0a,0x04],
  W: [0x11,0x11,0x11,0x15,0x15,0x1b,0x11],
  X: [0x11,0x11,0x0a,0x04,0x0a,0x11,0x11],
  Y: [0x11,0x11,0x0a,0x04,0x04,0x04,0x04],
  Z: [0x1f,0x01,0x02,0x04,0x08,0x10,0x1f],
  "0": [0x0e,0x11,0x13,0x15,0x19,0x11,0x0e],
  "1": [0x04,0x0c,0x04,0x04,0x04,0x04,0x0e],
  "2": [0x0e,0x11,0x01,0x06,0x08,0x10,0x1f],
  "3": [0x0e,0x11,0x01,0x06,0x01,0x11,0x0e],
  "4": [0x02,0x06,0x0a,0x12,0x1f,0x02,0x02],
  "5": [0x1f,0x10,0x1e,0x01,0x01,0x11,0x0e],
  "6": [0x06,0x08,0x10,0x1e,0x11,0x11,0x0e],
  "7": [0x1f,0x01,0x02,0x04,0x08,0x08,0x08],
  "8": [0x0e,0x11,0x11,0x0e,0x11,0x11,0x0e],
  "9": [0x0e,0x11,0x11,0x0f,0x01,0x02,0x0c],
  " ": [0x00,0x00,0x00,0x00,0x00,0x00,0x00],
  ":": [0x00,0x04,0x04,0x00,0x04,0x04,0x00],
  ".": [0x00,0x00,0x00,0x00,0x00,0x00,0x04],
  "+": [0x00,0x04,0x04,0x1f,0x04,0x04,0x00],
  "-": [0x00,0x00,0x00,0x1f,0x00,0x00,0x00],
  "/": [0x01,0x01,0x02,0x04,0x08,0x10,0x10],
  "%": [0x19,0x19,0x02,0x04,0x08,0x13,0x13],
  "(": [0x02,0x04,0x08,0x08,0x08,0x04,0x02],
  ")": [0x08,0x04,0x02,0x02,0x02,0x04,0x08],
  "!": [0x04,0x04,0x04,0x04,0x04,0x00,0x04],
  "#": [0x0a,0x0a,0x1f,0x0a,0x1f,0x0a,0x0a],
};

// ─── Pixel-art sprite data (16×16 grids, 0=transparent, 1=outline, 2-9=colors) ───
const SPRITE_PALETTE = {
  0: null,           // transparent
  1: "#111111",      // outline / black
  2: "#b0b0b0",      // blade silver
  3: "#d8d8d8",      // blade highlight
  4: "#808080",      // blade shadow
  5: "#8B4513",      // wood / handle brown
  6: "#A0522D",      // wood highlight
  7: "#f44",         // red accent
  8: "#ff0",         // gold/yellow accent
  9: "#44f",         // blue accent
  a: "#22cc55",      // green accent
  b: "#9944ff",      // purple accent
  c: "#ff8800",      // orange accent
  d: "#5eead4",      // teal accent
  e: "#888",         // dark grey
  f: "#ffcc00",      // bright gold
};

// Sword sprite 16×16
const SWORD_SPRITE = [
  "0000000000000010",
  "0000000000000110",
  "0000000000001310",
  "0000000000013310",
  "0000000000132100",
  "0000000001321000",
  "0000000013210000",
  "0000000132100000",
  "0000001321000000",
  "0000013210000000",
  "0000132100000000",
  "0001321000000000",
  "0001214000000000",
  "0000155000000000",
  "0000051000000000",
  "0000001000000000",
];

// Dagger sprite 16×16
const DAGGER_SPRITE = [
  "0000000000001000",
  "0000000000011100",
  "0000000000132100",
  "0000000001321000",
  "0000000013210000",
  "0000000132100000",
  "0000001321000000",
  "0000001241000000",
  "0000001551000000",
  "0000000510000000",
  "0000000100000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
];

// Bow sprite 16×16
const BOW_SPRITE = [
  "0000001000000000",
  "0000010100000000",
  "0000100010000000",
  "0001000001000000",
  "0010000000100000",
  "0100000000010000",
  "1000000000010000",
  "1000000000010000",
  "1000000000010000",
  "0100000000010000",
  "0010000000100000",
  "0001000001000000",
  "0000100010000000",
  "0000010100000000",
  "0000001000000000",
  "0000000000000000",
];

// Shield sprite 16×16
const SHIELD_SPRITE = [
  "0000111111110000",
  "0001999999991000",
  "0019999999999100",
  "0199993339999100",
  "0199933339999100",
  "1999933339999910",
  "1999933339999910",
  "1999933339999910",
  "1999933339999910",
  "0199993339999100",
  "0199999999999100",
  "0019999999999100",
  "0001999999991000",
  "0000199999910000",
  "0000019999100000",
  "0000001110000000",
];

// Staff sprite 16×16
const STAFF_SPRITE = [
  "000000aaa0000000",
  "00000a1a1a000000",
  "000000aaa0000000",
  "0000001100000000",
  "0000005500000000",
  "0000005500000000",
  "0000005500000000",
  "0000005500000000",
  "0000005500000000",
  "0000005500000000",
  "0000005500000000",
  "0000005500000000",
  "0000005500000000",
  "0000005500000000",
  "0000006600000000",
  "0000001100000000",
];

// Axe sprite 16×16 (for boss/striker)
const AXE_SPRITE = [
  "0000000000000000",
  "0000000111100000",
  "0000001e44410000",
  "0000014e44100000",
  "000001444e100000",
  "000000141e000000",
  "0000001110000000",
  "0000005500000000",
  "0000005500000000",
  "0000005500000000",
  "0000005500000000",
  "0000005500000000",
  "0000005500000000",
  "0000005500000000",
  "0000006600000000",
  "0000001100000000",
];

// Fangs sprite 16×16 (vampire)
const FANG_SPRITE = [
  "0000000000000000",
  "0000100000010000",
  "0001710000171000",
  "0017171001717100",
  "0171717117171710",
  "0171777777171710",
  "0017177717171100",
  "0001177711711000",
  "0000117711100000",
  "0000011710000000",
  "0000011110000000",
  "0000001710000000",
  "0000001100000000",
  "0000001100000000",
  "0000000000000000",
  "0000000000000000",
];

// Crown sprite 16×16 (boss)
const CROWN_SPRITE = [
  "0000000000000000",
  "00f0000f0000f000",
  "00f0000f0000f000",
  "0ff000fff000ff00",
  "0ff000fff000ff00",
  "0fff0fffff0fff00",
  "0fffffffffffff00",
  "01fffffffffff100",
  "01f888f888f88100",
  "01fffffffffff100",
  "0111111111111100",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
];

// Map class keys to sprites
const CLASS_SPRITES = {
  swordsman: SWORD_SPRITE,
  striker: AXE_SPRITE,
  tank: SHIELD_SPRITE,
  medic: STAFF_SPRITE,
  archer: BOW_SPRITE,
  vampire: FANG_SPRITE,
  boss: CROWN_SPRITE,
  sniper: DAGGER_SPRITE,
  trickster: DAGGER_SPRITE,
  bulwark: SHIELD_SPRITE,
  splitter: AXE_SPRITE,
};

// Class weapon labels for display
const CLASS_WEAPON_LABELS = {
  swordsman: "SWORD",
  striker: "AXE",
  tank: "SHIELD",
  medic: "STAFF",
  archer: "BOW",
  vampire: "FANGS",
  boss: "CROWN",
  sniper: "DAGGER",
  trickster: "DAGGER",
  bulwark: "SHIELD",
  splitter: "AXE",
};

// Class stat shortcuts for comparison
function getClassStats(classKey) {
  const def = CLASS_DEFS[classKey];
  if (!def) return null;
  const baseDamage = Math.round(def.outgoingDamageMult * 10);
  const attackSpeed = def.slashCooldown
    ? Math.round(10 / def.slashCooldown)
    : def.shotCooldown
    ? Math.round(10 / def.shotCooldown)
    : Math.round(def.speed / 25);
  return {
    hp: def.maxHp,
    damage: baseDamage,
    attackSpeed,
    speed: def.speed,
    defense: Math.round((1 - def.incomingDamageMult) * 100 + (1 / def.incomingDamageMult - 1) * 10),
  };
}

// ─── Drawing helpers ───

function drawPixelText(ctx, text, x, y, scale, color, outlineColor) {
  const str = String(text).toUpperCase();
  let cursorX = x;
  for (let c = 0; c < str.length; c++) {
    const ch = str[c];
    const rows = FONT_DATA[ch];
    if (!rows) {
      cursorX += (CHAR_W + 1) * scale;
      continue;
    }
    for (let row = 0; row < CHAR_H; row++) {
      const bits = rows[row];
      for (let col = 0; col < CHAR_W; col++) {
        if (bits & (1 << (CHAR_W - 1 - col))) {
          const px = cursorX + col * scale;
          const py = y + row * scale;
          // outline
          if (outlineColor) {
            ctx.fillStyle = outlineColor;
            ctx.fillRect(px - scale, py, scale, scale);
            ctx.fillRect(px + scale, py, scale, scale);
            ctx.fillRect(px, py - scale, scale, scale);
            ctx.fillRect(px, py + scale, scale, scale);
          }
          ctx.fillStyle = color;
          ctx.fillRect(px, py, scale, scale);
        }
      }
    }
    cursorX += (CHAR_W + 1) * scale;
  }
}

function measurePixelText(text, scale) {
  const str = String(text).toUpperCase();
  return str.length * (CHAR_W + 1) * scale - scale;
}

function drawPixelSprite(ctx, spriteData, x, y, pixelSize, flipX) {
  const rows = spriteData.length;
  const cols = spriteData[0].length;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ch = spriteData[row][flipX ? cols - 1 - col : col];
      if (ch === "0") continue;
      const paletteColor = SPRITE_PALETTE[ch];
      if (!paletteColor) continue;
      ctx.fillStyle = paletteColor;
      ctx.fillRect(x + col * pixelSize, y + row * pixelSize, pixelSize, pixelSize);
    }
  }
}

function drawHealthBubble(ctx, x, y, radius, hp, color, scale) {
  // Draw circle pixel by pixel
  const r = radius;
  for (let py = -r; py <= r; py++) {
    for (let px = -r; px <= r; px++) {
      if (px * px + py * py <= r * r) {
        // Edge detection for outline
        const isEdge = (px * px + py * py > (r - 2) * (r - 2));
        ctx.fillStyle = isEdge ? "#111111" : color;
        ctx.fillRect(x + px * scale, y + py * scale, scale, scale);
      }
    }
  }
  // Draw HP number centered
  const hpStr = String(Math.round(hp));
  const tw = measurePixelText(hpStr, scale);
  drawPixelText(ctx, hpStr, x - Math.floor(tw / 2), y - 3 * scale, scale, "#ffffff", "#111111");
}

function drawCollisionSparks(ctx, x, y, time, scale) {
  const sparkOffsets = [
    [-3, -5], [4, -4], [-5, 2], [3, 5], [6, -1],
    [-2, -7], [7, 3], [-6, -3], [5, 6], [-4, 4],
  ];
  for (let i = 0; i < sparkOffsets.length; i++) {
    const phase = (time * 3 + i * 0.7) % 2;
    if (phase > 1) continue;
    const alpha = 1 - phase;
    const spread = phase * 4;
    const ox = sparkOffsets[i][0] * spread;
    const oy = sparkOffsets[i][1] * spread;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = i % 2 === 0 ? "#ffff44" : "#ffffff";
    ctx.fillRect(x + ox * scale, y + oy * scale, scale * 2, scale * 2);
  }
  ctx.globalAlpha = 1;
}

// ─── Main battle comparison class ───

export class BattleComparison {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.visible = false;
    this.leftClass = "swordsman";
    this.rightClass = "archer";
    this.animTime = 0;
    this.animFrame = null;
    this.onClose = null;
    this._boundAnimate = this._animate.bind(this);
    this._boundHandleClick = this._handleClick.bind(this);
    this._boundHandleKey = this._handleKey.bind(this);
  }

  init() {
    if (this.canvas) return;

    this.canvas = document.createElement("canvas");
    this.canvas.id = "battle-comparison-canvas";
    this.canvas.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      z-index: 100; cursor: pointer; display: none;
      image-rendering: pixelated; image-rendering: crisp-edges;
    `;
    document.body.appendChild(this.canvas);

    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    this.canvas.addEventListener("click", this._boundHandleClick);
    window.addEventListener("keydown", this._boundHandleKey);
  }

  show(leftClassKey, rightClassKey, onClose) {
    this.init();
    this.leftClass = leftClassKey || "swordsman";
    this.rightClass = rightClassKey || "archer";
    this.onClose = onClose || null;
    this.animTime = 0;
    this.visible = true;
    this.canvas.style.display = "block";
    this._resize();
    this._startAnim();
  }

  hide() {
    this.visible = false;
    if (this.canvas) {
      this.canvas.style.display = "none";
    }
    this._stopAnim();
    if (this.onClose) {
      const cb = this.onClose;
      this.onClose = null;
      cb();
    }
  }

  _handleClick() {
    if (this.visible) this.hide();
  }

  _handleKey(e) {
    if (this.visible && (e.key === "Escape" || e.key === " " || e.key === "Enter")) {
      e.preventDefault();
      this.hide();
    }
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(window.innerWidth * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
    this.ctx.imageSmoothingEnabled = false;
  }

  _startAnim() {
    if (this.animFrame) return;
    let lastTime = performance.now();
    const loop = (now) => {
      if (!this.visible) return;
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      this.animTime += dt;
      this._draw();
      this.animFrame = requestAnimationFrame(loop);
    };
    this.animFrame = requestAnimationFrame(loop);
  }

  _stopAnim() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }

  _draw() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const t = this.animTime;

    // Responsive scale
    const baseScale = Math.max(1, Math.min(Math.floor(W / 480), Math.floor(H / 360)));
    const ps = baseScale; // pixel size

    ctx.imageSmoothingEnabled = false;

    // ─── Beige/cream background ───
    ctx.fillStyle = "#e8dcc8";
    ctx.fillRect(0, 0, W, H);

    // Subtle pixel grid on background
    ctx.fillStyle = "#d8ccb8";
    for (let gy = 0; gy < H; gy += 8 * ps) {
      for (let gx = 0; gx < W; gx += 8 * ps) {
        if ((Math.floor(gx / (8 * ps)) + Math.floor(gy / (8 * ps))) % 2 === 0) {
          ctx.fillRect(gx, gy, 8 * ps, 8 * ps);
        }
      }
    }

    // ─── Arena rectangle ───
    const arenaW = Math.min(W - 40 * ps, 420 * ps);
    const arenaH = Math.min(H - 100 * ps, 260 * ps);
    const arenaX = Math.floor((W - arenaW) / 2);
    const arenaY = Math.floor((H - arenaH) / 2) + 10 * ps;

    // Thick black border (outer)
    const borderW = 4 * ps;
    ctx.fillStyle = "#111111";
    ctx.fillRect(arenaX - borderW, arenaY - borderW, arenaW + borderW * 2, arenaH + borderW * 2);

    // White/very light grey arena fill
    ctx.fillStyle = "#f4f0ec";
    ctx.fillRect(arenaX, arenaY, arenaW, arenaH);

    // Inner arena pixel grid
    ctx.fillStyle = "#eae6e0";
    for (let gy = arenaY; gy < arenaY + arenaH; gy += 6 * ps) {
      for (let gx = arenaX; gx < arenaX + arenaW; gx += 6 * ps) {
        if ((Math.floor((gx - arenaX) / (6 * ps)) + Math.floor((gy - arenaY) / (6 * ps))) % 2 === 0) {
          ctx.fillRect(gx, gy, 6 * ps, 6 * ps);
        }
      }
    }

    // ─── Header text: "X vs Y" ───
    const leftDef = CLASS_DEFS[this.leftClass];
    const rightDef = CLASS_DEFS[this.rightClass];
    const leftWeapon = CLASS_WEAPON_LABELS[this.leftClass] || leftDef?.label?.toUpperCase() || "???";
    const rightWeapon = CLASS_WEAPON_LABELS[this.rightClass] || rightDef?.label?.toUpperCase() || "???";
    const headerText = `${leftWeapon} VS ${rightWeapon}`;
    const headerScale = Math.max(2, ps * 2);
    const headerTw = measurePixelText(headerText, headerScale);
    const headerX = Math.floor((W - headerTw) / 2);
    const headerY = arenaY - borderW - 18 * ps;

    drawPixelText(ctx, headerText, headerX, headerY, headerScale, "#222222", "#c8bca8");

    // ─── Subtitle: class labels ───
    const subtitleText = `${leftDef?.label || "???"} VS ${rightDef?.label || "???"}`;
    const subScale = Math.max(1, ps);
    const subTw = measurePixelText(subtitleText, subScale);
    drawPixelText(ctx, subtitleText, Math.floor((W - subTw) / 2), headerY + CHAR_H * headerScale + 4 * ps, subScale, "#555544", null);

    // ─── Draw weapon sprites in arena ───
    const leftSprite = CLASS_SPRITES[this.leftClass] || SWORD_SPRITE;
    const rightSprite = CLASS_SPRITES[this.rightClass] || DAGGER_SPRITE;
    const spritePs = Math.max(2, ps * 2);
    const spriteW = 16 * spritePs;
    const spriteH = 16 * spritePs;

    // Animate sprites sliding toward center
    const slideIn = Math.min(1, t * 2);
    const ease = 1 - Math.pow(1 - slideIn, 3);
    const centerX = arenaX + Math.floor(arenaW / 2);
    const centerY = arenaY + Math.floor(arenaH / 2);
    const spreadX = Math.floor(arenaW * 0.18);

    const leftSpriteX = centerX - spreadX - spriteW + Math.floor((1 - ease) * -60 * ps);
    const leftSpriteY = centerY - Math.floor(spriteH / 2) + Math.floor(Math.sin(t * 2) * 3 * ps);

    const rightSpriteX = centerX + spreadX + Math.floor((1 - ease) * 60 * ps);
    const rightSpriteY = centerY - Math.floor(spriteH / 2) + Math.floor(Math.sin(t * 2 + 1) * 3 * ps);

    drawPixelSprite(ctx, leftSprite, leftSpriteX, leftSpriteY, spritePs, false);
    drawPixelSprite(ctx, rightSprite, rightSpriteX, rightSpriteY, spritePs, true);

    // ─── Collision sparks in center when sprites are close ───
    if (slideIn >= 0.8) {
      drawCollisionSparks(ctx, centerX, centerY, t, ps);
    }

    // ─── "VS" text in center ───
    if (slideIn >= 0.5) {
      const vsAlpha = Math.min(1, (slideIn - 0.5) * 4);
      ctx.globalAlpha = vsAlpha;
      const vsScale = Math.max(3, ps * 3);
      const vsTw = measurePixelText("VS", vsScale);
      drawPixelText(ctx, "VS", centerX - Math.floor(vsTw / 2), centerY - Math.floor(CHAR_H * vsScale / 2), vsScale, "#cc2222", "#111111");
      ctx.globalAlpha = 1;
    }

    // ─── Health bubbles ───
    const leftStats = getClassStats(this.leftClass);
    const rightStats = getClassStats(this.rightClass);
    const bubbleR = Math.max(8, 10);
    const bubbleScale = Math.max(1, ps);

    if (leftStats) {
      const leftColor = leftDef ? `#${leftDef.color.toString(16).padStart(6, "0")}` : "#cc4444";
      drawHealthBubble(
        ctx,
        leftSpriteX + Math.floor(spriteW / 2),
        leftSpriteY - 12 * ps,
        bubbleR, leftStats.hp, leftColor, bubbleScale
      );
    }
    if (rightStats) {
      const rightColor = rightDef ? `#${rightDef.color.toString(16).padStart(6, "0")}` : "#44cc44";
      drawHealthBubble(
        ctx,
        rightSpriteX + Math.floor(spriteW / 2),
        rightSpriteY - 12 * ps,
        bubbleR, rightStats.hp, rightColor, bubbleScale
      );
    }

    // ─── Bottom HUD: Damage (red) and Attack Speed (green) ───
    const hudY = arenaY + arenaH + borderW + 8 * ps;
    const hudScale = Math.max(2, Math.floor(ps * 1.5));

    // Left side: Damage
    if (leftStats) {
      const dmgText = `DAMAGE: ${leftStats.damage}`;
      drawPixelText(ctx, dmgText, arenaX, hudY, hudScale, "#cc2222", "#111111");
    }

    // Right side: Attack Speed
    if (rightStats) {
      const atkText = `ATK SPD: ${rightStats.attackSpeed}`;
      const atkTw = measurePixelText(atkText, hudScale);
      drawPixelText(ctx, atkText, arenaX + arenaW - atkTw, hudY, hudScale, "#22aa44", "#111111");
    }

    // ─── Stat comparison bars ───
    const barY = hudY + CHAR_H * hudScale + 8 * ps;
    const barH = 4 * ps;
    const barMaxW = Math.floor((arenaW - 20 * ps) / 2);
    const leftBarX = arenaX;
    const rightBarX = arenaX + arenaW - barMaxW;

    if (leftStats && rightStats) {
      const stats = [
        { label: "HP", left: leftStats.hp, right: rightStats.hp, color: "#cc3333" },
        { label: "DMG", left: leftStats.damage, right: rightStats.damage, color: "#cc8822" },
        { label: "SPD", left: leftStats.speed, right: rightStats.speed, color: "#2288cc" },
      ];

      for (let i = 0; i < stats.length; i++) {
        const sy = barY + i * (barH + 6 * ps);
        const s = stats[i];
        const maxVal = Math.max(s.left, s.right, 1);

        // Label
        const labelScale = Math.max(1, ps);
        drawPixelText(ctx, s.label, centerX - Math.floor(measurePixelText(s.label, labelScale) / 2), sy, labelScale, "#444433", null);

        // Left bar (grows right-to-left toward center)
        const leftBarW = Math.floor((s.left / maxVal) * barMaxW * Math.min(1, t));
        ctx.fillStyle = "#222222";
        ctx.fillRect(centerX - 14 * ps - barMaxW, sy, barMaxW, barH);
        ctx.fillStyle = s.color;
        ctx.fillRect(centerX - 14 * ps - leftBarW, sy + ps, leftBarW, barH - 2 * ps);

        // Right bar (grows left-to-right from center)
        const rightBarW = Math.floor((s.right / maxVal) * barMaxW * Math.min(1, t));
        ctx.fillStyle = "#222222";
        ctx.fillRect(centerX + 14 * ps, sy, barMaxW, barH);
        ctx.fillStyle = s.color;
        ctx.fillRect(centerX + 14 * ps, sy + ps, rightBarW, barH - 2 * ps);
      }
    }

    // ─── Bottom hint ───
    const hintScale = Math.max(1, ps);
    const hintText = "CLICK OR PRESS SPACE TO START";
    const hintTw = measurePixelText(hintText, hintScale);
    const hintAlpha = 0.5 + 0.5 * Math.sin(t * 3);
    ctx.globalAlpha = hintAlpha;
    drawPixelText(ctx, hintText, Math.floor((W - hintTw) / 2), H - 16 * ps, hintScale, "#666655", null);
    ctx.globalAlpha = 1;
  }

  destroy() {
    this._stopAnim();
    if (this.canvas) {
      this.canvas.removeEventListener("click", this._boundHandleClick);
      window.removeEventListener("keydown", this._boundHandleKey);
      this.canvas.remove();
      this.canvas = null;
      this.ctx = null;
    }
  }
}

// Singleton
let _instance = null;

export function getBattleComparison() {
  if (!_instance) {
    _instance = new BattleComparison();
  }
  return _instance;
}

// Pick two classes for comparison from current tournament or setup
export function pickComparisonClasses(scene) {
  // If tournament is active and has a current match, use that
  if (scene.tournament?.active && scene.tournament.currentMatchIndex >= 0) {
    const match = scene.tournament.matches[scene.tournament.currentMatchIndex];
    if (match) {
      if (match.a && match.b) return [match.a, match.b];
      if (match.aTeam && match.bTeam) return [match.aTeam[0], match.bTeam[0]];
    }
  }

  // Otherwise pick top two classes by count
  const active = CLASS_KEYS
    .filter((k) => (scene.setup?.classCounts[k] ?? 0) > 0)
    .sort((a, b) => (scene.setup.classCounts[b] ?? 0) - (scene.setup.classCounts[a] ?? 0));

  if (active.length >= 2) return [active[0], active[1]];
  if (active.length === 1) return [active[0], active[0]];
  return ["swordsman", "archer"];
}
