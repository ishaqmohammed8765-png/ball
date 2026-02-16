import Phaser from "phaser";
import {
  ARENA_MODE_KEYS,
  BORDER_THICKNESS,
  CLASS_DEFS,
  CLASS_KEYS,
  COLLISION_DAMAGE_CACHE_TTL,
  COLLISION_DAMAGE_COOLDOWN,
  DEFAULT_SETUP,
  EVOLUTION_DEFS,
  FAST_FORWARD_STEPS,
  FIXED_DT,
  MAX_EFFECTS,
  MAX_SPEED,
  MAX_TOTAL_BALLS,
  MODIFIER_KEYS,
  NORMAL_STEPS,
  PIXEL_SIZE,
  RESTITUTION,
  MUTATION_DEFS,
  UPGRADE_DEFS
} from "./sim/constants.js";
import { createBall, createInitialBalls } from "./sim/setup.js";
import {
  capClassCounts,
  classColorHex,
  clamp,
  decodeReplayToken,
  encodeReplayToken,
  encodeSetupToken,
  loadReplayTokenFromUrl,
  loadSetupFromUrl,
  round6,
  sanitizeCount,
  sanitizeDimension
} from "./sim/utils.js";
import { buildCollisionPairs } from "./sim/spatial.js";
import { calculateCollisionDamage } from "./sim/damage.js";
import { buildControls } from "./ui/controls.js";

const INITIAL_SETUP = loadSetupFromUrl() ?? structuredClone(DEFAULT_SETUP);
const INITIAL_REPLAY_TOKEN = loadReplayTokenFromUrl();

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
    this.roundActive = false;
    this.winnerClassKey = null;
    this.nextRoundBoxClasses = [];
    this.ui = null;
    this.pixelMaskCache = new Map();
    this.nextBallId = 0;
    this.mode = "classic";
    this.arenaMode = "standard";
    this.activeModifier = "none";
    this.prizeLedger = Object.fromEntries(CLASS_KEYS.map((classKey) => [classKey, 0]));
    this.roundWins = Object.fromEntries(CLASS_KEYS.map((classKey) => [classKey, 0]));
    this.upgrades = Object.fromEntries(
      CLASS_KEYS.map((classKey) => [
        classKey,
        {
          hp: 0,
          speed: 0,
          mastery: 0
        }
      ])
    );
    this.evolutionLevels = Object.fromEntries(CLASS_KEYS.map((classKey) => [classKey, 0]));
    this.mutations = Object.fromEntries(CLASS_KEYS.map((classKey) => [classKey, null]));
    this.lastRewardResult = null;
    this.battleHistory = [];
    this.combatLog = [];
    this.achievements = new Set();
    this.lastNonEmptyClassSnapshot = Object.fromEntries(CLASS_KEYS.map((classKey) => [classKey, 0]));
    this.textureCacheByKey = new Set();
    this.classGlyphCache = new Map();
    this.pendingReplayToken = INITIAL_REPLAY_TOKEN;
    this.speedMultiplier = 1;
    this.setupWarningMessage = "";
    this.lastShareLink = "";
    this.tournament = {
      active: false,
      teamMode: false,
      baseSetup: null,
      matches: [],
      currentMatchIndex: -1,
      standings: Object.fromEntries(
        CLASS_KEYS.map((classKey) => [
          classKey,
          {
            played: 0,
            wins: 0,
            losses: 0
          }
        ])
      )
    };
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
    this.input.keyboard.on("keydown-S", () => {
      this.applySetupFromUiInputs();
      this.startRound();
    });
    this.input.keyboard.on("keydown-F", () => {
      this.fastForward = !this.fastForward;
    });
    this.input.keyboard.on("keydown-P", () => {
      this.paused = !this.paused;
    });
    this.input.keyboard.on("keydown", (event) => {
      if (event.key === "]") {
        this.setSpeedMultiplier(this.speedMultiplier === 4 ? 4 : this.speedMultiplier * 2);
      } else if (event.key === "[") {
        this.setSpeedMultiplier(this.speedMultiplier === 1 ? 1 : this.speedMultiplier / 2);
      }
    });

    buildControls(this);
    if (this.pendingReplayToken) {
      const loaded = this.importReplayToken(this.pendingReplayToken, true);
      if (!loaded) {
        this.rebuildInitialState();
      }
    } else {
      this.rebuildInitialState();
    }
  }

  applySetupFromUiInputs() {
    if (!this.ui?.countInputs || this.roundActive) {
      return;
    }
    const classCounts = {};
    for (const input of this.ui.countInputs) {
      classCounts[input.dataset.classKey] = sanitizeCount(input.value);
    }
    this.applySetup({
      arenaWidth: sanitizeDimension(this.ui.arenaWidthEl?.value, this.setup.arenaWidth),
      arenaHeight: sanitizeDimension(this.ui.arenaHeightEl?.value, this.setup.arenaHeight),
      classCounts
    });
  }

  syncControlInputs() {
    if (!this.ui) {
      return;
    }
    this.ui.arenaWidthEl.value = String(this.setup.arenaWidth);
    this.ui.arenaHeightEl.value = String(this.setup.arenaHeight);
    if (this.ui.modeSelectEl) {
      this.ui.modeSelectEl.value = this.mode;
    }
    if (this.ui.arenaSelectEl) {
      this.ui.arenaSelectEl.value = this.arenaMode;
    }
    if (this.ui.modifierSelectEl) {
      this.ui.modifierSelectEl.value = this.activeModifier;
    }
    if (this.ui.speedSelectEl) {
      this.ui.speedSelectEl.value = String(this.speedMultiplier);
    }
    for (const input of this.ui.countInputs) {
      input.value = String(this.setup.classCounts[input.dataset.classKey] ?? 0);
    }
  }

  setMode(nextMode) {
    if (!["classic", "blitz", "tournament"].includes(nextMode)) {
      return;
    }
    this.mode = nextMode;
    if (nextMode !== "tournament" && this.tournament.active) {
      this.stopTournament();
    }
    this.updateRoundPanels();
  }

  getModeLabel(modeKey = this.mode) {
    if (modeKey === "blitz") {
      return "Stress Test";
    }
    if (modeKey === "tournament") {
      return "Bracket Test";
    }
    return "Sandbox";
  }

  setArenaMode(nextArenaMode) {
    if (!ARENA_MODE_KEYS.includes(nextArenaMode)) {
      return;
    }
    this.arenaMode = nextArenaMode;
    this.updateRoundPanels();
  }

  setModifier(nextModifier) {
    if (!MODIFIER_KEYS.includes(nextModifier)) {
      return;
    }
    this.activeModifier = nextModifier;
    this.updateRoundPanels();
  }

  setSpeedMultiplier(nextSpeedMultiplier) {
    const parsed = Number(nextSpeedMultiplier);
    if (![1, 2, 4].includes(parsed)) {
      return;
    }
    this.speedMultiplier = parsed;
    this.updateRoundPanels();
  }

  getModeRules() {
    let movementMult = 1;
    let damageMult = 1;
    let prizeMult = 1;
    if (this.mode === "blitz") {
      movementMult = 1.1;
      damageMult = 1.15;
      prizeMult = 1.2;
    }
    if (this.mode === "tournament") {
      damageMult = 1.05;
      prizeMult = 1.25;
    }

    if (this.activeModifier === "iron_wall") {
      damageMult *= 0.9;
      prizeMult *= 1.05;
    } else if (this.activeModifier === "glass_cannon") {
      damageMult *= 1.18;
      prizeMult *= 1.1;
    } else if (this.activeModifier === "turbo") {
      movementMult *= 1.15;
      prizeMult *= 1.08;
    }

    return { movementMult, damageMult, prizeMult };
  }

  getArenaRules() {
    if (this.arenaMode === "crossfire") {
      return {
        hazardTick: 54,
        hazardDamage: 3.5
      };
    }
    if (this.arenaMode === "sanctum") {
      return {
        sanctumRadius: Math.min(this.setup.arenaWidth, this.setup.arenaHeight) * 0.17,
        sanctumHealingPerSecond: 2.8
      };
    }
    if (this.arenaMode === "gauntlet") {
      return {
        wallThorns: 7.5
      };
    }
    return {};
  }

  logCombatEvent(message) {
    this.combatLog.unshift(`t${this.stepCounter}: ${message}`);
    if (this.combatLog.length > 20) {
      this.combatLog = this.combatLog.slice(0, 20);
    }
  }

  getBattlePrizeAmount() {
    const modeRules = this.getModeRules();
    const survivorHp = this.balls.reduce((sum, ball) => sum + ball.hp, 0);
    const hpBonus = Math.round(survivorHp * 0.15);
    const speedBonus = Math.max(0, 40 - Math.floor(this.stepCounter / 60));
    return Math.max(25, Math.round((85 + hpBonus + speedBonus) * modeRules.prizeMult));
  }

  awardWinnerPrize(classKey, amount) {
    this.prizeLedger[classKey] += amount;
    this.roundWins[classKey] += 1;
    this.battleHistory.unshift({
      id: this.stepCounter + this.simTime,
      mode: this.mode,
      winner: classKey,
      prize: amount,
      step: this.stepCounter
    });
    if (this.battleHistory.length > 14) {
      this.battleHistory = this.battleHistory.slice(0, 14);
    }
    this.logCombatEvent(`${CLASS_DEFS[classKey].label} earned ${amount} prize`);
    this.evaluateAchievements();
  }

  getDeterministicValue(classKey, salt = 0) {
    const classSum = classKey.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const base =
      classSum +
      Math.floor(this.simTime * 1000) +
      this.stepCounter * 17 +
      this.balls.length * 13 +
      this.battleHistory.length * 29 +
      salt * 41;
    return Math.abs(base);
  }

  pickDeterministicRoundReward(classKey) {
    const rewardKinds = ["stat", "mutation", "evolution"];
    const statKeys = ["hp", "speed", "mastery"];
    const progression = this.upgrades[classKey];
    const availableStats = statKeys.filter((key) => progression[key] < UPGRADE_DEFS[key].maxLevel);
    const hasMutation = Boolean(this.mutations[classKey]);
    const canMutate = !hasMutation;
    const canEvolve = (this.evolutionLevels[classKey] ?? 0) < EVOLUTION_DEFS.maxLevel;
    const availableKinds = rewardKinds.filter((kind) => {
      if (kind === "stat") {
        return availableStats.length > 0;
      }
      if (kind === "mutation") {
        return canMutate;
      }
      return canEvolve;
    });
    if (availableKinds.length === 0) {
      return null;
    }

    let kind = rewardKinds[this.getDeterministicValue(classKey, 0) % rewardKinds.length];
    if (!availableKinds.includes(kind)) {
      kind = availableKinds[this.getDeterministicValue(classKey, 1) % availableKinds.length];
    }

    if (kind === "stat") {
      const statKey = availableStats[this.getDeterministicValue(classKey, 2) % availableStats.length];
      return { type: "stat", statKey };
    }
    if (kind === "mutation") {
      const mutationKeys = Object.keys(MUTATION_DEFS);
      const mutationKey = mutationKeys[this.getDeterministicValue(classKey, 3) % mutationKeys.length];
      return { type: "mutation", mutationKey };
    }
    return { type: "evolution" };
  }

  applyRoundReward(classKey) {
    const reward = this.pickDeterministicRoundReward(classKey);
    if (!reward) {
      this.lastRewardResult = { classKey, label: `${CLASS_DEFS[classKey].label}: no reward available` };
      return;
    }

    if (reward.type === "stat") {
      this.upgrades[classKey][reward.statKey] += 1;
      this.lastRewardResult = {
        classKey,
        type: "stat",
        label: `${CLASS_DEFS[classKey].label} auto-reward: +${UPGRADE_DEFS[reward.statKey].label} (Lv${this.upgrades[classKey][reward.statKey]})`
      };
    } else if (reward.type === "mutation") {
      this.mutations[classKey] = reward.mutationKey;
      this.lastRewardResult = {
        classKey,
        type: "mutation",
        label: `${CLASS_DEFS[classKey].label} auto-reward: mutation ${MUTATION_DEFS[reward.mutationKey].label}`
      };
    } else {
      this.evolutionLevels[classKey] += 1;
      this.lastRewardResult = {
        classKey,
        type: "evolution",
        label: `${CLASS_DEFS[classKey].label} auto-reward: evolution Lv${this.evolutionLevels[classKey]}`
      };
    }
    this.logCombatEvent(this.lastRewardResult.label);
  }

  applyUpgradesToBall(ball) {
    const classUpgrade = this.upgrades[ball.classKey];
    if (!classUpgrade) {
      return;
    }
    const hpLevel = classUpgrade.hp ?? 0;
    const speedLevel = classUpgrade.speed ?? 0;
    const masteryLevel = classUpgrade.mastery ?? 0;

    if (hpLevel > 0) {
      ball.maxHp = ball.maxHp * (1 + hpLevel * UPGRADE_DEFS.hp.hpPerLevel);
      ball.hp = ball.maxHp;
    }
    if (speedLevel > 0) {
      const speedMult = 1 + speedLevel * UPGRADE_DEFS.speed.speedPerLevel;
      ball.vx *= speedMult;
      ball.vy *= speedMult;
    }
    if (masteryLevel > 0) {
      ball.outgoingBonus = masteryLevel * UPGRADE_DEFS.mastery.outgoingPerLevel;
      ball.incomingReduction = masteryLevel * UPGRADE_DEFS.mastery.incomingReductionPerLevel;
    }

    const evolutionLevel = this.evolutionLevels[ball.classKey] ?? 0;
    if (evolutionLevel > 0) {
      ball.maxHp *= 1 + evolutionLevel * EVOLUTION_DEFS.hpPerLevel;
      ball.hp = ball.maxHp;
      const evoSpeedMult = 1 + evolutionLevel * EVOLUTION_DEFS.speedPerLevel;
      ball.vx *= evoSpeedMult;
      ball.vy *= evoSpeedMult;
      ball.r = Math.round(ball.r + evolutionLevel * EVOLUTION_DEFS.radiusPerLevel);
      ball.outgoingBonus = (ball.outgoingBonus ?? 0) + evolutionLevel * EVOLUTION_DEFS.outgoingPerLevel;
      ball.incomingReduction = clamp(
        (ball.incomingReduction ?? 0) + evolutionLevel * EVOLUTION_DEFS.incomingReductionPerLevel,
        0,
        0.75
      );
    }

    const mutationKey = this.mutations[ball.classKey];
    if (mutationKey && MUTATION_DEFS[mutationKey]) {
      const mutation = MUTATION_DEFS[mutationKey];
      ball.mutationKey = mutationKey;
      ball.maxHp *= mutation.hpPenalty ?? 0.92;
      ball.hp = Math.min(ball.hp, ball.maxHp);
      ball.outgoingBonus = (ball.outgoingBonus ?? 0) - (1 - (mutation.outgoingPenalty ?? 0.9));
      if (mutation.ability === "dash") {
        ball.abilityState.mutationCooldown = mutation.cooldown ?? 3.8;
      }
      if (mutation.ability === "sword") {
        ball.abilityState.swordsmanSlashCooldown = mutation.slashCooldown ?? 1.75;
      }
      if (mutation.ability === "archer") {
        ball.abilityState.archerShotCooldown = mutation.shotCooldown ?? 1.35;
      }
    } else {
      ball.mutationKey = null;
    }
  }

  exportReplayToken() {
    const payload = {
      v: 1,
      mode: this.mode,
      arenaMode: this.arenaMode,
      activeModifier: this.activeModifier,
      setup: this.setup,
      upgrades: this.upgrades,
      evolutionLevels: this.evolutionLevels,
      mutations: this.mutations,
      roundWins: this.roundWins
    };
    return encodeReplayToken(payload);
  }

  importReplayToken(token, fromUrl = false) {
    const payload = decodeReplayToken(token);
    if (!payload || payload.v !== 1 || !payload.setup) {
      return false;
    }
    this.mode = ["classic", "blitz", "tournament"].includes(payload.mode) ? payload.mode : "classic";
    this.arenaMode = ARENA_MODE_KEYS.includes(payload.arenaMode) ? payload.arenaMode : "standard";
    this.activeModifier = MODIFIER_KEYS.includes(payload.activeModifier) ? payload.activeModifier : "none";
    if (payload.upgrades && typeof payload.upgrades === "object") {
      for (const classKey of CLASS_KEYS) {
        const source = payload.upgrades[classKey];
        if (!source) {
          continue;
        }
        this.upgrades[classKey] = {
          hp: clamp(Number(source.hp) || 0, 0, UPGRADE_DEFS.hp.maxLevel),
          speed: clamp(Number(source.speed) || 0, 0, UPGRADE_DEFS.speed.maxLevel),
          mastery: clamp(Number(source.mastery) || 0, 0, UPGRADE_DEFS.mastery.maxLevel)
        };
      }
    }
    if (payload.evolutionLevels && typeof payload.evolutionLevels === "object") {
      for (const classKey of CLASS_KEYS) {
        const nextLevel = Number(payload.evolutionLevels[classKey]) || 0;
        this.evolutionLevels[classKey] = clamp(nextLevel, 0, EVOLUTION_DEFS.maxLevel);
      }
    }
    if (payload.mutations && typeof payload.mutations === "object") {
      for (const classKey of CLASS_KEYS) {
        const mutationKey = payload.mutations[classKey];
        this.mutations[classKey] = MUTATION_DEFS[mutationKey] ? mutationKey : null;
      }
    }
    if (payload.roundWins && typeof payload.roundWins === "object") {
      for (const classKey of CLASS_KEYS) {
        this.roundWins[classKey] = Number(payload.roundWins[classKey]) || 0;
      }
    }
    this.applySetup(payload.setup);
    this.syncControlInputs();
    if (!fromUrl) {
      this.logCombatEvent("Replay imported");
    }
    return true;
  }

  evaluateAchievements() {
    for (const classKey of CLASS_KEYS) {
      if ((this.prizeLedger[classKey] ?? 0) >= 500 && !this.achievements.has(`rich_${classKey}`)) {
        this.achievements.add(`rich_${classKey}`);
      }
    }
    if (this.battleHistory.length >= 5 && !this.achievements.has("veteran_5")) {
      this.achievements.add("veteran_5");
    }
    if (this.mode === "tournament" && this.battleHistory.length >= 10 && !this.achievements.has("tournament_runner")) {
      this.achievements.add("tournament_runner");
    }
  }

  resolveEmptyBattleWinner() {
    let bestClassKey = null;
    let bestCount = -1;
    for (const classKey of CLASS_KEYS) {
      const count = this.lastNonEmptyClassSnapshot[classKey] ?? 0;
      if (count > bestCount) {
        bestCount = count;
        bestClassKey = classKey;
      }
    }
    if (bestCount <= 0) {
      return null;
    }
    return bestClassKey;
  }

  getCurrentClassCounts() {
    const counts = Object.fromEntries(CLASS_KEYS.map((classKey) => [classKey, 0]));
    for (const ball of this.balls) {
      counts[ball.classKey] += 1;
    }
    return counts;
  }

  evaluateWinnerState() {
    if (this.roundFinished || !this.roundActive) {
      return;
    }

    if (this.balls.length === 0) {
      this.roundFinished = true;
      this.roundActive = false;
      this.winnerClassKey = this.resolveEmptyBattleWinner();
      this.paused = true;
      this.finalizeBattleResults();
      this.updateRoundPanels();
      return;
    }

    const classSet = new Set(this.balls.map((ball) => ball.classKey));
    if (classSet.size <= 1) {
      this.roundFinished = true;
      this.roundActive = false;
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
      this.finalizeBattleResults();
      this.updateRoundPanels();
    }
  }

  finalizeBattleResults() {
    if (!this.winnerClassKey) {
      return;
    }
    const prize = this.getBattlePrizeAmount();
    this.awardWinnerPrize(this.winnerClassKey, prize);
    this.applyRoundReward(this.winnerClassKey);
    if (this.tournament.active) {
      this.completeTournamentBattle(this.winnerClassKey);
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

  getPrizeBoardHtml() {
    const ranked = [...CLASS_KEYS]
      .map((classKey) => ({ classKey, prize: this.prizeLedger[classKey], wins: this.roundWins[classKey] }))
      .sort((a, b) => b.wins - a.wins || b.prize - a.prize || CLASS_KEYS.indexOf(a.classKey) - CLASS_KEYS.indexOf(b.classKey));
    const rows = ranked
      .slice(0, 6)
      .map(
        (entry) =>
          `<div><strong style="color:${classColorHex(entry.classKey)}">${CLASS_DEFS[entry.classKey].label}</strong>: ${entry.wins} wins, ${entry.prize} score</div>`
      )
      .join("");
    return rows || "<div>No prizes awarded yet.</div>";
  }

  getTournamentHtml() {
    if (!this.tournament.active) {
      return "<div>Tournament inactive.</div>";
    }
    const total = this.tournament.matches.length;
    const current = this.tournament.currentMatchIndex + 1;
    const table = CLASS_KEYS.filter((classKey) => (this.tournament.baseSetup?.classCounts[classKey] ?? 0) > 0)
      .map((classKey) => {
        const row = this.tournament.standings[classKey];
        return `<div><strong style="color:${classColorHex(classKey)}">${CLASS_DEFS[classKey].label}</strong>: ${row.wins}W-${row.losses}L</div>`;
      })
      .join("");
    const matchup = this.tournament.matches[this.tournament.currentMatchIndex];
    const matchupLabel = matchup?.label ? `<div>${matchup.label}</div>` : "";
    const format = this.tournament.teamMode ? "Team mode" : "Solo mode";
    return `<div>${format} | Match ${current}/${total}</div>${matchupLabel}${table}`;
  }

  getCombatLogHtml() {
    if (this.combatLog.length === 0) {
      return "<div>No combat events yet.</div>";
    }
    return this.combatLog.slice(0, 10).map((line) => `<div>${line}</div>`).join("");
  }

  getAchievementsHtml() {
    if (this.achievements.size === 0) {
      return "<div>No achievements yet.</div>";
    }
    return [...this.achievements]
      .slice(0, 10)
      .map((id) => `<div>${id}</div>`)
      .join("");
  }

  getRewardSummaryHtml() {
    if (!this.lastRewardResult) {
      return "<div>Win a round to trigger deterministic auto-rewards.</div>";
    }
    const classKey = this.lastRewardResult.classKey;
    const levels = this.upgrades[classKey];
    const evo = this.evolutionLevels[classKey] ?? 0;
    const mutationKey = this.mutations[classKey];
    const mutationLabel = mutationKey ? MUTATION_DEFS[mutationKey].label : "None";
    return `
      <div><strong style="color:${classColorHex(classKey)}">${CLASS_DEFS[classKey].label}</strong></div>
      <div>${this.lastRewardResult.label}</div>
      <div>Stats: HP Lv${levels.hp} | Speed Lv${levels.speed} | Mastery Lv${levels.mastery}</div>
      <div>Evolution Lv${evo} | Mutation: ${mutationLabel}</div>
    `;
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

  buildTournamentMatches() {
    const entrants = CLASS_KEYS.filter((classKey) => (this.setup.classCounts[classKey] ?? 0) > 0);
    const matches = [];
    if (this.tournament.teamMode) {
      const teams = [];
      for (let i = 0; i < entrants.length; i += 2) {
        const a = entrants[i];
        const b = entrants[i + 1];
        if (a && b) {
          teams.push([a, b]);
        }
      }
      for (let i = 0; i < teams.length; i += 1) {
        for (let j = i + 1; j < teams.length; j += 1) {
          matches.push({
            aTeam: teams[i],
            bTeam: teams[j],
            label: `${CLASS_DEFS[teams[i][0]].label}/${CLASS_DEFS[teams[i][1]].label} vs ${CLASS_DEFS[teams[j][0]].label}/${CLASS_DEFS[teams[j][1]].label}`
          });
        }
      }
      return matches;
    }
    for (let i = 0; i < entrants.length; i += 1) {
      for (let j = i + 1; j < entrants.length; j += 1) {
        matches.push({
          a: entrants[i],
          b: entrants[j],
          label: `${CLASS_DEFS[entrants[i]].label} vs ${CLASS_DEFS[entrants[j]].label}`
        });
      }
    }
    return matches;
  }

  startTournament(teamMode = false) {
    this.tournament.teamMode = Boolean(teamMode);
    const matches = this.buildTournamentMatches();
    if (matches.length === 0) {
      this.updateRoundPanels();
      return;
    }
    this.tournament.active = true;
    this.tournament.baseSetup = structuredClone(this.setup);
    this.tournament.matches = matches;
    this.tournament.currentMatchIndex = -1;
    this.tournament.standings = Object.fromEntries(
      CLASS_KEYS.map((classKey) => [
        classKey,
        {
          played: 0,
          wins: 0,
          losses: 0
        }
      ])
    );
    this.mode = "tournament";
    this.launchNextTournamentMatch();
  }

  stopTournament() {
    this.tournament.active = false;
    this.tournament.matches = [];
    this.tournament.currentMatchIndex = -1;
    this.tournament.teamMode = false;
    this.updateRoundPanels();
  }

  launchNextTournamentMatch() {
    if (!this.tournament.active) {
      return;
    }
    const nextIndex = this.tournament.currentMatchIndex + 1;
    if (nextIndex >= this.tournament.matches.length) {
      this.stopTournament();
      return;
    }
    this.tournament.currentMatchIndex = nextIndex;
    const matchup = this.tournament.matches[nextIndex];
    const classCounts = Object.fromEntries(CLASS_KEYS.map((classKey) => [classKey, 0]));
    if (matchup.aTeam && matchup.bTeam) {
      for (const classKey of matchup.aTeam) {
        classCounts[classKey] = this.tournament.baseSetup.classCounts[classKey];
      }
      for (const classKey of matchup.bTeam) {
        classCounts[classKey] = this.tournament.baseSetup.classCounts[classKey];
      }
    } else {
      classCounts[matchup.a] = this.tournament.baseSetup.classCounts[matchup.a];
      classCounts[matchup.b] = this.tournament.baseSetup.classCounts[matchup.b];
    }
    this.applySetup({
      arenaWidth: this.tournament.baseSetup.arenaWidth,
      arenaHeight: this.tournament.baseSetup.arenaHeight,
      classCounts
    });
    this.startRound();
    this.updateRoundPanels();
  }

  completeTournamentBattle(winnerClassKey) {
    if (!this.tournament.active || this.tournament.currentMatchIndex < 0) {
      return;
    }
    const matchup = this.tournament.matches[this.tournament.currentMatchIndex];
    if (matchup.aTeam && matchup.bTeam) {
      const winnerIsTeamA = matchup.aTeam.includes(winnerClassKey);
      const winnerTeam = winnerIsTeamA ? matchup.aTeam : matchup.bTeam;
      const loserTeam = winnerIsTeamA ? matchup.bTeam : matchup.aTeam;
      for (const classKey of matchup.aTeam) {
        this.tournament.standings[classKey].played += 1;
      }
      for (const classKey of matchup.bTeam) {
        this.tournament.standings[classKey].played += 1;
      }
      for (const classKey of winnerTeam) {
        this.tournament.standings[classKey].wins += 1;
      }
      for (const classKey of loserTeam) {
        this.tournament.standings[classKey].losses += 1;
      }
    } else {
      this.tournament.standings[matchup.a].played += 1;
      this.tournament.standings[matchup.b].played += 1;
      if (winnerClassKey === matchup.a) {
        this.tournament.standings[matchup.a].wins += 1;
        this.tournament.standings[matchup.b].losses += 1;
      } else {
        this.tournament.standings[matchup.b].wins += 1;
        this.tournament.standings[matchup.a].losses += 1;
      }
    }

    this.time.delayedCall(700, () => {
      this.launchNextTournamentMatch();
    });
  }

  generateShareLink() {
    const setupToken = encodeSetupToken(this.setup);
    const replayToken = this.exportReplayToken();
    const url = new URL(window.location.href);
    url.searchParams.set("setup", setupToken);
    url.searchParams.set("replay", replayToken);
    const link = url.toString();
    if (link !== this.lastShareLink) {
      window.history.replaceState({}, "", link);
      this.lastShareLink = link;
    }
    if (this.ui?.shareLinkOutEl) {
      this.ui.shareLinkOutEl.value = link;
    }
    return link;
  }

  updateRoundPanels() {
    if (!this.ui) {
      return;
    }

    this.ui.roundStatusEl.innerHTML = `${this.ui.createStatusHtml()}${
      this.setupWarningMessage ? `<br /><strong style="color:#fda4af">${this.setupWarningMessage}</strong>` : ""
    }`;
    if (this.ui.prizeBoardEl) {
      this.ui.prizeBoardEl.innerHTML = this.getPrizeBoardHtml();
    }
    if (this.ui.tournamentStatusEl) {
      this.ui.tournamentStatusEl.innerHTML = this.getTournamentHtml();
    }
    if (this.ui.combatLogEl) {
      this.ui.combatLogEl.innerHTML = this.getCombatLogHtml();
    }
    if (this.ui.achievementsEl) {
      this.ui.achievementsEl.innerHTML = this.getAchievementsHtml();
    }
    if (this.ui.replayOutEl) {
      this.ui.replayOutEl.value = this.exportReplayToken();
    }
    if (this.ui.rewardSummaryEl) {
      this.ui.rewardSummaryEl.innerHTML = this.getRewardSummaryHtml();
    }
    if (this.ui.rewardChoicesEl) {
      this.ui.rewardChoicesEl.innerHTML =
        '<div class="panel">Reward is auto-picked per winning round (deterministic).</div>';
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
        chip.dataset.classKey = survivor.classKey;
        if (this.ui.bindDraggableChip) {
          this.ui.bindDraggableChip(chip, survivor.classKey);
        }
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
    const classCountResult = capClassCounts(newSetup.classCounts, MAX_TOTAL_BALLS, CLASS_KEYS);
    this.setupWarningMessage = classCountResult.wasCapped
      ? `Setup capped to ${MAX_TOTAL_BALLS} total balls for stable performance.`
      : "";

    this.setup = {
      arenaWidth: sanitizeDimension(newSetup.arenaWidth, DEFAULT_SETUP.arenaWidth),
      arenaHeight: sanitizeDimension(newSetup.arenaHeight, DEFAULT_SETUP.arenaHeight),
      classCounts: classCountResult.classCounts
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

  startRound() {
    if (this.roundActive) {
      return;
    }
    this.balls = this.initialState.map((ball) => ({
      ...ball,
      abilityState: { ...ball.abilityState }
    }));
    for (const ball of this.balls) {
      this.applyUpgradesToBall(ball);
    }
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
    this.roundActive = this.balls.length > 0;
    this.lastNonEmptyClassSnapshot = this.getCurrentClassCounts();
    this.nextBallId = this.balls.reduce((maxId, ball) => Math.max(maxId, ball.id), -1) + 1;
    this.renderScene();
    this.updateRoundPanels();
  }

  resetSimulation() {
    this.balls = [];
    this.effects = [];
    this.stepCounter = 0;
    this.accumulator = 0;
    this.fastForward = false;
    this.paused = false;
    this.simTime = 0;
    this.lastDamageTimesByPair.clear();
    this.lastPairPruneAt = 0;
    this.roundFinished = false;
    this.roundActive = false;
    this.winnerClassKey = null;
    this.lastNonEmptyClassSnapshot = Object.fromEntries(CLASS_KEYS.map((classKey) => [classKey, 0]));
    this.nextBallId = this.initialState.reduce((maxId, ball) => Math.max(maxId, ball.id), -1) + 1;
    this.renderScene();
    this.updateRoundPanels();
  }

  update(_time, delta) {
    if (!this.roundActive) {
      this.renderScene();
      return;
    }
    if (this.paused) {
      this.renderScene();
      return;
    }

    this.accumulator += delta / 1000;
    this.accumulator = Math.min(this.accumulator, 0.25);

    const baseSteps = this.fastForward ? FAST_FORWARD_STEPS : NORMAL_STEPS;
    const maxStepsThisFrame = baseSteps * this.speedMultiplier;
    let steps = 0;
    while (this.accumulator >= FIXED_DT && steps < maxStepsThisFrame) {
      this.simulateStep(FIXED_DT);
      this.accumulator -= FIXED_DT;
      steps += 1;
    }

    this.renderScene();
  }

  simulateStep(dt) {
    const aliveBalls = this.balls.filter((ball) => ball.alive);
    const pendingDamage = new Map();
    const pendingHealing = new Map();
    const pendingSpawns = [];
    const modeRules = this.getModeRules();
    this.simTime += dt;
    if (aliveBalls.length > 0) {
      this.lastNonEmptyClassSnapshot = this.getCurrentClassCounts();
    }

    for (const ball of aliveBalls) {
      this.applyPerStepAbilities(ball, dt, aliveBalls, pendingDamage);
      ball.x += ball.vx * dt * modeRules.movementMult;
      ball.y += ball.vy * dt * modeRules.movementMult;
      const wallBounceNormal = this.resolveWallCollision(ball);
      if (wallBounceNormal) {
        this.trySpawnSplitChildrenFromWall(ball, wallBounceNormal.x, wallBounceNormal.y, pendingSpawns);
      }
      this.applyArenaEffects(ball, dt, pendingDamage, pendingHealing);
      this.spawnTrail(ball);
    }

    const collisionPairs = buildCollisionPairs(aliveBalls);
    for (const [i, j] of collisionPairs) {
      this.resolveBallCollision(aliveBalls[i], aliveBalls[j], pendingDamage, pendingHealing, pendingSpawns);
    }

    for (const ball of aliveBalls) {
      const damage = pendingDamage.get(ball.id) ?? 0;
      const healing = pendingHealing.get(ball.id) ?? 0;
      const reduction = clamp(ball.incomingReduction ?? 0, 0, 0.75);
      ball.hp = clamp(ball.hp - damage * modeRules.damageMult * (1 - reduction) + healing, 0, ball.maxHp);
      if (ball.hp <= 0) {
        ball.alive = false;
      }
    }

    this.balls = this.balls.filter((ball) => ball.alive);
    if (pendingSpawns.length > 0) {
      const availableSlots = Math.max(0, MAX_TOTAL_BALLS - this.balls.length);
      if (availableSlots > 0) {
        this.balls.push(...pendingSpawns.slice(0, availableSlots));
      }
    }
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

  applyPerStepAbilities(ball, dt, aliveBalls, pendingDamage) {
    const def = CLASS_DEFS[ball.classKey];
    if (ball.abilityState.splitCooldownLeft > 0) {
      ball.abilityState.splitCooldownLeft = Math.max(0, ball.abilityState.splitCooldownLeft - dt);
    }
    if (ball.abilityState.bossShockwaveCooldown > 0) {
      ball.abilityState.bossShockwaveCooldown = Math.max(0, ball.abilityState.bossShockwaveCooldown - dt);
    }
    if (ball.abilityState.bossRoarCooldown > 0) {
      ball.abilityState.bossRoarCooldown = Math.max(0, ball.abilityState.bossRoarCooldown - dt);
    }
    if (ball.abilityState.bossChargeCooldown > 0) {
      ball.abilityState.bossChargeCooldown = Math.max(0, ball.abilityState.bossChargeCooldown - dt);
    }
    if (ball.abilityState.swordsmanSlashCooldown > 0) {
      ball.abilityState.swordsmanSlashCooldown = Math.max(0, ball.abilityState.swordsmanSlashCooldown - dt);
    }
    if (ball.abilityState.archerShotCooldown > 0) {
      ball.abilityState.archerShotCooldown = Math.max(0, ball.abilityState.archerShotCooldown - dt);
    }
    if (ball.abilityState.mutationCooldown > 0) {
      ball.abilityState.mutationCooldown = Math.max(0, ball.abilityState.mutationCooldown - dt);
    }

    const mutationDef = ball.mutationKey ? MUTATION_DEFS[ball.mutationKey] : null;
    const regenPerSecond = (def.regenPerSecond ?? 0) + (mutationDef?.ability === "regen" ? mutationDef.regenPerSecond ?? 0 : 0);

    if (regenPerSecond > 0) {
      ball.hp = Math.min(ball.maxHp, ball.hp + regenPerSecond * dt);
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
    if (mutationDef?.ability === "dash" && ball.classKey !== "trickster" && ball.abilityState.mutationCooldown <= 0) {
      ball.vx *= mutationDef.dashMultiplier ?? 1.22;
      ball.vy *= mutationDef.dashMultiplier ?? 1.22;
      ball.abilityState.mutationCooldown = mutationDef.cooldown ?? 3.8;
      this.effects.push({
        type: "ring",
        x: ball.x,
        y: ball.y,
        color: 0xfacc15,
        life: 0.28,
        radius: ball.r + 2
      });
    }

    if (ball.classKey === "bulwark") {
      if (ball.abilityState.bulwarkShieldTimeLeft > 0) {
        ball.abilityState.bulwarkShieldTimeLeft = Math.max(0, ball.abilityState.bulwarkShieldTimeLeft - dt);
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

    if (ball.classKey === "boss") {
      ball.hp = Math.min(ball.maxHp, ball.hp + (def.regenPerSecond ?? 0) * dt);

      if (!ball.abilityState.bossEnraged && ball.hp <= ball.maxHp * (def.enrageThreshold ?? 0.45)) {
        ball.abilityState.bossEnraged = true;
        ball.outgoingBonus = (ball.outgoingBonus ?? 0) + (def.enrageOutgoingBonus ?? 0);
        ball.incomingReduction = clamp((ball.incomingReduction ?? 0) + (def.enrageIncomingReduction ?? 0), 0, 0.75);
        ball.vx *= def.enrageSpeedMult ?? 1;
        ball.vy *= def.enrageSpeedMult ?? 1;
        this.effects.push({
          type: "ring",
          x: ball.x,
          y: ball.y,
          color: 0xff6b35,
          life: 0.56,
          radius: ball.r + 8
        });
        this.logCombatEvent(`Boss #${ball.id} enraged`);
      }

      if (ball.abilityState.bossChargeCooldown <= 0) {
        const angle = (((this.stepCounter * 13 + ball.id * 17) % 360) * Math.PI) / 180;
        const force = def.chargeForce ?? 100;
        ball.vx += Math.cos(angle) * force;
        ball.vy += Math.sin(angle) * force;
        ball.abilityState.bossChargeCooldown = def.chargeCooldown ?? 1.7;
        this.effects.push({
          type: "spark",
          x: ball.x,
          y: ball.y,
          color: 0xffedd5,
          life: 0.28
        });
      }

      if (ball.abilityState.bossRoarCooldown <= 0) {
        this.triggerBossRoar(ball, aliveBalls, pendingDamage);
      }
    }

    if (ball.classKey === "swordsman" || mutationDef?.ability === "sword") {
      const swordDef = ball.classKey === "swordsman" ? def : mutationDef;
      if (ball.abilityState.swordsmanSlashCooldown <= 0) {
        this.triggerSwordSlash(ball, aliveBalls, pendingDamage, swordDef, ball.classKey === "swordsman" ? 0xfb923c : 0xfbbf24);
        ball.abilityState.swordsmanSlashCooldown = swordDef.slashCooldown ?? 1.25;
      }
    }

    if (ball.classKey === "archer" || mutationDef?.ability === "archer") {
      const archerDef = ball.classKey === "archer" ? def : mutationDef;
      if (ball.abilityState.archerShotCooldown <= 0) {
        this.triggerArcherShot(ball, aliveBalls, pendingDamage, archerDef, ball.classKey === "archer" ? 0x86efac : 0xfde68a);
        ball.abilityState.archerShotCooldown = archerDef.shotCooldown ?? 1;
      }
    }
  }

  triggerSwordSlash(source, aliveBalls, pendingDamage, slashDef, color) {
    const radius = slashDef.slashRadius ?? 90;
    const radiusSq = radius * radius;
    const slashDamage = slashDef.slashDamage ?? 8;
    const slashPush = slashDef.slashPush ?? 64;
    let hits = 0;

    for (const target of aliveBalls) {
      if (target.id === source.id || !target.alive) {
        continue;
      }
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > radiusSq) {
        continue;
      }
      const dist = Math.sqrt(distSq) || 1;
      const nx = dx / dist;
      const ny = dy / dist;
      target.vx += nx * slashPush;
      target.vy += ny * slashPush;
      pendingDamage.set(target.id, (pendingDamage.get(target.id) ?? 0) + slashDamage);
      hits += 1;
    }

    this.effects.push({
      type: "slash",
      x: source.x,
      y: source.y,
      color,
      life: 0.25,
      radius
    });
    if (hits > 0 && this.stepCounter % 18 === 0) {
      this.logCombatEvent(`${CLASS_DEFS[source.classKey].label} #${source.id} slash hit ${hits}`);
    }
  }

  triggerArcherShot(source, aliveBalls, pendingDamage, shotDef, color) {
    let target = null;
    let bestDistSq = Number.POSITIVE_INFINITY;
    const range = shotDef.shotRange ?? 280;
    const rangeSq = range * range;

    for (const candidate of aliveBalls) {
      if (!candidate.alive || candidate.id === source.id) {
        continue;
      }
      const dx = candidate.x - source.x;
      const dy = candidate.y - source.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > rangeSq) {
        continue;
      }
      if (distSq < bestDistSq) {
        target = candidate;
        bestDistSq = distSq;
      }
    }
    if (!target) {
      return;
    }

    const dist = Math.sqrt(bestDistSq) || 1;
    const nx = (target.x - source.x) / dist;
    const ny = (target.y - source.y) / dist;
    target.vx += nx * (shotDef.shotPush ?? 55);
    target.vy += ny * (shotDef.shotPush ?? 55);
    pendingDamage.set(target.id, (pendingDamage.get(target.id) ?? 0) + (shotDef.shotDamage ?? 9));

    this.effects.push({
      type: "arrow",
      x: source.x,
      y: source.y,
      tx: target.x,
      ty: target.y,
      color,
      life: 0.2
    });
    if (this.stepCounter % 20 === 0) {
      this.logCombatEvent(`${CLASS_DEFS[source.classKey].label} #${source.id} shot #${target.id}`);
    }
  }

  triggerBossRoar(source, aliveBalls, pendingDamage) {
    const def = CLASS_DEFS.boss;
    source.abilityState.bossRoarCooldown = def.roarCooldown ?? 1.1;
    const radius = def.roarRadius ?? 170;
    const radiusSq = radius * radius;
    const damage = (def.roarDamage ?? 8) * (source.abilityState.bossEnraged ? 1.35 : 1);
    const push = def.roarPush ?? 110;

    let hits = 0;
    for (const target of aliveBalls) {
      if (target.id === source.id || !target.alive) {
        continue;
      }
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > radiusSq) {
        continue;
      }
      const dist = Math.sqrt(distSq) || 1;
      const nx = dx / dist;
      const ny = dy / dist;
      target.vx += nx * push;
      target.vy += ny * push;
      pendingDamage.set(target.id, (pendingDamage.get(target.id) ?? 0) + damage);
      hits += 1;
    }

    if (hits > 0) {
      this.effects.push({
        type: "ring",
        x: source.x,
        y: source.y,
        color: source.abilityState.bossEnraged ? 0xff7a59 : 0xffc36b,
        life: 0.34,
        radius
      });
      if (this.stepCounter % 20 === 0) {
        this.logCombatEvent(`Boss roar hit ${hits}`);
      }
    }
  }

  applyArenaEffects(ball, dt, pendingDamage, pendingHealing) {
    const rules = this.getArenaRules();
    if (rules.hazardTick && this.stepCounter % rules.hazardTick === 0) {
      const row = Math.floor(this.stepCounter / rules.hazardTick);
      const hazardX = (row * 41) % this.setup.arenaWidth;
      const hazardY = (row * 37) % this.setup.arenaHeight;
      if (Math.abs(ball.x - hazardX) < ball.r * 0.7 || Math.abs(ball.y - hazardY) < ball.r * 0.7) {
        pendingDamage.set(ball.id, (pendingDamage.get(ball.id) ?? 0) + rules.hazardDamage);
      }
    }
    if (rules.sanctumRadius) {
      const cx = this.setup.arenaWidth * 0.5;
      const cy = this.setup.arenaHeight * 0.5;
      const dx = ball.x - cx;
      const dy = ball.y - cy;
      if (dx * dx + dy * dy <= rules.sanctumRadius * rules.sanctumRadius) {
        pendingHealing.set(ball.id, (pendingHealing.get(ball.id) ?? 0) + rules.sanctumHealingPerSecond * dt);
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
    let normalX = 0;
    let normalY = 0;

    if (ball.x < minX) {
      ball.x = minX;
      ball.vx = Math.abs(ball.vx) * wallBounceMult;
      bounced = true;
      normalX = 1;
      normalY = 0;
    } else if (ball.x > maxX) {
      ball.x = maxX;
      ball.vx = -Math.abs(ball.vx) * wallBounceMult;
      bounced = true;
      normalX = -1;
      normalY = 0;
    }

    if (ball.y < minY) {
      ball.y = minY;
      ball.vy = Math.abs(ball.vy) * wallBounceMult;
      bounced = true;
      normalX = 0;
      normalY = 1;
    } else if (ball.y > maxY) {
      ball.y = maxY;
      ball.vy = -Math.abs(ball.vy) * wallBounceMult;
      bounced = true;
      normalX = 0;
      normalY = -1;
    }

    if (bounced) {
      const rules = this.getArenaRules();
      if (rules.wallThorns) {
        ball.hp = Math.max(0, ball.hp - rules.wallThorns);
      }
      this.effects.push({
        type: "spark",
        x: ball.x,
        y: ball.y,
        color: 0xd8dee9,
        life: 0.2
      });
      return { x: normalX, y: normalY };
    }
    return null;
  }

  resolveBallCollision(a, b, pendingDamage, pendingHealing, pendingSpawns) {
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

    const pairKey = this.getPairKey(a.id, b.id);
    const canDealDamage = this.canDealCollisionDamage(pairKey);
    const collisionDamage = calculateCollisionDamage({
      a,
      b,
      impact,
      normalX: nx,
      normalY: ny,
      canDealDamage
    });
    const aOutgoingBonus = 1 + (a.outgoingBonus ?? 0);
    const bOutgoingBonus = 1 + (b.outgoingBonus ?? 0);
    collisionDamage.damageToB *= aOutgoingBonus;
    collisionDamage.damageToA *= bOutgoingBonus;
    collisionDamage.healingForA *= aOutgoingBonus;
    collisionDamage.healingForB *= bOutgoingBonus;

    if (canDealDamage && (collisionDamage.damageToA > 0 || collisionDamage.damageToB > 0)) {
      this.lastDamageTimesByPair.set(pairKey, this.simTime);
      pendingDamage.set(a.id, (pendingDamage.get(a.id) ?? 0) + collisionDamage.damageToA + collisionDamage.thornsToA);
      pendingDamage.set(b.id, (pendingDamage.get(b.id) ?? 0) + collisionDamage.damageToB + collisionDamage.thornsToB);
      pendingHealing.set(a.id, (pendingHealing.get(a.id) ?? 0) + collisionDamage.healingForA);
      pendingHealing.set(b.id, (pendingHealing.get(b.id) ?? 0) + collisionDamage.healingForB);
    }

    this.effects.push({
      type: "spark",
      x: (a.x + b.x) * 0.5,
      y: (a.y + b.y) * 0.5,
      color: 0xffffff,
      life: clamp(0.14 + impact / 900, 0.14, 0.36)
    });
    this.tryBossShockwave(a, b, nx, ny);
    this.tryBossShockwave(b, a, -nx, -ny);
    this.trySpawnSplitChildren(a, b, impact, nx, ny, pendingSpawns);
    this.trySpawnSplitChildren(b, a, impact, -nx, -ny, pendingSpawns);

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

  tryBossShockwave(source, target, normalX, normalY) {
    if (source.classKey !== "boss") {
      return;
    }
    if (source.abilityState.bossShockwaveCooldown > 0) {
      return;
    }
    const def = CLASS_DEFS.boss;
    const interval = def.shockwaveIntervalSteps ?? 8;
    if ((this.stepCounter + source.id + target.id) % interval !== 0) {
      return;
    }

    const push = def.shockwavePush ?? 75;
    const recoil = def.shockwaveRecoil ?? 0.2;
    target.vx += normalX * push;
    target.vy += normalY * push;
    source.vx -= normalX * push * recoil;
    source.vy -= normalY * push * recoil;
    source.abilityState.bossShockwaveCooldown = def.shockwaveCooldown ?? 0.5;

    this.effects.push({
      type: "ring",
      x: source.x,
      y: source.y,
      color: 0xffc36b,
      life: 0.25,
      radius: source.r + 6
    });
    if (this.stepCounter % 24 === 0) {
      this.logCombatEvent(`Boss shockwave from #${source.id}`);
    }
  }

  trySpawnSplitChildren(source, target, impact, normalX, normalY, pendingSpawns) {
    if (source.classKey !== "splitter" || !source.alive) {
      return;
    }
    const def = CLASS_DEFS.splitter;
    if (this.balls.length + pendingSpawns.length >= MAX_TOTAL_BALLS) {
      return;
    }
    if (source.abilityState.splitCooldownLeft > 0) {
      return;
    }
    if (source.abilityState.splitDepth >= def.maxSplitDepth) {
      return;
    }
    if (impact < def.splitImpactThreshold) {
      return;
    }

    const tangentX = -normalY;
    const tangentY = normalX;
    const childRadius = Math.max(8, Math.round(source.r * def.childRadiusMult));
    const childHp = Math.max(1, source.hp * def.childHpRatio);
    const baseSpeed = Math.max(180, Math.hypot(source.vx, source.vy) * def.childSpeedMult);
    const spawnOffset = childRadius + 3;

    source.alive = false;
    source.hp = 0;

    for (const direction of [-1, 1]) {
      const cx = source.x + tangentX * spawnOffset * direction;
      const cy = source.y + tangentY * spawnOffset * direction;
      const cvx = source.vx + tangentX * baseSpeed * 0.45 * direction + normalX * 42;
      const cvy = source.vy + tangentY * baseSpeed * 0.45 * direction + normalY * 42;
      const child = createBall(this.nextBallId, "splitter", cx, cy, cvx, cvy);
      child.r = childRadius;
      child.mass = Math.max(0.42, source.mass * 0.62);
      child.maxHp = childHp;
      child.hp = childHp;
      child.abilityState.splitDepth = source.abilityState.splitDepth + 1;
      child.abilityState.splitCooldownLeft = def.splitCooldown;
      this.applyUpgradesToBall(child);
      pendingSpawns.push(child);
      this.nextBallId += 1;
    }

    this.effects.push({
      type: "ring",
      x: source.x,
      y: source.y,
      color: 0x5eead4,
      life: 0.35,
      radius: source.r + 4
    });
    this.logCombatEvent(`Splitter #${source.id} split on impact`);
    this.effects.push({
      type: "spark",
      x: (source.x + target.x) * 0.5,
      y: (source.y + target.y) * 0.5,
      color: 0x99f6e4,
      life: 0.25
    });
  }

  trySpawnSplitChildrenFromWall(source, normalX, normalY, pendingSpawns) {
    if (source.classKey !== "splitter" || !source.alive) {
      return;
    }
    const def = CLASS_DEFS.splitter;
    if (source.abilityState.splitCooldownLeft > 0) {
      return;
    }
    if (source.abilityState.splitDepth >= def.maxSplitDepth) {
      return;
    }
    if (this.balls.length + pendingSpawns.length >= MAX_TOTAL_BALLS) {
      return;
    }

    const tangentX = -normalY;
    const tangentY = normalX;
    const childRadius = Math.max(8, Math.round(source.r * def.childRadiusMult));
    const childHp = Math.max(1, source.hp * def.childHpRatio);
    const baseSpeed = Math.max(170, Math.hypot(source.vx, source.vy) * def.childSpeedMult);
    const spawnOffset = childRadius + 3;

    source.alive = false;
    source.hp = 0;

    for (const direction of [-1, 1]) {
      const cx = source.x + tangentX * spawnOffset * direction;
      const cy = source.y + tangentY * spawnOffset * direction;
      const cvx = source.vx + tangentX * baseSpeed * 0.35 * direction + normalX * 34;
      const cvy = source.vy + tangentY * baseSpeed * 0.35 * direction + normalY * 34;
      const child = createBall(this.nextBallId, "splitter", cx, cy, cvx, cvy);
      child.r = childRadius;
      child.mass = Math.max(0.42, source.mass * 0.62);
      child.maxHp = childHp;
      child.hp = childHp;
      child.abilityState.splitDepth = source.abilityState.splitDepth + 1;
      child.abilityState.splitCooldownLeft = def.splitCooldown;
      this.applyUpgradesToBall(child);
      pendingSpawns.push(child);
      this.nextBallId += 1;
    }

    this.effects.push({
      type: "ring",
      x: source.x,
      y: source.y,
      color: 0x99f6e4,
      life: 0.3,
      radius: source.r + 5
    });
    this.logCombatEvent(`Splitter #${source.id} split on wall`);
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
    if (speed < 200 || (this.stepCounter + ball.id) % 3 !== 0) {
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
    const glow = Phaser.Display.Color.GetColor(
      clamp(shade.red + 20, 0, 255),
      clamp(shade.green + 20, 0, 255),
      clamp(shade.blue + 20, 0, 255)
    );

    if (ball.classKey === "boss") {
      this.graphics.lineStyle(3, 0xffc36b, 0.9);
      this.graphics.strokeCircle(ball.x, ball.y, r + 6);
      this.graphics.lineStyle(1, 0x201104, 0.6);
      this.graphics.strokeCircle(ball.x, ball.y, r + 10);
    }

    const points = this.getPixelMask(r);
    for (const [px, py] of points) {
      let color = ball.color;
      if (px + py < -r * 0.25) {
        color = highlight;
      } else if (px + py > r * 0.4) {
        color = shadow;
      } else if (Math.abs(px) + Math.abs(py) < r * 0.4) {
        color = glow;
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
    this.graphics.fillStyle(0xf8fafc, 0.55);
    this.graphics.fillRect(ball.x - Math.floor(r * 0.45), ball.y - Math.floor(r * 0.45), 2, 2);
  }

  drawClassArt(ball) {
    const cx = Math.round(ball.x);
    const cy = Math.round(ball.y);
    const glyph = this.getClassGlyph(ball.classKey);
    for (const rect of glyph.dark) {
      this.graphics.fillStyle(0x0b0f18, 0.95);
      this.graphics.fillRect(cx + rect[0], cy + rect[1], rect[2], rect[3]);
    }
    for (const rect of glyph.light) {
      this.graphics.fillStyle(0xbfd4da, 0.9);
      this.graphics.fillRect(cx + rect[0], cy + rect[1], rect[2], rect[3]);
    }
  }

  drawClassEquipment(ball) {
    const t = this.stepCounter * 0.09 + ball.id * 0.17;
    const swing = Math.sin(t);
    const facing = Math.atan2(ball.vy, ball.vx || 0.0001);
    const cx = ball.x;
    const cy = ball.y;

    if (ball.classKey === "swordsman") {
      const bladeLen = ball.r + 10;
      const swingAngle = facing + swing * 0.55;
      const tipX = cx + Math.cos(swingAngle) * bladeLen;
      const tipY = cy + Math.sin(swingAngle) * bladeLen;
      this.graphics.lineStyle(4, 0xcbd5e1, 0.95);
      this.graphics.strokeLineShape(new Phaser.Geom.Line(cx, cy, tipX, tipY));
      this.graphics.lineStyle(2, 0xf97316, 0.9);
      this.graphics.strokeLineShape(new Phaser.Geom.Line(cx, cy, cx + Math.cos(swingAngle - 0.25) * (bladeLen - 4), cy + Math.sin(swingAngle - 0.25) * (bladeLen - 4)));
      return;
    }

    if (ball.classKey === "archer") {
      const bowR = Math.max(8, ball.r - 4);
      const bx = cx + Math.cos(facing) * 2;
      const by = cy + Math.sin(facing) * 2;
      this.graphics.lineStyle(2, 0x22c55e, 0.95);
      this.graphics.strokeCircle(bx, by, bowR);
      const arrowLen = bowR + 8;
      const ax = bx + Math.cos(facing) * arrowLen;
      const ay = by + Math.sin(facing) * arrowLen;
      this.graphics.lineStyle(2, 0xf8fafc, 0.95);
      this.graphics.strokeLineShape(new Phaser.Geom.Line(bx, by, ax, ay));
      this.graphics.fillStyle(0xf8fafc, 0.95);
      this.graphics.fillRect(ax - 2, ay - 2, 4, 4);
      return;
    }

    if (ball.classKey === "tank") {
      this.graphics.lineStyle(3, 0x93c5fd, 0.9);
      this.graphics.strokeRect(cx - 7, cy - 7, 14, 14);
    } else if (ball.classKey === "striker") {
      const punchX = cx + Math.cos(facing) * (ball.r + 3);
      const punchY = cy + Math.sin(facing) * (ball.r + 3);
      this.graphics.fillStyle(0xfb7185, 0.95);
      this.graphics.fillRect(punchX - 3, punchY - 3, 6, 6);
    } else if (ball.classKey === "medic") {
      this.graphics.fillStyle(0x86efac, 0.95);
      this.graphics.fillRect(cx - 1, cy - 6, 2, 12);
      this.graphics.fillRect(cx - 6, cy - 1, 12, 2);
    } else if (ball.classKey === "trickster") {
      this.graphics.lineStyle(2, 0xfacc15, 0.9);
      this.graphics.strokeLineShape(new Phaser.Geom.Line(cx - 7, cy + 6, cx + 7, cy - 6));
      this.graphics.strokeLineShape(new Phaser.Geom.Line(cx - 7, cy - 6, cx + 7, cy + 6));
    } else if (ball.classKey === "sniper") {
      this.graphics.lineStyle(2, 0xe9d5ff, 0.9);
      this.graphics.strokeCircle(cx, cy, 6);
      this.graphics.fillStyle(0xe9d5ff, 0.95);
      this.graphics.fillRect(cx + 6, cy - 1, 5, 2);
    } else if (ball.classKey === "vampire") {
      this.graphics.fillStyle(0xfda4af, 0.9);
      this.graphics.fillRect(cx - 4, cy + 3, 2, 4);
      this.graphics.fillRect(cx + 2, cy + 3, 2, 4);
    } else if (ball.classKey === "bulwark") {
      this.graphics.lineStyle(3, 0x99f6e4, 0.85);
      this.graphics.strokeCircle(cx, cy, ball.r - 2);
    } else if (ball.classKey === "splitter") {
      this.graphics.lineStyle(2, 0x5eead4, 0.9);
      this.graphics.strokeLineShape(new Phaser.Geom.Line(cx - 6, cy - 6, cx + 6, cy + 6));
      this.graphics.strokeLineShape(new Phaser.Geom.Line(cx + 6, cy - 6, cx - 6, cy + 6));
    } else if (ball.classKey === "boss") {
      this.graphics.fillStyle(0xfbbf24, 0.95);
      this.graphics.fillRect(cx - 7, cy - ball.r - 6, 14, 3);
      this.graphics.fillRect(cx - 5, cy - ball.r - 9, 2, 3);
      this.graphics.fillRect(cx - 1, cy - ball.r - 10, 2, 4);
      this.graphics.fillRect(cx + 3, cy - ball.r - 9, 2, 3);
    }
  }

  getClassGlyph(classKey) {
    if (this.classGlyphCache.has(classKey)) {
      return this.classGlyphCache.get(classKey);
    }
    const glyph = { dark: [], light: [] };
    if (classKey === "tank") {
      glyph.dark.push([-4, -4, 8, 8], [-8, -1, 16, 2]);
    } else if (classKey === "striker") {
      glyph.dark.push([2, -7, 2, 6], [-4, -1, 10, 2], [-8, 5, 2, 2]);
    } else if (classKey === "medic") {
      glyph.dark.push([-1, -6, 2, 12], [-6, -1, 12, 2]);
    } else if (classKey === "trickster") {
      glyph.dark.push([-6, 2, 12, 2], [-2, -6, 2, 8], [2, -6, 2, 8]);
    } else if (classKey === "sniper") {
      glyph.dark.push([-7, -1, 14, 2], [6, -2, 2, 4]);
    } else if (classKey === "vampire") {
      glyph.dark.push([-5, -4, 3, 8], [2, -4, 3, 8], [-2, 2, 4, 4]);
    } else if (classKey === "bulwark") {
      glyph.dark.push([-6, -5, 12, 10]);
      glyph.light.push([-1, -3, 2, 6]);
    } else if (classKey === "splitter") {
      glyph.dark.push([-7, -1, 14, 2], [-1, -7, 2, 14], [-5, -5, 2, 2], [3, 3, 2, 2]);
    } else if (classKey === "swordsman") {
      glyph.dark.push([-1, -8, 2, 16], [-5, -6, 10, 2], [-3, 6, 6, 2]);
    } else if (classKey === "archer") {
      glyph.dark.push([-6, -5, 2, 10], [4, -5, 2, 10], [-4, -6, 8, 2], [-4, 4, 8, 2]);
      glyph.light.push([-1, -1, 2, 2]);
    } else if (classKey === "boss") {
      glyph.dark.push([-10, 2, 20, 3], [-8, -6, 16, 2], [-9, -9, 3, 3], [-1, -10, 2, 4], [6, -9, 3, 3]);
    }
    this.classGlyphCache.set(classKey, glyph);
    return glyph;
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
      } else if (fx.type === "slash") {
        const sweep = (fx.radius ?? 64) * (1 - alpha * 0.5);
        this.graphics.lineStyle(3, fx.color, alpha);
        this.graphics.strokeCircle(fx.x, fx.y, sweep * 0.55);
        this.graphics.lineStyle(2, fx.color, alpha * 0.85);
        this.graphics.strokeLineShape(new Phaser.Geom.Line(fx.x - sweep * 0.8, fx.y + 2, fx.x + sweep * 0.8, fx.y - 2));
      } else if (fx.type === "arrow") {
        this.graphics.lineStyle(2, fx.color, alpha);
        this.graphics.strokeLineShape(new Phaser.Geom.Line(fx.x, fx.y, fx.tx, fx.ty));
        this.graphics.fillStyle(fx.color, alpha);
        this.graphics.fillRect(fx.tx - 2, fx.ty - 2, 4, 4);
      } else if (fx.type === "plus") {
        this.graphics.fillStyle(fx.color, alpha);
        this.graphics.fillRect(fx.x - 1, fx.y - 4, 2, 8);
        this.graphics.fillRect(fx.x - 4, fx.y - 1, 8, 2);
      }
    }
  }

  drawAbilityCooldown(ball) {
    let ratio = null;
    let color = 0x8b9bb4;
    if (ball.classKey === "trickster") {
      const cd = CLASS_DEFS.trickster.dashCooldown ?? 1;
      ratio = clamp((ball.abilityState.tricksterDashTimer ?? 0) / cd, 0, 1);
      color = 0xf0b429;
    } else if (ball.classKey === "swordsman") {
      const cd = CLASS_DEFS.swordsman.slashCooldown ?? 1;
      ratio = clamp((ball.abilityState.swordsmanSlashCooldown ?? 0) / cd, 0, 1);
      color = 0xfb923c;
    } else if (ball.classKey === "archer") {
      const cd = CLASS_DEFS.archer.shotCooldown ?? 1;
      ratio = clamp((ball.abilityState.archerShotCooldown ?? 0) / cd, 0, 1);
      color = 0x86efac;
    } else if (ball.classKey === "bulwark") {
      const cd = CLASS_DEFS.bulwark.shieldCooldown ?? 1;
      if ((ball.abilityState.bulwarkShieldTimeLeft ?? 0) > 0) {
        ratio = 0;
        color = 0x9be7ff;
      } else {
        ratio = clamp((ball.abilityState.bulwarkShieldCooldown ?? 0) / cd, 0, 1);
        color = 0x7db7ca;
      }
    } else if (ball.classKey === "boss") {
      const def = CLASS_DEFS.boss;
      const shockwaveRatio = clamp((ball.abilityState.bossShockwaveCooldown ?? 0) / (def.shockwaveCooldown ?? 0.5), 0, 1);
      const roarRatio = clamp((ball.abilityState.bossRoarCooldown ?? 0) / (def.roarCooldown ?? 1.1), 0, 1);
      const chargeRatio = clamp((ball.abilityState.bossChargeCooldown ?? 0) / (def.chargeCooldown ?? 1.7), 0, 1);
      ratio = Math.max(shockwaveRatio, roarRatio, chargeRatio);
      color = 0xffc36b;
    } else if (ball.mutationKey && MUTATION_DEFS[ball.mutationKey]) {
      const mutation = MUTATION_DEFS[ball.mutationKey];
      if (mutation.ability === "dash") {
        ratio = clamp((ball.abilityState.mutationCooldown ?? 0) / (mutation.cooldown ?? 3.8), 0, 1);
        color = 0xfbbf24;
      } else if (mutation.ability === "sword") {
        ratio = clamp((ball.abilityState.swordsmanSlashCooldown ?? 0) / (mutation.slashCooldown ?? 1.75), 0, 1);
        color = 0xfbbf24;
      } else if (mutation.ability === "archer") {
        ratio = clamp((ball.abilityState.archerShotCooldown ?? 0) / (mutation.shotCooldown ?? 1.35), 0, 1);
        color = 0xfde68a;
      }
    }
    if (ratio == null) {
      return;
    }
    const w = Math.max(10, Math.floor(ball.r * 1.1));
    const h = 3;
    const x = ball.x - w / 2;
    const y = ball.y + ball.r + 8;
    this.graphics.fillStyle(0x0f172a, 0.9);
    this.graphics.fillRect(x, y, w, h);
    this.graphics.fillStyle(color, 0.95);
    this.graphics.fillRect(x + 1, y + 1, (w - 2) * (1 - ratio), h - 2);
  }

  drawArenaOverlay() {
    const rules = this.getArenaRules();
    if (rules.sanctumRadius) {
      this.graphics.lineStyle(2, 0x74f0b2, 0.5);
      this.graphics.strokeCircle(this.setup.arenaWidth * 0.5, this.setup.arenaHeight * 0.5, rules.sanctumRadius);
    }
    if (rules.hazardTick) {
      const row = Math.floor(this.stepCounter / rules.hazardTick);
      const hx = (row * 41) % this.setup.arenaWidth;
      const hy = (row * 37) % this.setup.arenaHeight;
      this.graphics.lineStyle(1, 0xff7a7a, 0.45);
      this.graphics.strokeLineShape(new Phaser.Geom.Line(hx, 0, hx, this.setup.arenaHeight));
      this.graphics.strokeLineShape(new Phaser.Geom.Line(0, hy, this.setup.arenaWidth, hy));
    }
  }

  renderScene() {
    this.graphics.clear();

    this.graphics.fillStyle(0x111826, 1);
    this.graphics.fillRect(0, 0, this.setup.arenaWidth, this.setup.arenaHeight);
    this.graphics.fillStyle(0x1b2638, 1);
    for (let y = 0; y < this.setup.arenaHeight; y += 28) {
      for (let x = (y / 28) % 2 === 0 ? 0 : 14; x < this.setup.arenaWidth; x += 28) {
        this.graphics.fillRect(x, y, 14, 14);
      }
    }
    this.graphics.fillStyle(0x0a1322, 0.18);
    for (let x = 0; x < this.setup.arenaWidth; x += 52) {
      this.graphics.fillRect(x, 0, 2, this.setup.arenaHeight);
    }
    for (let y = 0; y < this.setup.arenaHeight; y += 52) {
      this.graphics.fillRect(0, y, this.setup.arenaWidth, 2);
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
    this.drawArenaOverlay();

    for (const ball of this.balls) {
      this.drawPixelBall(ball);
      this.drawClassArt(ball);
      this.drawClassEquipment(ball);

      if (ball.classKey === "bulwark" && ball.abilityState.bulwarkShieldTimeLeft > 0) {
        this.graphics.lineStyle(2, 0xa8f0ff, 0.8);
        this.graphics.strokeCircle(ball.x, ball.y, ball.r + 4);
      }
      if (ball.classKey === "boss") {
        this.graphics.lineStyle(1, 0xfff1ce, 0.45);
        this.graphics.strokeCircle(ball.x, ball.y, ball.r + 12);
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
      this.drawAbilityCooldown(ball);
    }

    if (this.balls.length === 0 && !this.roundFinished) {
      this.graphics.fillStyle(0x050912, 0.74);
      this.graphics.fillRect(this.setup.arenaWidth / 2 - 200, this.setup.arenaHeight / 2 - 32, 400, 64);
      this.graphics.lineStyle(2, 0x8fa9cf, 0.95);
      this.graphics.strokeRect(this.setup.arenaWidth / 2 - 200, this.setup.arenaHeight / 2 - 32, 400, 64);
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
    } else if (!this.roundActive) {
      this.winnerText.setVisible(true);
      this.winnerText.setText("PRESS START ROUND");
      this.winnerText.setColor("#cbd5e1");
      this.winnerText.setPosition(this.setup.arenaWidth / 2, this.setup.arenaHeight / 2);
    } else {
      this.winnerText.setVisible(false);
    }

    const setupSummary = CLASS_KEYS.map((classKey) => `${CLASS_DEFS[classKey].label}:${this.setup.classCounts[classKey]}`).join(
      " "
    );
    const aliveCounts = this.getCurrentClassCounts();
    const aliveSummary = CLASS_KEYS.map((classKey) => `${CLASS_DEFS[classKey].label}:${aliveCounts[classKey]}`).join(
      " "
    );
    const topPrize = [...CLASS_KEYS]
      .map((classKey) => ({ classKey, prize: this.prizeLedger[classKey] }))
      .sort((a, b) => b.prize - a.prize || CLASS_KEYS.indexOf(a.classKey) - CLASS_KEYS.indexOf(b.classKey))[0];
    const tournamentProgress = this.tournament.active
      ? `  tournament:${this.tournament.currentMatchIndex + 1}/${this.tournament.matches.length}`
      : "";

    this.hudText.setText(
      `mode:${this.getModeLabel(this.mode)} (${this.mode})  step:${this.stepCounter}  alive:${this.balls.length}  size:${this.setup.arenaWidth}x${this.setup.arenaHeight}${tournamentProgress}\nsetup:${setupSummary}\nalive:${aliveSummary}\nleader:${
        CLASS_DEFS[topPrize.classKey].label
      } ${topPrize.prize}\nstate:${this.roundActive ? "running" : this.roundFinished ? "finished" : "ready"}  speed:${this.speedMultiplier}x  fast-forward:${
        this.fastForward ? "ON" : "OFF"
      }  paused:${this.paused ? "ON" : "OFF"}${
        this.roundFinished ? `\nwinner:${this.winnerClassKey ? CLASS_DEFS[this.winnerClassKey].label : "Draw"}` : ""
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
