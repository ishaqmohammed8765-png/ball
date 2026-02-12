import { CLASS_DEFS, CLASS_KEYS } from "../sim/constants.js";
import { classColorHex, sanitizeCount, sanitizeDimension } from "../sim/utils.js";

const PRESETS = {
  balanced: {
    label: "Balanced",
    counts: { tank: 4, striker: 5, medic: 3, trickster: 4, sniper: 3, vampire: 3, bulwark: 3, splitter: 3, boss: 1 }
  },
  chaos: {
    label: "Chaos",
    counts: {
      tank: 8,
      striker: 10,
      medic: 6,
      trickster: 8,
      sniper: 8,
      vampire: 8,
      bulwark: 6,
      splitter: 10,
      boss: 3
    }
  },
  duel: {
    label: "Duel",
    counts: { tank: 0, striker: 1, medic: 0, trickster: 0, sniper: 1, vampire: 0, bulwark: 0, splitter: 0, boss: 0 }
  }
};

function addStyles() {
  if (document.getElementById("ball-controls-style")) {
    return;
  }

  const styleTag = document.createElement("style");
  styleTag.id = "ball-controls-style";
  styleTag.textContent = `
    :root {
      --ui-bg: rgba(6, 14, 25, 0.95);
      --ui-edge: #36506e;
      --ui-text: #e2e8f0;
      --ui-muted: #9aa7bb;
      --ui-accent: #f2c94c;
      --ui-accent-alt: #67e8f9;
      --ui-danger: #ff7c70;
    }
    body {
      margin: 0;
      background:
        radial-gradient(1200px 560px at 8% 14%, rgba(24, 43, 73, 0.48), rgba(10, 16, 30, 0.25)),
        linear-gradient(180deg, #0a111f, #0c1424 36%, #090f1b);
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
      width: 332px;
      max-height: calc(100vh - 20px);
      overflow: auto;
      background: var(--ui-bg);
      color: var(--ui-text);
      border: 2px solid var(--ui-edge);
      border-radius: 10px;
      padding: 12px;
      font-family: "Consolas", "Cascadia Mono", monospace;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
      user-select: none;
    }
    #ball-controls h2 {
      margin: 0 0 6px;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.3px;
      color: var(--ui-accent);
    }
    #ball-controls .intro {
      margin-bottom: 8px;
      border: 1px solid #2c405b;
      border-radius: 7px;
      background: rgba(15, 24, 42, 0.95);
      padding: 8px;
      font-size: 11px;
      line-height: 1.35;
      color: #bed0ea;
    }
    #ball-controls .status {
      margin-bottom: 8px;
      border: 1px solid #2f4d73;
      border-radius: 7px;
      background: linear-gradient(180deg, rgba(16, 34, 59, 0.94), rgba(11, 20, 35, 0.96));
      padding: 8px;
      font-size: 12px;
      line-height: 1.35;
    }
    #ball-controls .status strong {
      color: #f8e389;
    }
    #ball-controls .row {
      display: grid;
      grid-template-columns: 1fr 90px;
      gap: 8px;
      align-items: center;
      margin-bottom: 6px;
    }
    #ball-controls label {
      font-size: 12px;
      opacity: 0.94;
    }
    #ball-controls input,
    #ball-controls select {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #355171;
      border-radius: 5px;
      padding: 5px 6px;
      font-size: 12px;
      background: #0a1426;
      color: #ecf4ff;
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
      background: var(--ui-accent);
      color: #111827;
      font-family: inherit;
      transition: transform 120ms ease, filter 120ms ease;
    }
    #ball-controls button:hover {
      filter: brightness(1.04);
      transform: translateY(-1px);
    }
    #ball-controls .preset-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      margin: 8px 0;
    }
    #ball-controls .preset-row button {
      background: var(--ui-accent-alt);
      color: #0b1a2e;
      padding: 6px 8px;
      font-size: 11px;
    }
    #ball-controls .subsection {
      margin-top: 10px;
      margin-bottom: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #9de6ff;
    }
    #ball-controls .panel {
      margin-bottom: 8px;
      border: 1px solid #2f4d73;
      border-radius: 7px;
      background: rgba(8, 18, 31, 0.8);
      padding: 8px;
      font-size: 11px;
      line-height: 1.35;
      color: #dbeafe;
    }
    #ball-controls .drop-zone {
      min-height: 48px;
      border: 2px dashed #416086;
      border-radius: 8px;
      padding: 6px;
      background: rgba(7, 15, 28, 0.78);
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 8px;
    }
    #ball-controls .drop-zone.active {
      border-color: #7cf7eb;
      background: rgba(9, 60, 72, 0.34);
    }
    #ball-controls .chip {
      display: inline-flex;
      align-items: center;
      border: 1px solid #111827;
      border-radius: 12px;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 700;
      color: #f8fafc;
      cursor: grab;
      white-space: nowrap;
      touch-action: none;
    }
    #ball-controls .chip.saved {
      cursor: pointer;
      border-color: #e5e7eb;
    }
    #ball-controls .chip.dragging {
      opacity: 0.3;
    }
    #ball-controls .chip-ghost {
      position: fixed;
      left: 0;
      top: 0;
      z-index: 1000;
      pointer-events: none;
      opacity: 0.95;
      transform: translate(-9999px, -9999px);
    }
    #ball-controls .link-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 6px;
      margin-bottom: 8px;
    }
    #ball-controls .link-row input {
      background: #050b16;
      border-color: #3f5d83;
      font-size: 11px;
    }
    #ball-controls .mini {
      background: #93e9d6;
      color: #12263f;
      padding: 6px 8px;
      font-size: 11px;
    }
    #ball-controls .desc-title {
      margin-top: 6px;
      margin-bottom: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #f4d974;
    }
    #ball-controls .class-desc {
      margin: 0 0 6px;
      font-size: 11px;
      line-height: 1.35;
      color: #d5deeb;
    }
    #ball-controls .swatch {
      display: inline-block;
      width: 9px;
      height: 9px;
      border: 1px solid #0f172a;
      margin-right: 6px;
      vertical-align: middle;
    }
    #ball-controls .hint {
      margin-top: 8px;
      font-size: 11px;
      color: var(--ui-muted);
      line-height: 1.3;
    }
    #ball-controls textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #355171;
      border-radius: 5px;
      padding: 6px;
      font-size: 11px;
      background: #0a1426;
      color: #ecf4ff;
      font-family: inherit;
      resize: vertical;
      min-height: 54px;
    }
  `;
  document.head.appendChild(styleTag);
}

function createStatusHtml(scene) {
  const modeLabel = scene.mode.charAt(0).toUpperCase() + scene.mode.slice(1);
  if (scene.roundFinished) {
    if (scene.winnerClassKey) {
      return `[${modeLabel}] Winner: <strong style="color:${classColorHex(scene.winnerClassKey)}">${CLASS_DEFS[scene.winnerClassKey].label}</strong> (${scene.balls.length} left)`;
    }
    return `[${modeLabel}] <strong>Draw:</strong> no surviving balls`;
  }
  const totalSetup = CLASS_KEYS.reduce((sum, classKey) => sum + (scene.setup.classCounts[classKey] ?? 0), 0);
  if (totalSetup === 0) {
    return `[${modeLabel}] <strong style="color:var(--ui-danger)">No balls configured.</strong> Set class counts and click Apply Setup + Reset.`;
  }
  return `[${modeLabel}] Round running... alive ${scene.balls.length}`;
}

function pointInRect(x, y, rect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function bindPointerDrag(scene, chip, classKey, nextRoundBoxEl) {
  chip.draggable = false;
  chip.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary) {
      return;
    }
    if (event.button !== 0 && event.pointerType !== "touch") {
      return;
    }
    event.preventDefault();
    if (chip.setPointerCapture) {
      chip.setPointerCapture(event.pointerId);
    }

    const ghost = chip.cloneNode(true);
    ghost.classList.add("chip-ghost");
    document.body.appendChild(ghost);
    chip.classList.add("dragging");

    const moveGhost = (clientX, clientY) => {
      ghost.style.transform = `translate(${Math.round(clientX + 12)}px, ${Math.round(clientY + 12)}px)`;
      const inDropZone = pointInRect(clientX, clientY, nextRoundBoxEl.getBoundingClientRect());
      nextRoundBoxEl.classList.toggle("active", inDropZone);
    };

    moveGhost(event.clientX, event.clientY);

    const onPointerMove = (moveEvent) => {
      moveGhost(moveEvent.clientX, moveEvent.clientY);
    };

    const endDrag = (clientX, clientY) => {
      nextRoundBoxEl.classList.remove("active");
      chip.classList.remove("dragging");
      ghost.remove();
      const inDropZone = pointInRect(clientX, clientY, nextRoundBoxEl.getBoundingClientRect());
      if (inDropZone) {
        scene.addClassToNextRoundBox(classKey);
      }
    };

    const onPointerUp = (upEvent) => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      if (chip.releasePointerCapture) {
        chip.releasePointerCapture(event.pointerId);
      }
      endDrag(upEvent.clientX, upEvent.clientY);
    };

    const onPointerCancel = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      if (chip.releasePointerCapture) {
        chip.releasePointerCapture(event.pointerId);
      }
      nextRoundBoxEl.classList.remove("active");
      chip.classList.remove("dragging");
      ghost.remove();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
  });
}

export function buildControls(scene) {
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
    <h2>Bouncing Balls Arena</h2>
    <div class="intro">Class-based auto-battler sandbox. Each class can be set to 0. Finish rounds, drag survivors into the next-round box, and chain matches.</div>
    <div id="roundStatus" class="status">Round running...</div>
    <div class="row">
      <label for="modeSelect">Mode</label>
      <select id="modeSelect">
        <option value="classic">Classic</option>
        <option value="blitz">Blitz</option>
        <option value="tournament">Tournament</option>
      </select>
    </div>
    <div class="row">
      <label for="arenaSelect">Arena</label>
      <select id="arenaSelect">
        <option value="standard">Standard</option>
        <option value="crossfire">Crossfire</option>
        <option value="sanctum">Sanctum</option>
        <option value="gauntlet">Gauntlet</option>
      </select>
    </div>
    <div class="row">
      <label for="modifierSelect">Modifier</label>
      <select id="modifierSelect">
        <option value="none">None</option>
        <option value="iron_wall">Iron Wall</option>
        <option value="glass_cannon">Glass Cannon</option>
        <option value="turbo">Turbo</option>
      </select>
    </div>
    <div class="row">
      <label for="arenaWidth">Arena Width</label>
      <input id="arenaWidth" type="number" min="420" max="2200" />
    </div>
    <div class="row">
      <label for="arenaHeight">Arena Height</label>
      <input id="arenaHeight" type="number" min="420" max="2200" />
    </div>
    ${classRows}
    <div class="preset-row">
      <button id="presetBalanced" type="button">Balanced</button>
      <button id="presetChaos" type="button">Chaos</button>
      <button id="presetDuel" type="button">Duel</button>
    </div>
    <div class="actions">
      <button id="applySetupBtn" type="button">Apply Setup + Reset</button>
      <button id="resetRoundBtn" type="button">Reset Round</button>
      <button id="startTournamentBtn" type="button">Start Tournament</button>
      <button id="startTeamTournamentBtn" type="button">Start Team Tournament</button>
      <button id="stopTournamentBtn" type="button">Stop Tournament</button>
    </div>
    <div class="subsection">Tournament</div>
    <div id="tournamentStatus" class="panel">Tournament inactive.</div>
    <div class="subsection">Prize Board</div>
    <div id="prizeBoard" class="panel">No prizes awarded yet.</div>
    <div class="subsection">Upgrades</div>
    <div class="row">
      <label for="upgradeClass">Upgrade Class</label>
      <select id="upgradeClass">
        ${CLASS_KEYS.map((classKey) => `<option value="${classKey}">${CLASS_DEFS[classKey].label}</option>`).join("")}
      </select>
    </div>
    <div class="panel" id="upgradeSummary">Select class to view upgrades.</div>
    <div class="actions">
      <button id="buyHpBtn" type="button">Buy HP Upgrade</button>
      <button id="buySpeedBtn" type="button">Buy Speed Upgrade</button>
      <button id="buyMasteryBtn" type="button">Buy Mastery Upgrade</button>
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
    <div class="subsection">Replay</div>
    <textarea id="replayOut" readonly></textarea>
    <div class="actions">
      <button id="exportReplayBtn" type="button">Export Replay Token</button>
    </div>
    <textarea id="replayIn" placeholder="Paste replay token here"></textarea>
    <div class="actions">
      <button id="importReplayBtn" type="button">Import Replay Token</button>
    </div>
    <div class="subsection">Combat Log</div>
    <div id="combatLog" class="panel">No combat events yet.</div>
    <div class="subsection">Achievements</div>
    <div id="achievements" class="panel">No achievements yet.</div>
    <div class="desc-title">Class Descriptions</div>
    ${descRows}
    <div class="hint">Controls: R reset | F fast-forward | P pause</div>
    <div class="hint">Deterministic sim: same setup + mode always gives the same result.</div>
    <div class="hint">Flow: finish a round, drag survivor chips into Next Round Box, then click Use Box For Next Round.</div>
  `;

  const arenaWidthEl = root.querySelector("#arenaWidth");
  const arenaHeightEl = root.querySelector("#arenaHeight");
  const modeSelectEl = root.querySelector("#modeSelect");
  const arenaSelectEl = root.querySelector("#arenaSelect");
  const modifierSelectEl = root.querySelector("#modifierSelect");
  const roundStatusEl = root.querySelector("#roundStatus");
  const tournamentStatusEl = root.querySelector("#tournamentStatus");
  const prizeBoardEl = root.querySelector("#prizeBoard");
  const upgradeClassEl = root.querySelector("#upgradeClass");
  const upgradeSummaryEl = root.querySelector("#upgradeSummary");
  const combatLogEl = root.querySelector("#combatLog");
  const achievementsEl = root.querySelector("#achievements");
  const survivorPoolEl = root.querySelector("#survivorPool");
  const nextRoundBoxEl = root.querySelector("#nextRoundBox");
  const shareLinkOutEl = root.querySelector("#shareLinkOut");
  const replayOutEl = root.querySelector("#replayOut");
  const replayInEl = root.querySelector("#replayIn");
  const applyBtn = root.querySelector("#applySetupBtn");
  const resetRoundBtn = root.querySelector("#resetRoundBtn");
  const startTournamentBtn = root.querySelector("#startTournamentBtn");
  const startTeamTournamentBtn = root.querySelector("#startTeamTournamentBtn");
  const stopTournamentBtn = root.querySelector("#stopTournamentBtn");
  const buyHpBtn = root.querySelector("#buyHpBtn");
  const buySpeedBtn = root.querySelector("#buySpeedBtn");
  const buyMasteryBtn = root.querySelector("#buyMasteryBtn");
  const useNextRoundBtn = root.querySelector("#useNextRoundBtn");
  const generateLinkBtn = root.querySelector("#generateLinkBtn");
  const exportReplayBtn = root.querySelector("#exportReplayBtn");
  const importReplayBtn = root.querySelector("#importReplayBtn");
  const copyLinkBtn = root.querySelector("#copyLinkBtn");
  const presetBalancedBtn = root.querySelector("#presetBalanced");
  const presetChaosBtn = root.querySelector("#presetChaos");
  const presetDuelBtn = root.querySelector("#presetDuel");
  const countInputs = root.querySelectorAll("[data-class-key]");

  scene.ui = {
    root,
    arenaWidthEl,
    arenaHeightEl,
    modeSelectEl,
    arenaSelectEl,
    modifierSelectEl,
    roundStatusEl,
    tournamentStatusEl,
    prizeBoardEl,
    upgradeClassEl,
    upgradeSummaryEl,
    combatLogEl,
    achievementsEl,
    survivorPoolEl,
    nextRoundBoxEl,
    shareLinkOutEl,
    replayOutEl,
    replayInEl,
    countInputs,
    setStatusMessage: (html) => {
      roundStatusEl.innerHTML = html;
    },
    createStatusHtml: () => createStatusHtml(scene),
    bindDraggableChip: (chip, classKey) => bindPointerDrag(scene, chip, classKey, nextRoundBoxEl)
  };

  scene.syncControlInputs();
  modeSelectEl.value = scene.mode;
  arenaSelectEl.value = scene.arenaMode;
  modifierSelectEl.value = scene.activeModifier;
  upgradeClassEl.value = CLASS_KEYS[0];

  const applyPreset = (presetKey) => {
    const preset = PRESETS[presetKey];
    if (!preset) {
      return;
    }
    for (const input of countInputs) {
      const classKey = input.dataset.classKey;
      input.value = String(preset.counts[classKey] ?? 0);
    }
    scene.ui.setStatusMessage(`${scene.ui.createStatusHtml()}<br /><strong>${preset.label} preset loaded.</strong>`);
  };

  presetBalancedBtn.addEventListener("click", () => applyPreset("balanced"));
  presetChaosBtn.addEventListener("click", () => applyPreset("chaos"));
  presetDuelBtn.addEventListener("click", () => applyPreset("duel"));

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

  modeSelectEl.addEventListener("change", () => {
    scene.setMode(modeSelectEl.value);
    scene.syncControlInputs();
  });
  arenaSelectEl.addEventListener("change", () => {
    scene.setArenaMode(arenaSelectEl.value);
    scene.syncControlInputs();
  });
  modifierSelectEl.addEventListener("change", () => {
    scene.setModifier(modifierSelectEl.value);
    scene.syncControlInputs();
  });

  resetRoundBtn.addEventListener("click", () => {
    scene.resetSimulation();
    scene.syncControlInputs();
  });

  startTournamentBtn.addEventListener("click", () => {
    scene.startTournament(false);
    scene.syncControlInputs();
  });
  startTeamTournamentBtn.addEventListener("click", () => {
    scene.startTournament(true);
    scene.syncControlInputs();
  });

  stopTournamentBtn.addEventListener("click", () => {
    scene.stopTournament();
    scene.syncControlInputs();
  });

  useNextRoundBtn.addEventListener("click", () => {
    scene.applyNextRoundBox();
    scene.syncControlInputs();
  });

  const buyUpgradeForSelection = (upgradeKey) => {
    scene.buyUpgrade(upgradeClassEl.value, upgradeKey);
    scene.syncControlInputs();
  };
  buyHpBtn.addEventListener("click", () => buyUpgradeForSelection("hp"));
  buySpeedBtn.addEventListener("click", () => buyUpgradeForSelection("speed"));
  buyMasteryBtn.addEventListener("click", () => buyUpgradeForSelection("mastery"));
  upgradeClassEl.addEventListener("change", () => {
    scene.updateRoundPanels();
  });

  generateLinkBtn.addEventListener("click", () => {
    shareLinkOutEl.value = scene.generateShareLink();
    shareLinkOutEl.select();
  });
  exportReplayBtn.addEventListener("click", () => {
    replayOutEl.value = scene.exportReplayToken();
    replayOutEl.select();
  });
  importReplayBtn.addEventListener("click", () => {
    const token = replayInEl.value.trim();
    if (!token) {
      scene.ui.setStatusMessage(`${scene.ui.createStatusHtml()}<br /><strong>Paste a replay token first.</strong>`);
      return;
    }
    if (scene.importReplayToken(token)) {
      replayOutEl.value = token;
      scene.ui.setStatusMessage(`${scene.ui.createStatusHtml()}<br /><strong>Replay imported.</strong>`);
    } else {
      scene.ui.setStatusMessage(`${scene.ui.createStatusHtml()}<br /><strong>Replay import failed.</strong>`);
    }
  });

  copyLinkBtn.addEventListener("click", async () => {
    if (!shareLinkOutEl.value) {
      shareLinkOutEl.value = scene.generateShareLink();
    }
    try {
      await navigator.clipboard.writeText(shareLinkOutEl.value);
      scene.ui.setStatusMessage(`${scene.ui.createStatusHtml()}<br /><strong>Link copied.</strong>`);
    } catch {
      shareLinkOutEl.select();
      shareLinkOutEl.setSelectionRange(0, shareLinkOutEl.value.length);
      scene.ui.setStatusMessage(`${scene.ui.createStatusHtml()}<br /><strong>Copy failed, selected URL for manual copy.</strong>`);
    }
  });

  scene.updateRoundPanels();
}
