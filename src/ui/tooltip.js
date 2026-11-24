// Hover details for anything with a data-tt="kind:id" attribute.
// With a mouse the panel follows the pointer; on touch screens CSS docks it to the top or bottom edge.
import { game } from "../game.js";
import { HOUR } from "../core/constants.js";
import { INDUSTRIES, TICKERS } from "../core/data/industries.js";
import { UPG_BY_ID } from "../core/data/upgrades.js";
import { ACH_BY_ID } from "../core/achievements.js";
import { pctChange } from "../core/market.js";
import {
  jobCooldown,
  jobPay,
  jobPaySecs,
  jobTimeLeft,
  jobUnlocked,
} from "../core/jobs.js";
import {
  buildingCost,
  maxTimer,
  timerLobbyCost,
  penaltyLobbyCost,
  timerFireCost,
  penaltyFireCost,
  upgradeCost,
} from "../core/economy.js";
import { money, mmss } from "../core/format.js";
import { JOB_BY_ID } from "../jobs/index.js";
import { $, esc } from "./dom.js";
import { buyAmt, isMystery } from "./store.js";

function industryTip(i) {
  const { S, D } = game,
    ind = INDUSTRIES[i];
  if (isMystery(i))
    return `<div class="tn">🔍 Rumored acquisition</div><div class="td">Your analysts are circling a new division. Earn ${money(ind.base * 0.5)} this run to find out what it is.</div>`;
  const each = ind.cps * D.indMult[i],
    share = D.cps ? (D.indCps[i] / D.cps) * 100 : 0;
  return `<div class="tn">${ind.icon} ${esc(ind.name)}</div><div class="ts">${esc(ind.sector)}</div>
    <div class="td">${esc(ind.flavor)}</div>
    <div>Each produces <b>${money(each)}/s</b> (base ${money(ind.cps)} × ${D.indMult[i].toFixed(2)})</div>
    <div>${S.owned[i]} owned producing <b>${money(D.indCps[i])}/s</b> (${share.toFixed(1)}% of income)</div>
    <div class="tc">Cost: ${money(buildingCost(S, i, buyAmt))}${buyAmt > 1 ? " for " + buyAmt : ""}</div>`;
}

function upgradeTip(id) {
  const u = UPG_BY_ID[id];
  if (!u) return "";
  let sec,
    bonus,
    pen = "";
  if (u.type === "scandal") {
    sec = INDUSTRIES[u.ind].sector + " · Scandal";
    bonus = `+10% ${esc(INDUSTRIES[u.ind].name)} output`;
    pen = `<div class="tp">Penalty: +1% Regulatory Fines</div>`;
  } else if (u.type === "mult") {
    sec = INDUSTRIES[u.ind].sector + " · Efficiency";
    bonus = `${esc(INDUSTRIES[u.ind].name)} output ×2`;
  } else {
    sec = "Clicking";
    bonus =
      u.kind === "x2"
        ? "Click power ×2"
        : "Clicks also earn +1% of your income per second";
  }
  return `<div class="tn">${u.icon} ${esc(u.name)}</div><div class="ts">${esc(sec)}</div><div class="td">${esc(u.desc)}</div>
    <div class="tb">Bonus: ${bonus}</div>${pen}<div class="tc">Cost: ${money(upgradeCost(u))}</div>`;
}

function fireTip(id) {
  const S = game.S,
    timer = id === "timer",
    n = timer ? S.timerLobbyists : S.penaltyLobbyists;
  return `<div class="tn">🔥 Fire a ${timer ? "Timer" : "Penalty"} Lobbyist</div>
    <div class="td">Lobbyists know where the bodies are buried. Their severance packages reflect that.</div>
    <div class="tp">${timer ? "−1 hour from the deadline window and the current countdown (always leaves at least 1 minute)" : "+1% regulatory fine multiplier"}</div>
    <div>Hired: ${n}</div>
    <div class="tc">${n ? "Severance: " + money(timer ? timerFireCost(S) : penaltyFireCost(S)) + " (2× the last hire)" : "Nobody to fire"}</div>`;
}

function lobbyTip(id) {
  const { S, D } = game;
  if (id === "timer")
    return `<div class="tn">⏳ Timer Lobbyist</div><div class="td">Convinces a subcommittee that deadlines are more of a suggestion.</div>
    <div class="tb">+1 hour to the regulatory timer (also extends the current countdown)</div>
    <div>Owned: ${S.timerLobbyists} · Window: ${maxTimer(S) / HOUR}h</div><div class="tc">Cost: ${money(timerLobbyCost(S))}</div>`;
  return `<div class="tn">🤝 Penalty Lobbyist</div><div class="td">Rewrites the penalty schedule over a very long lunch.</div>
    <div class="tb">−1% regulatory fine multiplier. Below 0%, fines turn into revenue paid to you.</div>
    <div>Owned: ${S.penaltyLobbyists} · Multiplier now: ${(D.fineMult * 100).toFixed(0)}%</div><div class="tc">Cost: ${money(penaltyLobbyCost(S))}</div>`;
}

function jobTip(id) {
  const { S, D } = game,
    j = JOB_BY_ID[id];
  if (!j) return "";
  const ind = INDUSTRIES[j.ind],
    left = jobTimeLeft(S, j, Date.now()),
    cdMin = jobCooldown(j) / 60000;
  const status = !jobUnlocked(S, j)
    ? "Acquire a " + esc(ind.name) + " to unlock."
    : left
      ? "Available again in " + mmss(left)
      : `Ready now. Playable once every ${cdMin >= 1 ? cdMin + " minutes" : Math.round(cdMin * 60) + " seconds"}, win or lose.`;
  return `<div class="tn">${j.icon} ${esc(j.name)}</div><div class="ts">Job · ${esc(ind.name)}</div>
    <div class="td">${esc(j.blurb)}</div>
    <div>${j.game.time}-second minigame. ${S.jobWins[j.id] ? "Completed " + S.jobWins[j.id] + "×." : ""}</div>
    <div class="tb">Reward: ${money(jobPay(D, j))} (${jobPaySecs(j) / 60} minutes of ${esc(ind.name)} income)</div>
    <div class="tc">${status}</div>`;
}

function achievementTip(id) {
  const a = ACH_BY_ID[id];
  if (!a) return "";
  const when = game.S.achievements[id];
  return `<div class="tn">${when ? a.icon : "🔒"} ${esc(a.name)}</div><div class="ts">${esc(a.cat)}</div>
    <div class="td">${esc(a.desc)}</div>
    ${when ? `<div class="tb">Unlocked ${new Date(when).toLocaleString()}</div>` : `<div style="color:var(--muted)">Locked</div>`}`;
}

function stockTip(i) {
  const { D, mkt } = game,
    ind = INDUSTRIES[i],
    h = mkt.ind[i],
    m = mkt.mood[i],
    c = pctChange(h);
  const moodTxt = m > 1.04 ? "Bullish 🐂" : m < 0.96 ? "Bearish 🐻" : "Neutral";
  return `<div class="tn">${ind.icon} ${TICKERS[i]} · ${esc(ind.name)}</div><div class="ts">${esc(ind.sector)}</div>
    <div>Share price: <b>${money(h[h.length - 1] || 0)}</b></div>
    <div>Actual income: <b>${money(D.indCps[i])}/s</b></div>
    <div>Investor mood: <b>${moodTxt}</b> (${(m * 100).toFixed(0)}% of income)</div>
    <div>3-minute change: <b>${c === null ? "n/a" : (c >= 0 ? "▲ +" : "▼ ") + c.toFixed(1) + "%"}</b></div>
    <div class="td">The price tracks this industry's income per second. Scandals spook investors for a minute or two.</div>`;
}

const TIPS = {
  bld: (id) => industryTip(+id),
  upg: upgradeTip,
  fire: fireTip,
  lobby: lobbyTip,
  job: jobTip,
  ach: achievementTip,
  mkt: (id) => stockTip(+id),
};

function tipHTML(key) {
  const [kind, id] = key.split(":");
  return TIPS[kind] ? TIPS[kind](id) : "";
}

/* ---------- showing and placing the panel ---------- */

let tipKey = null,
  tipX = 0,
  tipY = 0;
let touchMode = false; // from the most recent pointer type, so hybrid laptops work both ways

function placeTip() {
  const tip = $("tip");
  tip.classList.toggle("docked", touchMode);
  if (touchMode) return; // CSS pins it to the screen edge
  const w = tip.offsetWidth,
    h = tip.offsetHeight;
  let x = tipX - w - 16,
    y = tipY - 10;
  if (x < 8) x = tipX + 18;
  if (y + h > innerHeight - 8) y = innerHeight - h - 8;
  tip.style.left = x + "px";
  tip.style.top = Math.max(8, y) + "px";
}

// Re-renders the open tooltip (its numbers change as the game runs)
export function refreshTip() {
  if (!tipKey) return;
  $("tip").innerHTML = tipHTML(tipKey);
  placeTip();
}

export function hideTip() {
  tipKey = null;
  $("tip").style.display = "none";
}

export function wireTooltips() {
  document.addEventListener(
    "pointerdown",
    (e) => {
      touchMode = e.pointerType === "touch";
    },
    true,
  );
  document.addEventListener("mouseover", (e) => {
    const t = e.target.closest("[data-tt]");
    if (!t) {
      hideTip();
      return;
    }
    if (touchMode) {
      // put the panel on the half of the screen away from what was tapped
      const r = t.getBoundingClientRect();
      $("tip").classList.toggle("top", r.top + r.height / 2 > innerHeight / 2);
    }
    if (t.dataset.tt !== tipKey) {
      tipKey = t.dataset.tt;
      $("tip").style.display = "block";
      refreshTip();
    }
  });
  document.addEventListener("mousemove", (e) => {
    tipX = e.clientX;
    tipY = e.clientY;
    if (tipKey && !touchMode) placeTip();
  });
}
