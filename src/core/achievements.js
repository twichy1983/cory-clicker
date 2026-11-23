// Achievements: cosmetic trophies, checked once a second. They survive bankruptcy (a hard reset wipes them)
// and are stored in S.achievements as { id: unlockTimestamp }.
// Each test receives a context: { S, D, mkt, peakClickRate }.
import { INDUSTRIES } from "./data/industries.js";
import { UPGRADES } from "./data/upgrades.js";
import { pctChange } from "./market.js";
import { fmt, money } from "./format.js";

const totalOwned = S => S.owned.reduce((a, b) => a + b, 0);
const scandalsOwned = S => UPGRADES.filter(u => u.type === "scandal" && S.upgrades[u.id]).length;
const upgradesOwned = S => Object.keys(S.upgrades).length;
const anyStock = (c, fn) => c.mkt.ind.some((h, i) => c.S.owned[i] > 0 && fn(h, i));

export const ACH = [];
const A = (cat, id, icon, name, desc, test) => ACH.push({ cat, id, icon, name, desc, test });

// Industries
const IND_ACH = [
  ["Sidewalk Mogul", "🍋"], ["Supply Chain Gang", "🌾"], ["Assembly Line Dancing", "🏭"], ["Better Living Through Chemistry", "🧪"],
  ["Choking Hazard Included", "🧸"], ["Big Pharma, Small Ethics", "💊"], ["Hard Hat Optional", "🛢️"], ["Recall of the Wild", "✈️"],
  ["Data Hoarder", "🏦"], ["Island Time", "🏝️"],
];
IND_ACH.forEach(([name, icon], i) => A("Industries", "ind_" + INDUSTRIES[i].key, icon, name, `Own your first ${INDUSTRIES[i].name}.`, c => c.S.owned[i] >= 1));
A("Industries", "own_10",   "🏢", "Conglomerate in Training", "Own 10 industries in total.",    c => totalOwned(c.S) >= 10);
A("Industries", "own_100",  "🏙️", "Vertical Integration",     "Own 100 industries in total.",   c => totalOwned(c.S) >= 100);
A("Industries", "own_500",  "🌆", "Monopoly Money",           "Own 500 industries in total.",   c => totalOwned(c.S) >= 500);
A("Industries", "own_1000", "🌐", "Antitrust Magnet",         "Own 1,000 industries in total.", c => totalOwned(c.S) >= 1000);
A("Industries", "own_100x", "💯", "Century Club",             "Own 100 of a single industry.",  c => c.S.owned.some(n => n >= 100));
A("Industries", "own_all",  "🗂️", "Diversified Portfolio",    "Own at least one of every industry.", c => c.S.owned.every(n => n >= 1));

// Income per second
[[10, "🪙", "Pocket Change"], [1e3, "💵", "Side Hustle"], [1e6, "💰", "Seven Figures a Second"],
 [1e9, "🤑", "Billionaire Per Second"], [1e12, "🏛️", "Too Big to Fail"], [1e15, "🚀", "Post-Scarcity Greed"]]
  .forEach(([n, icon, name]) => A("Income", "cps_" + n, icon, name, `Earn ${money(n).replace(".000", "")} per second.`, c => c.D.cps >= n));

// Clicking
[[100, "👆", "Finger Exercise"], [1000, "🖐️", "Repetitive Strain"], [10000, "🦾", "Carpal Tunnel Syndicate"], [100000, "🤖", "Click Farm"]]
  .forEach(([n, icon, name]) => A("Clicking", "clicks_" + n, icon, name, `Click the dollar ${fmt(n)} times.`, c => c.S.clicks >= n));
[[5, "⚡", "Day Trader Fingers"], [10, "🌩️", "High-Frequency Trader"], [15, "💥", "Flash Crash Finger"]]
  .forEach(([n, icon, name]) => A("Clicking", "cspeed_" + n, icon, name, `Click ${n} times within one second.`, c => c.peakClickRate >= n));

// Upgrades & scandals
[[1, "🛒", "First Acquisition"], [10, "📦", "Shopping Spree"], [25, "🏷️", "Bulk Discount"], [50, "🧾", "Expense Account"], [100, "💳", "Unlimited Corporate Card"]]
  .forEach(([n, icon, name]) => A("Upgrades", "upg_" + n, icon, name, `Buy ${n} upgrade${n > 1 ? "s" : ""}.`, c => upgradesOwned(c.S) >= n));
A("Upgrades", "upg_all", "👑", "Fully Optimized", "Buy every upgrade in the game.", c => upgradesOwned(c.S) >= UPGRADES.length);
[[1, "⚖️", "First Offense"], [10, "🚔", "Repeat Offender"], [50, "🕴️", "Career Criminal"], [100, "📜", "Rap Sheet Longer Than the Fine Print"]]
  .forEach(([n, icon, name]) => A("Upgrades", "scan_" + n, icon, name, `Commit ${n} scandal${n > 1 ? "s" : ""}.`, c => scandalsOwned(c.S) >= n));
A("Upgrades", "scan_ind", "☣️", "Industry Pariah", "Commit every scandal in a single industry.",
  c => INDUSTRIES.some((_, i) => { const s = UPGRADES.filter(u => u.type === "scandal" && u.ind === i); return s.length && s.every(u => c.S.upgrades[u.id]); }));

// Lobbying & regulators
A("Lobbying", "lob_t1",  "⏳", "Buying Time",                   "Hire your first Timer Lobbyist.",            c => c.S.timerLobbyists >= 1);
A("Lobbying", "lob_t10", "📅", "Deadline Extension Specialist", "Hire 10 Timer Lobbyists.",                   c => c.S.timerLobbyists >= 10);
A("Lobbying", "lob_t24", "🗓️", "Two-Day Shipping on Justice",   "Stretch the deadline window to 48 hours.",   c => c.S.timerLobbyists >= 24);
A("Lobbying", "lob_p1",  "🤝", "Friends in Low Places",         "Hire your first Penalty Lobbyist.",          c => c.S.penaltyLobbyists >= 1);
A("Lobbying", "lob_p25", "💼", "K Street Regular",              "Hire 25 Penalty Lobbyists.",                 c => c.S.penaltyLobbyists >= 25);
A("Lobbying", "lob_p50", "🚪", "Revolving Door",                "Hire 50 Penalty Lobbyists.",                 c => c.S.penaltyLobbyists >= 50);
A("Lobbying", "lob_cap", "🎩", "Regulatory Capture",            "Push the fine multiplier to 0% or below.",   c => c.D.fineMult <= 0);
A("Lobbying", "reg_pay", "🧾", "Cost of Doing Business",        "Pay your fines before a deadline.",          c => c.S.finesPaid > 0);
A("Lobbying", "reg_7",   "🎭", "Compliance Theater",            "Get through 7 regulatory deadlines.",        c => c.S.cyclesSurvived >= 7);
A("Lobbying", "reg_1b",  "🏦", "Settlement Specialist",         "Pay $1 billion in fines over your career.",  c => c.S.finesPaid >= 1e9);
A("Lobbying", "reg_reb", "🎁", "Government Subsidy",            "Collect a regulatory rebate.",               c => c.S.rebatesCollected > 0);
A("Lobbying", "reg_bk",  "📉", "Chapter 11",                    "Go bankrupt. It happens to the best of us.", c => c.S.bankruptcies >= 1);

// Play time (active time with the game open)
[[600, "☕", "Trial Period", "10 minutes"], [3600, "🕐", "Clocked In", "1 hour"], [18000, "🌙", "Overtime", "5 hours"],
 [86400, "🛌", "Workaholic", "24 hours"], [360000, "🪦", "Corporate Lifer", "100 hours"]]
  .forEach(([s, icon, name, label]) => A("Play Time", "time_" + s, icon, name, `Play for ${label} in total.`, c => c.S.playTime >= s));

// Stock market
A("Stock Market", "mkt_bull",  "🐂", "Bull Run",     "Have any stock gain 10% within 3 minutes.",   c => anyStock(c, h => (pctChange(h) || 0) >= 10));
A("Stock Market", "mkt_moon",  "🌕", "To the Moon",  "Have any stock gain 50% within 3 minutes.",   c => anyStock(c, h => (pctChange(h) || 0) >= 50));
A("Stock Market", "mkt_bear",  "🐻", "Bear Market",  "Have any stock lose 10% within 3 minutes.",   c => anyStock(c, h => (pctChange(h) || 0) <= -10));
A("Stock Market", "mkt_index", "📈", "Index Fund",   "Grow the CLKX composite 25% within 3 minutes.", c => (pctChange(c.mkt.idx) || 0) >= 25);
A("Stock Market", "mkt_herd",  "🐃", "Herd Mentality", "Have 3 stocks rated Bullish at the same time.", c => c.mkt.mood.filter((m, i) => c.S.owned[i] > 0 && m > 1.04).length >= 3);
A("Stock Market", "mkt_press", "📰", "Bad Press",    "Let a scandal drive a stock's investor mood below 80%.", c => c.mkt.mood.some((m, i) => c.S.owned[i] > 0 && m < 0.8));
A("Stock Market", "mkt_blue",  "💎", "Blue Chip",    "Get a single stock's share price to $1 million.", c => c.mkt.ind.some(h => (h[h.length - 1] || 0) >= 1e6));
// Only while you still own industries, so a bankruptcy (index drops to $0) doesn't count as a crash
A("Stock Market", "mkt_crash", "🕳️", "Black Monday", "Watch the composite index lose 90% of its value.",
  c => { const h = c.mkt.idx, hi = Math.max(0, ...h); return totalOwned(c.S) > 0 && hi > 0 && h[h.length - 1] <= hi * 0.1; });

export const ACH_BY_ID = Object.fromEntries(ACH.map(a => [a.id, a]));
export const ACH_CATS = [...new Set(ACH.map(a => a.cat))];

// Big milestones that trigger the portal's celebration effect
export const MAJOR_ACH = new Set(["cps_1000000000", "cps_1000000000000", "cps_1000000000000000", "lob_cap", "upg_all", "scan_100", "mkt_moon"]);

// Unlocks every achievement whose test now passes. Returns the newly unlocked ones.
export function checkAchievements(ctx, now) {
  const fresh = [];
  for (const a of ACH) {
    if (ctx.S.achievements[a.id]) continue;
    let ok = false;
    try { ok = a.test(ctx); } catch { ok = false; }
    if (ok) { ctx.S.achievements[a.id] = now; fresh.push(a); }
  }
  return fresh;
}
