// The game's rules: income, prices, purchases, fines, deadlines and bankruptcy.
// Every function takes the `state` and, where needed, the `derived` values and the current time.
// Nothing here touches the page: functions return what happened and the UI decides how to show it.
import { HOUR, BASE_TIMER, BASE_FINE_RATE, COST_GROWTH, TIMER_LOBBY, PENALTY_LOBBY } from "./constants.js"
import { SCANDAL_MULT, DOUBLER_MULT, GLOBAL_MULT, ACHIEVEMENT_BONUS } from "./constants.js"
import { INDUSTRIES } from "./data/industries.js"
import { UPGRADES, UPG_BY_ID } from "./data/upgrades.js"
import { freshRun } from "./state.js"
import { rules } from "./rules.js"

/** @typedef {import("./state.js").GameState} GameState */

/* ---------- derived values (recomputed whenever state changes) ---------- */

/**
 * Values worked out from the state (`game.derived`). Never saved; call refreshDerived() after changing ownership.
 * @typedef {object} Derived
 * @property {number} cps  total income in dollars per second
 * @property {number[]} indMult  income multiplier of each industry (its scandals and doublers, times allMult)
 * @property {number} allMult  company-wide income multiplier (company-wide upgrades and achievements)
 * @property {number} globalMult  the part of allMult from company-wide upgrades
 * @property {number} achievementMult  the part of allMult from achievements (1.25 = +25%)
 * @property {number[]} indCps  income per second of each industry
 * @property {number} scandals  scandals committed
 * @property {number} clickPct  share of income added to each click (0.01 = 1%)
 * @property {number} clickPower  dollars per click
 * @property {number} fineMult  fine multiplier (scandals raise it, penalty lobbyists lower it)
 */

/**
 * Works out income, click power and the fine multiplier from what the player owns.
 * @param {GameState} state
 * @returns {Derived}
 */
export function derive(state) {
  const scandalsIn = INDUSTRIES.map(() => 0),
    doublersIn = INDUSTRIES.map(() => 0)
  let clickX = 1,
    clickPct = 0,
    scandals = 0,
    globals = 0
  for (const id in state.upgrades) {
    const upgrade = UPG_BY_ID[id]
    if (!upgrade) continue
    if (upgrade.type === "scandal") {
      scandalsIn[upgrade.ind]++
      scandals++
    } else if (upgrade.type === "mult") doublersIn[upgrade.ind]++
    else if (upgrade.type === "global") globals++
    else if (upgrade.type === "click") {
      if (upgrade.kind === "x2") clickX *= 2
      else clickPct += 0.01
    }
  }
  // Like most clickers, upgrades multiply rather than add, so income grows exponentially as you buy them.
  const globalMult = Math.pow(GLOBAL_MULT, globals)
  const achievementMult = 1 + ACHIEVEMENT_BONUS * Object.keys(state.achievements || {}).length
  const allMult = globalMult * achievementMult
  const indMult = INDUSTRIES.map(
    (_, i) => Math.pow(SCANDAL_MULT, scandalsIn[i]) * Math.pow(DOUBLER_MULT, doublersIn[i]) * allMult
  )
  const indCps = INDUSTRIES.map((ind, i) => state.owned[i] * ind.cps * indMult[i])
  const cps = indCps.reduce((sum, value) => sum + value, 0)
  return {
    cps,
    indMult,
    allMult,
    globalMult,
    achievementMult,
    indCps,
    scandals,
    clickPct,
    clickPower: clickX + cps * clickPct,
    fineMult: 1 + 0.01 * scandals - 0.01 * state.penaltyLobbyists
  }
}

/* ---------- prices ---------- */

export const maxTimer = (state) => BASE_TIMER + state.timerLobbyists * HOUR

/**
 * Price of the next `count` of industry `i`
 * @param {GameState} state
 */
export function buildingCost(state, i, count) {
  if (rules.freePurchases) return 0
  const price = INDUSTRIES[i].base * Math.pow(COST_GROWTH, state.owned[i])
  return Math.ceil((price * (Math.pow(COST_GROWTH, count) - 1)) / (COST_GROWTH - 1))
}

const lobbyCost = (cfg, count) => (rules.freePurchases ? 0 : Math.ceil(cfg.base * Math.pow(cfg.growth, count)))
/** @param {GameState} state */
export const timerLobbyCost = (state) => lobbyCost(TIMER_LOBBY, state.timerLobbyists)
/** @param {GameState} state */
export const penaltyLobbyCost = (state) => lobbyCost(PENALTY_LOBBY, state.penaltyLobbyists)
/**
 * Firing costs double what the most recently hired lobbyist of that type cost to hire
 * @param {GameState} state
 */
export const timerFireCost = (state) => 2 * lobbyCost(TIMER_LOBBY, Math.max(0, state.timerLobbyists - 1))
/** @param {GameState} state */
export const penaltyFireCost = (state) => 2 * lobbyCost(PENALTY_LOBBY, Math.max(0, state.penaltyLobbyists - 1))

export const upgradeCost = (upgrade) => (rules.freePurchases ? 0 : upgrade.cost)

/** @param {GameState} state */
function upgradeUnlocked(state, upgrade) {
  if (state.upgrades[upgrade.id]) return false
  if (upgrade.type === "click" || upgrade.type === "global")
    return rules.freePurchases || state.runEarned >= upgrade.unlockAt
  return state.owned[upgrade.ind] >= upgrade.req
}

/**
 * Upgrades the player can buy right now, cheapest first
 * @param {GameState} state
 */
export const availableUpgrades = (state) =>
  UPGRADES.filter((upgrade) => upgradeUnlocked(state, upgrade)).sort((left, right) => left.cost - right.cost)

/* ---------- earning ---------- */

export function earn(state, derived, amount) {
  if (amount <= 0) return
  state.dollars += amount
  state.runEarned += amount
  state.allTimeEarned += amount
  state.fines += amount * BASE_FINE_RATE * derived.fineMult // a negative multiplier makes a rebate accrue instead
}

/**
 * One click on the big dollar. Returns the amount earned.
 * @param {GameState} state
 * @param {Derived} derived
 */
export function clickDollar(state, derived) {
  const amount = derived.clickPower
  earn(state, derived, amount)
  state.clicks++
  state.clickEarned += amount
  return amount
}

/**
 * Advances the game to `now`, earning income and handling any deadlines crossed along the way
 * (including time spent away). Returns a list of events: { type: "survived", rebate } or { type: "bankrupt", ... }.
 * @param {GameState} state
 * @param {Derived} derived
 */
export function advance(state, derived, now) {
  const events = []
  for (let guard = 0; guard < 1000; guard++) {
    const until = Math.min(now, state.deadline)
    if (until > state.lastTick) earn(state, derived, (derived.cps * (until - state.lastTick)) / 1000)
    state.lastTick = Math.max(state.lastTick, until)
    if (now < state.deadline) break
    const event = settleDeadline(state, state.deadline, now)
    events.push(event)
    if (event.type === "bankrupt") break // income stops: the industries are gone
  }
  state.lastTick = now
  return events
}

/**
 * The deadline at time `deadlineTime` has arrived: a clean or negative ledger survives, unpaid fines mean bankruptcy.
 * @param {GameState} state
 */
function settleDeadline(state, deadlineTime, now) {
  if (state.fines > 0) return goBankrupt(state, now, false)
  const rebate = -state.fines || 0 // "|| 0" turns -0 into 0
  state.dollars += rebate
  state.rebatesCollected += rebate
  state.fines = 0
  state.deadline = deadlineTime + maxTimer(state)
  state.cyclesSurvived++
  return { type: "survived", rebate }
}

/**
 * Wipes the current run (cash, industries, upgrades, lobbyists, fines) but keeps lifetime stats.
 * Changes state in place. Returns { type: "bankrupt", owed, lost, voluntary }.
 * @param {GameState} state
 */
export function goBankrupt(state, now, voluntary) {
  const owed = state.fines,
    lost = state.dollars
  Object.assign(state, freshRun(now), {
    bankruptcies: state.bankruptcies + 1,
    lastTick: now
  })
  return { type: "bankrupt", owed, lost, voluntary }
}

/* ---------- purchases (each returns false if the player can't afford it) ---------- */

export function buyBuilding(state, i, count) {
  const cost = buildingCost(state, i, count)
  if (state.dollars < cost) return false
  state.dollars -= cost
  state.owned[i] += count
  return true
}

/** @param {GameState} state */
export function buyUpgrade(state, id) {
  const upgrade = UPG_BY_ID[id]
  if (!upgrade || !upgradeUnlocked(state, upgrade) || state.dollars < upgradeCost(upgrade)) return false
  state.dollars -= upgradeCost(upgrade)
  state.upgrades[id] = true
  return true
}

/** @param {GameState} state */
export function hireTimerLobbyist(state) {
  const cost = timerLobbyCost(state)
  if (state.dollars < cost) return false
  state.dollars -= cost
  state.timerLobbyists++
  state.deadline += HOUR
  return true
}

/** @param {GameState} state */
export function hirePenaltyLobbyist(state) {
  const cost = penaltyLobbyCost(state)
  if (state.dollars < cost) return false
  state.dollars -= cost
  state.penaltyLobbyists++
  return true
}

/**
 * Returns the severance paid, or false
 * @param {GameState} state
 */
export function fireTimerLobbyist(state, now) {
  const cost = timerFireCost(state)
  if (state.timerLobbyists < 1 || state.dollars < cost) return false
  state.dollars -= cost
  state.timerLobbyists--
  // Never fire your way into instant bankruptcy, but never gain time by firing either
  state.deadline = Math.min(state.deadline, Math.max(now + 60000, state.deadline - HOUR))
  return cost
}

/** @param {GameState} state */
export function firePenaltyLobbyist(state) {
  const cost = penaltyFireCost(state)
  if (state.penaltyLobbyists < 1 || state.dollars < cost) return false
  state.dollars -= cost
  state.penaltyLobbyists--
  return cost
}

/* ---------- the regulatory panel button ---------- */

/**
 * Pays the fines (or collects a rebate) early and restarts the clock.
 * Returns { type: "paid" | "rebate" | "filed", amount } or null if the player can't afford the fines.
 * If the deadline passed before the click was handled, it has already been settled: returns
 * { type: "deadline", events } with advance()'s events and doesn't pay anything.
 * @param {GameState} state
 * @param {Derived} derived
 */
export function payFines(state, derived, now) {
  const events = advance(state, derived, now)
  if (events.length) return { type: "deadline", events }
  let event
  if (state.fines > 0) {
    if (state.dollars < state.fines) return null
    event = { type: "paid", amount: state.fines }
    state.dollars -= state.fines
    state.finesPaid += state.fines
  } else {
    const rebate = -state.fines || 0 // "|| 0" turns -0 into 0
    event = { type: rebate > 0 ? "rebate" : "filed", amount: rebate }
    state.dollars += rebate
    state.rebatesCollected += rebate
  }
  // Settling early only counts as surviving a deadline once the clock has run for at least an hour,
  // so the button can't be clicked repeatedly to inflate the count.
  if (maxTimer(state) - (state.deadline - now) >= HOUR) state.cyclesSurvived++
  state.fines = 0
  state.deadline = now + maxTimer(state)
  return event
}
