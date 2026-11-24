// The stock market panel: the composite index chart and one small chart per listed industry.
import { game } from "../game.js"
import { INDUSTRIES, TICKERS } from "../core/data/industries.js"
import { MKT_LEN, pctChange } from "../core/market.js"
import { money, fmtShort } from "../core/format.js"
import { $ } from "./dom.js"

const UP_COLOR = "#3ddc84",
  DOWN_COLOR = "#ff5c5c"

function drawChart(canvas, data, big) {
  const dpr = window.devicePixelRatio || 1,
    width = canvas.clientWidth,
    height = canvas.clientHeight
  if (!width || !height) return
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
  }
  const ctx = canvas.getContext("2d")
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)
  const padR = big ? 58 : 5,
    padT = big ? 10 : 5,
    padB = big ? 8 : 5
  const plotW = width - padR,
    plotH = height - padT - padB
  const live = data.filter((value) => value > 0)
  if (data.length < 2 || !live.length) {
    ctx.strokeStyle = "rgba(255,255,255,.15)"
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, height / 2)
    ctx.lineTo(plotW, height / 2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = "#86a092"
    ctx.font = (big ? 13 : 11) + "px Segoe UI, sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(big ? "Market opens when your first industry starts earning" : "Not listed", plotW / 2, height / 2 - 6)
    return
  }
  const start = data.findIndex((value) => value > 0) // line begins at the "IPO" (first earning sample)
  const shown = data.slice(start)
  let low = Math.min(...shown),
    high = Math.max(...shown)
  if (high === low) {
    high = high * 1.05 + 1e-9
    low = low * 0.95
  }
  const span = high - low
  high += span * 0.08
  low = Math.max(0, low - span * 0.08)
  const xForIndex = (index) => ((index + MKT_LEN - data.length) / (MKT_LEN - 1)) * plotW // right-aligned: newest sample at the right edge
  const yForValue = (value) => padT + (1 - (value - low) / (high - low)) * plotH
  const color = data[data.length - 1] >= (live[0] || 0) ? UP_COLOR : DOWN_COLOR

  if (big) {
    // recessive grid + right-hand axis labels
    ctx.font = "11px Consolas, monospace"
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    for (let gridLine = 0; gridLine <= 3; gridLine++) {
      const value = low + (high - low) * (gridLine / 3),
        y = yForValue(value)
      ctx.strokeStyle = "rgba(255,255,255,.06)"
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, Math.round(y) + 0.5)
      ctx.lineTo(plotW, Math.round(y) + 0.5)
      ctx.stroke()
      ctx.fillStyle = "#86a092"
      ctx.fillText(fmtShort(value), plotW + 6, y)
    }
  }
  // area + line
  ctx.beginPath()
  for (let i = start; i < data.length; i++) {
    const x = xForIndex(i),
      y = yForValue(data[i])
    i > start ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
  }
  ctx.lineWidth = 2
  ctx.lineJoin = "round"
  ctx.strokeStyle = color
  ctx.stroke()
  ctx.lineTo(xForIndex(data.length - 1), padT + plotH)
  ctx.lineTo(xForIndex(start), padT + plotH)
  ctx.closePath()
  const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH)
  grad.addColorStop(0, color + "40")
  grad.addColorStop(1, color + "00")
  ctx.fillStyle = grad
  ctx.fill()
  // latest point
  const lastX = xForIndex(data.length - 1),
    lastY = yForValue(data[data.length - 1])
  ctx.beginPath()
  ctx.arc(lastX, lastY, big ? 4 : 3, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = "#070b09"
  ctx.stroke()

  if (big && game.mkt.hover >= start && game.mkt.hover < data.length) {
    // crosshair + readout
    const hoverIndex = game.mkt.hover,
      x = xForIndex(hoverIndex),
      y = yForValue(data[hoverIndex])
    ctx.strokeStyle = "rgba(255,255,255,.35)"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(Math.round(x) + 0.5, padT)
    ctx.lineTo(Math.round(x) + 0.5, padT + plotH)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = "#070b09"
    ctx.lineWidth = 2
    ctx.stroke()
    const ago = data.length - 1 - hoverIndex
    const label = `${money(data[hoverIndex])}/s · ${ago ? ago + "s ago" : "now"}`
    ctx.font = "bold 12px Segoe UI, sans-serif"
    ctx.textBaseline = "middle"
    const boxWidth = ctx.measureText(label).width + 14
    let boxX = x + 10
    if (boxX + boxWidth > plotW) boxX = x - 10 - boxWidth
    ctx.fillStyle = "rgba(10,15,13,.95)"
    ctx.strokeStyle = "#3a5446"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect ? ctx.roundRect(boxX, padT + 2, boxWidth, 22, 4) : ctx.rect(boxX, padT + 2, boxWidth, 22)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = "#eafff1"
    ctx.textAlign = "left"
    ctx.fillText(label, boxX + 7, padT + 13)
  }
}
const tkEls = []
let lastTickerKey = null
function rebuildTickers() {
  const listed = INDUSTRIES.map((_, i) => i).filter((i) => game.state.owned[i] > 0)
  const key = listed.join(",")
  if (key === lastTickerKey) return
  lastTickerKey = key
  const wrap = $("tickers")
  wrap.innerHTML = ""
  tkEls.length = 0
  if (!listed.length) {
    wrap.innerHTML = `<div class="empty">No listed companies yet. Buy an industry to take it public.</div>`
    return
  }
  listed.forEach((i) => {
    const row = document.createElement("div")
    row.className = "tk"
    row.dataset.tooltip = "mkt:" + i
    row.innerHTML = `<div class="tkTop"><span class="tkSym">${INDUSTRIES[i].icon} ${TICKERS[i]}</span><span class="tkPx"></span></div><div class="chg"></div><canvas></canvas>`
    wrap.appendChild(row)
    tkEls.push({
      i,
      price: row.querySelector(".tkPx"),
      chg: row.querySelector(".chg"),
      canvas: row.querySelector("canvas")
    })
  })
}
function setChange(element, history) {
  const change = pctChange(history)
  element.classList.toggle("up", change !== null && change >= 0)
  element.classList.toggle("down", change !== null && change < 0)
  element.textContent = change === null ? "—" : (change >= 0 ? "▲ +" : "▼ ") + change.toFixed(2) + "% (3m)"
}
// Redraws every chart (called once a second, on resize and after a reset)
export function drawMarket() {
  rebuildTickers()
  const idx = game.mkt.idx
  $("idxPx").textContent = money(idx[idx.length - 1] || 0) + "/s"
  setChange($("idxChg"), idx)
  drawChart($("idxChart"), idx, true)
  tkEls.forEach((entry) => {
    const history = game.mkt.ind[entry.i]
    entry.price.textContent = fmtShort(history[history.length - 1] || 0)
    setChange(entry.chg, history)
    drawChart(entry.canvas, history, false)
  })
}
// Forget the ticker layout so the next draw rebuilds it (after a new game, import or bankruptcy)
export function resetTickers() {
  lastTickerKey = null
}

// Crosshair on the index chart. Called once from main.js.
export function wireMarket() {
  $("idxChart").addEventListener("mousemove", (event) => {
    const rect = event.currentTarget.getBoundingClientRect(),
      plotW = rect.width - 58,
      count = game.mkt.idx.length
    const hoverIndex = Math.round(((event.clientX - rect.left) / plotW) * (MKT_LEN - 1)) - (MKT_LEN - count)
    game.mkt.hover = Math.max(0, Math.min(count - 1, hoverIndex))
    drawChart($("idxChart"), game.mkt.idx, true)
  })
  $("idxChart").addEventListener("mouseleave", () => {
    game.mkt.hover = -1
    drawChart($("idxChart"), game.mkt.idx, true)
  })
  window.addEventListener("resize", drawMarket)
}
