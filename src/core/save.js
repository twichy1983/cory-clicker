// Turning the state into a save string and back. Loaded data is checked field by field,
// so a broken or hand-edited save can't crash the game.
import { INDUSTRIES } from "./data/industries.js"
import { UPG_BY_ID } from "./data/upgrades.js"
import { ACH_BY_ID } from "./achievements.js"
import { JOB_BY_ID } from "./jobs.js"
import { newState, MAX_COMPANY_NAME } from "./state.js"

// Base64 of the JSON (UTF-8 safe, so company names with emoji survive)
export function encodeSave(state) {
  const bytes = new TextEncoder().encode(JSON.stringify(state))
  let bin = ""
  for (const byte of bytes) bin += String.fromCharCode(byte)
  return btoa(bin)
}

export function decodeSave(str) {
  const bin = atob(str.trim())
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

const count = (value) => Math.max(0, Math.floor(+value || 0))

// Builds a valid state from loaded data, keeping only fields that exist and have the right type.
// Throws if the data isn't a save at all or its key numbers are corrupt.
export function sanitize(data, now) {
  if (!data || typeof data !== "object") throw new Error("Not a save")
  const base = newState(now)
  for (const key in base) if (key in data && typeof data[key] === typeof base[key]) base[key] = data[key]
  base.owned = INDUSTRIES.map((_, i) => count((data.owned || [])[i]))
  base.timerLobbyists = count(base.timerLobbyists)
  base.penaltyLobbyists = count(base.penaltyLobbyists)
  base.upgrades = {}
  for (const id in data.upgrades || {}) if (UPG_BY_ID[id]) base.upgrades[id] = true
  base.achievements = {}
  for (const id in data.achievements || {})
    if (ACH_BY_ID[id] && isFinite(data.achievements[id])) base.achievements[id] = +data.achievements[id]
  base.jobs = {}
  base.jobWins = {}
  for (const id in data.jobs || {}) if (JOB_BY_ID[id] && isFinite(data.jobs[id])) base.jobs[id] = +data.jobs[id]
  for (const id in data.jobWins || {})
    if (JOB_BY_ID[id] && isFinite(data.jobWins[id])) base.jobWins[id] = count(data.jobWins[id])
  // Saves from before the jobs list had a single waste-dumping cooldown
  if (isFinite(data.jobReadyAt) && data.jobReadyAt > 0 && !base.jobs.waste) base.jobs.waste = +data.jobReadyAt
  base.company = [...base.company.trim()].slice(0, MAX_COMPANY_NAME).join("") || newState(now).company
  if (!isFinite(base.playTime) || base.playTime < 0) base.playTime = 0
  if (!isFinite(base.startedAt) || base.startedAt > now) base.startedAt = now
  for (const key of [
    "clicks",
    "clickEarned",
    "allTimeEarned",
    "finesPaid",
    "rebatesCollected",
    "bankruptcies",
    "cyclesSurvived"
  ])
    if (!isFinite(base[key]) || base[key] < 0) base[key] = 0
  for (const key of ["dollars", "runEarned", "allTimeEarned", "fines", "deadline", "lastTick"])
    if (!isFinite(base[key])) throw new Error("Corrupt save")
  return base
}
