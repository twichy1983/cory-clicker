import { JW, JH, pick, rr, vgrad, INK, emoji, label } from "./draw.js"
import { G, floatText, burst, jobStrike, endJob } from "./framework.js"

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
  init(G) {
    Object.assign(G, {
      slots: TELLERS.map((t) => ({ ...t, who: null, t: 0, life: 0 })),
      spawn: 0.25,
      opened: 0
    })
  },
  step(G, dt) {
    for (const s of G.slots)
      if (s.who) {
        s.t += dt
        if (s.t >= s.life) s.who = null
      }
    if ((G.spawn -= dt) <= 0) {
      const free = G.slots.filter((s) => !s.who)
      if (free.length) {
        const s = pick(free),
          aud = Math.random() < 0.25 + G.t * 0.005
        const ghost = !aud && Math.random() < 0.14
        Object.assign(s, {
          who: aud ? "🕵️" : ghost ? "👻" : pick(["👵", "🧑", "👨‍🦳", "👩‍🦱", "🧔", "👨‍🎓", "👩‍💼", "🧑‍🍳", "👴", "👩", "👦"]),
          aud,
          ghost,
          t: 0,
          life: Math.max(0.75, 1.25 - G.t * 0.015)
        })
      }
      G.spawn = Math.max(0.28, 0.6 - G.t * 0.01)
    }
    G.pct = (G.opened / ACCT_GOAL) * 100
    G.meterText = `${G.opened} / ${ACCT_GOAL}`
  },
  cursor(G, x, y) {
    return !!acctSlotAt(x, y)
  },
  down(G, x, y) {
    const s = acctSlotAt(x, y)
    if (!s) return
    if (s.aud) {
      s.who = null
      jobStrike("That was an auditor!", s.x, s.y - 260)
    } else {
      const n = s.ghost ? 2 : 1
      s.who = null
      G.opened = Math.min(ACCT_GOAL, G.opened + n)
      floatText(s.ghost ? "+2 (deceased)" : "+1 account", s.x, s.y - 250)
      burst(s.x, s.y - 150, s.ghost ? "#cfe8ff" : "#7cfc7c", 10, 260)
      if (G.opened >= ACCT_GOAL) endJob("win")
    }
  },
  draw(ctx, G, now) {
    ctx.fillStyle = vgrad(ctx, 0, JH, [
      [0, "#f3ead7"],
      [1, "#d9ccb0"]
    ])
    ctx.fillRect(0, 0, JW, JH)
    rr(ctx, 536, 18, 600, 76, 16)
    ctx.fillStyle = "#14365e"
    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = INK
    ctx.stroke()
    label(ctx, "🏦 MEGABANK", 836, 58, 46, "#ffd23f")
    for (const t of TELLERS) {
      const x = t.x,
        y = t.y
      rr(ctx, x - 150, y - 300, 300, 300, 28)
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
      const s = G.slots.find((q) => q.x === x && q.y === y)
      if (s && s.who) {
        const up = Math.min(1, s.t / 0.15),
          down = Math.max(0, (s.t - (s.life - 0.15)) / 0.15),
          rise = (up - down) * 150
        emoji(ctx, s.who, x, y + 60 - rise, 150)
        if (s.aud) emoji(ctx, "💼", x + 70, y + 60 - rise + 30, 60)
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
      rr(ctx, x - 165, y - 24, 330, 40, 10)
      ctx.fillStyle = "#7a5230"
      ctx.fill()
      ctx.lineWidth = 6
      ctx.strokeStyle = INK
      ctx.stroke()
    }
  }
}
function acctSlotAt(x, y) {
  return G.slots.find((s) => s.who && s.t > 0.08 && Math.abs(x - s.x) < 130 && y > s.y - 290 && y < s.y + 10)
}

export { AccountsGame }
