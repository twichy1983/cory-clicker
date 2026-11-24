import { JW, JH, rand, pick, rr, vgrad, INK, emoji, label, plainText, bubble, cloud } from "./draw.js"
import { burst, jobStrike, endJob } from "./framework.js"

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
  init(G) {
    Object.assign(G, { served: 0, speed: 0.34, msg: "", msgOk: true, msgT: 0 })
    lemonNext(G)
  },
  step(G, dt) {
    if (G.state === "pour") {
      G.level = Math.min(1, G.level + G.speed * dt)
      if (G.level >= 1) lemonJudge(G)
    } else if (G.state === "judged" && (G.wait -= dt) <= 0) lemonNext(G)
    G.msgT = Math.max(0, G.msgT - dt)
    G.pct = (G.served / LEMON.goal) * 100
    G.meterText = `${G.served} / ${LEMON.goal}`
  },
  down(G) {
    if (G.state === "ready") G.state = "pour"
  },
  up(G) {
    if (G.state === "pour") lemonJudge(G)
  },
  stop(G) {
    if (G.state === "pour") G.state = "judged"
  },
  cursor() {
    return true
  },
  draw(ctx, G, now) {
    ctx.fillStyle = vgrad(ctx, 0, 640, [
      [0, "#6cc6ff"],
      [1, "#dff4ff"]
    ])
    ctx.fillRect(0, 0, JW, 640)
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
    ].forEach(([x, y, s]) => cloud(ctx, x, y, s))
    ctx.fillStyle = "#8fd463"
    ctx.beginPath()
    ctx.ellipse(300, 650, 520, 140, 0, Math.PI, 0)
    ctx.ellipse(1400, 660, 600, 170, 0, Math.PI, 0)
    ctx.fill()
    ctx.fillStyle = vgrad(ctx, 600, JH, [
      [0, "#e9dfcc"],
      [1, "#cfc2a8"]
    ])
    ctx.fillRect(0, 600, JW, JH - 600)
    ctx.strokeStyle = "rgba(120,100,70,.35)"
    ctx.lineWidth = 4
    for (let x = -100; x < JW; x += 260) {
      ctx.beginPath()
      ctx.moveTo(x, 600)
      ctx.lineTo(x - 120, JH)
      ctx.stroke()
    }
    // the stand
    ctx.fillStyle = "#c98a4a"
    ctx.strokeStyle = INK
    ctx.lineWidth = 6
    rr(ctx, 470, 560, 732, 250, 16)
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
    rr(ctx, 440, 540, 792, 34, 10)
    ctx.fillStyle = "#a96b33"
    ctx.fill()
    ctx.strokeStyle = INK
    ctx.lineWidth = 6
    ctx.stroke()
    ;[490, 1180].forEach((x) => {
      rr(ctx, x - 14, 250, 28, 300, 8)
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
    rr(ctx, 600, 100, 472, 92, 18)
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
    emoji(ctx, G.cust, 1400, 520, 230)
    bubble(ctx, G.state === "judged" ? G.reaction : G.order, 1400, 360, 34)
    // cup + liquid
    const L = LEMON,
      h = L.cupBot - L.cupTop,
      lvlY = L.cupBot - G.level * h,
      lineY = L.cupBot - G.line * h,
      zoneY = L.cupBot - (G.line + L.zone) * h
    const cupPath = () => {
      ctx.beginPath()
      ctx.moveTo(L.cupX - L.topW / 2, L.cupTop)
      ctx.lineTo(L.cupX + L.topW / 2, L.cupTop)
      ctx.lineTo(L.cupX + L.botW / 2, L.cupBot)
      ctx.lineTo(L.cupX - L.botW / 2, L.cupBot)
      ctx.closePath()
    }
    ctx.fillStyle = "rgba(0,0,0,.18)"
    ctx.beginPath()
    ctx.ellipse(L.cupX, L.cupBot + 8, 150, 20, 0, 0, Math.PI * 2)
    ctx.fill()
    cupPath()
    ctx.fillStyle = "rgba(235,250,255,.55)"
    ctx.fill()
    ctx.save()
    cupPath()
    ctx.clip()
    ctx.fillStyle = "rgba(120,220,120,.35)"
    ctx.fillRect(0, zoneY, JW, lineY - zoneY)
    ctx.fillStyle = vgrad(ctx, lvlY, L.cupBot, [
      [0, "#fff27a"],
      [1, "#ffc928"]
    ])
    ctx.fillRect(0, lvlY, JW, L.cupBot - lvlY)
    if (G.level > 0.08) {
      ;[
        [-60, 0],
        [40, 18],
        [-5, 34]
      ].forEach(([dx, dy], i) => {
        const cy = Math.max(lvlY + 18 + dy, L.cupTop + 20)
        rr(ctx, L.cupX + dx - 26, cy, 52, 46, 9)
        ctx.fillStyle = "rgba(255,255,255,.55)"
        ctx.fill()
        ctx.strokeStyle = "rgba(255,255,255,.9)"
        ctx.lineWidth = 3
        ctx.stroke()
      })
    }
    for (let i = 0; i < 7; i++) {
      const by = L.cupBot - ((now * 60 + i * 67) % Math.max(1, L.cupBot - lvlY))
      if (by > lvlY) {
        ctx.fillStyle = "rgba(255,255,255,.6)"
        ctx.beginPath()
        ctx.arc(L.cupX - 80 + i * 26, by, 5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    if (G.level > 0.12) {
      // previously-enjoyed floaters: a hair, some gum, a mystery crumb
      const fy = lvlY + 14
      ctx.strokeStyle = "#3b2a1a"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(L.cupX - 70, fy + 6)
      ctx.bezierCurveTo(L.cupX - 40, fy - 12, L.cupX - 10, fy + 22, L.cupX + 20, fy + 4)
      ctx.stroke()
      ctx.fillStyle = "#ff8fc0"
      ctx.beginPath()
      ctx.ellipse(L.cupX + 60, fy + 10, 16, 9, 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.lineWidth = 3
      ctx.strokeStyle = INK
      ctx.stroke()
      ctx.fillStyle = "#6b4a2a"
      ctx.beginPath()
      ctx.arc(L.cupX - 20, fy + 40, 6, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
    ctx.strokeStyle = "#d62859"
    ctx.lineWidth = 9
    ctx.lineCap = "round" // a stranger's lipstick on the rim
    ctx.beginPath()
    ctx.arc(L.cupX - 70, L.cupTop + 4, 26, 0.2, Math.PI - 0.2)
    ctx.stroke()
    ctx.lineCap = "butt"
    ctx.setLineDash([18, 12])
    ctx.strokeStyle = "#e3241b"
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(L.cupX - L.topW / 2 - 30, lineY)
    ctx.lineTo(L.cupX + L.topW / 2 + 30, lineY)
    ctx.stroke()
    ctx.setLineDash([])
    label(ctx, "LEGAL MIN", L.cupX - L.topW / 2 - 40, lineY, 28, "#ff6b5b", "right")
    cupPath()
    ctx.lineWidth = 7
    ctx.strokeStyle = INK
    ctx.stroke()
    ctx.fillStyle = "rgba(255,255,255,.35)"
    ctx.beginPath()
    ctx.moveTo(L.cupX - L.topW / 2 + 26, L.cupTop + 20)
    ctx.lineTo(L.cupX - L.botW / 2 + 22, L.cupBot - 20)
    ctx.lineTo(L.cupX - L.botW / 2 + 40, L.cupBot - 20)
    ctx.lineTo(L.cupX - L.topW / 2 + 48, L.cupTop + 20)
    ctx.fill()
    // pitcher (tilts while pouring)
    const tilt = G.state === "pour" ? -0.85 : -0.15,
      px = 1010,
      py = 330
    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(tilt)
    rr(ctx, -70, -110, 140, 190, 26)
    ctx.fillStyle = "rgba(230,248,255,.75)"
    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = INK
    ctx.stroke()
    ctx.save()
    rr(ctx, -70, -110, 140, 190, 26)
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
    rr(ctx, -58, -96, 116, 40, 8)
    ctx.fillStyle = "#fff"
    ctx.fill()
    ctx.lineWidth = 4
    ctx.strokeStyle = INK
    ctx.stroke()
    plainText(ctx, "♻ BACKWASH", 0, -76, 20, "#2f9e44", "center", 900)
    ctx.restore()
    if (G.state === "pour") {
      const sx = px - 120,
        sy = py - 40,
        wob = Math.sin(now * 30) * 4
      ctx.strokeStyle = "#ffcd2e"
      ctx.lineWidth = 22
      ctx.lineCap = "round"
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.quadraticCurveTo(sx - 20 + wob, sy + 60, L.cupX + 30, lvlY)
      ctx.stroke()
      ctx.lineCap = "butt"
    }
    ctx.save()
    ctx.translate(L.cupX + L.topW / 2 - 20, L.cupTop)
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
    if (G.state === "ready" && G.phase === "play") label(ctx, "HOLD TO POUR", L.cupX, 420, 40, "#fff")
    if (G.msgT > 0) label(ctx, G.msg, L.cupX, 380, 48, G.msgOk ? "#9dff6a" : "#ff6b5b")
  }
}
function lemonNext(G) {
  Object.assign(G, {
    level: 0,
    line: rand(0.42, 0.76),
    state: "ready",
    cust: pick(["🧑", "👩", "👨‍🦰", "👵", "🧔", "👧", "🧑‍🦱", "👱‍♀️", "👴"]),
    order: pick(["Is it fresh?", "Fresh-squeezed, right?", "A large, please!", "Why is it cloudy?", "Extra lemony!"])
  })
}
function lemonJudge(G) {
  const d = G.level - G.line
  G.state = "judged"
  G.wait = 0.75
  G.msgT = 0.75
  if (d < 0) {
    G.msg = "Not full enough!"
    G.msgOk = false
    G.reaction = pick(["Half a cup?! And is that GUM?", "There's a HAIR in this!"])
    jobStrike("Complaint!", LEMON.cupX, 300)
  } else if (d <= LEMON.zone) {
    G.served++
    G.speed = Math.min(0.8, G.speed + 0.055)
    G.msg = "Resold!"
    G.msgOk = true
    G.reaction = pick(["Tastes… familiar?", "Mmm, chewy!", "Why is it warm?", "Thanks, I guess!"])
    burst(LEMON.cupX, LEMON.cupTop, "#ffe34d", 16)
    if (G.served >= LEMON.goal) endJob("win")
  } else {
    G.msg = "Wasted backwash!"
    G.msgOk = false
    G.reaction = pick(["Wow, a full cup!", "So generous!"])
  }
}

export { LemonGame }
