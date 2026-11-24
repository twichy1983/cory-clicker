import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  rand,
  pick,
  roundedRect,
  vgrad,
  INK,
  emoji,
  label,
  plainText,
  bubble,
  cloud
} from "./draw.js"
import { burst, jobStrike, endJob } from "./framework.js"

/** @typedef {import("./framework.js").Minigame} Minigame */

/* ---------------------------------------------------------
   JOB: SHORT POUR (Lemonade Stand)
   Hold to pour; stop at (or just above) the legal-minimum line.
   --------------------------------------------------------- */
const LEMON = {
  goal: 8,
  zone: 0.08,
  cupX: 836,
  cupTop: 470,
  cupBot: 880,
  topW: 300,
  botW: 225
}
/** @type {Minigame} */
const LemonGame = {
  time: 30,
  strikes: 3,
  meter: "SHORT POURS",
  tagline:
    "Customers never finish their lemonade. You pour their leftovers back into the pitcher, top it up, and resell it as fresh-squeezed. Every recycled cup goes right to the legal minimum.",
  rules: [
    "<b>Press and hold</b> anywhere to pour from the backwash pitcher. Let go to stop.",
    "Stop <b>at or just above the red LEGAL MIN line</b> (the green zone) for a perfect short pour.",
    "Under the line and the customer notices: a strike. 3 complaints and the health department shows up.",
    "Way over the line wastes perfectly good backwash: no credit.",
    `Resell <b>${LEMON.goal} recycled cups</b> before time runs out. Pouring speeds up as you go.`
  ],
  winTitle: "Pre-enjoyed and resold!",
  winText: "Eight cups of other people's leftovers sold at full price. The secret ingredient is strangers.",
  lose: {
    busted: "Three customers found someone else's gum in their cup. The health department is on its way, with gloves.",
    time: "The line moved on. Somewhere, a stand with clean cups is thriving, and it makes you sick."
  },
  init(shift) {
    Object.assign(shift, { served: 0, speed: 0.34, msg: "", msgOk: true, msgT: 0 })
    lemonNext(shift)
  },
  step(shift, dt) {
    if (shift.state === "pour") {
      shift.level = Math.min(1, shift.level + shift.speed * dt)
      if (shift.level >= 1) lemonJudge(shift)
    } else if (shift.state === "judged") {
      shift.wait -= dt
      if (shift.wait <= 0) lemonNext(shift)
    }
    shift.msgT = Math.max(0, shift.msgT - dt)
    shift.pct = (shift.served / LEMON.goal) * 100
    shift.meterText = `${shift.served} / ${LEMON.goal}`
  },
  down(shift) {
    if (shift.state === "ready") shift.state = "pour"
  },
  up(shift) {
    if (shift.state === "pour") lemonJudge(shift)
  },
  stop(shift) {
    if (shift.state === "pour") shift.state = "judged"
  },
  cursor() {
    return true
  },
  draw(ctx, shift, now) {
    ctx.fillStyle = vgrad(ctx, 0, 640, [
      [0, "#6cc6ff"],
      [1, "#dff4ff"]
    ])
    ctx.fillRect(0, 0, CANVAS_WIDTH, 640)
    ctx.fillStyle = "rgba(255,236,120,.35)"
    ctx.beginPath()
    ctx.arc(230, 180, 120, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "#ffe34d"
    ctx.beginPath()
    ctx.arc(230, 180, 72, 0, Math.PI * 2)
    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = "#e0a800"
    ctx.stroke()
    ;[
      [520, 120, 1],
      [1250, 90, 1.2],
      [1500, 200, 0.8]
    ].forEach(([x, y, scale]) => cloud(ctx, x, y, scale))
    ctx.fillStyle = "#8fd463"
    ctx.beginPath()
    ctx.ellipse(300, 650, 520, 140, 0, Math.PI, 0)
    ctx.ellipse(1400, 660, 600, 170, 0, Math.PI, 0)
    ctx.fill()
    ctx.fillStyle = vgrad(ctx, 600, CANVAS_HEIGHT, [
      [0, "#e9dfcc"],
      [1, "#cfc2a8"]
    ])
    ctx.fillRect(0, 600, CANVAS_WIDTH, CANVAS_HEIGHT - 600)
    ctx.strokeStyle = "rgba(120,100,70,.35)"
    ctx.lineWidth = 4
    for (let x = -100; x < CANVAS_WIDTH; x += 260) {
      ctx.beginPath()
      ctx.moveTo(x, 600)
      ctx.lineTo(x - 120, CANVAS_HEIGHT)
      ctx.stroke()
    }
    // the stand
    ctx.fillStyle = "#c98a4a"
    ctx.strokeStyle = INK
    ctx.lineWidth = 6
    roundedRect(ctx, 470, 560, 732, 250, 16)
    ctx.fill()
    ctx.stroke()
    ctx.strokeStyle = "rgba(90,50,20,.45)"
    ctx.lineWidth = 4
    for (let y = 610; y < 800; y += 48) {
      ctx.beginPath()
      ctx.moveTo(480, y)
      ctx.lineTo(1192, y)
      ctx.stroke()
    }
    roundedRect(ctx, 440, 540, 792, 34, 10)
    ctx.fillStyle = "#a96b33"
    ctx.fill()
    ctx.strokeStyle = INK
    ctx.lineWidth = 6
    ctx.stroke()
    ;[490, 1180].forEach((x) => {
      roundedRect(ctx, x - 14, 250, 28, 300, 8)
      ctx.fillStyle = "#b67a3c"
      ctx.fill()
      ctx.stroke()
    })
    for (let i = 0; i < 9; i++) {
      // striped awning with scallops
      const x0 = 440 + i * 88
      ctx.fillStyle = i % 2 ? "#fff6d5" : "#ffd23f"
      ctx.beginPath()
      ctx.moveTo(x0, 200)
      ctx.lineTo(x0 + 88, 200)
      ctx.lineTo(x0 + 88, 300)
      ctx.arc(x0 + 44, 300, 44, 0, Math.PI)
      ctx.closePath()
      ctx.fill()
    }
    ctx.lineWidth = 6
    ctx.strokeStyle = INK
    ctx.beginPath()
    ctx.moveTo(440, 200)
    ctx.lineTo(1232, 200)
    ctx.lineTo(1232, 300)
    for (let i = 8; i >= 0; i--) ctx.arc(440 + i * 88 + 44, 300, 44, 0, Math.PI)
    ctx.lineTo(440, 200)
    ctx.stroke()
    roundedRect(ctx, 600, 100, 472, 92, 18)
    ctx.fillStyle = "#fff6d5"
    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = INK
    ctx.stroke()
    label(ctx, "LEMONADE", 836, 146, 62, "#ffd23f")
    label(ctx, "Fresh*", 1090, 640, 38, "#fff")
    label(ctx, "$5", 1090, 700, 52, "#ffe34d")
    plainText(ctx, "*previously", 1090, 760, 22, "rgba(60,30,10,.85)", "center", 700)
    // customer
    emoji(ctx, shift.cust, 1400, 520, 230)
    bubble(ctx, shift.state === "judged" ? shift.reaction : shift.order, 1400, 360, 34)
    // cup + liquid
    const cup = LEMON,
      height = cup.cupBot - cup.cupTop,
      lvlY = cup.cupBot - shift.level * height,
      lineY = cup.cupBot - shift.line * height,
      zoneY = cup.cupBot - (shift.line + cup.zone) * height
    const cupPath = () => {
      ctx.beginPath()
      ctx.moveTo(cup.cupX - cup.topW / 2, cup.cupTop)
      ctx.lineTo(cup.cupX + cup.topW / 2, cup.cupTop)
      ctx.lineTo(cup.cupX + cup.botW / 2, cup.cupBot)
      ctx.lineTo(cup.cupX - cup.botW / 2, cup.cupBot)
      ctx.closePath()
    }
    ctx.fillStyle = "rgba(0,0,0,.18)"
    ctx.beginPath()
    ctx.ellipse(cup.cupX, cup.cupBot + 8, 150, 20, 0, 0, Math.PI * 2)
    ctx.fill()
    cupPath()
    ctx.fillStyle = "rgba(235,250,255,.55)"
    ctx.fill()
    ctx.save()
    cupPath()
    ctx.clip()
    ctx.fillStyle = "rgba(120,220,120,.35)"
    ctx.fillRect(0, zoneY, CANVAS_WIDTH, lineY - zoneY)
    ctx.fillStyle = vgrad(ctx, lvlY, cup.cupBot, [
      [0, "#fff27a"],
      [1, "#ffc928"]
    ])
    ctx.fillRect(0, lvlY, CANVAS_WIDTH, cup.cupBot - lvlY)
    if (shift.level > 0.08) {
      ;[
        [-60, 0],
        [40, 18],
        [-5, 34]
      ].forEach(([offsetX, offsetY], i) => {
        const cubeY = Math.max(lvlY + 18 + offsetY, cup.cupTop + 20)
        roundedRect(ctx, cup.cupX + offsetX - 26, cubeY, 52, 46, 9)
        ctx.fillStyle = "rgba(255,255,255,.55)"
        ctx.fill()
        ctx.strokeStyle = "rgba(255,255,255,.9)"
        ctx.lineWidth = 3
        ctx.stroke()
      })
    }
    for (let i = 0; i < 7; i++) {
      const bubbleY = cup.cupBot - ((now * 60 + i * 67) % Math.max(1, cup.cupBot - lvlY))
      if (bubbleY > lvlY) {
        ctx.fillStyle = "rgba(255,255,255,.6)"
        ctx.beginPath()
        ctx.arc(cup.cupX - 80 + i * 26, bubbleY, 5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    if (shift.level > 0.12) {
      // previously-enjoyed floaters: a hair, some gum, a mystery crumb
      const floaterY = lvlY + 14
      ctx.strokeStyle = "#3b2a1a"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(cup.cupX - 70, floaterY + 6)
      ctx.bezierCurveTo(cup.cupX - 40, floaterY - 12, cup.cupX - 10, floaterY + 22, cup.cupX + 20, floaterY + 4)
      ctx.stroke()
      ctx.fillStyle = "#ff8fc0"
      ctx.beginPath()
      ctx.ellipse(cup.cupX + 60, floaterY + 10, 16, 9, 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.lineWidth = 3
      ctx.strokeStyle = INK
      ctx.stroke()
      ctx.fillStyle = "#6b4a2a"
      ctx.beginPath()
      ctx.arc(cup.cupX - 20, floaterY + 40, 6, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
    ctx.strokeStyle = "#d62859"
    ctx.lineWidth = 9
    ctx.lineCap = "round" // a stranger's lipstick on the rim
    ctx.beginPath()
    ctx.arc(cup.cupX - 70, cup.cupTop + 4, 26, 0.2, Math.PI - 0.2)
    ctx.stroke()
    ctx.lineCap = "butt"
    ctx.setLineDash([18, 12])
    ctx.strokeStyle = "#e3241b"
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(cup.cupX - cup.topW / 2 - 30, lineY)
    ctx.lineTo(cup.cupX + cup.topW / 2 + 30, lineY)
    ctx.stroke()
    ctx.setLineDash([])
    label(ctx, "LEGAL MIN", cup.cupX - cup.topW / 2 - 40, lineY, 28, "#ff6b5b", "right")
    cupPath()
    ctx.lineWidth = 7
    ctx.strokeStyle = INK
    ctx.stroke()
    ctx.fillStyle = "rgba(255,255,255,.35)"
    ctx.beginPath()
    ctx.moveTo(cup.cupX - cup.topW / 2 + 26, cup.cupTop + 20)
    ctx.lineTo(cup.cupX - cup.botW / 2 + 22, cup.cupBot - 20)
    ctx.lineTo(cup.cupX - cup.botW / 2 + 40, cup.cupBot - 20)
    ctx.lineTo(cup.cupX - cup.topW / 2 + 48, cup.cupTop + 20)
    ctx.fill()
    // pitcher (tilts while pouring)
    const tilt = shift.state === "pour" ? -0.85 : -0.15,
      pitcherX = 1010,
      pitcherY = 330
    ctx.save()
    ctx.translate(pitcherX, pitcherY)
    ctx.rotate(tilt)
    roundedRect(ctx, -70, -110, 140, 190, 26)
    ctx.fillStyle = "rgba(230,248,255,.75)"
    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = INK
    ctx.stroke()
    ctx.save()
    roundedRect(ctx, -70, -110, 140, 190, 26)
    ctx.clip()
    ctx.fillStyle = "#ffd94a"
    ctx.fillRect(-70, -40, 140, 130)
    ctx.restore()
    ctx.beginPath()
    ctx.arc(80, -20, 40, -1.2, 1.2)
    ctx.lineWidth = 14
    ctx.strokeStyle = INK
    ctx.stroke()
    ctx.lineWidth = 7
    ctx.strokeStyle = "#e9f8ff"
    ctx.stroke()
    roundedRect(ctx, -58, -96, 116, 40, 8)
    ctx.fillStyle = "#fff"
    ctx.fill()
    ctx.lineWidth = 4
    ctx.strokeStyle = INK
    ctx.stroke()
    plainText(ctx, "♻ BACKWASH", 0, -76, 20, "#2f9e44", "center", 900)
    ctx.restore()
    if (shift.state === "pour") {
      const streamX = pitcherX - 120,
        streamY = pitcherY - 40,
        wob = Math.sin(now * 30) * 4
      ctx.strokeStyle = "#ffcd2e"
      ctx.lineWidth = 22
      ctx.lineCap = "round"
      ctx.beginPath()
      ctx.moveTo(streamX, streamY)
      ctx.quadraticCurveTo(streamX - 20 + wob, streamY + 60, cup.cupX + 30, lvlY)
      ctx.stroke()
      ctx.lineCap = "butt"
    }
    ctx.save()
    ctx.translate(cup.cupX + cup.topW / 2 - 20, cup.cupTop)
    ctx.fillStyle = "#ffe34d"
    ctx.beginPath()
    ctx.arc(0, 0, 46, 0, Math.PI * 2)
    ctx.fill()
    ctx.lineWidth = 5
    ctx.strokeStyle = "#d9a400"
    ctx.stroke()
    ctx.strokeStyle = "#fff3a8"
    ctx.lineWidth = 3
    for (let i = 0; i < 6; i++) {
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(Math.cos(i) * 36, Math.sin(i) * 36)
      ctx.stroke()
    }
    ctx.restore()
    if (shift.state === "ready" && shift.phase === "play") label(ctx, "HOLD TO POUR", cup.cupX, 420, 40, "#fff")
    if (shift.msgT > 0) label(ctx, shift.msg, cup.cupX, 380, 48, shift.msgOk ? "#9dff6a" : "#ff6b5b")
  }
}
function lemonNext(shift) {
  Object.assign(shift, {
    level: 0,
    line: rand(0.42, 0.76),
    state: "ready",
    cust: pick(["🧑", "👩", "👨‍🦰", "👵", "🧔", "👧", "🧑‍🦱", "👱‍♀️", "👴"]),
    order: pick(["Is it fresh?", "Fresh-squeezed, right?", "A large, please!", "Why is it cloudy?", "Extra lemony!"])
  })
}
function lemonJudge(shift) {
  const diff = shift.level - shift.line
  shift.state = "judged"
  shift.wait = 0.75
  shift.msgT = 0.75
  if (diff < 0) {
    shift.msg = "Not full enough!"
    shift.msgOk = false
    shift.reaction = pick(["Half a cup?! And is that GUM?", "There's a HAIR in this!"])
    jobStrike("Complaint!", LEMON.cupX, 300)
  } else if (diff <= LEMON.zone) {
    shift.served++
    shift.speed = Math.min(0.8, shift.speed + 0.055)
    shift.msg = "Resold!"
    shift.msgOk = true
    shift.reaction = pick(["Tastes… familiar?", "Mmm, chewy!", "Why is it warm?", "Thanks, I guess!"])
    burst(LEMON.cupX, LEMON.cupTop, "#ffe34d", 16)
    if (shift.served >= LEMON.goal) endJob("win")
  } else {
    shift.msg = "Wasted backwash!"
    shift.msgOk = false
    shift.reaction = pick(["Wow, a full cup!", "So generous!"])
  }
}

export { LemonGame }
