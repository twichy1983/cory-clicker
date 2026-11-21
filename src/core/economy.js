// The game's rules: income, prices, purchases, fines, deadlines and bankruptcy.
// Every function takes the state (S) and, where needed, the derived values (D) and the current time.
// Nothing here touches the page: functions return what happened and the UI decides how to show it.
import { HOUR, BASE_TIMER, BASE_FINE_RATE, COST_GROWTH, TIMER_LOBBY, PENALTY_LOBBY } from "./constants.js";
import { INDUSTRIES } from "./data/industries.js";
import { UPGRADES, UPG_BY_ID } from "./data/upgrades.js";
import { freshRun } from "./state.js";
import { rules } from "./rules.js";

/* ---------- derived values (recomputed whenever S changes) ---------- */

// Works out income, click power and the fine multiplier from what the player owns.
export function derive(S) {
  const scandalsIn = INDUSTRIES.map(() => 0), doublersIn = INDUSTRIES.map(() => 0);
  let clickX = 1, clickPct = 0, scandals = 0;
  for (const id in S.upgrades) {
    const u = UPG_BY_ID[id];
    if (!u) continue;
    if (u.type === "scandal") { scandalsIn[u.ind]++; scandals++; }
    else if (u.type === "mult") doublersIn[u.ind]++;
    else if (u.type === "click") { if (u.kind === "x2") clickX *= 2; else clickPct += 0.01; }
  }
  const indMult = INDUSTRIES.map((_, i) => (1 + 0.10 * scandalsIn[i]) * Math.pow(2, doublersIn[i]));
  const indCps = INDUSTRIES.map((ind, i) => S.owned[i] * ind.cps * indMult[i]);
  const cps = indCps.reduce((a, b) => a + b, 0);
  return {
    cps, indMult, indCps, scandals, clickPct,
    clickPower: clickX + cps * clickPct,
    fineMult: 1 + 0.01 * scandals - 0.01 * S.penaltyLobbyists,
  };
}

/* ---------- prices ---------- */

export const maxTimer = S => BASE_TIMER + S.timerLobbyists * HOUR;

// Price of the next `n` of industry `i`
export function buildingCost(S, i, n) {
  if (rules.freePurchases) return 0;
  const b = INDUSTRIES[i].base * Math.pow(COST_GROWTH, S.owned[i]);
  return Math.ceil(b * (Math.pow(COST_GROWTH, n) - 1) / (COST_GROWTH - 1));
}

const lobbyCost = (cfg, count) => rules.freePurchases ? 0 : Math.ceil(cfg.base * Math.pow(cfg.growth, count));
export const timerLobbyCost = S => lobbyCost(TIMER_LOBBY, S.timerLobbyists);
export const penaltyLobbyCost = S => lobbyCost(PENALTY_LOBBY, S.penaltyLobbyists);
// Firing costs double what the most recently hired lobbyist of that type cost to hire
export const timerFireCost = S => 2 * lobbyCost(TIMER_LOBBY, Math.max(0, S.timerLobbyists - 1));
export const penaltyFireCost = S => 2 * lobbyCost(PENALTY_LOBBY, Math.max(0, S.penaltyLobbyists - 1));

export const upgradeCost = u => rules.freePurchases ? 0 : u.cost;

function upgradeUnlocked(S, u) {
  if (S.upgrades[u.id]) return false;
  if (u.type === "click") return rules.freePurchases || S.runEarned >= u.unlockAt;
  return S.owned[u.ind] >= u.req;
}

// Upgrades the player can buy right now, cheapest first
export const availableUpgrades = S => UPGRADES.filter(u => upgradeUnlocked(S, u)).sort((a, b) => a.cost - b.cost);

/* ---------- earning ---------- */

export function earn(S, D, amount) {
  if (amount <= 0) return;
  S.dollars += amount; S.runEarned += amount; S.allTimeEarned += amount;
  S.fines += amount * BASE_FINE_RATE * D.fineMult; // a negative multiplier makes a rebate accrue instead
}

// One click on the big dollar. Returns the amount earned.
export function clickDollar(S, D) {
  const amount = D.clickPower;
  earn(S, D, amount);
  S.clicks++; S.clickEarned += amount;
  return amount;
}

// Advances the game to `now`, earning income and handling any deadlines crossed along the way
// (including time spent away). Returns a list of events: { type: "survived", rebate } or { type: "bankrupt", ... }.
export function advance(S, D, now) {
  const events = [];
  for (let guard = 0; guard < 1000; guard++) {
    const until = Math.min(now, S.deadline);
    if (until > S.lastTick) earn(S, D, D.cps * (until - S.lastTick) / 1000);
    S.lastTick = Math.max(S.lastTick, until);
    if (now < S.deadline) break;
    const ev = settleDeadline(S, S.deadline, now);
    events.push(ev);
    if (ev.type === "bankrupt") break; // income stops: the industries are gone
  }
  S.lastTick = now;
  return events;
}

// The deadline at time `at` has arrived: a clean or negative ledger survives, unpaid fines mean bankruptcy.
function settleDeadline(S, at, now) {
  if (S.fines > 0) return goBankrupt(S, now, false);
  const rebate = -S.fines || 0; // "|| 0" turns -0 into 0
  S.dollars += rebate; S.rebatesCollected += rebate; S.fines = 0;
  S.deadline = at + maxTimer(S);
  S.cyclesSurvived++;
  return { type: "survived", rebate };
}

// Wipes the current run (cash, industries, upgrades, lobbyists, fines) but keeps lifetime stats.
// Changes S in place. Returns { type: "bankrupt", owed, lost, voluntary }.
export function goBankrupt(S, now, voluntary) {
  const owed = S.fines, lost = S.dollars;
  Object.assign(S, freshRun(now), { bankruptcies: S.bankruptcies + 1, lastTick: now });
  return { type: "bankrupt", owed, lost, voluntary };
}

/* ---------- purchases (each returns false if the player can't afford it) ---------- */

export function buyBuilding(S, i, n) {
  const cost = buildingCost(S, i, n);
  if (S.dollars < cost) return false;
  S.dollars -= cost; S.owned[i] += n;
  return true;
}

export function buyUpgrade(S, id) {
  const u = UPG_BY_ID[id];
  if (!u || !upgradeUnlocked(S, u) || S.dollars < upgradeCost(u)) return false;
  S.dollars -= upgradeCost(u); S.upgrades[id] = true;
  return true;
}

export function hireTimerLobbyist(S) {
  const cost = timerLobbyCost(S);
  if (S.dollars < cost) return false;
  S.dollars -= cost; S.timerLobbyists++; S.deadline += HOUR;
  return true;
}

export function hirePenaltyLobbyist(S) {
  const cost = penaltyLobbyCost(S);
  if (S.dollars < cost) return false;
  S.dollars -= cost; S.penaltyLobbyists++;
  return true;
}

// Returns the severance paid, or false
export function fireTimerLobbyist(S, now) {
  const cost = timerFireCost(S);
  if (S.timerLobbyists < 1 || S.dollars < cost) return false;
  S.dollars -= cost; S.timerLobbyists--;
  // Never fire your way into instant bankruptcy, but never gain time by firing either
  S.deadline = Math.min(S.deadline, Math.max(now + 60000, S.deadline - HOUR));
  return cost;
}

export function firePenaltyLobbyist(S) {
  const cost = penaltyFireCost(S);
  if (S.penaltyLobbyists < 1 || S.dollars < cost) return false;
  S.dollars -= cost; S.penaltyLobbyists--;
  return cost;
}

/* ---------- the regulatory panel button ---------- */

// Pays the fines (or collects a rebate) early and restarts the clock.
// Returns { type: "paid" | "rebate" | "filed", amount } or null if the player can't afford the fines.
export function payFines(S, D, now) {
  advance(S, D, now);
  let ev;
  if (S.fines > 0) {
    if (S.dollars < S.fines) return null;
    ev = { type: "paid", amount: S.fines };
    S.dollars -= S.fines; S.finesPaid += S.fines;
  } else {
    const rebate = -S.fines || 0; // "|| 0" turns -0 into 0
    ev = { type: rebate > 0 ? "rebate" : "filed", amount: rebate };
    S.dollars += rebate; S.rebatesCollected += rebate;
  }
  // Settling early only counts as surviving a deadline once the clock has run for at least an hour,
  // so the button can't be clicked repeatedly to inflate the count.
  if (maxTimer(S) - (S.deadline - now) >= HOUR) S.cyclesSurvived++;
  S.fines = 0;
  S.deadline = now + maxTimer(S);
  return ev;
}
