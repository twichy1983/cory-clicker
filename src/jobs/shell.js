import { JW, JH, rr, vgrad, INK, emoji, label } from "./draw.js";
import { floatText, burst, jobAlert, jobStrike, endJob } from "./framework.js";

/* ---------------------------------------------------------
   JOB: FOLLOW THE MONEY (Offshore Shell Network)
   A shell game with literal shell companies.
   --------------------------------------------------------- */
const SHELL_X = [486, 836, 1186], SHELL_Y = 640, SHELL_GOAL = 5;
const ShellGame = {
  time: 40, strikes: 3, meter: "FUNDS LOCATED",
  tagline: "You quietly emptied the employee pension fund into offshore shell companies. The retirees' lawyers are on the trail. Keep track of where the money is while the shells reshuffle.",
  rules: [
    "Watch which shell company the 💰 pension money goes under.",
    "The shells shuffle to throw off the lawyers. Keep your eye on the money.",
    "<b>Click the shell</b> you think is hiding it. A wrong guess is a strike.",
    `Find the money <b>${SHELL_GOAL} times</b> before time runs out. The shuffles get faster every round.`,
  ],
  winTitle: "Pension secured (for you)!", winText: "Forty thousand retirements, safely offshore. The retirees will be fine. They have each other.",
  lose: { busted: "You lost track of 40,000 people's pensions three times. The lawyers found it before you did.", time: "Time's up. The money is still out there somewhere, in a very nice climate." },
  init(G){ Object.assign(G, { slot: [0, 1, 2], money: 1, found: 0, round: 0, stage: "show", st: 0, swap: null, swapsLeft: 0, lift: [1, 1, 1], pickI: -1 }); shellRound(G); },
  step(G, dt){
    G.st += dt;
    const liftTo = (i, v) => G.lift[i] += (v - G.lift[i]) * Math.min(1, dt * 12);
    if (G.stage === "show") { G.lift.forEach((_, i) => liftTo(i, i === G.money ? 1 : 0)); if (G.st > 1.1) { G.stage = "lower"; G.st = 0; } }
    else if (G.stage === "lower") { G.lift.forEach((_, i) => liftTo(i, 0)); if (G.st > .35) { G.stage = "shuffle"; G.st = 0; shellNextSwap(G); } }
    else if (G.stage === "shuffle") {
      if (G.st >= G.swap.dur) {
        const { a, b } = G.swap; [G.slot[a], G.slot[b]] = [G.slot[b], G.slot[a]];
        if (--G.swapsLeft > 0) { G.st = 0; shellNextSwap(G); } else { G.stage = "pick"; G.st = 0; G.swap = null; jobAlert("Where's the money?", "warn"); }
      }
    } else if (G.stage === "reveal") { G.lift.forEach((_, i) => liftTo(i, 1)); if (G.st > 1.1) { if (G.found >= SHELL_GOAL) endJob("win"); else shellRound(G); } }
    G.pct = G.found / SHELL_GOAL * 100; G.meterText = `${G.found} / ${SHELL_GOAL}`;
  },
  cursor(G, x, y){ return G.stage === "pick" && shellAt(G, x, y) >= 0; },
  down(G, x, y){
    if (G.stage !== "pick") return;
    const i = shellAt(G, x, y); if (i < 0) return;
    G.pickI = i; G.stage = "reveal"; G.st = 0;
    const p = shellPos(G, i);
    if (i === G.money) { G.found++; floatText("Found it! 💰", p.x, SHELL_Y - 260); burst(p.x, SHELL_Y - 60, "#ffd23f", 18); }
    else jobStrike("Wrong shell!", p.x, SHELL_Y - 260);
  },
  draw(ctx, G, now){
    ctx.fillStyle = vgrad(ctx, 0, 520, [[0, "#0b1d3a"], [1, "#3c2a6b"]]); ctx.fillRect(0, 0, JW, 520);
    ctx.fillStyle = "#fff"; for (let i = 0; i < 60; i++) { const sx = (i * 397) % JW, sy = (i * 131) % 420, tw = .5 + .5 * Math.sin(now * 2 + i); ctx.globalAlpha = .3 + .7 * tw; ctx.fillRect(sx, sy, 3, 3); } ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff6d5"; ctx.beginPath(); ctx.arc(1420, 150, 70, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = vgrad(ctx, 420, 560, [[0, "#1d5b8f"], [1, "#2b7fb8"]]); ctx.fillRect(0, 420, JW, 140);
    ctx.fillStyle = vgrad(ctx, 540, JH, [[0, "#f2d49b"], [1, "#d9b26f"]]); ctx.fillRect(0, 540, JW, JH - 540);
    emoji(ctx, "🌴", 150, 430, 320); emoji(ctx, "🌴", 1540, 450, 280);
    rr(ctx, 300, SHELL_Y - 10, 1072, 70, 18); ctx.fillStyle = "#8a5a33"; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    rr(ctx, 360, SHELL_Y + 60, 40, 200, 8); ctx.fill(); ctx.stroke(); rr(ctx, 1272, SHELL_Y + 60, 40, 200, 8); ctx.fill(); ctx.stroke();
    const mp = shellPos(G, G.money);
    if (G.lift[G.money] > .05) { emoji(ctx, "💰", mp.x, SHELL_Y - 40, 110); label(ctx, "PENSIONS", mp.x, SHELL_Y + 26, 24, "#ffe066"); }
    [0, 1, 2].forEach(i => { const p = shellPos(G, i); drawShell(ctx, p.x, SHELL_Y - G.lift[i] * 170 - p.lift, G.stage === "pick" && G.phase === "play" ? Math.sin(now * 6 + i) * .03 : 0); });
  },
};
function shellRound(G){ G.round++; G.money = Math.floor(Math.random() * 3); G.stage = "show"; G.st = 0; G.swapsLeft = 3 + G.round * 2; G.lift = [0, 0, 0]; }
function shellNextSwap(G){ let a = Math.floor(Math.random() * 3), b = (a + 1 + Math.floor(Math.random() * 2)) % 3; G.swap = { a, b, dur: Math.max(.2, .52 - G.round * .06) }; }
function shellPos(G, i){
  let x = SHELL_X[G.slot[i]], lift = 0;
  if (G.stage === "shuffle" && G.swap && (i === G.swap.a || i === G.swap.b)) {
    const k = Math.min(1, G.st / G.swap.dur), e = k * k * (3 - 2 * k), other = i === G.swap.a ? G.swap.b : G.swap.a;
    x = SHELL_X[G.slot[i]] + (SHELL_X[G.slot[other]] - SHELL_X[G.slot[i]]) * e; lift = Math.sin(Math.PI * k) * (i === G.swap.a ? 60 : -30);
  }
  return { x, lift };
}
function shellAt(G, x, y){ for (let i = 0; i < 3; i++) { const p = shellPos(G, i); if (Math.abs(x - p.x) < 150 && y > SHELL_Y - 250 && y < SHELL_Y + 40) return i; } return -1; }
// A big scallop shell, base at (x, y). All three look identical, so the only way to win is to watch the money.
function drawShell(ctx, x, y, wob){
  ctx.save(); ctx.translate(x, y); ctx.rotate(wob);
  ctx.beginPath(); ctx.moveTo(-150, 0); ctx.quadraticCurveTo(-170, -190, 0, -220); ctx.quadraticCurveTo(170, -190, 150, 0); ctx.closePath();
  ctx.fillStyle = vgrad(ctx, -220, 0, [[0, "#ffd6e0"], [1, "#f08aa8"]]); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  ctx.strokeStyle = "rgba(160,60,90,.55)"; ctx.lineWidth = 5; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 12, -10); ctx.lineTo(i * 46, -195 + Math.abs(i) * 18); ctx.stroke(); }
  rr(ctx, -46, -10, 92, 34, 10); ctx.fillStyle = "#f08aa8"; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  label(ctx, "SHELL CO.", 0, -110, 28, "#fff");
  ctx.restore();
}

export { ShellGame };
