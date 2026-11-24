import { JW, JH, pick, rr, vgrad, INK, emoji, label, plainText, bubble, inBox } from "./draw.js"
import { burst, jobStrike, endJob } from "./framework.js"

/* ---------------------------------------------------------
   JOB: SCHOOL MILK CONTRACT (Ingredient Supplier), a rhythm game
   Jugs arrive on the beat. As each crosses the glowing line, hit the
   chemical its label asks for (buttons, or keys 1/2/3, A/S/D, J/K/L).
   --------------------------------------------------------- */
const MILK = {
  goal: 24,
  belt: 690,
  hitX: 1040,
  speed: 520,
  bpm: 100,
  first: 2.0,
  perfect: 0.09,
  good: 0.2,
  exit: 1370
}
const MILK_BEAT = 60 / MILK.bpm
const CHEMS = [
  {
    name: "TAP WATER",
    icon: "💧",
    color: "#3b8bdb",
    ink: "#fff",
    keys: ["1", "a", "j"]
  },
  {
    name: "CHALK",
    icon: "🦴",
    color: "#f1f3f5",
    ink: "#1b1b1b",
    keys: ["2", "s", "k"]
  },
  {
    name: "FORMALDEHYDE",
    icon: "⚗️",
    color: "#2fb35a",
    ink: "#fff",
    keys: ["3", "d", "l"]
  }
]
const MILK_BTNS = CHEMS.map((_, i) => ({
  x: 120 + i * 490,
  y: 800,
  width: 450,
  height: 112
}))
const MilkGame = {
  time: 30,
  strikes: 3,
  meter: "JUGS DOSED",
  tagline:
    "You won the milk contract for every school in the district by underbidding everyone. The trick: each jug gets a splash of tap water, chalk to keep it white, or formaldehyde to keep it 'fresh.' The lunch lady checks every jug.",
  rules: [
    "Jugs ride the belt <b>to the beat</b>. Each jug's label and cap color show the chemical it needs: <b>💧 TAP WATER</b>, <b>🦴 CHALK</b> or <b>⚗️ FORMALDEHYDE</b>.",
    "When a jug crosses the <b>glowing line</b>, hit the matching button (or keys <b>1 2 3</b>, <b>A S D</b> or <b>J K L</b>). Right on the beat is a PERFECT.",
    "The <b>wrong chemical</b> is a strike: the lunch lady tastes it. 3 strikes and you're busted.",
    "Miss a jug and the kids get real milk: no strike, but your combo resets and so does the profit.",
    `Dose <b>${MILK.goal} jugs</b> before the song ends. It gets busier as it goes.`
  ],
  winTitle: "Calcium is calcium!",
  winText:
    "Twenty-four jugs of 'Growing Kids Milk' dosed to the beat. The school board called it 'remarkably shelf-stable.'",
  lose: {
    busted:
      "The lunch lady tasted formaldehyde where the chalk should be, three times. She called the school board, a reporter, and her cousin the lawyer.",
    time: "The song ended and too much real milk reached the cafeteria. The shareholders are livid."
  },
  init(shift) {
    Object.assign(shift, {
      jugs: milkChart(),
      done: 0,
      combo: 0,
      best: 0,
      judge: "",
      judgeOk: true,
      judgeT: 0,
      squirt: null,
      press: [0, 0, 0],
      ladySay: "",
      ladyT: 0
    })
  },
  step(shift, dt) {
    shift.judgeT = Math.max(0, shift.judgeT - dt)
    shift.ladyT = Math.max(0, shift.ladyT - dt)
    shift.press = shift.press.map((cooldown) => Math.max(0, cooldown - dt))
    if (shift.squirt && (shift.squirt.timer -= dt) <= 0) shift.squirt = null
    for (const jug of shift.jugs)
      if (!jug.res && shift.elapsed - jug.hitTime > MILK.good) {
        // sailed past the line undosed
        jug.res = "miss"
        shift.combo = 0
        milkJudge(shift, "MISS", false)
        shift.ladySay = pick(["Real milk? Weird.", "This one's… actual milk?", "Huh. Tastes like a cow."])
        shift.ladyT = 0.9
      }
    shift.pct = (shift.done / MILK.goal) * 100
    shift.meterText = `${shift.done} / ${MILK.goal}`
  },
  extra(shift) {
    return (
      "🚨 " +
      Array.from({ length: this.strikes }, (_, i) => (i < shift.strikes ? "●" : "○")).join(" ") +
      `  ·  🔥 x${shift.combo}`
    )
  },
  cursor(shift, x, y) {
    return MILK_BTNS.some((button) => inBox(x, y, button))
  },
  down(shift, x, y) {
    const i = MILK_BTNS.findIndex((button) => inBox(x, y, button))
    if (i >= 0) milkPress(shift, i)
  },
  key(shift, pressedKey) {
    const i = CHEMS.findIndex((chem) => chem.keys.includes(pressedKey.toLowerCase()))
    if (i < 0) return false
    milkPress(shift, i)
    return true
  },
  draw(ctx, shift, now) {
    const ph = ((((shift.elapsed - MILK.first) / MILK_BEAT) % 1) + 1) % 1,
      pulse = 1 - ph // beat phase: 0 on the beat
    // dairy plant wall
    ctx.fillStyle = vgrad(ctx, 0, MILK.belt, [
      [0, "#dbeef5"],
      [1, "#c4dde8"]
    ])
    ctx.fillRect(0, 0, JW, MILK.belt)
    ctx.strokeStyle = "rgba(255,255,255,.7)"
    ctx.lineWidth = 3
    for (let x = 0; x < JW; x += 70) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, MILK.belt)
      ctx.stroke()
    }
    for (let y = 0; y < MILK.belt; y += 70) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(JW, y)
      ctx.stroke()
    }
    rr(ctx, 80, 30, 760, 100, 18)
    ctx.fillStyle = "#2f80ed"
    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = INK
    ctx.stroke()
    label(ctx, "🐄 FRESH FOR GROWING KIDS 🐄", 460, 80, 44, "#fff")
    plainText(ctx, "District #12 Official Supplier · Lowest bid since 2009", 460, 160, 24, "#4a6378", "center", 800)
    // chemical tanks feeding one nozzle over the line
    CHEMS.forEach((chem, i) => {
      const tx = MILK.hitX - 200 + i * 200,
        ty = 210,
        hit = shift.press[i] > 0
      ctx.strokeStyle = INK
      ctx.lineWidth = 16
      ctx.beginPath()
      ctx.moveTo(tx, ty + 120)
      ctx.quadraticCurveTo(tx, 380, MILK.hitX, 395)
      ctx.stroke()
      ctx.strokeStyle = "#9aa4ab"
      ctx.lineWidth = 9
      ctx.stroke()
      rr(ctx, tx - 70, ty - 20 + (hit ? 6 : 0), 140, 150, 22)
      ctx.fillStyle = chem.color
      ctx.fill()
      ctx.lineWidth = 6
      ctx.strokeStyle = INK
      ctx.stroke()
      emoji(ctx, chem.icon, tx, ty + 30 + (hit ? 6 : 0), 54)
      plainText(ctx, chem.name, tx, ty + 95 + (hit ? 6 : 0), chem.name.length > 9 ? 15 : 19, chem.ink, "center", 900)
    })
    rr(ctx, MILK.hitX - 36, 385, 72, 48, 12)
    ctx.fillStyle = "#6b757d"
    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = INK
    ctx.stroke()
    // the glowing hit line, pulsing on the beat
    ctx.fillStyle = `rgba(255,236,120,${0.12 + 0.3 * pulse})`
    ctx.fillRect(MILK.hitX - 78, 440, 156, MILK.belt - 440)
    ctx.strokeStyle = `rgba(255,200,0,${0.5 + 0.5 * pulse})`
    ctx.lineWidth = 6
    ctx.setLineDash([16, 10])
    ;[MILK.hitX - 78, MILK.hitX + 78].forEach((x) => {
      ctx.beginPath()
      ctx.moveTo(x, 440)
      ctx.lineTo(x, MILK.belt)
      ctx.stroke()
    })
    ctx.setLineDash([])
    // floor + belt
    ctx.fillStyle = "#5b646b"
    ctx.fillRect(0, MILK.belt, JW, JH - MILK.belt)
    rr(ctx, -20, MILK.belt - 10, JW + 40, 70, 20)
    ctx.fillStyle = "#2c3236"
    ctx.fill()
    ctx.strokeStyle = INK
    ctx.lineWidth = 6
    ctx.stroke()
    ctx.strokeStyle = "#475057"
    ctx.lineWidth = 8
    const off = (shift.elapsed * MILK.speed) % 80
    for (let x = -off; x < JW; x += 80) {
      ctx.beginPath()
      ctx.moveTo(x, MILK.belt + 4)
      ctx.lineTo(x + 30, MILK.belt + 25)
      ctx.lineTo(x, MILK.belt + 46)
      ctx.stroke()
    }
    // jugs
    for (const jug of shift.jugs) {
      const x = MILK.hitX - (jug.hitTime - shift.elapsed) * MILK.speed
      if (x > -120 && x < JW + 120) drawRhythmJug(ctx, x, jug)
    }
    // squirt from the nozzle into the jug on the line
    if (shift.squirt) {
      const chem = CHEMS[shift.squirt.chemIndex]
      ctx.strokeStyle = chem.color
      ctx.lineWidth = 18
      ctx.lineCap = "round"
      ctx.beginPath()
      ctx.moveTo(MILK.hitX, 432)
      ctx.lineTo(MILK.hitX + Math.sin(now * 40) * 3, 505)
      ctx.stroke()
      ctx.lineCap = "butt"
      ctx.lineWidth = 4
      ctx.strokeStyle = INK
      ctx.stroke()
    }
    // the lunch lady, bopping to the beat
    rr(ctx, MILK.exit + 30, 520, 200, 170, 18)
    ctx.fillStyle = "#f0f4f6"
    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = INK
    ctx.stroke()
    label(ctx, "CAFETERIA", MILK.exit + 130, 560, 28, "#2f80ed")
    emoji(ctx, "👩‍🍳", MILK.exit + 130, 440 - pulse * 14, 160)
    if (shift.ladyT > 0) bubble(ctx, shift.ladySay, MILK.exit + 90, 330, 28)
    if (shift.combo >= 3) label(ctx, `🔥 ${shift.combo} COMBO`, MILK.exit + 130, 620 + 0 * pulse, 30, "#ffd23f")
    // judgement
    if (shift.judgeT > 0) {
      ctx.save()
      ctx.globalAlpha = Math.min(1, shift.judgeT * 3)
      label(ctx, shift.judge, MILK.hitX, 300 - (1 - shift.judgeT) * 30, 62, shift.judgeOk ? "#9dff6a" : "#ff5c5c")
      ctx.restore()
    }
    // beat counter (visual metronome)
    for (let i = 0; i < 4; i++) {
      const beatNo = Math.floor((shift.elapsed - MILK.first) / MILK_BEAT),
        on = shift.elapsed >= MILK.first - 0.001 && ((beatNo % 4) + 4) % 4 === i
      ctx.beginPath()
      ctx.arc(1180 + i * 44, 80, on ? 16 : 12, 0, Math.PI * 2)
      ctx.fillStyle = on ? "#ff4d8d" : "rgba(0,0,0,.25)"
      ctx.fill()
    }
    plainText(ctx, `♪ ${MILK.bpm} BPM`, 1246, 125, 22, "#4a6378", "center", 900)
    // chemical buttons
    CHEMS.forEach((chem, i) => {
      const button = MILK_BTNS[i],
        down = shift.press[i] > 0
      rr(ctx, button.x, button.y + (down ? 6 : 0), button.width, button.height, 24)
      ctx.fillStyle = chem.color
      ctx.fill()
      ctx.lineWidth = 6
      ctx.strokeStyle = INK
      ctx.stroke()
      emoji(ctx, chem.icon, button.x + 70, button.y + button.height / 2 + (down ? 6 : 0), 58)
      plainText(
        ctx,
        chem.name,
        button.x + button.width / 2 + 30,
        button.y + 46 + (down ? 6 : 0),
        chem.name.length > 9 ? 30 : 36,
        chem.ink,
        "center",
        900
      )
      plainText(
        ctx,
        `key ${chem.keys[0]} · ${chem.keys[1].toUpperCase()} · ${chem.keys[2].toUpperCase()}`,
        button.x + button.width / 2 + 30,
        button.y + 84 + (down ? 6 : 0),
        20,
        chem.ink === "#fff" ? "rgba(255,255,255,.8)" : "#555",
        "center",
        800
      )
    })
    if (shift.phase === "play" && shift.elapsed < MILK.first)
      label(ctx, shift.elapsed < MILK.first - 1.2 ? "READY…" : "HERE THEY COME!", JW / 2, 470, 64, "#fff")
  }
}
function milkChart() {
  const out = []
  let hitTime = MILK.first
  while (hitTime < MilkGame.time - 0.3) {
    if (Math.random() < Math.min(0.85, 0.55 + (hitTime - MILK.first) * 0.013)) {
      out.push({ hitTime, chem: Math.floor(Math.random() * 3), res: null })
      if (hitTime > 12 && Math.random() < 0.22)
        out.push({
          hitTime: hitTime + MILK_BEAT / 2,
          chem: Math.floor(Math.random() * 3),
          res: null
        }) // off-beat jug
    }
    hitTime += MILK_BEAT
  }
  return out
}
function milkJudge(shift, text, ok) {
  shift.judge = text
  shift.judgeOk = ok
  shift.judgeT = 0.55
}
function milkPress(shift, ci) {
  shift.press[ci] = 0.12
  shift.squirt = { chemIndex: ci, timer: 0.18 }
  let best = null,
    bd = Infinity
  for (const jug of shift.jugs)
    if (!jug.res) {
      const diff = Math.abs(shift.elapsed - jug.hitTime)
      if (diff < bd) {
        bd = diff
        best = jug
      }
    }
  if (!best || bd > MILK.good) {
    shift.combo = 0
    milkJudge(shift, "OFF BEAT", false)
    return
  }
  if (best.chem !== ci) {
    best.res = "wrong"
    shift.combo = 0
    milkJudge(shift, "WRONG!", false)
    shift.ladySay = pick(["That's not chalk!", "Is this… embalming fluid?", "BLECH!"])
    shift.ladyT = 1
    jobStrike("Wrong chemical!", MILK.exit + 130, 330)
    return
  }
  best.res = bd <= MILK.perfect ? "perfect" : "good"
  shift.done++
  shift.combo++
  shift.best = Math.max(shift.best, shift.combo)
  milkJudge(shift, best.res === "perfect" ? "PERFECT!" : "GOOD", true)
  burst(MILK.hitX, MILK.belt - 200, CHEMS[ci].color, 12, 280)
  if (shift.done >= MILK.goal) endJob("win")
}
function drawRhythmJug(ctx, x, jug) {
  const chem = CHEMS[jug.chem],
    base = MILK.belt - 6,
    width = 112,
    height = 178,
    top = base - height
  const dosed = jug.res === "perfect" || jug.res === "good"
  ctx.save()
  const body = dosed ? "#eef6ff" : jug.res === "wrong" ? "#dff3c8" : "#fff"
  ctx.lineWidth = 6
  ctx.strokeStyle = INK
  rr(ctx, x - width / 2, top + 40, width, height - 40, 26)
  ctx.fillStyle = body
  ctx.fill()
  ctx.stroke()
  rr(ctx, x - 24, top + 6, 48, 42, 10)
  ctx.fillStyle = body
  ctx.fill()
  ctx.stroke()
  rr(ctx, x - 30, top - 14, 60, 26, 8)
  ctx.fillStyle = chem.color
  ctx.fill()
  ctx.stroke() // cap = the chemical it needs
  ctx.beginPath()
  ctx.arc(x + width / 2 - 6, top + 92, 28, -1.3, 1.3)
  ctx.lineWidth = 12
  ctx.stroke()
  ctx.lineWidth = 6
  rr(ctx, x - width / 2 + 10, top + 70, width - 20, 92, 10)
  ctx.fillStyle = chem.color
  ctx.fill()
  ctx.lineWidth = 4
  ctx.stroke() // label = the chemical it needs
  emoji(ctx, chem.icon, x, top + 100, 40)
  plainText(
    ctx,
    chem.name,
    x,
    top + 142,
    chem.name.length > 11 ? 11 : chem.name.length > 7 ? 13 : 16,
    chem.ink,
    "center",
    900
  )
  if (dosed) emoji(ctx, "✅", x + 40, top - 6, 34)
  else if (jug.res === "wrong") emoji(ctx, "🤢", x + 40, top - 6, 40)
  else if (jug.res === "miss") label(ctx, "REAL MILK", x, top - 20, 20, "#9fd8ff")
  ctx.restore()
}

export { MilkGame }
