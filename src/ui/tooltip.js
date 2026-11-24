// Hover details for anything with a data-tooltip="kind:id" attribute.
// With a mouse the panel follows the pointer; on touch screens CSS docks it to the top or bottom edge.
import { game } from "../game.js"
import { HOUR } from "../core/constants.js"
import { INDUSTRIES, TICKERS } from "../core/data/industries.js"
import { UPG_BY_ID } from "../core/data/upgrades.js"
import { ACH_BY_ID } from "../core/achievements.js"
import { pctChange } from "../core/market.js"
import { jobCooldown, jobPay, jobPaySecs, jobTimeLeft, jobUnlocked } from "../core/jobs.js"
import { buildingCost, upgradeCost, maxTimer } from "../core/economy.js"
import { timerLobbyCost, penaltyLobbyCost, timerFireCost, penaltyFireCost } from "../core/economy.js"
import { money, mmss } from "../core/format.js"
import { JOB_BY_ID } from "../jobs/index.js"
import { $, esc } from "./dom.js"
import { buyAmt, isMystery } from "./store.js"

function industryTip(i) {
  const { state, derived } = game,
    ind = INDUSTRIES[i]
  if (isMystery(i))
    return `<div class="tn">🔍 Rumored acquisition</div><div class="td">Your analysts are circling a new division. Earn ${money(ind.base * 0.5)} this run to find out what it is.</div>`
  const each = ind.cps * derived.indMult[i],
    share = derived.cps ? (derived.indCps[i] / derived.cps) * 100 : 0
  return `<div class="tn">${ind.icon} ${esc(ind.name)}</div><div class="ts">${esc(ind.sector)}</div>
    <div class="td">${esc(ind.flavor)}</div>
    <div>Each produces <b>${money(each)}/s</b> (base ${money(ind.cps)} × ${derived.indMult[i].toFixed(2)})</div>
    <div>${state.owned[i]} owned producing <b>${money(derived.indCps[i])}/s</b> (${share.toFixed(1)}% of income)</div>
    <div class="tc">Cost: ${money(buildingCost(state, i, buyAmt))}${buyAmt > 1 ? " for " + buyAmt : ""}</div>`
}

function upgradeTip(id) {
  const upgrade = UPG_BY_ID[id]
  if (!upgrade) return ""
  let sec,
    bonus,
    pen = ""
  if (upgrade.type === "scandal") {
    sec = INDUSTRIES[upgrade.ind].sector + " · Scandal"
    bonus = `+10% ${esc(INDUSTRIES[upgrade.ind].name)} output`
    pen = `<div class="tp">Penalty: +1% Regulatory Fines</div>`
  } else if (upgrade.type === "mult") {
    sec = INDUSTRIES[upgrade.ind].sector + " · Efficiency"
    bonus = `${esc(INDUSTRIES[upgrade.ind].name)} output ×2`
  } else {
    sec = "Clicking"
    bonus = upgrade.kind === "x2" ? "Click power ×2" : "Clicks also earn +1% of your income per second"
  }
  return `<div class="tn">${upgrade.icon} ${esc(upgrade.name)}</div><div class="ts">${esc(sec)}</div><div class="td">${esc(upgrade.desc)}</div>
    <div class="tb">Bonus: ${bonus}</div>${pen}<div class="tc">Cost: ${money(upgradeCost(upgrade))}</div>`
}

function fireTip(id) {
  const state = game.state,
    timer = id === "timer",
    count = timer ? state.timerLobbyists : state.penaltyLobbyists
  return `<div class="tn">🔥 Fire a ${timer ? "Timer" : "Penalty"} Lobbyist</div>
    <div class="td">Lobbyists know where the bodies are buried. Their severance packages reflect that.</div>
    <div class="tp">${timer ? "−1 hour from the deadline window and the current countdown (always leaves at least 1 minute)" : "+1% regulatory fine multiplier"}</div>
    <div>Hired: ${count}</div>
    <div class="tc">${count ? "Severance: " + money(timer ? timerFireCost(state) : penaltyFireCost(state)) + " (2× the last hire)" : "Nobody to fire"}</div>`
}

function lobbyTip(id) {
  const { state, derived } = game
  if (id === "timer")
    return `<div class="tn">⏳ Timer Lobbyist</div><div class="td">Convinces a subcommittee that deadlines are more of a suggestion.</div>
    <div class="tb">+1 hour to the regulatory timer (also extends the current countdown)</div>
    <div>Owned: ${state.timerLobbyists} · Window: ${maxTimer(state) / HOUR}h</div><div class="tc">Cost: ${money(timerLobbyCost(state))}</div>`
  return `<div class="tn">🤝 Penalty Lobbyist</div><div class="td">Rewrites the penalty schedule over a very long lunch.</div>
    <div class="tb">−1% regulatory fine multiplier. Below 0%, fines turn into revenue paid to you.</div>
    <div>Owned: ${state.penaltyLobbyists} · Multiplier now: ${(derived.fineMult * 100).toFixed(0)}%</div><div class="tc">Cost: ${money(penaltyLobbyCost(state))}</div>`
}

function jobTip(id) {
  const { state, derived } = game,
    job = JOB_BY_ID[id]
  if (!job) return ""
  const ind = INDUSTRIES[job.ind],
    left = jobTimeLeft(state, job, Date.now()),
    cdMin = jobCooldown(job) / 60000
  const status = !jobUnlocked(state, job)
    ? "Acquire a " + esc(ind.name) + " to unlock."
    : left
      ? "Available again in " + mmss(left)
      : `Ready now. Playable once every ${cdMin >= 1 ? cdMin + " minutes" : Math.round(cdMin * 60) + " seconds"}, win or lose.`
  return `<div class="tn">${job.icon} ${esc(job.name)}</div><div class="ts">Job · ${esc(ind.name)}</div>
    <div class="td">${esc(job.blurb)}</div>
    <div>${job.game.time}-second minigame. ${state.jobWins[job.id] ? "Completed " + state.jobWins[job.id] + "×." : ""}</div>
    <div class="tb">Reward: ${money(jobPay(derived, job))} (${jobPaySecs(job) / 60} minutes of ${esc(ind.name)} income)</div>
    <div class="tc">${status}</div>`
}

function achievementTip(id) {
  const achievement = ACH_BY_ID[id]
  if (!achievement) return ""
  const when = game.state.achievements[id]
  return `<div class="tn">${when ? achievement.icon : "🔒"} ${esc(achievement.name)}</div><div class="ts">${esc(achievement.cat)}</div>
    <div class="td">${esc(achievement.desc)}</div>
    ${when ? `<div class="tb">Unlocked ${new Date(when).toLocaleString()}</div>` : `<div class="muted">Locked</div>`}`
}

function stockTip(i) {
  const { derived, mkt } = game,
    ind = INDUSTRIES[i],
    history = mkt.ind[i],
    mood = mkt.mood[i],
    change = pctChange(history)
  const moodTxt = mood > 1.04 ? "Bullish 🐂" : mood < 0.96 ? "Bearish 🐻" : "Neutral"
  return `<div class="tn">${ind.icon} ${TICKERS[i]} · ${esc(ind.name)}</div><div class="ts">${esc(ind.sector)}</div>
    <div>Share price: <b>${money(history[history.length - 1] || 0)}</b></div>
    <div>Actual income: <b>${money(derived.indCps[i])}/s</b></div>
    <div>Investor mood: <b>${moodTxt}</b> (${(mood * 100).toFixed(0)}% of income)</div>
    <div>3-minute change: <b>${change === null ? "n/a" : (change >= 0 ? "▲ +" : "▼ ") + change.toFixed(1) + "%"}</b></div>
    <div class="td">The price tracks this industry's income per second. Scandals spook investors for a minute or two.</div>`
}

const TIPS = {
  bld: (id) => industryTip(+id),
  upg: upgradeTip,
  fire: fireTip,
  lobby: lobbyTip,
  job: jobTip,
  ach: achievementTip,
  mkt: (id) => stockTip(+id)
}

function tipHTML(key) {
  const [kind, id] = key.split(":")
  return TIPS[kind] ? TIPS[kind](id) : ""
}

/* ---------- showing and placing the panel ---------- */

let tipKey = null,
  tipX = 0,
  tipY = 0
let touchMode = false // from the most recent pointer type, so hybrid laptops work both ways

function placeTip() {
  const tip = $("tip")
  tip.classList.toggle("docked", touchMode)
  if (touchMode) return // CSS pins it to the screen edge
  const width = tip.offsetWidth,
    height = tip.offsetHeight
  let x = tipX - width - 16,
    y = tipY - 10
  if (x < 8) x = tipX + 18
  if (y + height > innerHeight - 8) y = innerHeight - height - 8
  tip.style.left = x + "px"
  tip.style.top = Math.max(8, y) + "px"
}

// Re-renders the open tooltip (its numbers change as the game runs)
export function refreshTip() {
  if (!tipKey) return
  $("tip").innerHTML = tipHTML(tipKey)
  placeTip()
}

export function hideTip() {
  tipKey = null
  $("tip").style.display = "none"
}

export function wireTooltips() {
  document.addEventListener(
    "pointerdown",
    (event) => {
      touchMode = event.pointerType === "touch"
    },
    true
  )
  document.addEventListener("mouseover", (event) => {
    /** @type {HTMLElement} */
    const target = /** @type {HTMLElement} */ (event.target).closest("[data-tooltip]")
    if (!target) {
      hideTip()
      return
    }
    if (touchMode) {
      // put the panel on the half of the screen away from what was tapped
      const rect = target.getBoundingClientRect()
      $("tip").classList.toggle("top", rect.top + rect.height / 2 > innerHeight / 2)
    }
    if (target.dataset.tooltip !== tipKey) {
      tipKey = target.dataset.tooltip
      $("tip").style.display = "block"
      refreshTip()
    }
  })
  document.addEventListener("mousemove", (event) => {
    tipX = event.clientX
    tipY = event.clientY
    if (tipKey && !touchMode) placeTip()
  })
}
