import { CLASS_DEFS, CLASS_KEYS, DEFAULT_SETUP, POSITION_ROUNDING } from "./constants.js";

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const round6 = (value) => Math.round(value * POSITION_ROUNDING) / POSITION_ROUNDING;
export const classColorHex = (classKey) =>
  `#${CLASS_DEFS[classKey].color.toString(16).padStart(6, "0")}`;

export function sanitizeCount(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return 0;
  }
  return clamp(parsed, 0, 90);
}

export function sanitizeDimension(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return fallback;
  }
  return clamp(parsed, 420, 2200);
}

export function capClassCounts(classCounts, maxTotal, classOrder = CLASS_KEYS) {
  const capped = {};
  let total = 0;
  for (const classKey of classOrder) {
    const count = sanitizeCount(classCounts?.[classKey]);
    capped[classKey] = count;
    total += count;
  }

  if (total <= maxTotal) {
    return {
      classCounts: capped,
      total,
      wasCapped: false
    };
  }

  const trimmed = { ...capped };
  const sortedKeys = [...classOrder].sort((a, b) => trimmed[b] - trimmed[a] || a.localeCompare(b));
  let overBy = total - maxTotal;

  // Remove from the largest pools first to preserve distribution.
  for (const classKey of sortedKeys) {
    if (overBy <= 0) {
      break;
    }
    const reduction = Math.min(trimmed[classKey], overBy);
    trimmed[classKey] -= reduction;
    overBy -= reduction;
  }

  const nextTotal = Object.values(trimmed).reduce((sum, count) => sum + count, 0);
  return {
    classCounts: trimmed,
    total: nextTotal,
    wasCapped: true
  };
}

function safeEncodeBase64(value) {
  return btoa(unescape(encodeURIComponent(value))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function safeDecodeBase64(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return decodeURIComponent(escape(atob(normalized + padding)));
}

export function encodeSetupToken(setup) {
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

export function decodeSetupToken(token) {
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

export function loadSetupFromUrl() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get("setup");
  if (!token) {
    return null;
  }
  return decodeSetupToken(token);
}

export function loadReplayTokenFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get("replay");
}

export function encodeReplayToken(payload) {
  return safeEncodeBase64(JSON.stringify(payload));
}

export function decodeReplayToken(token) {
  try {
    const parsed = JSON.parse(safeDecodeBase64(token));
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
