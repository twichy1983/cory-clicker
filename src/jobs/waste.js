import { JW, JH, rand, pick, clamp, rr, vgrad, hgrad, emoji } from "./draw.js";
import {
  G,
  floatText,
  jobAlert,
  jobStrike,
  endJob,
  jobImage,
  imgReady,
} from "./framework.js";

/* ---------------------------------------------------------
   JOB: WASTE DISPOSAL (Processing Plant)
   Pollute the lake to 100% by opening sludge valves and tossing toxic barrels,
   without the inspector catching you 3 times. Scene art: assets/job-lake.webp.
   --------------------------------------------------------- */
const WASTE = {
  valveRate: 3.6,
  valveOpen: 2.6,
  valveCool: 2.0, // % per second while open, seconds open, seconds before reuse
  barrelAmt: 7,
  barrelEvery: 2.3,
  maxBarrels: 3,
  recover: 3.0, // the lake cleans itself, % per second
  warn: 1.3,
  watch: 2.6,
  gapMin: 4.2,
  gapMax: 6.8,
  firstAt: 5,
  // Tuned so flawless instant play finishes in ~20 s; real players need most of the 30 s.
};
const LAKE = [
  [215, 455],
  [400, 447],
  [600, 450],
  [800, 445],
  [1000, 447],
  [1200, 452],
  [1350, 462],
  [1450, 480],
  [1520, 530],
  [1560, 590],
  [1530, 640],
  [1470, 690],
  [1420, 730],
  [1330, 800],
  [1250, 850],
  [1100, 875],
  [950, 880],
  [800, 865],
  [700, 845],
  [600, 820],
  [470, 790],
  [380, 770],
  [280, 738],
  [220, 690],
  [185, 620],
  [175, 560],
  [190, 500],
];
const OUTFALLS = [
  { x: 740, y: 450 },
  { x: 990, y: 450 },
  { x: 1330, y: 466 },
];
const BARREL_SPOTS = [
  { x: 585, y: 885 },
  { x: 1010, y: 908 },
  { x: 1455, y: 885 },
];
// The inspector rises from behind the green bush; the bush is re-drawn from the scene image over his lower half.
const INSPECTOR = {
  x: 1112,
  showY: 338,
  hideY: 448,
  cropX: 1030,
  cropY: 336,
  cropW: 170,
  cropH: 130,
};
const OUT_SCALE = 1.35,
  BARREL_SCALE = 1.35;
function inLake(x, y) {
  let inside = false;
  for (let i = 0, j = LAKE.length - 1; i < LAKE.length; j = i++) {
    const [xi, yi] = LAKE[i],
      [xj, yj] = LAKE[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}
function lakePath(ctx) {
  ctx.beginPath();
  LAKE.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}
const easeOutBack = (k) =>
  1 + 2.4 * Math.pow(k - 1, 3) + 1.4 * Math.pow(k - 1, 2);

const WasteGame = {
  time: 30,
  strikes: 3,
  meter: "LAKE CONTAMINATION",
  image: "assets/job-lake.webp",
  tagline:
    "Licensed hazardous-waste disposal costs $4 million a year. The lake behind the plant is free. It's also the town's drinking water, which the board described as 'not our department.'",
  rules: [
    "<b>Click a red valve</b> to open a sludge pipe. Click it again to shut it early.",
    "<b>Drag toxic barrels</b> into the lake, or tap one to toss it.",
    "Fill the <b>contamination meter to 100%</b> before time runs out. The lake keeps trying to heal itself. Don't let it.",
    "Watch the bushes. When the <b>inspector</b> is looking, stop dumping. Get caught 3 times and you're busted.",
  ],
  winTitle: "Quota met!",
  winText:
    "The town's tap water now glows faintly at night. Legal is calling it a 'feature,' and the fish have stopped filing complaints.",
  lose: {
    busted:
      "The inspector photographed everything. Legal is already drafting a statement blaming a 'rogue intern.'",
    time: "Time's up. The lake survived, and so did the town's water supply. Embarrassing.",
  },
  init(G) {
    Object.assign(G, {
      valves: OUTFALLS.map((o) => ({
        ...o,
        open: false,
        openT: 0,
        cool: 0,
        spin: 0,
        blobT: 0,
      })),
      barrels: [],
      nextBarrel: 0.6,
      flying: [],
      blobs: [],
      drops: [],
      rings: [],
      insp: {
        state: "hidden",
        t: 0,
        next: WASTE.firstAt,
        y: INSPECTOR.hideY,
        caught: false,
      },
      drag: null,
    });
  },
  ambient(G, dt) {
    G.blobs.forEach((b) => {
      b.r += (b.target - b.r) * Math.min(1, dt * 1.4);
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vx *= 0.995;
      b.vy *= 0.995;
      b.ph += dt;
    });
    G.drops = G.drops.filter(
      (d) =>
        ((d.vy += 900 * dt),
        (d.x += d.vx * dt),
        (d.y += d.vy * dt),
        (d.life -= dt)) > 0,
    );
    G.rings = G.rings.filter((r) => ((r.r += 70 * dt), (r.life -= dt)) > 0);
    G.valves.forEach((v) => {
      if (v.open) v.spin += dt * 9;
    });
  },
  step(G, dt) {
    let delta = -WASTE.recover * dt;
    for (const v of G.valves) {
      if (v.open) {
        v.openT += dt;
        delta += WASTE.valveRate * dt;
        if ((v.blobT -= dt) <= 0) {
          v.blobT = 0.18;
          wasteBlob(
            v.x + rand(-30, 30),
            v.y + 70 * OUT_SCALE + rand(0, 30),
            rand(28, 42),
            62,
          );
        }
        if (Math.random() < dt * 30)
          G.drops.push({
            x: v.x + rand(-16, 16),
            y: v.y + 66 * OUT_SCALE,
            vx: rand(-70, 70),
            vy: rand(-240, -90),
            life: 0.5,
            sludge: true,
          });
        if (v.openT >= WASTE.valveOpen) {
          v.open = false;
          v.cool = WASTE.valveCool;
        }
      } else if (v.cool > 0) v.cool = Math.max(0, v.cool - dt);
    }
    if ((G.nextBarrel -= dt) <= 0) {
      G.nextBarrel = WASTE.barrelEvery;
      const free = BARREL_SPOTS.filter(
        (s) => !G.barrels.some((b) => b.spot === s),
      );
      if (free.length && G.barrels.length < WASTE.maxBarrels) {
        const s = pick(free);
        G.barrels.push({ spot: s, x: s.x, y: s.y, pop: 0 });
      }
    }
    G.barrels.forEach((b) => {
      b.pop = Math.min(1, b.pop + dt * 4);
      if (b.back) {
        b.x += (b.spot.x - b.x) * Math.min(1, dt * 10);
        b.y += (b.spot.y - b.y) * Math.min(1, dt * 10);
      }
    });
    for (const f of G.flying) {
      f.t += dt;
      if (!f.landed && f.t >= f.dur) {
        f.landed = true;
        delta += WASTE.barrelAmt;
        wasteSplash(f.tx, f.ty, true);
        wasteBlob(f.tx, f.ty, rand(55, 75), 90);
        if (G.insp.state === "watch") wasteStrike();
        floatText("+" + WASTE.barrelAmt + "%", f.tx, f.ty - 40);
      }
    }
    G.flying = G.flying.filter((f) => f.t < f.dur + 0.55);
    const ins = G.insp;
    ins.t += dt;
    if (ins.state === "hidden" && G.t >= ins.next) {
      ins.state = "warn";
      ins.t = 0;
      jobAlert("👀 Someone's coming…", "warn");
    } else if (ins.state === "warn" && ins.t >= WASTE.warn) {
      ins.state = "watch";
      ins.t = 0;
      ins.caught = false;
      jobAlert("🕵️ INSPECTOR WATCHING. STOP DUMPING!", "bad");
    } else if (ins.state === "watch") {
      if (G.valves.some((v) => v.open)) wasteStrike();
      if (ins.t >= WASTE.watch) {
        ins.state = "leave";
        ins.t = 0;
      }
    } else if (ins.state === "leave" && ins.t >= 0.5) {
      ins.state = "hidden";
      ins.t = 0;
      ins.next = G.t + rand(WASTE.gapMin, WASTE.gapMax);
    }
    const targetY =
      ins.state === "watch"
        ? INSPECTOR.showY
        : ins.state === "warn"
          ? INSPECTOR.hideY - 22
          : INSPECTOR.hideY;
    ins.y += (targetY - ins.y) * Math.min(1, dt * 9);
    G.pct = clamp(G.pct + delta, 0, 100);
    if (G.pct >= 100) endJob("win");
  },
  stop(G) {
    G.valves.forEach((v) => (v.open = false));
    G.drag = null;
  },
  draw(ctx, G, now) {
    const img = jobImage(this.image);
    if (imgReady(img)) ctx.drawImage(img, 0, 0, JW, JH);
    else {
      ctx.fillStyle = "#4da9d8";
      ctx.fillRect(0, 0, JW, JH);
    }
    ctx.save();
    lakePath(ctx);
    ctx.clip();
    const murk = G.pct / 100;
    ctx.fillStyle = `rgba(96,118,22,${0.58 * murk})`;
    ctx.fillRect(0, 0, JW, JH);
    // cartoon sludge slicks: outline pass first, then fills on top, so overlapping slicks merge into one outlined shape
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#34470b";
    ctx.lineWidth = 9;
    for (const b of G.blobs) {
      blobPath(ctx, b);
      ctx.stroke();
    }
    for (const b of G.blobs) {
      blobPath(ctx, b);
      const grd = ctx.createLinearGradient(
        0,
        b.y - b.r * 0.6,
        0,
        b.y + b.r * 0.6,
      );
      grd.addColorStop(0, b.hue < 0.5 ? "#a3cf2e" : "#8fb32a");
      grd.addColorStop(1, b.hue < 0.5 ? "#5c7f12" : "#6b6a17");
      ctx.fillStyle = grd;
      ctx.fill();
    }
    for (const b of G.blobs) {
      ctx.fillStyle = "rgba(240,255,190,.55)";
      ctx.beginPath();
      ctx.ellipse(
        b.x - b.r * 0.32,
        b.y - b.r * 0.2,
        b.r * 0.26,
        b.r * 0.07,
        -0.15,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.fillStyle = "rgba(52,71,11,.5)";
      ctx.beginPath();
      ctx.ellipse(
        b.x + b.r * 0.3,
        b.y + b.r * 0.12,
        b.r * 0.1,
        b.r * 0.05,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    if (murk > 0.15)
      for (let i = 0; i < 18 * murk; i++) {
        const bx = 260 + ((i * 397) % 1220),
          by = 480 + ((i * 211) % 360),
          ph = (now * 1.3 + i * 0.37) % 1;
        if (!inLake(bx, by)) continue;
        ctx.strokeStyle = `rgba(200,220,120,${0.55 * (1 - ph)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(bx, by, 4 + ph * 9, (4 + ph * 9) * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    for (const r of G.rings) {
      ctx.strokeStyle = `rgba(255,255,255,${0.6 * r.life})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.r, r.r * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // belly-up fish surface as the lake dies (one per 9% contamination)
    const FISH = [
      [420, 600],
      [980, 720],
      [700, 560],
      [1260, 640],
      [560, 740],
      [1120, 540],
      [860, 650],
      [1380, 700],
      [330, 680],
      [1020, 610],
      [640, 660],
    ];
    for (let i = 0; i < Math.min(FISH.length, Math.floor(G.pct / 9)); i++) {
      const [fx, fy] = FISH[i];
      ctx.save();
      ctx.translate(
        fx + Math.sin(now * 0.8 + i) * 6,
        fy + Math.sin(now * 1.6 + i * 2) * 3,
      );
      ctx.rotate(Math.PI + (i % 2 ? 0.25 : -0.25));
      ctx.filter = "grayscale(1) sepia(.7) hue-rotate(35deg) brightness(1.15)"; // pale, sickly, belly-up
      emoji(ctx, "🐟", 0, 0, 62);
      ctx.filter = "none";
      ctx.restore();
    }
    ctx.restore();
    drawInspector(ctx, G, now, img);
    G.valves.forEach((v) => {
      ctx.save();
      ctx.translate(v.x, v.y);
      ctx.scale(OUT_SCALE, OUT_SCALE);
      ctx.translate(-v.x, -v.y);
      drawOutfall(ctx, v, now);
      ctx.restore();
    });
    G.barrels.forEach((b) => {
      if (b !== G.drag?.barrel)
        drawBarrel(
          ctx,
          b.x,
          b.y,
          0.55 + 0.45 * easeOutBack(b.pop),
          Math.sin(now * 2 + b.spot.x) * 0.03,
        );
    });
    for (const f of G.flying) {
      const k = Math.min(1, f.t / f.dur);
      if (k < 1) {
        const x = f.x0 + (f.tx - f.x0) * k,
          y = f.y0 + (f.ty - f.y0) * k - Math.sin(Math.PI * k) * f.arc;
        drawBarrel(ctx, x, y, 1 - 0.25 * k, f.spin * k);
      } else {
        const s = (f.t - f.dur) / 0.55;
        ctx.save();
        ctx.globalAlpha = 1 - s;
        drawBarrel(
          ctx,
          f.tx,
          f.ty + 20 * s,
          0.75 * (1 - 0.4 * s),
          f.spin + 0.5 * s,
        );
        ctx.restore();
      }
    }
    if (G.drag)
      drawBarrel(ctx, G.drag.x, G.drag.y, 1.08, Math.sin(now * 10) * 0.08);
    for (const d of G.drops) {
      ctx.fillStyle = d.sludge
        ? `rgba(96,112,26,${Math.min(1, d.life * 2)})`
        : `rgba(225,248,255,${Math.min(1, d.life * 2)})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.sludge ? 6 : 5, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  cursor(G, x, y) {
    return !!(wasteValveAt(x, y) || wasteBarrelAt(x, y));
  },
  down(G, x, y) {
    const v = wasteValveAt(x, y);
    if (v) {
      if (v.open) {
        v.open = false;
        v.cool = WASTE.valveCool * (v.openT / WASTE.valveOpen);
      } else if (v.cool === 0) {
        v.open = true;
        v.openT = 0;
        v.blobT = 0;
        if (G.insp.state === "watch") wasteStrike();
      }
      return;
    }
    const b = wasteBarrelAt(x, y);
    if (b) G.drag = { barrel: b, x, y, sx: x, sy: y, moved: false };
  },
  move(G, x, y) {
    if (G.drag) {
      G.drag.x = x;
      G.drag.y = y + 40;
      if (Math.hypot(x - G.drag.sx, y - G.drag.sy) > 14) G.drag.moved = true;
    }
  },
  up(G, x, y) {
    if (!G.drag) return;
    const d = G.drag,
      b = d.barrel;
    G.drag = null;
    if (!d.moved) {
      const [tx, ty] = wasteLakeTarget(b.x);
      wasteThrow(b, tx, ty);
      return;
    }
    if (inLake(x, y)) {
      b.x = x;
      b.y = y + 40;
      wasteThrow(b, x, y, 0.18, 30);
    } else {
      b.x = x;
      b.y = y + 40;
      b.back = true;
    }
  },
};
function wasteStrike() {
  if (G.insp.caught) return;
  G.insp.caught = true;
  jobStrike("SPOTTED!", INSPECTOR.x, INSPECTOR.showY - 150);
}
function wasteBlob(x, y, r, max) {
  if (G.blobs.length > 70) G.blobs.shift();
  G.blobs.push({
    x,
    y,
    r: r * 0.3,
    target: Math.min(max * 1.7, r + G.pct * 1.1),
    vx: rand(-14, 14),
    vy: rand(-4, 10),
    ph: rand(0, 6),
    hue: Math.random(),
    lobes: Array.from({ length: 9 }, () => rand(-0.22, 0.22)),
  });
}
function blobPath(ctx, b) {
  // wobbly, flattened (perspective) puddle outline
  const n = b.lobes.length,
    pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2,
      k = 1 + b.lobes[i] + Math.sin(b.ph * 1.6 + i) * 0.05;
    pts.push([b.x + Math.cos(a) * b.r * k, b.y + Math.sin(a) * b.r * k * 0.5]);
  }
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const p = pts[i % n],
      q = pts[(i + 1) % n],
      mx = (p[0] + q[0]) / 2,
      my = (p[1] + q[1]) / 2;
    i ? ctx.quadraticCurveTo(p[0], p[1], mx, my) : ctx.moveTo(mx, my);
  }
  ctx.closePath();
}
function wasteSplash(x, y, big) {
  for (let i = 0; i < (big ? 22 : 8); i++)
    G.drops.push({
      x: x + rand(-20, 20),
      y,
      vx: rand(-260, 260),
      vy: rand(-520, -220),
      life: 0.7,
      sludge: Math.random() < 0.4,
    });
  G.rings.push({ x, y, r: 10, life: 0.9 });
  if (big) G.rings.push({ x, y, r: 2, life: 1.2 });
}
function wasteValveAt(x, y) {
  return G.valves.find(
    (v) => Math.hypot(x - v.x, y - (v.y - 62 * OUT_SCALE)) < 100,
  );
}
function wasteBarrelAt(x, y) {
  return [...G.barrels]
    .reverse()
    .find(
      (b) =>
        Math.abs(x - b.x) < 66 * BARREL_SCALE &&
        y < b.y + 24 &&
        y > b.y - 118 * BARREL_SCALE,
    );
}
function wasteThrow(b, tx, ty, dur = 0.5, arc = 170) {
  G.barrels = G.barrels.filter((o) => o !== b);
  G.flying.push({
    x0: b.x,
    y0: b.y,
    tx,
    ty,
    t: 0,
    dur,
    arc,
    spin: rand(-1.4, 1.4),
    landed: false,
  });
}
function wasteLakeTarget(x) {
  // tap-to-toss: aim straight out into the water
  for (let y = 760; y > 470; y -= 20)
    if (inLake(x, y) && inLake(x + 40, y) && inLake(x - 40, y))
      return [x, y - 60];
  return [870, 640];
}
function drawOutfall(ctx, v, now) {
  const x = v.x,
    y = v.y,
    R = 30,
    ready = !v.open && v.cool === 0 && G.phase === "play";
  if (v.open) {
    // sludge stream pouring out of the pipe mouth into the lake
    const fall = 70,
      wob = Math.sin(now * 14) * 4;
    ctx.beginPath();
    ctx.moveTo(x - 22, y + 2);
    ctx.quadraticCurveTo(x - 24 + wob, y + fall * 0.5, x - 30, y + fall);
    ctx.lineTo(x + 30, y + fall);
    ctx.quadraticCurveTo(x + 24 - wob, y + fall * 0.5, x + 22, y + 2);
    ctx.closePath();
    ctx.fillStyle = hgrad(ctx, x - 30, x + 30, [
      [0, "#5e8212"],
      [0.45, "#b5e03a"],
      [1, "#5e8212"],
    ]);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#34470b";
    ctx.stroke();
    ctx.strokeStyle = "rgba(240,255,190,.7)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    for (let i = 0; i < 3; i++) {
      const o = ((now * 2.6 + i / 3) % 1) * (fall - 18);
      ctx.beginPath();
      ctx.moveTo(x - 9 + i * 9, y + 6 + o);
      ctx.lineTo(x - 10 + i * 9, y + 16 + o);
      ctx.stroke();
    }
    ctx.lineCap = "butt";
    ctx.beginPath();
    ctx.ellipse(x, y + fall, 46 + Math.sin(now * 9) * 5, 14, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#c8ee5a";
    ctx.fill();
    ctx.strokeStyle = "#34470b";
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#2c3136";
  rr(ctx, x - R, y - 46, R * 2, 44, 10);
  ctx.fillStyle = hgrad(ctx, x - R, x + R, [
    [0, "#5d656d"],
    [0.35, "#dfe4e8"],
    [0.65, "#a7afb7"],
    [1, "#4f565d"],
  ]);
  ctx.fill();
  ctx.stroke();
  rr(ctx, x - R - 5, y - 24, R * 2 + 10, 11, 4);
  ctx.fillStyle = "#7f8890";
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y, R + 3, 13, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#8c949b";
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y + 1, R - 5, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = v.open ? "#6d7f1c" : "#14171a";
  ctx.fill();
  const wx = x,
    wy = y - 86,
    wr = 27;
  ctx.fillStyle = "#6d757c";
  rr(ctx, x - 5, wy, 10, 42, 3);
  ctx.fill();
  ctx.stroke();
  if (ready) {
    ctx.strokeStyle = `rgba(255,236,120,${0.55 + 0.45 * Math.sin(now * 6)})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(wx, wy, wr + 11, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(wx, wy);
  ctx.rotate(v.spin);
  ctx.strokeStyle = "#2c1212";
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.arc(0, 0, wr, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = v.cool > 0 ? "#8a6a6a" : "#e0302a";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(0, 0, wr, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 5;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(wr - 2, 0);
    ctx.stroke();
  }
  ctx.fillStyle = "#3a3f44";
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (v.open) {
    ctx.strokeStyle = "#d8ff6a";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(
      wx,
      wy,
      wr + 11,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * (1 - v.openT / WASTE.valveOpen),
    );
    ctx.stroke();
  } else if (v.cool > 0) {
    ctx.strokeStyle = "rgba(255,255,255,.7)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(
      wx,
      wy,
      wr + 11,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * (1 - v.cool / WASTE.valveCool),
    );
    ctx.stroke();
  }
}
function drawBarrel(ctx, x, y, s, rot) {
  // (x, y) is the barrel's base
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s * BARREL_SCALE, s * BARREL_SCALE);
  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.beginPath();
  ctx.ellipse(0, 2, 40, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  const w = 68,
    h = 92,
    top = -h;
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#2a2009";
  rr(ctx, -w / 2, top, w, h, 12);
  ctx.fillStyle = hgrad(ctx, -w / 2, w / 2, [
    [0, "#b8860e"],
    [0.3, "#ffd84a"],
    [0.55, "#f5c22b"],
    [1, "#9c6f08"],
  ]);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#1d1d1d";
  ctx.fillRect(-w / 2 + 2, top + 32, w - 4, 26);
  ctx.fillStyle = "#ffd84a";
  ctx.font = "900 26px 'Segoe UI Symbol', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("☣", 0, top + 46);
  ctx.strokeStyle = "rgba(60,40,0,.55)";
  ctx.lineWidth = 3;
  [top + 14, top + h - 14].forEach((ry) => {
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 3, ry);
    ctx.lineTo(w / 2 - 3, ry);
    ctx.stroke();
  });
  ctx.beginPath();
  ctx.ellipse(0, top + 3, w / 2 - 4, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#e3ad1d";
  ctx.fill();
  ctx.strokeStyle = "#2a2009";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#7da11f";
  ctx.beginPath();
  ctx.ellipse(-12, top + 2, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawInspector(ctx, G, now, img) {
  const ins = G.insp,
    I = INSPECTOR;
  if (ins.state === "watch") {
    // vision cone over the lake
    ctx.save();
    lakePath(ctx);
    ctx.clip();
    ctx.fillStyle = vgrad(ctx, I.showY - 60, 860, [
      [0, "rgba(255,240,120,.38)"],
      [1, "rgba(255,240,120,.04)"],
    ]);
    ctx.beginPath();
    ctx.moveTo(I.x, I.showY - 70);
    ctx.lineTo(260, 900);
    ctx.lineTo(1580, 900);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  if (ins.y < I.hideY - 2) {
    emoji(ctx, "🕵️", I.x, ins.y - 44, 112);
    if (ins.state === "watch")
      emoji(ctx, "🔍", I.x + 62, ins.y - 70 + Math.sin(now * 6) * 5, 54);
    if (imgReady(img))
      ctx.drawImage(
        img,
        I.cropX,
        I.cropY,
        I.cropW,
        I.cropH,
        I.cropX,
        I.cropY,
        I.cropW,
        I.cropH,
      ); // bush in front
  }
  if (ins.state === "warn")
    emoji(
      ctx,
      "👀",
      I.x,
      I.cropY - 34 + Math.sin(now * 20) * 3,
      64,
      0.6 + 0.4 * Math.sin(now * 14),
    );
}

export { WasteGame };
