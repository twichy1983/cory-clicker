import { CANVAS_WIDTH, CANVAS_HEIGHT, rand, pick, roundedRect, vgrad, INK, emoji, label, plainText } from "./draw.js"
import { shift, floatText, jobAlert, jobStrike, endJob } from "./framework.js"

/** @typedef {import("./framework.js").Minigame} Minigame */

/* ---------------------------------------------------------
   JOB: SHRED THE COMPLAINTS (Consumer Goods Factory)
   Click falling complaint letters before they reach the regulator.
   --------------------------------------------------------- */
const SHRED = { goal: 20, inbox: 815, keepChance: 0.28, keepPenalty: 3 }
const SHRED_EVIDENCE = {
  icons: ["🔥", "⚠️", "📎", "🧯", "🚑", "⚖️"],
  texts: [
    "ENGINEER: IT WILL BURN",
    "INJURY REPORT #212",
    "SUBPOENA",
    "MEMO: DO NOT SHIP",
    "WE KNEW IN 2019",
    "BURN CLAIM #88",
    "WHISTLEBLOWER DRAFT",
    "TEST RESULT: FAILED",
    "CEO: SHIP IT ANYWAY"
  ]
}
// documents the company actually needs: shredding one costs progress
const SHRED_KEEP = {
  icons: ["💰", "📈", "🏝️", "⛳", "🛥️", "🖋️"],
  texts: [
    "CEO BONUS PLAN",
    "STOCK OPTIONS",
    "OFFSHORE ACCOUNTS",
    "Q3 RECORD PROFITS",
    "LOBBYIST CONTACTS",
    "YACHT TITLE",
    "SENATOR'S IOU"
  ]
}
/** @type {Minigame} */
const ShredGame = {
  time: 30,
  strikes: 3,
  meter: "EVIDENCE SHREDDED",
  tagline:
    "Your own engineers warned that the space heater catches fire. Then the fires started. Now the memos, injury reports and subpoenas are flying in. If any reach federal investigators, it's a recall, and maybe a prison term.",
  rules: [
    "Incriminating documents (<b>white envelopes, red text</b>) fall toward the investigators' inbox. <b>Click one</b> to shred it.",
    `<b>Don't shred the gold folders marked KEEP</b>: bonus plans, stock options, offshore accounts. Shredding one costs you ${SHRED.keepPenalty} shredded documents. Let them drop; they get filed safely.`,
    "Every piece of evidence that reaches the inbox is a strike. 3 strikes and the FBI is in the lobby.",
    `Shred <b>${SHRED.goal} documents</b> before time runs out. The evidence piles up faster as the shift goes on.`
  ],
  winTitle: "Plausible deniability!",
  winText: "Twenty documents shredded. Officially, nobody knew anything, and now nobody can prove otherwise.",
  lose: {
    busted:
      "Three documents reached federal investigators. Your lawyer recommends a long vacation in a country without extradition.",
    time: "Time's up. The pile of evidence is now taller than the CEO, and it has a press agent."
  },
  init(shift) {
    Object.assign(shift, { letters: [], spawn: 0.3, shredded: 0 })
  },
  step(shift, dt) {
    shift.spawn -= dt
    if (shift.spawn <= 0) {
      const keep = Math.random() < SHRED.keepChance,
        src = keep ? SHRED_KEEP : SHRED_EVIDENCE
      shift.letters.push({
        x: rand(170, 1500),
        y: -60,
        vy: rand(175, 220) + shift.elapsed * 9,
        phase: rand(0, 6),
        sway: rand(20, 50),
        keep,
        icon: pick(src.icons),
        text: pick(src.texts)
      })
      shift.spawn = Math.max(0.36, 0.85 - shift.elapsed * 0.018)
    }
    for (const letter of shift.letters) {
      letter.y += letter.vy * dt
      letter.phase += dt * 2
    }
    for (const letter of shift.letters)
      if (!letter.gone && letter.y > SHRED.inbox) {
        letter.gone = true
        if (letter.keep) floatText("Filed ✓", letter.x, SHRED.inbox - 60)
        else jobStrike("Evidence leaked!", letter.x, SHRED.inbox - 80)
      }
    shift.letters = shift.letters.filter((letter) => !letter.gone)
    shift.pct = (shift.shredded / SHRED.goal) * 100
    shift.meterText = `${shift.shredded} / ${SHRED.goal}`
  },
  cursor(shift, x, y) {
    return !!shredLetterAt(x, y)
  },
  down(shift, x, y) {
    const letter = shredLetterAt(x, y)
    if (!letter) return
    letter.gone = true
    for (let i = 0; i < 14; i++)
      shift.parts.push({
        x: letter.x + rand(-50, 50),
        y: letter.y + rand(-20, 20),
        vx: rand(-200, 200),
        vy: rand(-350, -50),
        life: rand(0.5, 0.9),
        color: letter.keep ? (i % 3 ? "#f2c94c" : "#d4a72c") : i % 3 ? "#fffdf0" : "#e8e1c8",
        radius: 6,
        width: 8,
        height: 30,
        grav: 900,
        rot: rand(0, 3)
      })
    if (letter.keep) {
      shift.shredded = Math.max(0, shift.shredded - SHRED.keepPenalty)
      floatText(`−${SHRED.keepPenalty}! You needed that!`, letter.x, letter.y - 60, true)
      jobAlert(`💸 That was the ${letter.text.toLowerCase()}!`, "bad")
      return
    }
    shift.shredded++
    floatText("Shredded!", letter.x, letter.y - 60)
    if (shift.shredded >= SHRED.goal) endJob("win")
  },
  draw(ctx, shift, now) {
    ctx.fillStyle = vgrad(ctx, 0, SHRED.inbox, [
      [0, "#3a4a63"],
      [1, "#2a364a"]
    ])
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    roundedRect(ctx, 110, 120, 560, 360, 14)
    ctx.fillStyle = vgrad(ctx, 120, 480, [
      [0, "#ffb36b"],
      [1, "#ffd9a1"]
    ])
    ctx.fill()
    ctx.fillStyle = "#3d3a55"
    ;[
      [140, 300, 70, 180],
      [220, 240, 90, 240],
      [320, 330, 60, 150],
      [390, 210, 100, 270],
      [500, 280, 80, 200],
      [590, 320, 60, 160]
    ].forEach(([x, y, width, height]) => ctx.fillRect(x, y, width, height))
    ctx.lineWidth = 12
    ctx.strokeStyle = "#cfd6df"
    roundedRect(ctx, 110, 120, 560, 360, 14)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(390, 120)
    ctx.lineTo(390, 480)
    ctx.stroke()
    ctx.save()
    ctx.translate(1170, 120)
    ctx.rotate(-0.03)
    roundedRect(ctx, 0, 0, 380, 230, 10)
    ctx.fillStyle = "#f5f1e6"
    ctx.fill()
    ctx.lineWidth = 8
    ctx.strokeStyle = "#8a6b3f"
    ctx.stroke()
    plainText(ctx, "SAFETY IS OUR", 190, 80, 34, "#333", "center", 900)
    plainText(ctx, "#2 PRIORITY", 190, 135, 50, "#d62828", "center", 900)
    plainText(ctx, "(after shipping)", 190, 185, 24, "#777", "center", 700)
    ctx.restore()
    // office furniture: filing cabinet, plant, wall clock
    roundedRect(ctx, 1290, 470, 230, 345, 12)
    ctx.fillStyle = "#7c8a99"
    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = INK
    ctx.stroke()
    ;[490, 600, 710].forEach((y) => {
      roundedRect(ctx, 1310, y, 190, 90, 8)
      ctx.fillStyle = "#9aa8b6"
      ctx.fill()
      ctx.stroke()
      roundedRect(ctx, 1375, y + 36, 60, 16, 6)
      ctx.fillStyle = "#3d4650"
      ctx.fill()
    })
    plainText(ctx, "INCIDENTS", 1405, 532, 22, "#1b2430", "center", 900)
    plainText(ctx, "(EMPTY)", 1405, 642, 22, "#1b2430", "center", 900)
    emoji(ctx, "🪴", 1590, 700, 150)
    emoji(ctx, "🪑", 870, 720, 170)
    ctx.beginPath()
    ctx.arc(836, 120, 62, 0, Math.PI * 2)
    ctx.fillStyle = "#fffdf3"
    ctx.fill()
    ctx.lineWidth = 7
    ctx.strokeStyle = INK
    ctx.stroke()
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(836, 120)
    ctx.lineTo(836 + Math.cos(now) * 44, 120 + Math.sin(now) * 44)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(836, 120)
    ctx.lineTo(836 + Math.cos(now / 12) * 28, 120 + Math.sin(now / 12) * 28)
    ctx.stroke()
    // regulator's inbox along the bottom
    ctx.fillStyle = vgrad(ctx, SHRED.inbox, CANVAS_HEIGHT, [
      [0, "#8c2a2a"],
      [1, "#5e1515"]
    ])
    ctx.fillRect(0, SHRED.inbox, CANVAS_WIDTH, CANVAS_HEIGHT - SHRED.inbox)
    ctx.lineWidth = 6
    ctx.strokeStyle = INK
    ctx.beginPath()
    ctx.moveTo(0, SHRED.inbox)
    ctx.lineTo(CANVAS_WIDTH, SHRED.inbox)
    ctx.stroke()
    label(ctx, "📥 TO: FEDERAL INVESTIGATORS", 836, SHRED.inbox + 60, 44, "#ffd9d9")
    for (const letter of shift.letters) drawLetter(ctx, letter)
  }
}
const LETTER_SCALE = 1.3
function shredLetterAt(x, y) {
  return [...shift.letters]
    .reverse()
    .find(
      (letter) =>
        Math.abs(x - (letter.x + Math.sin(letter.phase) * letter.sway)) < 95 * LETTER_SCALE &&
        Math.abs(y - letter.y) < 72 * LETTER_SCALE
    )
}
function drawLetter(ctx, letter) {
  const x = letter.x + Math.sin(letter.phase) * letter.sway,
    y = letter.y
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(LETTER_SCALE, LETTER_SCALE)
  ctx.translate(-x, -y)
  drawLetterShape(ctx, letter, x, y)
  ctx.restore()
}
function drawLetterShape(ctx, letter, x, y) {
  if (letter.keep) return drawKeepFolder(ctx, letter, x, y)
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(Math.sin(letter.phase) * 0.12)
  roundedRect(ctx, -85, -55, 170, 110, 10)
  ctx.fillStyle = "#fffaf0"
  ctx.fill()
  ctx.lineWidth = 5
  ctx.strokeStyle = INK
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-85, -55)
  ctx.lineTo(0, 10)
  ctx.lineTo(85, -55)
  ctx.strokeStyle = "#9a8f74"
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.restore()
  emoji(ctx, letter.icon, x + 50, y - 30, 40)
  label(ctx, letter.text, x, y + 34, letter.text.length > 14 ? 15 : 20, "#ff6b5b")
}
function drawKeepFolder(ctx, letter, x, y) {
  // a gold manila folder with a green KEEP stamp: do not shred
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(Math.sin(letter.phase) * 0.12)
  ctx.lineWidth = 5
  ctx.strokeStyle = INK
  roundedRect(ctx, -85, -70, 70, 26, 8)
  ctx.fillStyle = "#e0b43a"
  ctx.fill()
  ctx.stroke() // folder tab
  roundedRect(ctx, -85, -55, 170, 110, 10)
  ctx.fillStyle = vgrad(ctx, -55, 55, [
    [0, "#ffd866"],
    [1, "#e8b331"]
  ])
  ctx.fill()
  ctx.stroke()
  ctx.strokeStyle = "rgba(120,80,0,.45)"
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(-80, -38)
  ctx.lineTo(80, -38)
  ctx.stroke()
  ctx.save()
  ctx.rotate(-0.18)
  roundedRect(ctx, -46, -30, 92, 38, 8)
  ctx.lineWidth = 5
  ctx.strokeStyle = "#1f9d55"
  ctx.stroke()
  plainText(ctx, "KEEP", 0, -11, 26, "#1f9d55", "center", 900)
  ctx.restore()
  ctx.restore()
  emoji(ctx, letter.icon, x + 56, y - 34, 38)
  label(ctx, letter.text, x, y + 34, letter.text.length > 14 ? 15 : 19, "#9dff9d")
}

export { ShredGame }
