// The middle column: cash, the big dollar, the news ticker, the regulatory panel and the lobbyists.
import { game } from "../game.js";
import { HOUR, BASE_FINE_RATE } from "../core/constants.js";
import {
  maxTimer,
  timerLobbyCost,
  penaltyLobbyCost,
  timerFireCost,
  penaltyFireCost,
} from "../core/economy.js";
import { newsLine } from "../core/news.js";
import { money, fmtTime } from "../core/format.js";
import { GAME_TITLE } from "../config.js";
import { $ } from "./dom.js";

export function renderHud() {
  const { S, D } = game,
    now = Date.now();
  $("dollars").textContent = money(S.dollars);
  $("cps").textContent = "per second: " + money(D.cps);
  $("clickInfo").textContent = "+" + money(D.clickPower) + " per click";

  // Regulatory panel
  const left = S.deadline - now,
    rebate = S.fines < 0,
    urgent = !rebate && S.fines > 0 && left < HOUR;
  const reg = $("reg");
  reg.classList.toggle("rebate", rebate || (S.fines === 0 && D.fineMult < 0));
  reg.classList.toggle("urgent", urgent);
  $("regHead").textContent = rebate
    ? "✔ REGULATORY CAPTURE ACHIEVED ✔"
    : "⚠ FEDERAL REGULATORY ENFORCEMENT ⚠";
  $("regLabel").textContent = rebate ? "REBATE OWED TO YOU" : "FINES OWED";
  $("fineAmt").textContent = money(Math.abs(S.fines));
  $("timerLabel").firstChild.textContent = rebate
    ? "PAYOUT IN"
    : "PAYMENT DUE IN";
  $("fineTimer").textContent = fmtTime(left);
  $("fineBar").style.width =
    Math.max(0, Math.min(100, (left / maxTimer(S)) * 100)) + "%";
  const pct = (D.fineMult * 100).toFixed(0);
  $("fineInfo").innerHTML =
    `Fines accrue at ${(BASE_FINE_RATE * 100).toFixed(0)}% of all revenue × <b>${pct}%</b> multiplier ` +
    `(+${D.scandals}% scandals, −${S.penaltyLobbyists}% lobbyists)<br>` +
    `${rebate || D.fineMult < 0 ? "Currently accruing rebate" : "Currently accruing"}: <b>${money(Math.abs(D.cps * BASE_FINE_RATE * D.fineMult))}/s</b> · Deadline window: ${maxTimer(S) / HOUR}h`;
  const pay = $("payBtn");
  if (S.fines > 0) {
    pay.disabled = S.dollars < S.fines;
    pay.textContent = pay.disabled
      ? `SHORT ${money(S.fines - S.dollars)} — CAN'T PAY`
      : `PAY ${money(S.fines)} NOW`;
  } else {
    pay.disabled = false;
    pay.textContent = rebate
      ? `COLLECT ${money(-S.fines)} REBATE`
      : "FILE COMPLIANCE REPORT";
  }
  document.body.classList.toggle("danger", urgent);
  document.title = urgent
    ? `⚠ ${fmtTime(left)} FINES DUE ⚠`
    : `${money(S.dollars)} · ${GAME_TITLE}`;

  // Lobbyists
  const tc = timerLobbyCost(S),
    pc = penaltyLobbyCost(S),
    tf = timerFireCost(S),
    pf = penaltyFireCost(S);
  $("timerLobbyN").textContent = S.timerLobbyists;
  $("timerLobbyC").textContent = money(tc);
  $("timerLobbyBtn").classList.toggle("cant", S.dollars < tc);
  $("penaltyLobbyN").textContent = S.penaltyLobbyists;
  $("penaltyLobbyC").textContent = money(pc);
  $("penaltyLobbyBtn").classList.toggle("cant", S.dollars < pc);
  $("timerFireC").textContent = S.timerLobbyists ? money(tf) : "none hired";
  $("timerFireBtn").disabled = !S.timerLobbyists || S.dollars < tf;
  $("penaltyFireC").textContent = S.penaltyLobbyists ? money(pf) : "none hired";
  $("penaltyFireBtn").disabled = !S.penaltyLobbyists || S.dollars < pf;
}

// The pop animation and floating "+$5" after a click on the big dollar
export function showClickFeedback(amount, ev) {
  const btn = $("bigDollar");
  btn.classList.remove("pop");
  void btn.offsetWidth; // restart the CSS animation
  btn.classList.add("pop");
  const r = btn.getBoundingClientRect();
  const x = ev && ev.clientX ? ev.clientX : r.left + r.width / 2;
  const y = ev && ev.clientY ? ev.clientY : r.top + r.height / 2;
  const f = document.createElement("div");
  f.className = "floater";
  f.textContent = "+" + money(amount);
  f.style.left = x - 20 + (Math.random() * 30 - 15) + "px";
  f.style.top = y - 30 + "px";
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1000);
}

export function setNews() {
  $("tickerText").textContent = newsLine(game.S, game.D, Date.now());
}

// Fades the ticker out, swaps the headline, fades back in
export function rotateNews() {
  const t = $("ticker");
  t.style.opacity = 0;
  setTimeout(() => {
    setNews();
    t.style.opacity = 1;
  }, 400);
}
