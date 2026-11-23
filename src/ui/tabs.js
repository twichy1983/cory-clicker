// The tabbed panel under the market: Rap Sheet, Stats, Achievements and Save.
import { game } from "../game.js";
import { UPGRADES } from "../core/data/upgrades.js";
import { ACH, ACH_CATS } from "../core/achievements.js";
import { totalJobWins } from "../core/jobs.js";
import { fmt, money, fmtDuration } from "../core/format.js";
import { $, esc } from "./dom.js";

export const tabVisible = name => !$("tab-" + name).hidden;

export function renderStats() {
  const { S, D } = game;
  const rows = [
    ["Company", esc(S.company)],
    ["Cash on hand", money(S.dollars)],
    ["Earned this run", money(S.runEarned)],
    ["Earned all time", money(S.allTimeEarned)],
    ["Income per second", money(D.cps)],
    ["Dollar clicks", fmt(S.clicks)],
    ["Earned by clicking", money(S.clickEarned)],
    ["Industries owned", fmt(S.owned.reduce((a, b) => a + b, 0))],
    ["Upgrades owned", `${Object.keys(S.upgrades).length} / ${UPGRADES.length}`],
    ["Scandals committed", `${D.scandals} / ${UPGRADES.filter(u => u.type === "scandal").length}`],
    ["Fine multiplier", (D.fineMult * 100).toFixed(0) + "%"],
    ["Timer lobbyists", S.timerLobbyists],
    ["Penalty lobbyists", S.penaltyLobbyists],
    ["Fines paid (all time)", money(S.finesPaid)],
    ["Rebates collected", money(S.rebatesCollected)],
    ["Deadlines survived", S.cyclesSurvived],
    ["Bankruptcies", S.bankruptcies],
    ["Achievements", `${Object.keys(S.achievements).length} / ${ACH.length}`],
    ["Play time", fmtDuration(S.playTime * 1000)],
    ["Jobs completed", totalJobWins(S)],
    ["Playing since", new Date(S.startedAt).toLocaleString()],
  ];
  $("stats").innerHTML = rows.map(([a, b]) => `<div><span>${a}</span><span>${b}</span></div>`).join("");
}

let lastAchKey = "";

// Redraws the trophy grid when the unlocked set changes (or always, with force)
export function renderAchievements(force) {
  const S = game.S, got = Object.keys(S.achievements).length;
  $("achTabCount").textContent = got + "/" + ACH.length;
  const key = Object.keys(S.achievements).sort().join(",");
  if (!force && key === lastAchKey && $("achievements").childElementCount) return;
  lastAchKey = key;
  let html = `<div class="achHead"><span>Achievements</span><span>${got} / ${ACH.length}</span></div>
    <div class="achBar"><div style="width:${(got / ACH.length * 100).toFixed(1)}%"></div></div>`;
  for (const cat of ACH_CATS) {
    const list = ACH.filter(a => a.cat === cat), n = list.filter(a => S.achievements[a.id]).length;
    html += `<div class="achCat">${esc(cat)}<span>${n}/${list.length}</span></div><div class="achGrid">` +
      list.map(a => `<div class="ach${S.achievements[a.id] ? "" : " locked"}" data-tt="ach:${a.id}">${S.achievements[a.id] ? a.icon : "🔒"}</div>`).join("") + `</div>`;
  }
  $("achievements").innerHTML = html;
}

export function wireTabs() {
  document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.toggle("on", x === b));
    document.querySelectorAll(".tabBody").forEach(x => { x.hidden = x.id !== "tab-" + b.dataset.tab; });
    if (b.dataset.tab === "stats") renderStats();
    if (b.dataset.tab === "ach") renderAchievements();
  }));
}
