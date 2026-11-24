import {
  JW,
  JH,
  rand,
  rr,
  vgrad,
  hgrad,
  INK,
  emoji,
  plainText,
} from "./draw.js";
import { G, floatText, jobStrike } from "./framework.js";

/* ---------------------------------------------------------
   JOB: SKIP MAINTENANCE (Refinery Complex)
   Survive the shift: vent gauges once they pass yellow, before they hit red.
   --------------------------------------------------------- */
const GAUGE_SPOTS = [
  { x: 250, y: 640 },
  { x: 545, y: 600 },
  { x: 836, y: 640 },
  { x: 1127, y: 600 },
  { x: 1422, y: 640 },
  { x: 836, y: 420 },
];
const GAUGE_R = 105,
  GAUGE_VENT = 0.55;
const GaugeGame = {
  time: 30,
  strikes: 3,
  meter: "SHIFT SURVIVED",
  tagline:
    "The last safety inspector 'retired' after asking too many questions. Maintenance costs money; replacement workers are cheaper. Keep the refinery running flat-out with the crew still inside.",
  rules: [
    "Pressure keeps climbing in every pipe. <b>Click a gauge</b> to vent it back down.",
    "Venting wastes product, so a gauge <b>can only be vented once its needle is past the yellow line</b>.",
    "If a needle reaches the end of the red, that pipe bursts: a strike (and an ambulance). 3 strikes and the cameras show up.",
    "Survive the <b>full 30-second shift</b> to win. More gauges come online as the shift goes on.",
  ],
  winTitle: "Shift survived!",
  winText:
    "Thirty seconds at full output, zero maintenance. Three workers' comp claims were denied before the shift even ended.",
  lose: {
    busted:
      "Three pipes burst and the evening news got there before your PR team. The CEO is 'deeply saddened' from a beach in Monaco.",
  },
  init(G) {
    Object.assign(G, {
      gauges: GAUGE_SPOTS.slice(0, 3).map((s) => gaugeNew(s)),
    });
  },
  step(G, dt) {
    const want = G.t > 21 ? 6 : G.t > 14 ? 5 : G.t > 7 ? 4 : 3;
    while (G.gauges.length < want) {
      const s = GAUGE_SPOTS[G.gauges.length];
      G.gauges.push(gaugeNew(s));
      floatText("New gauge online!", s.x, s.y - 140);
    }
    for (const g of G.gauges) {
      g.p += g.rate * (1 + G.t * 0.025) * dt;
      g.fire = Math.max(0, g.fire - dt);
      g.puff = Math.max(0, g.puff - dt);
      if (g.p >= 1) {
        g.p = 0.1;
        g.fire = 1.4;
        g.rate = rand(0.07, 0.14);
        jobStrike("Pipe burst!", g.x, g.y - 160);
      }
    }
    G.pct = Math.min(100, (G.t / this.time) * 100);
    G.meterText = Math.ceil(Math.max(0, this.time - G.t)) + "s to go";
  },
  onTimeUp() {
    return "win";
  },
  cursor(G, x, y) {
    return !!gaugeAt(x, y);
  },
  down(G, x, y) {
    const g = gaugeAt(x, y);
    if (!g) return;
    if (g.p >= GAUGE_VENT) {
      g.p = 0.05;
      g.puff = 0.8;
      g.rate = rand(0.07, 0.15);
      for (let i = 0; i < 12; i++)
        G.parts.push({
          x: g.x + rand(-30, 30),
          y: g.y - GAUGE_R - 30,
          vx: rand(-90, 90),
          vy: rand(-260, -120),
          life: rand(0.6, 1),
          color: "rgba(240,240,240,.9)",
          r: rand(16, 26),
          grav: -60,
        });
    } else floatText("Not yet!", g.x, g.y - 150, true);
  },
  draw(ctx, G, now) {
    ctx.fillStyle = vgrad(ctx, 0, 520, [
      [0, "#2b1d4d"],
      [0.6, "#a34f5c"],
      [1, "#f08a4b"],
    ]);
    ctx.fillRect(0, 0, JW, 520);
    ctx.fillStyle = "#1c1a24";
    [
      [80, 260, 160, 260],
      [300, 200, 70, 320],
      [420, 300, 220, 220],
      [1180, 240, 90, 280],
      [1320, 300, 260, 220],
    ].forEach(([x, y, w, h]) => {
      rr(ctx, x, y, w, h, 14);
      ctx.fill();
    });
    [
      [335, 200],
      [1225, 240],
    ].forEach(([x, y], i) => {
      const fl = 1 + Math.sin(now * 12 + i) * 0.15;
      emoji(ctx, "🔥", x, y - 40 * fl, 70 * fl);
    });
    ctx.fillStyle = "#2a2a30";
    ctx.fillRect(0, 500, JW, JH - 500);
    ctx.fillStyle = hgrad(ctx, 0, JW, [
      [0, "#6b6f75"],
      [0.5, "#a9aeb4"],
      [1, "#6b6f75"],
    ]);
    [520, 760].forEach((y) => {
      rr(ctx, -10, y, JW + 20, 46, 20);
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = INK;
      ctx.stroke();
    });
    // the crew, still inside; they panic when a nearby needle is in the red
    [398, 690, 982, 1274].forEach((wx, i) => {
      const near = G.gauges.filter((g) => Math.abs(g.x - wx) < 320),
        scared = near.some((g) => g.p > 0.8 || g.fire > 0);
      emoji(ctx, "👷", wx + (scared ? Math.sin(now * 30 + i) * 6 : 0), 880, 92);
      if (scared) emoji(ctx, "😱", wx + 30, 810, 46);
    });
    for (const g of G.gauges) drawGauge(ctx, g, now);
    if (G.gauges.some((g) => g.fire > 0))
      emoji(ctx, "🚑", JW - ((now * 700) % (JW + 300)) + 150, 470, 110);
  },
};
function gaugeNew(s) {
  return {
    x: s.x,
    y: s.y,
    p: rand(0.05, 0.3),
    rate: rand(0.07, 0.14),
    fire: 0,
    puff: 0,
  };
}
function gaugeAt(x, y) {
  return G.gauges.find((g) => Math.hypot(x - g.x, y - g.y) < GAUGE_R + 20);
}
function drawGauge(ctx, g, now) {
  const { x, y } = g,
    R = GAUGE_R,
    a0 = Math.PI * 0.75,
    a1 = Math.PI * 2.25,
    ang = (p) => a0 + (a1 - a0) * p;
  rr(ctx, x - 16, y + R - 10, 32, 120, 6);
  ctx.fillStyle = "#7c8187";
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, R + 14, 0, Math.PI * 2);
  ctx.fillStyle = "#b8bdc2";
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, R, 0, Math.PI * 2);
  ctx.fillStyle = "#fbfbf6";
  ctx.fill();
  [
    [0, GAUGE_VENT, "#5cc96b"],
    [GAUGE_VENT, 0.8, "#ffd23f"],
    [0.8, 1, "#ff3b30"],
  ].forEach(([s, e, c]) => {
    ctx.beginPath();
    ctx.arc(x, y, R - 16, ang(s), ang(e));
    ctx.lineWidth = 22;
    ctx.strokeStyle = c;
    ctx.stroke();
  });
  const ready = g.p >= GAUGE_VENT && G.phase === "play";
  if (ready) {
    ctx.beginPath();
    ctx.arc(x, y, R + 24, 0, Math.PI * 2);
    ctx.lineWidth = 8;
    ctx.strokeStyle = `rgba(255,236,120,${0.5 + 0.5 * Math.sin(now * 10)})`;
    ctx.stroke();
  }
  const shake = g.p > 0.8 ? Math.sin(now * 60) * 0.04 : 0,
    na = ang(Math.min(1, g.p)) + shake;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(na) * (R - 22), y + Math.sin(na) * (R - 22));
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#c1121f";
  ctx.stroke();
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fillStyle = "#333";
  ctx.fill();
  plainText(ctx, "PSI", x, y + 46, 22, "#666", "center", 900);
  if (g.fire > 0) {
    for (let i = 0; i < 3; i++)
      emoji(
        ctx,
        "🔥",
        x - 60 + i * 60,
        y - R - 40 - Math.sin(now * 20 + i) * 10,
        80 + (i % 2) * 20,
      );
  }
}

export { GaugeGame };
