import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  pick,
  roundedRect,
  vgrad,
  INK,
  emoji,
  label,
  plainText,
  button,
  inBox
} from "./draw.js"
import { floatText, burst, endJob } from "./framework.js"

/* ---------------------------------------------------------
   JOB: NEON SNACK LAB (Additive Laboratory)
   Add dye drops until the batch matches the order card.
   --------------------------------------------------------- */
const DYES = {
  red: { name: "COAL TAR RED", rgb: [226, 35, 40], x: 210 },
  yellow: { name: "PETRO YELLOW", rgb: [255, 214, 10], x: 410 },
  blue: { name: "BLUE #???", rgb: [10, 110, 230], x: 610 }
}
const DYE_BASE = [236, 226, 205]
const DYE_ORDERS = [
  { name: "Sunset Orange", red: 1, yellow: 2, blue: 0 },
  { name: "Toxic Lime", red: 0, yellow: 2, blue: 1 },
  { name: "Grape Escape", red: 1, yellow: 0, blue: 1 },
  { name: "Electric Teal", red: 0, yellow: 1, blue: 2 },
  { name: "Hot Lava Red", red: 2, yellow: 1, blue: 0 },
  { name: "Swamp Surprise", red: 1, yellow: 2, blue: 1 },
  { name: "Blue-ish Raspberry", red: 0, yellow: 0, blue: 2 },
  { name: "Cheese Dust", red: 0, yellow: 3, blue: 0 },
  { name: "Mystery Purple", red: 2, yellow: 0, blue: 1 }
]
const DYE_GOAL = 5,
  DYE_BOTTLE_Y = 610,
  DYE_FLUSH = { x: 1110, y: 690, width: 230, height: 110 }
function dyeColor(amounts) {
  const total = amounts.red + amounts.yellow + amounts.blue
  if (!total) return DYE_BASE
  const mix = [0, 1, 2].map(
    (i) =>
      Math.pow(Math.max(8, DYES.red.rgb[i]), amounts.red / total) *
      Math.pow(Math.max(8, DYES.yellow.rgb[i]), amounts.yellow / total) *
      Math.pow(Math.max(8, DYES.blue.rgb[i]), amounts.blue / total)
  )
  const strength = Math.min(1, 0.45 + total * 0.18)
  return DYE_BASE.map((base, i) => Math.round(base + (mix[i] - base) * strength))
}
const rgbStr = (rgb) => `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
function dyeMatch(shift) {
  const batchColor = dyeColor(shift.drops),
    orderColor = dyeColor(shift.order)
  return Math.max(
    0,
    Math.round(
      100 -
        Math.hypot(batchColor[0] - orderColor[0], batchColor[1] - orderColor[1], batchColor[2] - orderColor[2]) * 0.55
    )
  )
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
  init(shift) {
    Object.assign(shift, {
      shipped: 0,
      drops: { red: 0, yellow: 0, blue: 0 },
      flushT: 0,
      shipT: 0,
      falling: [],
      used: []
    })
    dyeNewOrder(shift)
  },
  step(shift, dt) {
    shift.flushT = Math.max(0, shift.flushT - dt)
    for (const drop of shift.falling) drop.age += dt
    const landed = shift.falling.filter((drop) => drop.age >= 0.35)
    shift.falling = shift.falling.filter((drop) => drop.age < 0.35)
    landed.forEach((drop) => {
      shift.drops[drop.colorKey]++
      shift.splashT = 0.3
    })
    shift.splashT = Math.max(0, (shift.splashT || 0) - dt)
    if (shift.shipT > 0) {
      if ((shift.shipT -= dt) <= 0) {
        shift.shipped++
        if (shift.shipped >= DYE_GOAL) endJob("win")
        else dyeNewOrder(shift)
      }
    } else if (
      !shift.falling.length &&
      dyeMatch(shift) >= 99 &&
      shift.drops.red + shift.drops.yellow + shift.drops.blue > 0
    ) {
      shift.shipT = 0.8
      floatText("SHIPPED!", 836, 300)
      burst(836, 380, rgbStr(dyeColor(shift.drops)), 22)
    }
    shift.pct = ((shift.shipped + (shift.shipT > 0 ? 1 : 0)) / DYE_GOAL) * 100
    shift.meterText = `${shift.shipped + (shift.shipT > 0 ? 1 : 0)} / ${DYE_GOAL}`
  },
  cursor(shift, x, y) {
    return !!dyeBottleAt(x, y) || inBox(x, y, DYE_FLUSH)
  },
  down(shift, x, y) {
    if (shift.shipT > 0 || shift.flushT > 0) return
    const colorKey = dyeBottleAt(x, y)
    if (colorKey) {
      shift.falling.push({ colorKey, age: 0, x: DYES[colorKey].x })
      return
    }
    if (inBox(x, y, DYE_FLUSH)) {
      shift.drops = { red: 0, yellow: 0, blue: 0 }
      shift.falling = []
      shift.flushT = 0.9
      floatText("Flushed", 836, 420, true)
    }
  },
  draw(ctx, shift, now) {
    ctx.fillStyle = vgrad(ctx, 0, 560, [
      [0, "#22313b"],
      [1, "#2f4250"]
    ])
    ctx.fillRect(0, 0, CANVAS_WIDTH, 560)
    ctx.fillStyle = "#3a2a1d"
    ;[200, 380].forEach((y) => {
      roundedRect(ctx, 60, y, 560, 20, 6)
      ctx.fill()
    })
    ;["⚗️", "🧪", "🧫", "🧴", "⚗️"].forEach((icon, i) => emoji(ctx, icon, 110 + i * 110, 160, 60))
    ;["🧪", "🧴", "⚗️", "🧪"].forEach((icon, i) => emoji(ctx, icon, 130 + i * 130, 340, 60))
    roundedRect(ctx, 60, 440, 560, 70, 10)
    ctx.fillStyle = "#ffd23f"
    ctx.fill()
    ctx.lineWidth = 5
    ctx.strokeStyle = INK
    ctx.stroke()
    plainText(ctx, "⚠ BANNED IN 27 COUNTRIES (NOT OURS)", 340, 475, 24, "#1b1b1b", "center", 900)
    ctx.fillStyle = vgrad(ctx, 540, CANVAS_HEIGHT, [
      [0, "#9a6a3e"],
      [1, "#6e4626"]
    ])
    ctx.fillRect(0, 540, CANVAS_WIDTH, CANVAS_HEIGHT - 540)
    ctx.strokeStyle = INK
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(0, 540)
    ctx.lineTo(CANVAS_WIDTH, 540)
    ctx.stroke()
    // beaker with the current batch
    const beakerX = 836,
      btop = 230,
      bbot = 720,
      beakerWidth = 300,
      col = dyeColor(shift.drops),
      fill = shift.flushT > 0 ? 0.25 + 0.75 * (1 - shift.flushT / 0.9) : 1
    const level = bbot - (bbot - btop - 60) * 0.7 * fill
    ctx.save()
    roundedRect(ctx, beakerX - beakerWidth / 2, btop, beakerWidth, bbot - btop, 40)
    ctx.clip()
    ctx.fillStyle = "rgba(220,240,250,.25)"
    ctx.fillRect(beakerX - beakerWidth / 2, btop, beakerWidth, bbot - btop)
    ctx.fillStyle = rgbStr(col)
    ctx.fillRect(beakerX - beakerWidth / 2, level + (shift.splashT || 0) * 20, beakerWidth, bbot - level)
    ctx.fillStyle = "rgba(255,255,255,.25)"
    for (let i = 0; i < 8; i++) {
      const bubbleY = bbot - ((now * 70 + i * 53) % (bbot - level))
      ctx.beginPath()
      ctx.arc(beakerX - 110 + i * 30, bubbleY, 7, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
    roundedRect(ctx, beakerX - beakerWidth / 2, btop, beakerWidth, bbot - btop, 40)
    ctx.lineWidth = 8
    ctx.strokeStyle = INK
    ctx.stroke()
    roundedRect(ctx, beakerX - beakerWidth / 2 - 20, btop - 16, beakerWidth + 40, 30, 10)
    ctx.fillStyle = "#d9eef7"
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = "rgba(255,255,255,.35)"
    roundedRect(ctx, beakerX - beakerWidth / 2 + 22, btop + 40, 24, bbot - btop - 90, 12)
    ctx.fill()
    for (let i = 1; i < 5; i++) {
      ctx.strokeStyle = "rgba(255,255,255,.6)"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(beakerX + beakerWidth / 2 - 50, btop + i * 90)
      ctx.lineTo(beakerX + beakerWidth / 2 - 16, btop + i * 90)
      ctx.stroke()
    }
    // match meter
    const matchPct = dyeMatch(shift)
    roundedRect(ctx, beakerX - 220, 770, 440, 40, 20)
    ctx.fillStyle = "#1b2228"
    ctx.fill()
    ctx.lineWidth = 5
    ctx.strokeStyle = INK
    ctx.stroke()
    roundedRect(ctx, beakerX - 216, 774, (432 * matchPct) / 100, 32, 16)
    ctx.fillStyle = matchPct >= 99 ? "#7cfc7c" : matchPct > 75 ? "#ffd23f" : "#ff7a59"
    ctx.fill()
    label(ctx, `MATCH ${matchPct}%`, beakerX, 850, 40, "#fff")
    // dye bottles
    for (const [colorKey, dye] of Object.entries(DYES)) {
      const x = dye.x,
        y = DYE_BOTTLE_Y,
        flying = shift.falling.some((drop) => drop.colorKey === colorKey)
      ctx.save()
      ctx.translate(x, y + (flying ? -10 : 0))
      roundedRect(ctx, -62, 0, 124, 200, 22)
      ctx.fillStyle = "rgba(230,245,255,.5)"
      ctx.fill()
      ctx.lineWidth = 6
      ctx.strokeStyle = INK
      ctx.stroke()
      ctx.save()
      roundedRect(ctx, -62, 0, 124, 200, 22)
      ctx.clip()
      ctx.fillStyle = rgbStr(dye.rgb)
      ctx.fillRect(-62, 60, 124, 140)
      ctx.restore()
      roundedRect(ctx, -62, 0, 124, 200, 22)
      ctx.stroke()
      roundedRect(ctx, -24, -50, 48, 56, 8)
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
      roundedRect(ctx, -54, 100, 108, 52, 8)
      ctx.fillStyle = "#fff"
      ctx.fill()
      ctx.lineWidth = 4
      ctx.stroke()
      const words = dye.name.split(" ") // long names wrap: last word on its own line
      if (dye.name.length > 9 && words.length > 1) {
        plainText(ctx, words.slice(0, -1).join(" "), 0, 115, 17, "#1b1b1b", "center", 900)
        plainText(ctx, words[words.length - 1], 0, 138, 18, "#1b1b1b", "center", 900)
      } else plainText(ctx, dye.name, 0, 126, 20, "#1b1b1b", "center", 900)
      ctx.restore()
      label(ctx, "+" + shift.drops[colorKey], x, y + 250, 34, "#fff")
    }
    for (const drop of shift.falling) {
      const progress = drop.age / 0.35,
        x = drop.x + (836 - drop.x) * progress,
        y = DYE_BOTTLE_Y - 90 - Math.sin(Math.PI * progress) * 160 + progress * 60
      ctx.fillStyle = rgbStr(DYES[drop.colorKey].rgb)
      ctx.beginPath()
      ctx.arc(x, y, 18, 0, Math.PI * 2)
      ctx.fill()
      ctx.lineWidth = 4
      ctx.strokeStyle = INK
      ctx.stroke()
    }
    button(
      ctx,
      DYE_FLUSH.x,
      DYE_FLUSH.y,
      DYE_FLUSH.width,
      DYE_FLUSH.height,
      "🚰 FLUSH",
      "#5c7cfa",
      false,
      shift.flushT > 0
    )
    // order card
    ctx.save()
    ctx.translate(1330, 130)
    ctx.rotate(0.04)
    roundedRect(ctx, 0, 0, 290, 470, 18)
    ctx.fillStyle = "#fffdf3"
    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = INK
    ctx.stroke()
    plainText(ctx, "ORDER #" + (4100 + shift.orderNo), 145, 44, 28, "#555", "center", 900)
    roundedRect(ctx, 35, 80, 220, 220, 20)
    ctx.fillStyle = rgbStr(dyeColor(shift.order))
    ctx.fill()
    ctx.lineWidth = 6
    ctx.stroke()
    plainText(ctx, shift.order.name, 145, 340, 30, "#1b1b1b", "center", 900)
    plainText(ctx, "Client: Sugar Bombz (ages 2+)", 145, 385, 20, "#666")
    plainText(ctx, "Must glow. Must hook.", 145, 420, 20, "#c92a2a", "center", 900)
    ctx.restore()
    if (shift.shipT > 0) label(ctx, "MATCH! SHIPPING…", beakerX, 170, 52, "#9dff6a")
  }
}
function dyeBottleAt(x, y) {
  return Object.keys(DYES).find(
    (colorKey) => Math.abs(x - DYES[colorKey].x) < 75 && y > DYE_BOTTLE_Y - 90 && y < DYE_BOTTLE_Y + 210
  )
}
function dyeNewOrder(shift) {
  let order
  do {
    order = pick(DYE_ORDERS)
  } while (shift.used.includes(order.name) && shift.used.length < DYE_ORDERS.length)
  shift.used.push(order.name)
  shift.order = order
  shift.orderNo = (shift.orderNo || 0) + 1
  shift.drops = { red: 0, yellow: 0, blue: 0 }
  shift.falling = []
}

export { DyeGame }
