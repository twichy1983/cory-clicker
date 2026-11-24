// The shared minigame window: intro card, timer, progress meter, strikes, alerts, result screens,
// the animation loop and mouse/touch/keyboard input. Each minigame (lemon.js, milk.js, ...) is an object with:
//   time, strikes?, meter, image?, tagline, rules[], winTitle, winText, lose{busted,time}
//   init(G)  step(G,dt)  ambient?(G,dt)  stop?(G)  draw(ctx,G,now)
//   down?/move?/up?(G,x,y)  cursor?(G,x,y)  key?(G,key) -> true if used  extra?(G)  onTimeUp?(G)  resultNote?(G,kind)
// G is the current shift's state (null when no job is open). Minigames read it from here.
// This module only runs the window. What a shift does to the game (cooldown, pay, toasts, saving) happens in
// actions.js, which main.js connects through setJobHooks.
import { game } from "../game.js";
import { INDUSTRIES } from "../core/data/industries.js";
import {
  jobCooldown,
  jobPay,
  jobPaySecs,
  jobTimeLeft,
  jobUnlocked,
} from "../core/jobs.js";
import { money, mmss } from "../core/format.js";
import { $, esc } from "../ui/dom.js";
import { JW, JH, rand, label } from "./draw.js";

export let G = null;
let raf = 0;
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
    return 0;
  },
  onPayOut() {},
  onClose() {},
};
export function setJobHooks(h) {
  Object.assign(hooks, h);
}

/* ---------- helpers every minigame can use ---------- */

export function floatText(text, x, y, bad) {
  G.floats.push({ text, x, y, life: 1.1, bad });
}

export function burst(x, y, color, n = 14, speed = 380, size = 7) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2),
      s = rand(speed * 0.3, speed);
    G.parts.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - speed * 0.4,
      life: rand(0.5, 0.9),
      color,
      r: rand(size * 0.6, size),
      grav: 900,
    });
  }
}

export function jobAlert(text, cls) {
  const a = $("jobAlert");
  a.textContent = text;
  a.className = "on " + (cls || "");
  if (G) G.alertT = 1.6;
}

export function jobStrike(text, x = JW / 2, y = JH / 2) {
  if (!G || G.phase !== "play") return;
  G.strikes++;
  floatText(text, x, y, true);
  if (G.strikes >= G.game.strikes) {
    jobAlert("🚨 BUSTED!", "bad");
    endJob("busted");
  } else jobAlert(`🚨 ${text} Strike ${G.strikes} of ${G.game.strikes}`, "bad");
}

// What winning the current job pays
export const jobReward = () => jobPay(game.D, G.job);

// Pays extra cash from inside a minigame (e.g. price-gouging profits), with a message for the player
export function payOut(amount, text) {
  hooks.onPayOut(amount, text);
}

const images = {};
export function jobImage(src) {
  if (!images[src]) {
    const im = new Image();
    im.src = src;
    images[src] = im;
  }
  return images[src];
}
export const imgReady = (im) => im && im.complete && im.naturalWidth > 0;

/* ---------- the shift lifecycle: open -> start -> end -> close ---------- */

export const jobIsOpen = () => G !== null;

export function openJob(j) {
  if (G || !jobUnlocked(game.S, j) || jobTimeLeft(game.S, j, Date.now()) > 0)
    return;
  hooks.onOpen();
  const mg = j.game;
  if (mg.image) jobImage(mg.image);
  G = {
    job: j,
    game: mg,
    phase: "intro",
    t: 0,
    pct: 0,
    strikes: 0,
    alertT: 0,
    floats: [],
    parts: [],
    meterText: null,
  };
  mg.init(G);
  $("jobOverlay").hidden = false;
  $("jobAlert").className = "";
  $("jobMeterLbl").textContent = mg.meter;
  showJobPanel("intro");
  cancelAnimationFrame(raf);
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    stepJob(dt);
    drawJob(now / 1000);
    if (G) raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}

export function closeJob() {
  cancelAnimationFrame(raf);
  G = null;
  $("jobOverlay").hidden = true;
  $("jobPanel").hidden = true;
  hooks.onClose();
}

function startJob() {
  hooks.onStart(G.job);
  G.phase = "play";
  $("jobPanel").hidden = true;
  jobAlert("Shift started. Go!", "warn");
}

export function endJob(result) {
  if (!G || G.phase !== "play") return;
  G.phase = "over";
  G.result = result;
  G.game.stop?.(G);
  if (result === "win") G.reward = hooks.onWin(G.job);
  setTimeout(() => {
    if (G && G.phase === "over") showJobPanel(result);
  }, 650);
}

function showJobPanel(kind) {
  const p = $("jobPanel"),
    j = G.job,
    mg = G.game,
    cd = jobCooldown(j);
  const note = mg.resultNote
    ? `<p class="reward">${mg.resultNote(G, kind)}</p>`
    : "";
  let html;
  if (kind === "intro") {
    const cdText = `${Math.round(cd / 60000) || "few"} ${cd >= 120000 ? "minutes" : cd >= 60000 ? "minute" : "seconds"}`;
    html = `<div class="jobCardBig">
      <h3>${j.icon} ${j.name}</h3><p>${mg.tagline}</p>
      <ul>${mg.rules.map((r) => `<li>${r}</li>`).join("")}</ul>
      <p class="reward">Reward: ${money(jobReward())} (${jobPaySecs(j) / 60} minutes of ${esc(INDUSTRIES[j.ind].name)} income)</p>
      <p style="color:var(--muted);font-size:.85em">Starting the shift uses this job for the next ${cdText}, win or lose.</p>
      <div class="row"><button class="alt" data-act="close">Not now</button><button class="go" data-act="start">Start shift</button></div></div>`;
  } else if (kind === "win") {
    html = `<div class="jobCardBig"><h3>${mg.winTitle}</h3><p>${mg.winText}</p>
      <p class="reward">+${money(G.reward)}</p>${note}
      <div class="row"><button class="go" data-act="close">Back to the office</button></div></div>`;
  } else {
    const why =
      kind === "quit"
        ? "You walked off the job."
        : (mg.lose && mg.lose[kind]) || "The shift is over.";
    const title =
      kind === "busted"
        ? "Busted!"
        : kind === "quit"
          ? "Shift abandoned"
          : "Shift over";
    html = `<div class="jobCardBig bad"><h3>${title}</h3><p>${why}</p>${note}
      <p style="color:var(--muted)">No job payout. This job is available again in ${mmss(jobTimeLeft(game.S, j, Date.now()))}.</p>
      <div class="row"><button class="go" data-act="close">Back to the office</button></div></div>`;
  }
  p.hidden = false;
  p.innerHTML = html;
}

/* ---------- animation loop ---------- */

function stepJob(dt) {
  if (!G) return;
  G.parts = G.parts.filter(
    (q) =>
      ((q.vy += (q.grav || 0) * dt),
      (q.x += q.vx * dt),
      (q.y += q.vy * dt),
      (q.life -= dt)) > 0,
  );
  G.floats = G.floats.filter((f) => ((f.y -= 45 * dt), (f.life -= dt)) > 0);
  if (G.alertT > 0 && (G.alertT -= dt) <= 0) $("jobAlert").className = "";
  G.game.ambient?.(G, dt);
  if (G.phase === "play") {
    G.t += dt;
    G.game.step(G, dt);
    if (G && G.phase === "play" && G.t >= G.game.time)
      endJob(G.game.onTimeUp ? G.game.onTimeUp(G) : "time");
  }
  if (G) updateHud();
}

function updateHud() {
  const mg = G.game,
    left = Math.max(0, mg.time - G.t);
  $("jobTimer").textContent = "⏱ " + left.toFixed(1) + "s";
  $("jobTimer").classList.toggle("low", G.phase === "play" && left < 8);
  $("jobPct").textContent = G.meterText || Math.floor(G.pct) + "%";
  $("jobFill").style.width = G.pct + "%";
  const strikes = mg.strikes
    ? "🚨 " +
      Array.from({ length: mg.strikes }, (_, i) =>
        i < G.strikes ? "●" : "○",
      ).join(" ")
    : "";
  const extra = mg.extra ? mg.extra(G) : strikes;
  $("jobExtra").textContent = extra;
  $("jobExtra").hidden = !extra;
}

function drawJob(now) {
  if (!G) return;
  const ctx = $("jobCanvas").getContext("2d");
  ctx.save();
  ctx.clearRect(0, 0, JW, JH);
  G.game.draw(ctx, G, now);
  ctx.restore();
  for (const q of G.parts) {
    ctx.globalAlpha = Math.min(1, q.life * 2);
    ctx.fillStyle = q.color;
    if (q.w) {
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.rotate(q.rot + q.life * 6);
      ctx.fillRect(-q.w / 2, -q.h / 2, q.w, q.h);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  for (const f of G.floats) {
    ctx.globalAlpha = Math.min(1, f.life * 1.5);
    label(ctx, f.text, f.x, f.y, 44, f.bad ? "#ff4d4d" : "#d8ff6a");
  }
  ctx.globalAlpha = 1;
}

/* ---------- input ---------- */

function canvasPoint(e) {
  const r = $("jobCanvas").getBoundingClientRect();
  return [
    ((e.clientX - r.left) * JW) / r.width,
    ((e.clientY - r.top) * JH) / r.height,
  ];
}

// Connects the job window's buttons, canvas and keyboard. Called once from main.js.
export function wireJobWindow() {
  const canvas = $("jobCanvas");
  canvas.addEventListener("pointerdown", (e) => {
    if (!G || G.phase !== "play") return;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* not supported */
    }
    G.game.down?.(G, ...canvasPoint(e));
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!G) return;
    const [x, y] = canvasPoint(e);
    if (G.phase === "play") G.game.move?.(G, x, y);
    canvas.style.cursor =
      G.phase === "play" && G.game.cursor?.(G, x, y) ? "pointer" : "default";
  });
  const up = (e) => {
    if (G && G.phase === "play") G.game.up?.(G, ...canvasPoint(e));
  };
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  // Games that take keys (the milk rhythm game) get them during play; only keys they use are blocked
  document.addEventListener("keydown", (e) => {
    if (
      !G ||
      G.phase !== "play" ||
      !G.game.key ||
      e.repeat ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey
    )
      return;
    if (G.game.key(G, e.key)) e.preventDefault();
  });
  $("jobClose").addEventListener("click", () => {
    if (G && G.phase === "play") endJob("quit");
    else closeJob();
  });
  $("jobPanel").addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "start") startJob();
    else if (act === "close") closeJob();
  });
}
