// The shared minigame window: intro card, timer, progress meter, strikes, alerts, result screens,
// the animation loop and mouse/touch/keyboard input. Each minigame (lemon.js, milk.js, ...) is an object with:
//   time, strikes?, meter, image?, tagline, rules[], winTitle, winText, lose{busted,time}
//   init(shift)  step(shift, dt)  ambient?(shift, dt)  stop?(shift)  draw(ctx, shift, now)
//   down?/move?/up?(shift, x, y)  cursor?(shift, x, y)  key?(shift, key) -> true if used  extra?(shift)  onTimeUp?(shift)  resultNote?(shift, kind)
// `shift` is the current shift's state (null when no job is open). Minigames read it from here.
// This module only runs the window. What a shift does to the game (cooldown, pay, toasts, saving) happens in
// actions.js, which main.js connects through setJobHooks.
import { game } from "../game.js"
import { INDUSTRIES } from "../core/data/industries.js"
import { jobCooldown, jobPay, jobPaySecs, jobTimeLeft, jobUnlocked } from "../core/jobs.js"
import { money, mmss } from "../core/format.js"
import { $, esc } from "../ui/dom.js"
import { JW, JH, rand, label } from "./draw.js"

export let shift = null
let raf = 0
// Set by main.js:
//   onOpen()                when the window opens
//   onStart(job)            when a shift starts (the cooldown starts with it, win or lose)
//   onWin(job) -> reward    when a shift is won
//   onPayOut(amount, text)  when a minigame pays extra cash, with a message for the player
//   onClose()               when the window closes
const hooks = {
  onOpen() {},
  onStart() {},
  onWin() {
    return 0
  },
  onPayOut() {},
  onClose() {}
}
export function setJobHooks(newHooks) {
  Object.assign(hooks, newHooks)
}

/* ---------- helpers every minigame can use ---------- */

export function floatText(text, x, y, bad) {
  shift.floats.push({ text, x, y, life: 1.1, bad })
}

export function burst(x, y, color, count = 14, speed = 380, size = 7) {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2),
      particleSpeed = rand(speed * 0.3, speed)
    shift.parts.push({
      x,
      y,
      vx: Math.cos(angle) * particleSpeed,
      vy: Math.sin(angle) * particleSpeed - speed * 0.4,
      life: rand(0.5, 0.9),
      color,
      radius: rand(size * 0.6, size),
      grav: 900
    })
  }
}

export function jobAlert(text, cls) {
  const alertBox = $("jobAlert")
  alertBox.textContent = text
  alertBox.className = "on " + (cls || "")
  if (shift) shift.alertT = 1.6
}

export function jobStrike(text, x = JW / 2, y = JH / 2) {
  if (!shift || shift.phase !== "play") return
  shift.strikes++
  floatText(text, x, y, true)
  if (shift.strikes >= shift.game.strikes) {
    jobAlert("🚨 BUSTED!", "bad")
    endJob("busted")
  } else jobAlert(`🚨 ${text} Strike ${shift.strikes} of ${shift.game.strikes}`, "bad")
}

// What winning the current job pays
export const jobReward = () => jobPay(game.derived, shift.job)

// Pays extra cash from inside a minigame (e.g. price-gouging profits), with a message for the player
export function payOut(amount, text) {
  hooks.onPayOut(amount, text)
}

const images = {}
export function jobImage(src) {
  if (!images[src]) {
    const im = new Image()
    im.src = src
    images[src] = im
  }
  return images[src]
}
export const imgReady = (im) => im && im.complete && im.naturalWidth > 0

/* ---------- the shift lifecycle: open -> start -> end -> close ---------- */

export const jobIsOpen = () => shift !== null

export function openJob(job) {
  if (shift || !jobUnlocked(game.state, job) || jobTimeLeft(game.state, job, Date.now()) > 0) return
  hooks.onOpen()
  const mg = job.game
  if (mg.image) jobImage(mg.image)
  shift = {
    job,
    game: mg,
    phase: "intro",
    elapsed: 0,
    pct: 0,
    strikes: 0,
    alertT: 0,
    floats: [],
    parts: [],
    meterText: null
  }
  mg.init(shift)
  $("jobOverlay").hidden = false
  $("jobAlert").className = ""
  $("jobMeterLbl").textContent = mg.meter
  showJobPanel("intro")
  cancelAnimationFrame(raf)
  let last = performance.now()
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    stepJob(dt)
    drawJob(now / 1000)
    if (shift) raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)
}

export function closeJob() {
  cancelAnimationFrame(raf)
  shift = null
  $("jobOverlay").hidden = true
  $("jobPanel").hidden = true
  hooks.onClose()
}

function startJob() {
  hooks.onStart(shift.job)
  shift.phase = "play"
  $("jobPanel").hidden = true
  jobAlert("Shift started. Go!", "warn")
}

export function endJob(result) {
  if (!shift || shift.phase !== "play") return
  shift.phase = "over"
  shift.result = result
  shift.game.stop?.(shift)
  if (result === "win") shift.reward = hooks.onWin(shift.job)
  setTimeout(() => {
    if (shift && shift.phase === "over") showJobPanel(result)
  }, 650)
}

function showJobPanel(kind) {
  const panel = $("jobPanel"),
    job = shift.job,
    mg = shift.game,
    cd = jobCooldown(job)
  const note = mg.resultNote ? `<p class="reward">${mg.resultNote(shift, kind)}</p>` : ""
  let html
  if (kind === "intro") {
    const cdText = `${Math.round(cd / 60000) || "few"} ${cd >= 120000 ? "minutes" : cd >= 60000 ? "minute" : "seconds"}`
    html = `<div class="jobCardBig">
      <h3>${job.icon} ${job.name}</h3><p>${mg.tagline}</p>
      <ul>${mg.rules.map((rule) => `<li>${rule}</li>`).join("")}</ul>
      <p class="reward">Reward: ${money(jobReward())} (${jobPaySecs(job) / 60} minutes of ${esc(INDUSTRIES[job.ind].name)} income)</p>
      <p style="color:var(--muted);font-size:.85em">Starting the shift uses this job for the next ${cdText}, win or lose.</p>
      <div class="row"><button class="alt" data-act="close">Not now</button><button class="go" data-act="start">Start shift</button></div></div>`
  } else if (kind === "win") {
    html = `<div class="jobCardBig"><h3>${mg.winTitle}</h3><p>${mg.winText}</p>
      <p class="reward">+${money(shift.reward)}</p>${note}
      <div class="row"><button class="go" data-act="close">Back to the office</button></div></div>`
  } else {
    const why = kind === "quit" ? "You walked off the job." : (mg.lose && mg.lose[kind]) || "The shift is over."
    const title = kind === "busted" ? "Busted!" : kind === "quit" ? "Shift abandoned" : "Shift over"
    html = `<div class="jobCardBig bad"><h3>${title}</h3><p>${why}</p>${note}
      <p style="color:var(--muted)">No job payout. This job is available again in ${mmss(jobTimeLeft(game.state, job, Date.now()))}.</p>
      <div class="row"><button class="go" data-act="close">Back to the office</button></div></div>`
  }
  panel.hidden = false
  panel.innerHTML = html
}

/* ---------- animation loop ---------- */

function stepJob(dt) {
  if (!shift) return
  shift.parts = shift.parts.filter(
    (particle) =>
      ((particle.vy += (particle.grav || 0) * dt),
      (particle.x += particle.vx * dt),
      (particle.y += particle.vy * dt),
      (particle.life -= dt)) > 0
  )
  shift.floats = shift.floats.filter((float) => ((float.y -= 45 * dt), (float.life -= dt)) > 0)
  if (shift.alertT > 0 && (shift.alertT -= dt) <= 0) $("jobAlert").className = ""
  shift.game.ambient?.(shift, dt)
  if (shift.phase === "play") {
    shift.elapsed += dt
    shift.game.step(shift, dt)
    if (shift && shift.phase === "play" && shift.elapsed >= shift.game.time)
      endJob(shift.game.onTimeUp ? shift.game.onTimeUp(shift) : "time")
  }
  if (shift) updateHud()
}

function updateHud() {
  const mg = shift.game,
    left = Math.max(0, mg.time - shift.elapsed)
  $("jobTimer").textContent = "⏱ " + left.toFixed(1) + "s"
  $("jobTimer").classList.toggle("low", shift.phase === "play" && left < 8)
  $("jobPct").textContent = shift.meterText || Math.floor(shift.pct) + "%"
  $("jobFill").style.width = shift.pct + "%"
  const strikes = mg.strikes
    ? "🚨 " + Array.from({ length: mg.strikes }, (_, i) => (i < shift.strikes ? "●" : "○")).join(" ")
    : ""
  const extra = mg.extra ? mg.extra(shift) : strikes
  $("jobExtra").textContent = extra
  $("jobExtra").hidden = !extra
}

function drawJob(now) {
  if (!shift) return
  const ctx = $("jobCanvas").getContext("2d")
  ctx.save()
  ctx.clearRect(0, 0, JW, JH)
  shift.game.draw(ctx, shift, now)
  ctx.restore()
  for (const particle of shift.parts) {
    ctx.globalAlpha = Math.min(1, particle.life * 2)
    ctx.fillStyle = particle.color
    if (particle.width) {
      ctx.save()
      ctx.translate(particle.x, particle.y)
      ctx.rotate(particle.rot + particle.life * 6)
      ctx.fillRect(-particle.width / 2, -particle.height / 2, particle.width, particle.height)
      ctx.restore()
    } else {
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1
  for (const float of shift.floats) {
    ctx.globalAlpha = Math.min(1, float.life * 1.5)
    label(ctx, float.text, float.x, float.y, 44, float.bad ? "#ff4d4d" : "#d8ff6a")
  }
  ctx.globalAlpha = 1
}

/* ---------- input ---------- */

function canvasPoint(event) {
  const rect = $("jobCanvas").getBoundingClientRect()
  return [((event.clientX - rect.left) * JW) / rect.width, ((event.clientY - rect.top) * JH) / rect.height]
}

// Connects the job window's buttons, canvas and keyboard. Called once from main.js.
export function wireJobWindow() {
  const canvas = $("jobCanvas")
  canvas.addEventListener("pointerdown", (event) => {
    if (!shift || shift.phase !== "play") return
    try {
      canvas.setPointerCapture(event.pointerId)
    } catch {
      /* not supported */
    }
    shift.game.down?.(shift, ...canvasPoint(event))
  })
  canvas.addEventListener("pointermove", (event) => {
    if (!shift) return
    const [x, y] = canvasPoint(event)
    if (shift.phase === "play") shift.game.move?.(shift, x, y)
    canvas.style.cursor = shift.phase === "play" && shift.game.cursor?.(shift, x, y) ? "pointer" : "default"
  })
  const up = (event) => {
    if (shift && shift.phase === "play") shift.game.up?.(shift, ...canvasPoint(event))
  }
  canvas.addEventListener("pointerup", up)
  canvas.addEventListener("pointercancel", up)
  // Games that take keys (the milk rhythm game) get them during play; only keys they use are blocked
  document.addEventListener("keydown", (event) => {
    if (
      !shift ||
      shift.phase !== "play" ||
      !shift.game.key ||
      event.repeat ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return
    if (shift.game.key(shift, event.key)) event.preventDefault()
  })
  $("jobClose").addEventListener("click", () => {
    if (shift && shift.phase === "play") endJob("quit")
    else closeJob()
  })
  $("jobPanel").addEventListener("click", (event) => {
    const act = event.target.closest("[data-act]")?.dataset.act
    if (act === "start") startJob()
    else if (act === "close") closeJob()
  })
}
