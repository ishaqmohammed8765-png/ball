import { labelForAbility } from "../sim/abilities.js";

function sortById(a, b) {
  return a.id - b.id;
}

export function createRenderer(scene, initialState) {
  const arena = scene.add.graphics();
  const ballsGraphics = scene.add.graphics();
  const labelById = new Map();
  let stateRef = initialState;

  function drawArena() {
    const c = stateRef.constants;
    arena.clear();
    arena.fillStyle(0xffffff, 1);
    arena.fillRect(0, 0, c.width, c.height);
    arena.lineStyle(2, 0x000000, 1);
    arena.strokeRect(c.border, c.border, c.width - c.border * 2, c.height - c.border * 2);
  }

  function syncLabels() {
    const aliveIds = new Set();
    const balls = [...stateRef.balls].sort(sortById);

    for (let i = 0; i < balls.length; i += 1) {
      const b = balls[i];
      aliveIds.add(b.id);
      if (!labelById.has(b.id)) {
        const t = scene.add.text(b.x, b.y, labelForAbility(b.abilityType), {
          color: "#000000",
          fontSize: "11px",
          fontFamily: "Arial"
        });
        t.setOrigin(0.5, 0.5);
        labelById.set(b.id, t);
      }
    }

    for (const [id, textObj] of labelById.entries()) {
      if (!aliveIds.has(id)) {
        textObj.destroy();
        labelById.delete(id);
      }
    }
  }

  function drawBalls() {
    ballsGraphics.clear();
    const balls = [...stateRef.balls].sort(sortById);
    for (let i = 0; i < balls.length; i += 1) {
      const b = balls[i];
      ballsGraphics.fillStyle(0xf2f2f2, 1);
      ballsGraphics.lineStyle(2, 0x000000, 1);
      ballsGraphics.fillCircle(b.x, b.y, b.radius);
      ballsGraphics.strokeCircle(b.x, b.y, b.radius);

      const hpRatio = Math.max(0, Math.min(1, b.hp / b.maxHp));
      const barW = b.radius * 1.8;
      const barH = 4;
      const barX = b.x - barW / 2;
      const barY = b.y - b.radius - 10;
      ballsGraphics.lineStyle(1, 0x000000, 1);
      ballsGraphics.strokeRect(barX, barY, barW, barH);
      ballsGraphics.fillStyle(0x000000, 1);
      ballsGraphics.fillRect(barX + 1, barY + 1, (barW - 2) * hpRatio, barH - 2);

      const label = labelById.get(b.id);
      if (label) {
        label.setPosition(b.x, b.y);
      }
    }
  }

  function setState(nextState) {
    stateRef = nextState;
    drawArena();
    syncLabels();
  }

  function render() {
    syncLabels();
    drawBalls();
  }

  drawArena();

  return { setState, render };
}
