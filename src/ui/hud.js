// The middle column: cash, the big dollar, the news ticker, the regulatory panel and the lobbyists.
import { game } from "../game.js"
import { HOUR, BASE_FINE_RATE } from "../core/constants.js"
import { maxTimer, timerLobbyCost, penaltyLobbyCost, timerFireCost, penaltyFireCost } from "../core/economy.js"
import { newsLine } from "../core/news.js"
import { money, fmtTime } from "../core/format.js"
import { GAME_TITLE } from "../config.js"
import { $ } from "./dom.js"

export function renderHud() {
  const { state, derived } = game,
    now = Date.now()
  $("dollars").textContent = money(state.dollars)
  $("cps").textContent = "per second: " + money(derived.cps)
  $("clickInfo").textContent = "+" + money(derived.clickPower) + " per click"

  // Regulatory panel
  const left = state.deadline - now,
    rebate = state.fines < 0,
    urgent = !rebate && state.fines > 0 && left < HOUR
  const reg = $("reg")
  reg.classList.toggle("rebate", rebate || (state.fines === 0 && derived.fineMult < 0))
  reg.classList.toggle("urgent", urgent)
  $("regHead").textContent = rebate ? "✔ REGULATORY CAPTURE ACHIEVED ✔" : "⚠ FEDERAL REGULATORY ENFORCEMENT ⚠"
  $("regLabel").textContent = rebate ? "REBATE OWED TO YOU" : "FINES OWED"
  $("fineAmt").textContent = money(Math.abs(state.fines))
  $("timerLabel").firstChild.textContent = rebate ? "PAYOUT IN" : "PAYMENT DUE IN"
  $("fineTimer").textContent = fmtTime(left)
  $("fineBar").style.width = Math.max(0, Math.min(100, (left / maxTimer(state)) * 100)) + "%"
  const pct = (derived.fineMult * 100).toFixed(0)
  $("fineInfo").innerHTML =
    `Fines accrue at ${(BASE_FINE_RATE * 100).toFixed(0)}% of all revenue × <b>${pct}%</b> multiplier ` +
    `(+${derived.scandals}% scandals, −${state.penaltyLobbyists}% lobbyists)<br>` +
    `${rebate || derived.fineMult < 0 ? "Currently accruing rebate" : "Currently accruing"}: <b>${money(Math.abs(derived.cps * BASE_FINE_RATE * derived.fineMult))}/s</b> · Deadline window: ${maxTimer(state) / HOUR}h`
  const pay = $("payBtn")
  if (state.fines > 0) {
    pay.disabled = state.dollars < state.fines
    pay.textContent = pay.disabled
      ? `SHORT ${money(state.fines - state.dollars)} — CAN'T PAY`
      : `PAY ${money(state.fines)} NOW`
  } else {
    pay.disabled = false
    pay.textContent = rebate ? `COLLECT ${money(-state.fines)} REBATE` : "FILE COMPLIANCE REPORT"
  }
  document.body.classList.toggle("danger", urgent)
  document.title = urgent ? `⚠ ${fmtTime(left)} FINES DUE ⚠` : `${money(state.dollars)} · ${GAME_TITLE}`

  // Lobbyists
  const tc = timerLobbyCost(state),
    pc = penaltyLobbyCost(state),
    tf = timerFireCost(state),
    pf = penaltyFireCost(state)
  $("timerLobbyN").textContent = state.timerLobbyists
  $("timerLobbyC").textContent = money(tc)
  $("timerLobbyBtn").classList.toggle("cant", state.dollars < tc)
  $("penaltyLobbyN").textContent = state.penaltyLobbyists
  $("penaltyLobbyC").textContent = money(pc)
  $("penaltyLobbyBtn").classList.toggle("cant", state.dollars < pc)
  $("timerFireC").textContent = state.timerLobbyists ? money(tf) : "none hired"
  $("timerFireBtn").disabled = !state.timerLobbyists || state.dollars < tf
  $("penaltyFireC").textContent = state.penaltyLobbyists ? money(pf) : "none hired"
  $("penaltyFireBtn").disabled = !state.penaltyLobbyists || state.dollars < pf
}

// The pop animation and floating "+$5" after a click on the big dollar
export function showClickFeedback(amount, ev) {
  const btn = $("bigDollar")
  btn.classList.remove("pop")
  void btn.offsetWidth // restart the CSS animation
  btn.classList.add("pop")
  const rect = btn.getBoundingClientRect()
  const x = ev && ev.clientX ? ev.clientX : rect.left + rect.width / 2
  const y = ev && ev.clientY ? ev.clientY : rect.top + rect.height / 2
  const floater = document.createElement("div")
  floater.className = "floater"
  floater.textContent = "+" + money(amount)
  floater.style.left = x - 20 + (Math.random() * 30 - 15) + "px"
  floater.style.top = y - 30 + "px"
  document.body.appendChild(floater)
  setTimeout(() => floater.remove(), 1000)
}

export function setNews() {
  $("tickerText").textContent = newsLine(game.state, game.derived, Date.now())
}

// Fades the ticker out, swaps the headline, fades back in
export function rotateNews() {
  const ticker = $("ticker")
  ticker.style.opacity = 0
  setTimeout(() => {
    setNews()
    ticker.style.opacity = 1
  }, 400)
}
