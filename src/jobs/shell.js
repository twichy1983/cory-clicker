import { CANVAS_WIDTH, CANVAS_HEIGHT, roundedRect, vgrad, INK, emoji, label } from "./draw.js"
import { floatText, burst, jobAlert, jobStrike, endJob } from "./framework.js"

/* ---------------------------------------------------------
   JOB: FOLLOW THE MONEY (Offshore Shell Network)
   A shell game with literal shell companies.
   --------------------------------------------------------- */
const SHELL_X = [486, 836, 1186],
  SHELL_Y = 640,
  SHELL_GOAL = 5
const ShellGame = {
  time: 40,
  strikes: 3,
  meter: "FUNDS LOCATED",
  tagline:
    "You quietly emptied the employee pension fund into offshore shell companies. The retirees' lawyers are on the trail. Keep track of where the money is while the shells reshuffle.",
  rules: [
    "Watch which shell company the 💰 pension money goes under.",
    "The shells shuffle to throw off the lawyers. Keep your eye on the money.",
    "<b>Click the shell</b> you think is hiding it. A wrong guess is a strike.",
    `Find the money <b>${SHELL_GOAL} times</b> before time runs out. The shuffles get faster every round.`
  ],
  winTitle: "Pension secured (for you)!",
  winText: "Forty thousand retirements, safely offshore. The retirees will be fine. They have each other.",
  lose: {
    busted: "You lost track of 40,000 people's pensions three times. The lawyers found it before you did.",
    time: "Time's up. The money is still out there somewhere, in a very nice climate."
  },
  init(shift) {
    Object.assign(shift, {
      slot: [0, 1, 2],
      money: 1,
      found: 0,
      round: 0,
      stage: "show",
      stageTimer: 0,
      swap: null,
      swapsLeft: 0,
      lift: [1, 1, 1],
      pickI: -1
    })
    shellRound(shift)
  },
  step(shift, dt) {
    shift.stageTimer += dt
    const liftTo = (i, target) => {
      shift.lift[i] += (target - shift.lift[i]) * Math.min(1, dt * 12)
    }
    if (shift.stage === "show") {
      shift.lift.forEach((_, i) => liftTo(i, i === shift.money ? 1 : 0))
      if (shift.stageTimer > 1.1) {
        shift.stage = "lower"
        shift.stageTimer = 0
      }
    } else if (shift.stage === "lower") {
      shift.lift.forEach((_, i) => liftTo(i, 0))
      if (shift.stageTimer > 0.35) {
        shift.stage = "shuffle"
        shift.stageTimer = 0
        shellNextSwap(shift)
      }
    } else if (shift.stage === "shuffle") {
      if (shift.stageTimer >= shift.swap.dur) {
        const { indexA, indexB } = shift.swap
        ;[shift.slot[indexA], shift.slot[indexB]] = [shift.slot[indexB], shift.slot[indexA]]
        shift.swapsLeft--
        if (shift.swapsLeft > 0) {
          shift.stageTimer = 0
          shellNextSwap(shift)
        } else {
          shift.stage = "pick"
          shift.stageTimer = 0
          shift.swap = null
          jobAlert("Where's the money?", "warn")
        }
      }
    } else if (shift.stage === "reveal") {
      shift.lift.forEach((_, i) => liftTo(i, 1))
      if (shift.stageTimer > 1.1) {
        if (shift.found >= SHELL_GOAL) endJob("win")
        else shellRound(shift)
      }
    }
    shift.pct = (shift.found / SHELL_GOAL) * 100
    shift.meterText = `${shift.found} / ${SHELL_GOAL}`
  },
  cursor(shift, x, y) {
    return shift.stage === "pick" && shellAt(shift, x, y) >= 0
  },
  down(shift, x, y) {
    if (shift.stage !== "pick") return
    const i = shellAt(shift, x, y)
    if (i < 0) return
    shift.pickI = i
    shift.stage = "reveal"
    shift.stageTimer = 0
    const pos = shellPos(shift, i)
    if (i === shift.money) {
      shift.found++
      floatText("Found it! 💰", pos.x, SHELL_Y - 260)
      burst(pos.x, SHELL_Y - 60, "#ffd23f", 18)
    } else jobStrike("Wrong shell!", pos.x, SHELL_Y - 260)
  },
  draw(ctx, shift, now) {
    ctx.fillStyle = vgrad(ctx, 0, 520, [
      [0, "#0b1d3a"],
      [1, "#3c2a6b"]
    ])
    ctx.fillRect(0, 0, CANVAS_WIDTH, 520)
    ctx.fillStyle = "#fff"
    for (let i = 0; i < 60; i++) {
      const starX = (i * 397) % CANVAS_WIDTH,
        starY = (i * 131) % 420,
        twinkle = 0.5 + 0.5 * Math.sin(now * 2 + i)
      ctx.globalAlpha = 0.3 + 0.7 * twinkle
      ctx.fillRect(starX, starY, 3, 3)
    }
    ctx.globalAlpha = 1
    ctx.fillStyle = "#fff6d5"
    ctx.beginPath()
    ctx.arc(1420, 150, 70, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = vgrad(ctx, 420, 560, [
      [0, "#1d5b8f"],
      [1, "#2b7fb8"]
    ])
    ctx.fillRect(0, 420, CANVAS_WIDTH, 140)
    ctx.fillStyle = vgrad(ctx, 540, CANVAS_HEIGHT, [
      [0, "#f2d49b"],
      [1, "#d9b26f"]
    ])
    ctx.fillRect(0, 540, CANVAS_WIDTH, CANVAS_HEIGHT - 540)
    emoji(ctx, "🌴", 150, 430, 320)
    emoji(ctx, "🌴", 1540, 450, 280)
    roundedRect(ctx, 300, SHELL_Y - 10, 1072, 70, 18)
    ctx.fillStyle = "#8a5a33"
    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = INK
    ctx.stroke()
    roundedRect(ctx, 360, SHELL_Y + 60, 40, 200, 8)
    ctx.fill()
    ctx.stroke()
    roundedRect(ctx, 1272, SHELL_Y + 60, 40, 200, 8)
    ctx.fill()
    ctx.stroke()
    const moneyPos = shellPos(shift, shift.money)
    if (shift.lift[shift.money] > 0.05) {
      emoji(ctx, "💰", moneyPos.x, SHELL_Y - 40, 110)
      label(ctx, "PENSIONS", moneyPos.x, SHELL_Y + 26, 24, "#ffe066")
    }
    ;[0, 1, 2].forEach((i) => {
      const pos = shellPos(shift, i)
      drawShell(
        ctx,
        pos.x,
        SHELL_Y - shift.lift[i] * 170 - pos.lift,
        shift.stage === "pick" && shift.phase === "play" ? Math.sin(now * 6 + i) * 0.03 : 0
      )
    })
  }
}
function shellRound(shift) {
  shift.round++
  shift.money = Math.floor(Math.random() * 3)
  shift.stage = "show"
  shift.stageTimer = 0
  shift.swapsLeft = 3 + shift.round * 2
  shift.lift = [0, 0, 0]
}
function shellNextSwap(shift) {
  let indexA = Math.floor(Math.random() * 3),
    indexB = (indexA + 1 + Math.floor(Math.random() * 2)) % 3
  shift.swap = { indexA, indexB, dur: Math.max(0.2, 0.52 - shift.round * 0.06) }
}
function shellPos(shift, i) {
  let x = SHELL_X[shift.slot[i]],
    lift = 0
  if (shift.stage === "shuffle" && shift.swap && (i === shift.swap.indexA || i === shift.swap.indexB)) {
    const progress = Math.min(1, shift.stageTimer / shift.swap.dur),
      eased = progress * progress * (3 - 2 * progress),
      other = i === shift.swap.indexA ? shift.swap.indexB : shift.swap.indexA
    x = SHELL_X[shift.slot[i]] + (SHELL_X[shift.slot[other]] - SHELL_X[shift.slot[i]]) * eased
    lift = Math.sin(Math.PI * progress) * (i === shift.swap.indexA ? 60 : -30)
  }
  return { x, lift }
}
function shellAt(shift, x, y) {
  for (let i = 0; i < 3; i++) {
    const pos = shellPos(shift, i)
    if (Math.abs(x - pos.x) < 150 && y > SHELL_Y - 250 && y < SHELL_Y + 40) return i
  }
  return -1
}
// A big scallop shell, base at (x, y). All three look identical, so the only way to win is to watch the money.
function drawShell(ctx, x, y, wob) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(wob)
  ctx.beginPath()
  ctx.moveTo(-150, 0)
  ctx.quadraticCurveTo(-170, -190, 0, -220)
  ctx.quadraticCurveTo(170, -190, 150, 0)
  ctx.closePath()
  ctx.fillStyle = vgrad(ctx, -220, 0, [
    [0, "#ffd6e0"],
    [1, "#f08aa8"]
  ])
  ctx.fill()
  ctx.lineWidth = 7
  ctx.strokeStyle = INK
  ctx.stroke()
  ctx.strokeStyle = "rgba(160,60,90,.55)"
  ctx.lineWidth = 5
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath()
    ctx.moveTo(i * 12, -10)
    ctx.lineTo(i * 46, -195 + Math.abs(i) * 18)
    ctx.stroke()
  }
  roundedRect(ctx, -46, -10, 92, 34, 10)
  ctx.fillStyle = "#f08aa8"
  ctx.fill()
  ctx.lineWidth = 6
  ctx.strokeStyle = INK
  ctx.stroke()
  label(ctx, "SHELL CO.", 0, -110, 28, "#fff")
  ctx.restore()
}

export { ShellGame }
