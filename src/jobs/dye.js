import { JW, JH, pick, rr, vgrad, INK, emoji, label, plainText, button, inBox } from "./draw.js"
import { floatText, burst, endJob } from "./framework.js"

/* ---------------------------------------------------------
   JOB: NEON SNACK LAB (Additive Laboratory)
   Add dye drops until the batch matches the order card.
   --------------------------------------------------------- */
const DYES = {
  r: { name: "COAL TAR RED", rgb: [226, 35, 40], x: 210 },
  y: { name: "PETRO YELLOW", rgb: [255, 214, 10], x: 410 },
  b: { name: "BLUE #???", rgb: [10, 110, 230], x: 610 }
}
const DYE_BASE = [236, 226, 205]
const DYE_ORDERS = [
  { name: "Sunset Orange", r: 1, y: 2, b: 0 },
  { name: "Toxic Lime", r: 0, y: 2, b: 1 },
  { name: "Grape Escape", r: 1, y: 0, b: 1 },
  { name: "Electric Teal", r: 0, y: 1, b: 2 },
  { name: "Hot Lava Red", r: 2, y: 1, b: 0 },
  { name: "Swamp Surprise", r: 1, y: 2, b: 1 },
  { name: "Blue-ish Raspberry", r: 0, y: 0, b: 2 },
  { name: "Cheese Dust", r: 0, y: 3, b: 0 },
  { name: "Mystery Purple", r: 2, y: 0, b: 1 }
]
const DYE_GOAL = 5,
  DYE_BOTTLE_Y = 610,
  DYE_FLUSH = { x: 1110, y: 690, w: 230, h: 110 }
function dyeColor(d) {
  const total = d.r + d.y + d.b
  if (!total) return DYE_BASE
  const mix = [0, 1, 2].map(
    (i) =>
      Math.pow(Math.max(8, DYES.r.rgb[i]), d.r / total) *
      Math.pow(Math.max(8, DYES.y.rgb[i]), d.y / total) *
      Math.pow(Math.max(8, DYES.b.rgb[i]), d.b / total)
  )
  const f = Math.min(1, 0.45 + total * 0.18)
  return DYE_BASE.map((c, i) => Math.round(c + (mix[i] - c) * f))
}
const rgbStr = (c) => `rgb(${c[0]},${c[1]},${c[2]})`
function dyeMatch(G) {
  const a = dyeColor(G.drops),
    b = dyeColor(G.order)
  return Math.max(0, Math.round(100 - Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) * 0.55))
}
const DyeGame = {
  time: 35,
  meter: "FORMULAS SHIPPED",
  tagline:
    "Sugar Bombz cereal is marketed to toddlers, so it has to glow like a slot machine. Mix industrial dyes to match the client's color. Regulators have 'concerns.' You have quarterly targets.",
  rules: [
    "<b>Click a dye bottle</b> to add one drop of coal-tar color to the batch.",
    "Match the <b>order card color</b>. The match meter shows how close you are.",
    "At a <b>100% match</b> the batch ships automatically, straight to a cereal aisle near you.",
    "Overshot it? <b>Flush</b> the batch down the drain (into the same lake as everything else).",
    `Ship <b>${DYE_GOAL === 1 ? "the formula" : DYE_GOAL + " formulas"}</b> before time runs out.`
  ],
  winTitle: "Taste the rainbow (of lawsuits)!",
  winText: "Five neon formulas shipped. Toddlers nationwide are now vibrating at a frequency only dogs can hear.",
  lose: {
    time: "Time's up. The client went with a lab that has even fewer scruples and faster hands."
  },
  init(G) {
    Object.assign(G, {
      shipped: 0,
      drops: { r: 0, y: 0, b: 0 },
      flushT: 0,
      shipT: 0,
      falling: [],
      used: []
    })
    dyeNewOrder(G)
  },
  step(G, dt) {
    G.flushT = Math.max(0, G.flushT - dt)
    for (const f of G.falling) f.t += dt
    const landed = G.falling.filter((f) => f.t >= 0.35)
    G.falling = G.falling.filter((f) => f.t < 0.35)
    landed.forEach((f) => {
      G.drops[f.k]++
      G.splashT = 0.3
    })
    G.splashT = Math.max(0, (G.splashT || 0) - dt)
    if (G.shipT > 0) {
      if ((G.shipT -= dt) <= 0) {
        G.shipped++
        if (G.shipped >= DYE_GOAL) endJob("win")
        else dyeNewOrder(G)
      }
    } else if (!G.falling.length && dyeMatch(G) >= 99 && G.drops.r + G.drops.y + G.drops.b > 0) {
      G.shipT = 0.8
      floatText("SHIPPED!", 836, 300)
      burst(836, 380, rgbStr(dyeColor(G.drops)), 22)
    }
    G.pct = ((G.shipped + (G.shipT > 0 ? 1 : 0)) / DYE_GOAL) * 100
    G.meterText = `${G.shipped + (G.shipT > 0 ? 1 : 0)} / ${DYE_GOAL}`
  },
  cursor(G, x, y) {
    return !!dyeBottleAt(x, y) || inBox(x, y, DYE_FLUSH)
  },
  down(G, x, y) {
    if (G.shipT > 0 || G.flushT > 0) return
    const k = dyeBottleAt(x, y)
    if (k) {
      G.falling.push({ k, t: 0, x: DYES[k].x })
      return
    }
    if (inBox(x, y, DYE_FLUSH)) {
      G.drops = { r: 0, y: 0, b: 0 }
      G.falling = []
      G.flushT = 0.9
      floatText("Flushed", 836, 420, true)
    }
  },
  draw(ctx, G, now) {
    ctx.fillStyle = vgrad(ctx, 0, 560, [
      [0, "#22313b"],
      [1, "#2f4250"]
    ])
    ctx.fillRect(0, 0, JW, 560)
    ctx.fillStyle = "#3a2a1d"
    ;[200, 380].forEach((y) => {
      rr(ctx, 60, y, 560, 20, 6)
      ctx.fill()
    })
    ;["⚗️", "🧪", "🧫", "🧴", "⚗️"].forEach((e, i) => emoji(ctx, e, 110 + i * 110, 160, 60))
    ;["🧪", "🧴", "⚗️", "🧪"].forEach((e, i) => emoji(ctx, e, 130 + i * 130, 340, 60))
    rr(ctx, 60, 440, 560, 70, 10)
    ctx.fillStyle = "#ffd23f"
    ctx.fill()
    ctx.lineWidth = 5
    ctx.strokeStyle = INK
    ctx.stroke()
    plainText(ctx, "⚠ BANNED IN 27 COUNTRIES (NOT OURS)", 340, 475, 24, "#1b1b1b", "center", 900)
    ctx.fillStyle = vgrad(ctx, 540, JH, [
      [0, "#9a6a3e"],
      [1, "#6e4626"]
    ])
    ctx.fillRect(0, 540, JW, JH - 540)
    ctx.strokeStyle = INK
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(0, 540)
    ctx.lineTo(JW, 540)
    ctx.stroke()
    // beaker with the current batch
    const bx = 836,
      btop = 230,
      bbot = 720,
      bw = 300,
      col = dyeColor(G.drops),
      fill = G.flushT > 0 ? 0.25 + 0.75 * (1 - G.flushT / 0.9) : 1
    const level = bbot - (bbot - btop - 60) * 0.7 * fill
    ctx.save()
    rr(ctx, bx - bw / 2, btop, bw, bbot - btop, 40)
    ctx.clip()
    ctx.fillStyle = "rgba(220,240,250,.25)"
    ctx.fillRect(bx - bw / 2, btop, bw, bbot - btop)
    ctx.fillStyle = rgbStr(col)
    ctx.fillRect(bx - bw / 2, level + (G.splashT || 0) * 20, bw, bbot - level)
    ctx.fillStyle = "rgba(255,255,255,.25)"
    for (let i = 0; i < 8; i++) {
      const yy = bbot - ((now * 70 + i * 53) % (bbot - level))
      ctx.beginPath()
      ctx.arc(bx - 110 + i * 30, yy, 7, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
    rr(ctx, bx - bw / 2, btop, bw, bbot - btop, 40)
    ctx.lineWidth = 8
    ctx.strokeStyle = INK
    ctx.stroke()
    rr(ctx, bx - bw / 2 - 20, btop - 16, bw + 40, 30, 10)
    ctx.fillStyle = "#d9eef7"
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = "rgba(255,255,255,.35)"
    rr(ctx, bx - bw / 2 + 22, btop + 40, 24, bbot - btop - 90, 12)
    ctx.fill()
    for (let i = 1; i < 5; i++) {
      ctx.strokeStyle = "rgba(255,255,255,.6)"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(bx + bw / 2 - 50, btop + i * 90)
      ctx.lineTo(bx + bw / 2 - 16, btop + i * 90)
      ctx.stroke()
    }
    // match meter
    const m = dyeMatch(G)
    rr(ctx, bx - 220, 770, 440, 40, 20)
    ctx.fillStyle = "#1b2228"
    ctx.fill()
    ctx.lineWidth = 5
    ctx.strokeStyle = INK
    ctx.stroke()
    rr(ctx, bx - 216, 774, (432 * m) / 100, 32, 16)
    ctx.fillStyle = m >= 99 ? "#7cfc7c" : m > 75 ? "#ffd23f" : "#ff7a59"
    ctx.fill()
    label(ctx, `MATCH ${m}%`, bx, 850, 40, "#fff")
    // dye bottles
    for (const [k, d] of Object.entries(DYES)) {
      const x = d.x,
        y = DYE_BOTTLE_Y,
        flying = G.falling.some((f) => f.k === k)
      ctx.save()
      ctx.translate(x, y + (flying ? -10 : 0))
      rr(ctx, -62, 0, 124, 200, 22)
      ctx.fillStyle = "rgba(230,245,255,.5)"
      ctx.fill()
      ctx.lineWidth = 6
      ctx.strokeStyle = INK
      ctx.stroke()
      ctx.save()
      rr(ctx, -62, 0, 124, 200, 22)
      ctx.clip()
      ctx.fillStyle = rgbStr(d.rgb)
      ctx.fillRect(-62, 60, 124, 140)
      ctx.restore()
      rr(ctx, -62, 0, 124, 200, 22)
      ctx.stroke()
      rr(ctx, -24, -50, 48, 56, 8)
      ctx.fillStyle = "#30363b"
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(-12, -50)
      ctx.lineTo(0, -82)
      ctx.lineTo(12, -50)
      ctx.fillStyle = "#30363b"
      ctx.fill()
      ctx.stroke()
      rr(ctx, -54, 100, 108, 52, 8)
      ctx.fillStyle = "#fff"
      ctx.fill()
      ctx.lineWidth = 4
      ctx.stroke()
      const words = d.name.split(" ") // long names wrap: last word on its own line
      if (d.name.length > 9 && words.length > 1) {
        plainText(ctx, words.slice(0, -1).join(" "), 0, 115, 17, "#1b1b1b", "center", 900)
        plainText(ctx, words[words.length - 1], 0, 138, 18, "#1b1b1b", "center", 900)
      } else plainText(ctx, d.name, 0, 126, 20, "#1b1b1b", "center", 900)
      ctx.restore()
      label(ctx, "+" + G.drops[k], x, y + 250, 34, "#fff")
    }
    for (const f of G.falling) {
      const k = f.t / 0.35,
        x = f.x + (836 - f.x) * k,
        y = DYE_BOTTLE_Y - 90 - Math.sin(Math.PI * k) * 160 + k * 60
      ctx.fillStyle = rgbStr(DYES[f.k].rgb)
      ctx.beginPath()
      ctx.arc(x, y, 18, 0, Math.PI * 2)
      ctx.fill()
      ctx.lineWidth = 4
      ctx.strokeStyle = INK
      ctx.stroke()
    }
    button(ctx, DYE_FLUSH.x, DYE_FLUSH.y, DYE_FLUSH.w, DYE_FLUSH.h, "🚰 FLUSH", "#5c7cfa", false, G.flushT > 0)
    // order card
    ctx.save()
    ctx.translate(1330, 130)
    ctx.rotate(0.04)
    rr(ctx, 0, 0, 290, 470, 18)
    ctx.fillStyle = "#fffdf3"
    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = INK
    ctx.stroke()
    plainText(ctx, "ORDER #" + (4100 + G.orderNo), 145, 44, 28, "#555", "center", 900)
    rr(ctx, 35, 80, 220, 220, 20)
    ctx.fillStyle = rgbStr(dyeColor(G.order))
    ctx.fill()
    ctx.lineWidth = 6
    ctx.stroke()
    plainText(ctx, G.order.name, 145, 340, 30, "#1b1b1b", "center", 900)
    plainText(ctx, "Client: Sugar Bombz (ages 2+)", 145, 385, 20, "#666")
    plainText(ctx, "Must glow. Must hook.", 145, 420, 20, "#c92a2a", "center", 900)
    ctx.restore()
    if (G.shipT > 0) label(ctx, "MATCH! SHIPPING…", bx, 170, 52, "#9dff6a")
  }
}
function dyeBottleAt(x, y) {
  return Object.keys(DYES).find((k) => Math.abs(x - DYES[k].x) < 75 && y > DYE_BOTTLE_Y - 90 && y < DYE_BOTTLE_Y + 210)
}
function dyeNewOrder(G) {
  let o
  do {
    o = pick(DYE_ORDERS)
  } while (G.used.includes(o.name) && G.used.length < DYE_ORDERS.length)
  G.used.push(o.name)
  G.order = o
  G.orderNo = (G.orderNo || 0) + 1
  G.drops = { r: 0, y: 0, b: 0 }
  G.falling = []
}

export { DyeGame }
