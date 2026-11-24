import { CANVAS_WIDTH, CANVAS_HEIGHT, pick, roundedRect, vgrad, INK, emoji, label } from "./draw.js"
import { shift, floatText, burst, jobStrike, endJob } from "./framework.js"

/* ---------------------------------------------------------
   JOB: SURPRISE ACCOUNTS (Megabank Data Silo)
   Whack-a-mole: sign up customers, never the auditors.
   --------------------------------------------------------- */
const TELLERS = [0, 1, 2, 3].flatMap((i) => [
  { x: 300 + i * 357, y: 470 },
  { x: 300 + i * 357, y: 830 }
])
const ACCT_GOAL = 25
const AccountsGame = {
  time: 30,
  strikes: 3,
  meter: "ACCOUNTS OPENED",
  tagline:
    "Head office wants eight accounts per customer. Grandma, the paperboy, the recently deceased: everyone gets a credit card and a monthly fee. Nobody needs to know.",
  rules: [
    "Customers pop up at the teller windows. <b>Click them</b> to open an account in their name.",
    "<b>Ghosts 👻 count double.</b> Dead customers never complain about fees.",
    "<b>Don't click the auditors</b> 🕵️ (trench coat, briefcase). That's a strike.",
    `Open <b>${ACCT_GOAL} accounts</b> before time runs out. 3 strikes and you're busted.`
  ],
  winTitle: "Cross-sold!",
  winText: "Twenty-five new accounts, several for people who are no longer with us. Their overdraft fees live on.",
  lose: {
    busted: "You tried to open an account for an auditor. Three times. The audit is now extremely thorough.",
    time: "Time's up. You're short of quota, and the regional manager is 'disappointed in your hunger.'"
  },
  init(shift) {
    Object.assign(shift, {
      slots: TELLERS.map((teller) => ({ ...teller, who: null, age: 0, life: 0 })),
      spawn: 0.25,
      opened: 0
    })
  },
  step(shift, dt) {
    for (const slot of shift.slots)
      if (slot.who) {
        slot.age += dt
        if (slot.age >= slot.life) slot.who = null
      }
    shift.spawn -= dt
    if (shift.spawn <= 0) {
      const free = shift.slots.filter((slot) => !slot.who)
      if (free.length) {
        const slot = pick(free),
          aud = Math.random() < 0.25 + shift.elapsed * 0.005
        const ghost = !aud && Math.random() < 0.14
        Object.assign(slot, {
          who: aud ? "🕵️" : ghost ? "👻" : pick(["👵", "🧑", "👨‍🦳", "👩‍🦱", "🧔", "👨‍🎓", "👩‍💼", "🧑‍🍳", "👴", "👩", "👦"]),
          aud,
          ghost,
          age: 0,
          life: Math.max(0.75, 1.25 - shift.elapsed * 0.015)
        })
      }
      shift.spawn = Math.max(0.28, 0.6 - shift.elapsed * 0.01)
    }
    shift.pct = (shift.opened / ACCT_GOAL) * 100
    shift.meterText = `${shift.opened} / ${ACCT_GOAL}`
  },
  cursor(shift, x, y) {
    return !!acctSlotAt(x, y)
  },
  down(shift, x, y) {
    const slot = acctSlotAt(x, y)
    if (!slot) return
    if (slot.aud) {
      slot.who = null
      jobStrike("That was an auditor!", slot.x, slot.y - 260)
    } else {
      const count = slot.ghost ? 2 : 1
      slot.who = null
      shift.opened = Math.min(ACCT_GOAL, shift.opened + count)
      floatText(slot.ghost ? "+2 (deceased)" : "+1 account", slot.x, slot.y - 250)
      burst(slot.x, slot.y - 150, slot.ghost ? "#cfe8ff" : "#7cfc7c", 10, 260)
      if (shift.opened >= ACCT_GOAL) endJob("win")
    }
  },
  draw(ctx, shift, now) {
    ctx.fillStyle = vgrad(ctx, 0, CANVAS_HEIGHT, [
      [0, "#f3ead7"],
      [1, "#d9ccb0"]
    ])
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    roundedRect(ctx, 536, 18, 600, 76, 16)
    ctx.fillStyle = "#14365e"
    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = INK
    ctx.stroke()
    label(ctx, "🏦 MEGABANK", 836, 58, 46, "#ffd23f")
    for (const teller of TELLERS) {
      const x = teller.x,
        y = teller.y
      roundedRect(ctx, x - 150, y - 300, 300, 300, 28)
      ctx.fillStyle = "#c9b48a"
      ctx.fill()
      ctx.lineWidth = 6
      ctx.strokeStyle = INK
      ctx.stroke()
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(x - 120, y - 20)
      ctx.lineTo(x - 120, y - 190)
      ctx.arc(x, y - 190, 120, Math.PI, 0)
      ctx.lineTo(x + 120, y - 20)
      ctx.closePath()
      ctx.fillStyle = "#28435f"
      ctx.fill()
      ctx.clip()
      const slot = shift.slots.find((entry) => entry.x === x && entry.y === y)
      if (slot && slot.who) {
        const up = Math.min(1, slot.age / 0.15),
          down = Math.max(0, (slot.age - (slot.life - 0.15)) / 0.15),
          rise = (up - down) * 150
        emoji(ctx, slot.who, x, y + 60 - rise, 150)
        if (slot.aud) emoji(ctx, "💼", x + 70, y + 60 - rise + 30, 60)
      }
      ctx.restore()
      ctx.beginPath()
      ctx.moveTo(x - 120, y - 20)
      ctx.lineTo(x - 120, y - 190)
      ctx.arc(x, y - 190, 120, Math.PI, 0)
      ctx.lineTo(x + 120, y - 20)
      ctx.lineWidth = 6
      ctx.strokeStyle = INK
      ctx.stroke()
      ctx.strokeStyle = "rgba(255,255,255,.5)"
      ctx.lineWidth = 4
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath()
        ctx.moveTo(x + i * 60, y - 30)
        ctx.lineTo(x + i * 60, y - 230)
        ctx.stroke()
      }
      roundedRect(ctx, x - 165, y - 24, 330, 40, 10)
      ctx.fillStyle = "#7a5230"
      ctx.fill()
      ctx.lineWidth = 6
      ctx.strokeStyle = INK
      ctx.stroke()
    }
  }
}
function acctSlotAt(x, y) {
  return shift.slots.find(
    (slot) => slot.who && slot.age > 0.08 && Math.abs(x - slot.x) < 130 && y > slot.y - 290 && y < slot.y + 10
  )
}

export { AccountsGame }
