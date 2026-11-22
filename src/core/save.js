// Turning the state into a save string and back. Loaded data is checked field by field,
// so a broken or hand-edited save can't crash the game.
import { INDUSTRIES } from "./data/industries.js";
import { UPG_BY_ID } from "./data/upgrades.js";
import { ACH_BY_ID } from "./achievements.js";
import { JOB_BY_ID } from "./jobs.js";
import { newState, MAX_COMPANY_NAME } from "./state.js";

// Base64 of the JSON (UTF-8 safe, so company names with emoji survive)
export function encodeSave(S) {
  const bytes = new TextEncoder().encode(JSON.stringify(S));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function decodeSave(str) {
  const bin = atob(str.trim());
  const bytes = Uint8Array.from(bin, ch => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

const count = v => Math.max(0, Math.floor(+v || 0));

// Builds a valid state from loaded data, keeping only fields that exist and have the right type.
// Throws if the data isn't a save at all or its key numbers are corrupt.
export function sanitize(o, now) {
  if (!o || typeof o !== "object") throw new Error("Not a save");
  const base = newState(now);
  for (const k in base) if (k in o && typeof o[k] === typeof base[k]) base[k] = o[k];
  base.owned = INDUSTRIES.map((_, i) => count((o.owned || [])[i]));
  base.timerLobbyists = count(base.timerLobbyists);
  base.penaltyLobbyists = count(base.penaltyLobbyists);
  base.upgrades = {};
  for (const id in (o.upgrades || {})) if (UPG_BY_ID[id]) base.upgrades[id] = true;
  base.achievements = {};
  for (const id in (o.achievements || {})) if (ACH_BY_ID[id] && isFinite(o.achievements[id])) base.achievements[id] = +o.achievements[id];
  base.jobs = {}; base.jobWins = {};
  for (const id in (o.jobs || {})) if (JOB_BY_ID[id] && isFinite(o.jobs[id])) base.jobs[id] = +o.jobs[id];
  for (const id in (o.jobWins || {})) if (JOB_BY_ID[id] && isFinite(o.jobWins[id])) base.jobWins[id] = count(o.jobWins[id]);
  // Saves from before the jobs list had a single waste-dumping cooldown
  if (isFinite(o.jobReadyAt) && o.jobReadyAt > 0 && !base.jobs.waste) base.jobs.waste = +o.jobReadyAt;
  base.company = [...base.company.trim()].slice(0, MAX_COMPANY_NAME).join("") || newState(now).company;
  if (!isFinite(base.playTime) || base.playTime < 0) base.playTime = 0;
  if (!isFinite(base.startedAt) || base.startedAt > now) base.startedAt = now;
  for (const k of ["clicks", "clickEarned", "allTimeEarned", "finesPaid", "rebatesCollected", "bankruptcies", "cyclesSurvived"])
    if (!isFinite(base[k]) || base[k] < 0) base[k] = 0;
  for (const k of ["dollars", "runEarned", "allTimeEarned", "fines", "deadline", "lastTick"]) if (!isFinite(base[k])) throw new Error("Corrupt save");
  return base;
}
