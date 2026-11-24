// Achievements: cosmetic trophies, checked once a second. They survive bankruptcy (a hard reset wipes them)
// and are stored in state.achievements as { id: unlockTimestamp }.
// Each test receives a context: { state, derived, mkt, peakClickRate }.
import { INDUSTRIES } from "./data/industries.js"
import { UPGRADES } from "./data/upgrades.js"
import { pctChange } from "./market.js"
import { fmt, money } from "./format.js"

const totalOwned = (state) => state.owned.reduce((sum, count) => sum + count, 0)
const scandalsOwned = (state) =>
  UPGRADES.filter((upgrade) => upgrade.type === "scandal" && state.upgrades[upgrade.id]).length
const upgradesOwned = (state) => Object.keys(state.upgrades).length
const anyStock = (context, fn) => context.mkt.ind.some((history, i) => context.state.owned[i] > 0 && fn(history, i))

export const ACH = []
const addAchievement = (cat, id, icon, name, desc, test) => ACH.push({ cat, id, icon, name, desc, test })

// Industries
const IND_ACH = [
  ["Sidewalk Mogul", "🍋"],
  ["Supply Chain Gang", "🌾"],
  ["Assembly Line Dancing", "🏭"],
  ["Better Living Through Chemistry", "🧪"],
  ["Choking Hazard Included", "🧸"],
  ["Big Pharma, Small Ethics", "💊"],
  ["Hard Hat Optional", "🛢️"],
  ["Recall of the Wild", "✈️"],
  ["Data Hoarder", "🏦"],
  ["Island Time", "🏝️"]
]
IND_ACH.forEach(([name, icon], i) =>
  addAchievement(
    "Industries",
    "ind_" + INDUSTRIES[i].key,
    icon,
    name,
    `Own your first ${INDUSTRIES[i].name}.`,
    (context) => context.state.owned[i] >= 1
  )
)
addAchievement(
  "Industries",
  "own_10",
  "🏢",
  "Conglomerate in Training",
  "Own 10 industries in total.",
  (context) => totalOwned(context.state) >= 10
)
addAchievement(
  "Industries",
  "own_100",
  "🏙️",
  "Vertical Integration",
  "Own 100 industries in total.",
  (context) => totalOwned(context.state) >= 100
)
addAchievement(
  "Industries",
  "own_500",
  "🌆",
  "Monopoly Money",
  "Own 500 industries in total.",
  (context) => totalOwned(context.state) >= 500
)
addAchievement(
  "Industries",
  "own_1000",
  "🌐",
  "Antitrust Magnet",
  "Own 1,000 industries in total.",
  (context) => totalOwned(context.state) >= 1000
)
addAchievement("Industries", "own_100x", "💯", "Century Club", "Own 100 of a single industry.", (context) =>
  context.state.owned.some((count) => count >= 100)
)
addAchievement(
  "Industries",
  "own_all",
  "🗂️",
  "Diversified Portfolio",
  "Own at least one of every industry.",
  (context) => context.state.owned.every((count) => count >= 1)
)

// Income per second
;[
  [10, "🪙", "Pocket Change"],
  [1e3, "💵", "Side Hustle"],
  [1e6, "💰", "Seven Figures a Second"],
  [1e9, "🤑", "Billionaire Per Second"],
  [1e12, "🏛️", "Too Big to Fail"],
  [1e15, "🚀", "Post-Scarcity Greed"]
].forEach(([threshold, icon, name]) =>
  addAchievement(
    "Income",
    "cps_" + threshold,
    icon,
    name,
    `Earn ${money(threshold).replace(".000", "")} per second.`,
    (context) => context.derived.cps >= threshold
  )
)

// Clicking
;[
  [100, "👆", "Finger Exercise"],
  [1000, "🖐️", "Repetitive Strain"],
  [10000, "🦾", "Carpal Tunnel Syndicate"],
  [100000, "🤖", "Click Farm"]
].forEach(([threshold, icon, name]) =>
  addAchievement(
    "Clicking",
    "clicks_" + threshold,
    icon,
    name,
    `Click the dollar ${fmt(threshold)} times.`,
    (context) => context.state.clicks >= threshold
  )
)
;[
  [5, "⚡", "Day Trader Fingers"],
  [10, "🌩️", "High-Frequency Trader"],
  [15, "💥", "Flash Crash Finger"]
].forEach(([threshold, icon, name]) =>
  addAchievement(
    "Clicking",
    "cspeed_" + threshold,
    icon,
    name,
    `Click ${threshold} times within one second.`,
    (context) => context.peakClickRate >= threshold
  )
)

// Upgrades & scandals
;[
  [1, "🛒", "First Acquisition"],
  [10, "📦", "Shopping Spree"],
  [25, "🏷️", "Bulk Discount"],
  [50, "🧾", "Expense Account"],
  [100, "💳", "Unlimited Corporate Card"]
].forEach(([threshold, icon, name]) =>
  addAchievement(
    "Upgrades",
    "upg_" + threshold,
    icon,
    name,
    `Buy ${threshold} upgrade${threshold > 1 ? "s" : ""}.`,
    (context) => upgradesOwned(context.state) >= threshold
  )
)
addAchievement(
  "Upgrades",
  "upg_all",
  "👑",
  "Fully Optimized",
  "Buy every upgrade in the game.",
  (context) => upgradesOwned(context.state) >= UPGRADES.length
)
;[
  [1, "⚖️", "First Offense"],
  [10, "🚔", "Repeat Offender"],
  [50, "🕴️", "Career Criminal"],
  [100, "📜", "Rap Sheet Longer Than the Fine Print"]
].forEach(([threshold, icon, name]) =>
  addAchievement(
    "Upgrades",
    "scan_" + threshold,
    icon,
    name,
    `Commit ${threshold} scandal${threshold > 1 ? "s" : ""}.`,
    (context) => scandalsOwned(context.state) >= threshold
  )
)
addAchievement(
  "Upgrades",
  "scan_ind",
  "☣️",
  "Industry Pariah",
  "Commit every scandal in a single industry.",
  (context) =>
    INDUSTRIES.some((_, i) => {
      const scandalUpgrades = UPGRADES.filter((upgrade) => upgrade.type === "scandal" && upgrade.ind === i)
      return scandalUpgrades.length && scandalUpgrades.every((upgrade) => context.state.upgrades[upgrade.id])
    })
)

// Lobbying & regulators
addAchievement(
  "Lobbying",
  "lob_t1",
  "⏳",
  "Buying Time",
  "Hire your first Timer Lobbyist.",
  (context) => context.state.timerLobbyists >= 1
)
addAchievement(
  "Lobbying",
  "lob_t10",
  "📅",
  "Deadline Extension Specialist",
  "Hire 10 Timer Lobbyists.",
  (context) => context.state.timerLobbyists >= 10
)
addAchievement(
  "Lobbying",
  "lob_t24",
  "🗓️",
  "Two-Day Shipping on Justice",
  "Stretch the deadline window to 48 hours.",
  (context) => context.state.timerLobbyists >= 24
)
addAchievement(
  "Lobbying",
  "lob_p1",
  "🤝",
  "Friends in Low Places",
  "Hire your first Penalty Lobbyist.",
  (context) => context.state.penaltyLobbyists >= 1
)
addAchievement(
  "Lobbying",
  "lob_p25",
  "💼",
  "K Street Regular",
  "Hire 25 Penalty Lobbyists.",
  (context) => context.state.penaltyLobbyists >= 25
)
addAchievement(
  "Lobbying",
  "lob_p50",
  "🚪",
  "Revolving Door",
  "Hire 50 Penalty Lobbyists.",
  (context) => context.state.penaltyLobbyists >= 50
)
addAchievement(
  "Lobbying",
  "lob_cap",
  "🎩",
  "Regulatory Capture",
  "Push the fine multiplier to 0% or below.",
  (context) => context.derived.fineMult <= 0
)
addAchievement(
  "Lobbying",
  "reg_pay",
  "🧾",
  "Cost of Doing Business",
  "Pay your fines before a deadline.",
  (context) => context.state.finesPaid > 0
)
addAchievement(
  "Lobbying",
  "reg_7",
  "🎭",
  "Compliance Theater",
  "Get through 7 regulatory deadlines.",
  (context) => context.state.cyclesSurvived >= 7
)
addAchievement(
  "Lobbying",
  "reg_1b",
  "🏦",
  "Settlement Specialist",
  "Pay $1 billion in fines over your career.",
  (context) => context.state.finesPaid >= 1e9
)
addAchievement(
  "Lobbying",
  "reg_reb",
  "🎁",
  "Government Subsidy",
  "Collect a regulatory rebate.",
  (context) => context.state.rebatesCollected > 0
)
addAchievement(
  "Lobbying",
  "reg_bk",
  "📉",
  "Chapter 11",
  "Go bankrupt. It happens to the best of us.",
  (context) => context.state.bankruptcies >= 1
)

// Play time (active time with the game open)
;[
  [600, "☕", "Trial Period", "10 minutes"],
  [3600, "🕐", "Clocked In", "1 hour"],
  [18000, "🌙", "Overtime", "5 hours"],
  [86400, "🛌", "Workaholic", "24 hours"],
  [360000, "🪦", "Corporate Lifer", "100 hours"]
].forEach(([seconds, icon, name, label]) =>
  addAchievement(
    "Play Time",
    "time_" + seconds,
    icon,
    name,
    `Play for ${label} in total.`,
    (context) => context.state.playTime >= seconds
  )
)

// Stock market
addAchievement("Stock Market", "mkt_bull", "🐂", "Bull Run", "Have any stock gain 10% within 3 minutes.", (context) =>
  anyStock(context, (history) => (pctChange(history) || 0) >= 10)
)
addAchievement(
  "Stock Market",
  "mkt_moon",
  "🌕",
  "To the Moon",
  "Have any stock gain 50% within 3 minutes.",
  (context) => anyStock(context, (history) => (pctChange(history) || 0) >= 50)
)
addAchievement(
  "Stock Market",
  "mkt_bear",
  "🐻",
  "Bear Market",
  "Have any stock lose 10% within 3 minutes.",
  (context) => anyStock(context, (history) => (pctChange(history) || 0) <= -10)
)
addAchievement(
  "Stock Market",
  "mkt_index",
  "📈",
  "Index Fund",
  "Grow the CLKX composite 25% within 3 minutes.",
  (context) => (pctChange(context.mkt.idx) || 0) >= 25
)
addAchievement(
  "Stock Market",
  "mkt_herd",
  "🐃",
  "Herd Mentality",
  "Have 3 stocks rated Bullish at the same time.",
  (context) => context.mkt.mood.filter((mood, i) => context.state.owned[i] > 0 && mood > 1.04).length >= 3
)
addAchievement(
  "Stock Market",
  "mkt_press",
  "📰",
  "Bad Press",
  "Let a scandal drive a stock's investor mood below 80%.",
  (context) => context.mkt.mood.some((mood, i) => context.state.owned[i] > 0 && mood < 0.8)
)
addAchievement(
  "Stock Market",
  "mkt_blue",
  "💎",
  "Blue Chip",
  "Get a single stock's share price to $1 million.",
  (context) => context.mkt.ind.some((history) => (history[history.length - 1] || 0) >= 1e6)
)
// Only while you still own industries, so a bankruptcy (index drops to $0) doesn't count as a crash
addAchievement(
  "Stock Market",
  "mkt_crash",
  "🕳️",
  "Black Monday",
  "Watch the composite index lose 90% of its value.",
  (context) => {
    const history = context.mkt.idx,
      hi = Math.max(0, ...history)
    return totalOwned(context.state) > 0 && hi > 0 && history[history.length - 1] <= hi * 0.1
  }
)

export const ACH_BY_ID = Object.fromEntries(ACH.map((achievement) => [achievement.id, achievement]))
export const ACH_CATS = [...new Set(ACH.map((achievement) => achievement.cat))]

// Big milestones that trigger the portal's celebration effect
export const MAJOR_ACH = new Set([
  "cps_1000000000",
  "cps_1000000000000",
  "cps_1000000000000000",
  "lob_cap",
  "upg_all",
  "scan_100",
  "mkt_moon"
])

// Unlocks every achievement whose test now passes. Returns the newly unlocked ones.
export function checkAchievements(ctx, now) {
  const fresh = []
  for (const achievement of ACH) {
    if (ctx.state.achievements[achievement.id]) continue
    let ok = false
    try {
      ok = achievement.test(ctx)
    } catch {
      ok = false
    }
    if (ok) {
      ctx.state.achievements[achievement.id] = now
      fresh.push(achievement)
    }
  }
  return fresh
}
