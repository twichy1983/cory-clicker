// The tabbed panel under the market: Rap Sheet, Stats, Achievements and Save.
import { game } from "../game.js"
import { UPGRADES } from "../core/data/upgrades.js"
import { ACH, ACH_CATS } from "../core/achievements.js"
import { totalJobWins } from "../core/jobs.js"
import { ACHIEVEMENT_BONUS } from "../core/constants.js"
import { fmt, money, fmtDuration } from "../core/format.js"
import { $, esc } from "./dom.js"

export const tabVisible = (name) => !$("tab-" + name).hidden

export function renderStats() {
  const { state, derived } = game
  const rows = [
    ["Company", esc(state.company)],
    ["Cash on hand", money(state.dollars)],
    ["Earned this run", money(state.runEarned)],
    ["Earned all time", money(state.allTimeEarned)],
    ["Income per second", money(derived.cps)],
    ["Dollar clicks", fmt(state.clicks)],
    ["Earned by clicking", money(state.clickEarned)],
    ["Industries owned", fmt(state.owned.reduce((sum, count) => sum + count, 0))],
    ["Upgrades owned", `${Object.keys(state.upgrades).length} / ${UPGRADES.length}`],
    ["Scandals committed", `${derived.scandals} / ${UPGRADES.filter((upgrade) => upgrade.type === "scandal").length}`],
    ["Fine multiplier", (derived.fineMult * 100).toFixed(0) + "%"],
    ["Timer lobbyists", state.timerLobbyists],
    ["Penalty lobbyists", state.penaltyLobbyists],
    ["Fines paid (all time)", money(state.finesPaid)],
    ["Rebates collected", money(state.rebatesCollected)],
    ["Deadlines survived", state.cyclesSurvived],
    ["Bankruptcies", state.bankruptcies],
    ["Achievements", `${Object.keys(state.achievements).length} / ${ACH.length}`],
    ["Income bonus from achievements", `+${Math.round((derived.achievementMult - 1) * 100)}%`],
    ["Company-wide multiplier", "×" + fmt(derived.allMult)],
    ["Play time", fmtDuration(state.playTime * 1000)],
    ["Jobs completed", totalJobWins(state)],
    ["Playing since", new Date(state.startedAt).toLocaleString()]
  ]
  $("stats").innerHTML = rows.map(([label, value]) => `<div><span>${label}</span><span>${value}</span></div>`).join("")
}

let lastAchKey = ""

// Redraws the trophy grid when the unlocked set changes (or always, with force)
export function renderAchievements(force) {
  const state = game.state,
    got = Object.keys(state.achievements).length
  $("achTabCount").textContent = got + "/" + ACH.length
  const key = Object.keys(state.achievements).sort().join(",")
  if (!force && key === lastAchKey && $("achievements").childElementCount) return
  lastAchKey = key
  let html = `<div class="achHead"><span>Achievements · +${Math.round(ACHIEVEMENT_BONUS * 100)}% income each</span><span>${got} / ${ACH.length}</span></div>
    <div class="achBar"><div style="width:${((got / ACH.length) * 100).toFixed(1)}%"></div></div>`
  for (const cat of ACH_CATS) {
    const list = ACH.filter((achievement) => achievement.cat === cat),
      count = list.filter((achievement) => state.achievements[achievement.id]).length
    html +=
      `<div class="achCat">${esc(cat)}<span>${count}/${list.length}</span></div><div class="achGrid">` +
      list
        .map(
          (achievement) =>
            `<div class="ach${state.achievements[achievement.id] ? "" : " locked"}" data-tooltip="ach:${achievement.id}">${state.achievements[achievement.id] ? achievement.icon : "🔒"}</div>`
        )
        .join("") +
      `</div>`
  }
  $("achievements").innerHTML = html
}

export function wireTabs() {
  document.querySelectorAll(".tab").forEach((/** @type {HTMLElement} */ tab) =>
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((otherTab) => otherTab.classList.toggle("on", otherTab === tab))
      document.querySelectorAll(".tabBody").forEach((/** @type {HTMLElement} */ panel) => {
        panel.hidden = panel.id !== "tab-" + tab.dataset.tab
      })
      if (tab.dataset.tab === "stats") renderStats()
      if (tab.dataset.tab === "ach") renderAchievements()
    })
  )
}
