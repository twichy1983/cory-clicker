import { CANVAS_WIDTH, CANVAS_HEIGHT, rand, roundedRect, vgrad, hgrad, INK, emoji, plainText } from "./draw.js"
import { shift, floatText, jobStrike } from "./framework.js"

/* ---------------------------------------------------------
   JOB: SKIP MAINTENANCE (Refinery Complex)
   Survive the shift: vent gauges once they pass yellow, before they hit red.
   --------------------------------------------------------- */
const GAUGE_SPOTS = [
  { x: 250, y: 640 },
  { x: 545, y: 600 },
  { x: 836, y: 640 },
  { x: 1127, y: 600 },
  { x: 1422, y: 640 },
  { x: 836, y: 420 }
]
const GAUGE_R = 105,
  GAUGE_VENT = 0.55
const GaugeGame = {
  time: 30,
  strikes: 3,
  meter: "SHIFT SURVIVED",
  tagline:
    "The last safety inspector 'retired' after asking too many questions. Maintenance costs money; replacement workers are cheaper. Keep the refinery running flat-out with the crew still inside.",
  rules: [
    "Pressure keeps climbing in every pipe. <b>Click a gauge</b> to vent it back down.",
    "Venting wastes product, so a gauge <b>can only be vented once its needle is past the yellow line</b>.",
    "If a needle reaches the end of the red, that pipe bursts: a strike (and an ambulance). 3 strikes and the cameras show up.",
    "Survive the <b>full 30-second shift</b> to win. More gauges come online as the shift goes on."
  ],
  winTitle: "Shift survived!",
  winText:
    "Thirty seconds at full output, zero maintenance. Three workers' comp claims were denied before the shift even ended.",
  lose: {
    busted:
      "Three pipes burst and the evening news got there before your PR team. The CEO is 'deeply saddened' from a beach in Monaco."
  },
  init(shift) {
    Object.assign(shift, {
      gauges: GAUGE_SPOTS.slice(0, 3).map((spot) => gaugeNew(spot))
    })
  },
  step(shift, dt) {
    const want = shift.elapsed > 21 ? 6 : shift.elapsed > 14 ? 5 : shift.elapsed > 7 ? 4 : 3
    while (shift.gauges.length < want) {
      const spot = GAUGE_SPOTS[shift.gauges.length]
      shift.gauges.push(gaugeNew(spot))
      floatText("New gauge online!", spot.x, spot.y - 140)
    }
    for (const gauge of shift.gauges) {
      gauge.pressure += gauge.rate * (1 + shift.elapsed * 0.025) * dt
      gauge.fire = Math.max(0, gauge.fire - dt)
      gauge.puff = Math.max(0, gauge.puff - dt)
      if (gauge.pressure >= 1) {
        gauge.pressure = 0.1
        gauge.fire = 1.4
        gauge.rate = rand(0.07, 0.14)
        jobStrike("Pipe burst!", gauge.x, gauge.y - 160)
      }
    }
    shift.pct = Math.min(100, (shift.elapsed / this.time) * 100)
    shift.meterText = Math.ceil(Math.max(0, this.time - shift.elapsed)) + "s to go"
  },
  onTimeUp() {
    return "win"
  },
  cursor(shift, x, y) {
    return !!gaugeAt(x, y)
  },
  down(shift, x, y) {
    const gauge = gaugeAt(x, y)
    if (!gauge) return
    if (gauge.pressure >= GAUGE_VENT) {
      gauge.pressure = 0.05
      gauge.puff = 0.8
      gauge.rate = rand(0.07, 0.15)
      for (let i = 0; i < 12; i++)
        shift.parts.push({
          x: gauge.x + rand(-30, 30),
          y: gauge.y - GAUGE_R - 30,
          vx: rand(-90, 90),
          vy: rand(-260, -120),
          life: rand(0.6, 1),
          color: "rgba(240,240,240,.9)",
          radius: rand(16, 26),
          grav: -60
        })
    } else floatText("Not yet!", gauge.x, gauge.y - 150, true)
  },
  draw(ctx, shift, now) {
    ctx.fillStyle = vgrad(ctx, 0, 520, [
      [0, "#2b1d4d"],
      [0.6, "#a34f5c"],
      [1, "#f08a4b"]
    ])
    ctx.fillRect(0, 0, CANVAS_WIDTH, 520)
    ctx.fillStyle = "#1c1a24"
    ;[
      [80, 260, 160, 260],
      [300, 200, 70, 320],
      [420, 300, 220, 220],
      [1180, 240, 90, 280],
      [1320, 300, 260, 220]
    ].forEach(([x, y, width, height]) => {
      roundedRect(ctx, x, y, width, height, 14)
      ctx.fill()
    })
    ;[
      [335, 200],
      [1225, 240]
    ].forEach(([x, y], i) => {
      const flicker = 1 + Math.sin(now * 12 + i) * 0.15
      emoji(ctx, "🔥", x, y - 40 * flicker, 70 * flicker)
    })
    ctx.fillStyle = "#2a2a30"
    ctx.fillRect(0, 500, CANVAS_WIDTH, CANVAS_HEIGHT - 500)
    ctx.fillStyle = hgrad(ctx, 0, CANVAS_WIDTH, [
      [0, "#6b6f75"],
      [0.5, "#a9aeb4"],
      [1, "#6b6f75"]
    ])
    ;[520, 760].forEach((y) => {
      roundedRect(ctx, -10, y, CANVAS_WIDTH + 20, 46, 20)
      ctx.fill()
      ctx.lineWidth = 5
      ctx.strokeStyle = INK
      ctx.stroke()
    })
    // the crew, still inside; they panic when a nearby needle is in the red
    ;[398, 690, 982, 1274].forEach((workerX, i) => {
      const near = shift.gauges.filter((gauge) => Math.abs(gauge.x - workerX) < 320),
        scared = near.some((gauge) => gauge.pressure > 0.8 || gauge.fire > 0)
      emoji(ctx, "👷", workerX + (scared ? Math.sin(now * 30 + i) * 6 : 0), 880, 92)
      if (scared) emoji(ctx, "😱", workerX + 30, 810, 46)
    })
    for (const gauge of shift.gauges) drawGauge(ctx, gauge, now)
    if (shift.gauges.some((gauge) => gauge.fire > 0))
      emoji(ctx, "🚑", CANVAS_WIDTH - ((now * 700) % (CANVAS_WIDTH + 300)) + 150, 470, 110)
  }
}
function gaugeNew(spot) {
  return {
    x: spot.x,
    y: spot.y,
    pressure: rand(0.05, 0.3),
    rate: rand(0.07, 0.14),
    fire: 0,
    puff: 0
  }
}
function gaugeAt(x, y) {
  return shift.gauges.find((gauge) => Math.hypot(x - gauge.x, y - gauge.y) < GAUGE_R + 20)
}
function drawGauge(ctx, gauge, now) {
  const { x, y } = gauge,
    radius = GAUGE_R,
    startAngle = Math.PI * 0.75,
    endAngle = Math.PI * 2.25,
    ang = (fraction) => startAngle + (endAngle - startAngle) * fraction
  roundedRect(ctx, x - 16, y + radius - 10, 32, 120, 6)
  ctx.fillStyle = "#7c8187"
  ctx.fill()
  ctx.lineWidth = 5
  ctx.strokeStyle = INK
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x, y, radius + 14, 0, Math.PI * 2)
  ctx.fillStyle = "#b8bdc2"
  ctx.fill()
  ctx.lineWidth = 7
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = "#fbfbf6"
  ctx.fill()
  ;[
    [0, GAUGE_VENT, "#5cc96b"],
    [GAUGE_VENT, 0.8, "#ffd23f"],
    [0.8, 1, "#ff3b30"]
  ].forEach(([start, end, color]) => {
    ctx.beginPath()
    ctx.arc(x, y, radius - 16, ang(start), ang(end))
    ctx.lineWidth = 22
    ctx.strokeStyle = color
    ctx.stroke()
  })
  const ready = gauge.pressure >= GAUGE_VENT && shift.phase === "play"
  if (ready) {
    ctx.beginPath()
    ctx.arc(x, y, radius + 24, 0, Math.PI * 2)
    ctx.lineWidth = 8
    ctx.strokeStyle = `rgba(255,236,120,${0.5 + 0.5 * Math.sin(now * 10)})`
    ctx.stroke()
  }
  const shake = gauge.pressure > 0.8 ? Math.sin(now * 60) * 0.04 : 0,
    needleAngle = ang(Math.min(1, gauge.pressure)) + shake
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + Math.cos(needleAngle) * (radius - 22), y + Math.sin(needleAngle) * (radius - 22))
  ctx.lineWidth = 9
  ctx.lineCap = "round"
  ctx.strokeStyle = "#c1121f"
  ctx.stroke()
  ctx.lineCap = "butt"
  ctx.beginPath()
  ctx.arc(x, y, 14, 0, Math.PI * 2)
  ctx.fillStyle = "#333"
  ctx.fill()
  plainText(ctx, "PSI", x, y + 46, 22, "#666", "center", 900)
  if (gauge.fire > 0) {
    for (let i = 0; i < 3; i++)
      emoji(ctx, "🔥", x - 60 + i * 60, y - radius - 40 - Math.sin(now * 20 + i) * 10, 80 + (i % 2) * 20)
  }
}

export { GaugeGame }
