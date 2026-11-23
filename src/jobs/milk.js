import { JW, JH, pick, rr, vgrad, INK, emoji, label, plainText, bubble, inBox } from "./draw.js";
import { burst, jobStrike, endJob } from "./framework.js";

/* ---------------------------------------------------------
   JOB: SCHOOL MILK CONTRACT (Ingredient Supplier), a rhythm game
   Jugs arrive on the beat. As each crosses the glowing line, hit the
   chemical its label asks for (buttons, or keys 1/2/3, A/S/D, J/K/L).
   --------------------------------------------------------- */
const MILK = { goal: 24, belt: 690, hitX: 1040, speed: 520, bpm: 100, first: 2.0, perfect: .09, good: .2, exit: 1370 };
const MILK_BEAT = 60 / MILK.bpm;
const CHEMS = [
  { name: "TAP WATER", icon: "💧", color: "#3b8bdb", ink: "#fff", keys: ["1", "a", "j"] },
  { name: "CHALK", icon: "🦴", color: "#f1f3f5", ink: "#1b1b1b", keys: ["2", "s", "k"] },
  { name: "FORMALDEHYDE", icon: "⚗️", color: "#2fb35a", ink: "#fff", keys: ["3", "d", "l"] },
];
const MILK_BTNS = CHEMS.map((c, i) => ({ x: 120 + i * 490, y: 800, w: 450, h: 112 }));
const MilkGame = {
  time: 30, strikes: 3, meter: "JUGS DOSED",
  tagline: "You won the milk contract for every school in the district by underbidding everyone. The trick: each jug gets a splash of tap water, chalk to keep it white, or formaldehyde to keep it 'fresh.' The lunch lady checks every jug.",
  rules: [
    "Jugs ride the belt <b>to the beat</b>. Each jug's label and cap color show the chemical it needs: <b>💧 TAP WATER</b>, <b>🦴 CHALK</b> or <b>⚗️ FORMALDEHYDE</b>.",
    "When a jug crosses the <b>glowing line</b>, hit the matching button (or keys <b>1 2 3</b>, <b>A S D</b> or <b>J K L</b>). Right on the beat is a PERFECT.",
    "The <b>wrong chemical</b> is a strike: the lunch lady tastes it. 3 strikes and you're busted.",
    "Miss a jug and the kids get real milk: no strike, but your combo resets and so does the profit.",
    `Dose <b>${MILK.goal} jugs</b> before the song ends. It gets busier as it goes.`,
  ],
  winTitle: "Calcium is calcium!", winText: "Twenty-four jugs of 'Growing Kids Milk' dosed to the beat. The school board called it 'remarkably shelf-stable.'",
  lose: { busted: "The lunch lady tasted formaldehyde where the chalk should be, three times. She called the school board, a reporter, and her cousin the lawyer.",
          time: "The song ended and too much real milk reached the cafeteria. The shareholders are livid." },
  init(G){ Object.assign(G, { jugs: milkChart(), done: 0, combo: 0, best: 0, judge: "", judgeOk: true, judgeT: 0, squirt: null, press: [0, 0, 0], ladySay: "", ladyT: 0 }); },
  step(G, dt){
    G.judgeT = Math.max(0, G.judgeT - dt); G.ladyT = Math.max(0, G.ladyT - dt);
    G.press = G.press.map(p => Math.max(0, p - dt));
    if (G.squirt && (G.squirt.t -= dt) <= 0) G.squirt = null;
    for (const j of G.jugs) if (!j.res && G.t - j.t > MILK.good) {   // sailed past the line undosed
      j.res = "miss"; G.combo = 0; milkJudge(G, "MISS", false);
      G.ladySay = pick(["Real milk? Weird.", "This one's… actual milk?", "Huh. Tastes like a cow."]); G.ladyT = .9;
    }
    G.pct = G.done / MILK.goal * 100; G.meterText = `${G.done} / ${MILK.goal}`;
  },
  extra(G){ return "🚨 " + Array.from({ length: this.strikes }, (_, i) => i < G.strikes ? "●" : "○").join(" ") + `  ·  🔥 x${G.combo}`; },
  cursor(G, x, y){ return MILK_BTNS.some(b => inBox(x, y, b)); },
  down(G, x, y){ const i = MILK_BTNS.findIndex(b => inBox(x, y, b)); if (i >= 0) milkPress(G, i); },
  key(G, k){ const i = CHEMS.findIndex(c => c.keys.includes(k.toLowerCase())); if (i < 0) return false; milkPress(G, i); return true; },
  draw(ctx, G, now){
    const ph = (((G.t - MILK.first) / MILK_BEAT) % 1 + 1) % 1, pulse = 1 - ph;   // beat phase: 0 on the beat
    // dairy plant wall
    ctx.fillStyle = vgrad(ctx, 0, MILK.belt, [[0, "#dbeef5"], [1, "#c4dde8"]]); ctx.fillRect(0, 0, JW, MILK.belt);
    ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 3;
    for (let x = 0; x < JW; x += 70) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, MILK.belt); ctx.stroke(); }
    for (let y = 0; y < MILK.belt; y += 70) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(JW, y); ctx.stroke(); }
    rr(ctx, 80, 30, 760, 100, 18); ctx.fillStyle = "#2f80ed"; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    label(ctx, "🐄 FRESH FOR GROWING KIDS 🐄", 460, 80, 44, "#fff");
    plainText(ctx, "District #12 Official Supplier · Lowest bid since 2009", 460, 160, 24, "#4a6378", "center", 800);
    // chemical tanks feeding one nozzle over the line
    CHEMS.forEach((c, i) => {
      const tx = MILK.hitX - 200 + i * 200, ty = 210, hit = G.press[i] > 0;
      ctx.strokeStyle = INK; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(tx, ty + 120); ctx.quadraticCurveTo(tx, 380, MILK.hitX, 395); ctx.stroke();
      ctx.strokeStyle = "#9aa4ab"; ctx.lineWidth = 9; ctx.stroke();
      rr(ctx, tx - 70, ty - 20 + (hit ? 6 : 0), 140, 150, 22); ctx.fillStyle = c.color; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      emoji(ctx, c.icon, tx, ty + 30 + (hit ? 6 : 0), 54);
      plainText(ctx, c.name, tx, ty + 95 + (hit ? 6 : 0), c.name.length > 9 ? 15 : 19, c.ink, "center", 900);
    });
    rr(ctx, MILK.hitX - 36, 385, 72, 48, 12); ctx.fillStyle = "#6b757d"; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    // the glowing hit line, pulsing on the beat
    ctx.fillStyle = `rgba(255,236,120,${.12 + .3 * pulse})`; ctx.fillRect(MILK.hitX - 78, 440, 156, MILK.belt - 440);
    ctx.strokeStyle = `rgba(255,200,0,${.5 + .5 * pulse})`; ctx.lineWidth = 6; ctx.setLineDash([16, 10]);
    [MILK.hitX - 78, MILK.hitX + 78].forEach(x => { ctx.beginPath(); ctx.moveTo(x, 440); ctx.lineTo(x, MILK.belt); ctx.stroke(); }); ctx.setLineDash([]);
    // floor + belt
    ctx.fillStyle = "#5b646b"; ctx.fillRect(0, MILK.belt, JW, JH - MILK.belt);
    rr(ctx, -20, MILK.belt - 10, JW + 40, 70, 20); ctx.fillStyle = "#2c3236"; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke();
    ctx.strokeStyle = "#475057"; ctx.lineWidth = 8;
    const off = (G.t * MILK.speed) % 80;
    for (let x = -off; x < JW; x += 80) { ctx.beginPath(); ctx.moveTo(x, MILK.belt + 4); ctx.lineTo(x + 30, MILK.belt + 25); ctx.lineTo(x, MILK.belt + 46); ctx.stroke(); }
    // jugs
    for (const j of G.jugs) { const x = MILK.hitX - (j.t - G.t) * MILK.speed; if (x > -120 && x < JW + 120) drawRhythmJug(ctx, x, j); }
    // squirt from the nozzle into the jug on the line
    if (G.squirt) {
      const c = CHEMS[G.squirt.c]; ctx.strokeStyle = c.color; ctx.lineWidth = 18; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(MILK.hitX, 432); ctx.lineTo(MILK.hitX + Math.sin(now * 40) * 3, 505); ctx.stroke(); ctx.lineCap = "butt";
      ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    }
    // the lunch lady, bopping to the beat
    rr(ctx, MILK.exit + 30, 520, 200, 170, 18); ctx.fillStyle = "#f0f4f6"; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    label(ctx, "CAFETERIA", MILK.exit + 130, 560, 28, "#2f80ed");
    emoji(ctx, "👩‍🍳", MILK.exit + 130, 440 - pulse * 14, 160);
    if (G.ladyT > 0) bubble(ctx, G.ladySay, MILK.exit + 90, 330, 28);
    if (G.combo >= 3) label(ctx, `🔥 ${G.combo} COMBO`, MILK.exit + 130, 620 + 0 * pulse, 30, "#ffd23f");
    // judgement
    if (G.judgeT > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, G.judgeT * 3); label(ctx, G.judge, MILK.hitX, 300 - (1 - G.judgeT) * 30, 62, G.judgeOk ? "#9dff6a" : "#ff5c5c"); ctx.restore(); }
    // beat counter (visual metronome)
    for (let i = 0; i < 4; i++) {
      const beatNo = Math.floor((G.t - MILK.first) / MILK_BEAT), on = G.t >= MILK.first - .001 && ((beatNo % 4) + 4) % 4 === i;
      ctx.beginPath(); ctx.arc(1180 + i * 44, 80, on ? 16 : 12, 0, Math.PI * 2); ctx.fillStyle = on ? "#ff4d8d" : "rgba(0,0,0,.25)"; ctx.fill();
    }
    plainText(ctx, `♪ ${MILK.bpm} BPM`, 1246, 125, 22, "#4a6378", "center", 900);
    // chemical buttons
    CHEMS.forEach((c, i) => {
      const b = MILK_BTNS[i], down = G.press[i] > 0;
      rr(ctx, b.x, b.y + (down ? 6 : 0), b.w, b.h, 24); ctx.fillStyle = c.color; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      emoji(ctx, c.icon, b.x + 70, b.y + b.h / 2 + (down ? 6 : 0), 58);
      plainText(ctx, c.name, b.x + b.w / 2 + 30, b.y + 46 + (down ? 6 : 0), c.name.length > 9 ? 30 : 36, c.ink, "center", 900);
      plainText(ctx, `key ${c.keys[0]} · ${c.keys[1].toUpperCase()} · ${c.keys[2].toUpperCase()}`, b.x + b.w / 2 + 30, b.y + 84 + (down ? 6 : 0), 20, c.ink === "#fff" ? "rgba(255,255,255,.8)" : "#555", "center", 800);
    });
    if (G.phase === "play" && G.t < MILK.first) label(ctx, G.t < MILK.first - 1.2 ? "READY…" : "HERE THEY COME!", JW / 2, 470, 64, "#fff");
  },
};
function milkChart(){
  const out = []; let t = MILK.first;
  while (t < MilkGame.time - .3) {
    if (Math.random() < Math.min(.85, .55 + (t - MILK.first) * .013)) {
      out.push({ t, chem: Math.floor(Math.random() * 3), res: null });
      if (t > 12 && Math.random() < .22) out.push({ t: t + MILK_BEAT / 2, chem: Math.floor(Math.random() * 3), res: null });   // off-beat jug
    }
    t += MILK_BEAT;
  }
  return out;
}
function milkJudge(G, text, ok){ G.judge = text; G.judgeOk = ok; G.judgeT = .55; }
function milkPress(G, ci){
  G.press[ci] = .12; G.squirt = { c: ci, t: .18 };
  let best = null, bd = Infinity;
  for (const j of G.jugs) if (!j.res) { const d = Math.abs(G.t - j.t); if (d < bd) { bd = d; best = j; } }
  if (!best || bd > MILK.good) { G.combo = 0; milkJudge(G, "OFF BEAT", false); return; }
  if (best.chem !== ci) {
    best.res = "wrong"; G.combo = 0; milkJudge(G, "WRONG!", false);
    G.ladySay = pick(["That's not chalk!", "Is this… embalming fluid?", "BLECH!"]); G.ladyT = 1;
    jobStrike("Wrong chemical!", MILK.exit + 130, 330); return;
  }
  best.res = bd <= MILK.perfect ? "perfect" : "good";
  G.done++; G.combo++; G.best = Math.max(G.best, G.combo);
  milkJudge(G, best.res === "perfect" ? "PERFECT!" : "GOOD", true);
  burst(MILK.hitX, MILK.belt - 200, CHEMS[ci].color, 12, 280);
  if (G.done >= MILK.goal) endJob("win");
}
function drawRhythmJug(ctx, x, j){
  const c = CHEMS[j.chem], base = MILK.belt - 6, w = 112, h = 178, top = base - h;
  const dosed = j.res === "perfect" || j.res === "good";
  ctx.save();
  const body = dosed ? "#eef6ff" : j.res === "wrong" ? "#dff3c8" : "#fff";
  ctx.lineWidth = 6; ctx.strokeStyle = INK;
  rr(ctx, x - w / 2, top + 40, w, h - 40, 26); ctx.fillStyle = body; ctx.fill(); ctx.stroke();
  rr(ctx, x - 24, top + 6, 48, 42, 10); ctx.fillStyle = body; ctx.fill(); ctx.stroke();
  rr(ctx, x - 30, top - 14, 60, 26, 8); ctx.fillStyle = c.color; ctx.fill(); ctx.stroke();               // cap = the chemical it needs
  ctx.beginPath(); ctx.arc(x + w / 2 - 6, top + 92, 28, -1.3, 1.3); ctx.lineWidth = 12; ctx.stroke(); ctx.lineWidth = 6;
  rr(ctx, x - w / 2 + 10, top + 70, w - 20, 92, 10); ctx.fillStyle = c.color; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();   // label = the chemical it needs
  emoji(ctx, c.icon, x, top + 100, 40);
  plainText(ctx, c.name, x, top + 142, c.name.length > 11 ? 11 : c.name.length > 7 ? 13 : 16, c.ink, "center", 900);
  if (dosed) emoji(ctx, "✅", x + 40, top - 6, 34);
  else if (j.res === "wrong") emoji(ctx, "🤢", x + 40, top - 6, 40);
  else if (j.res === "miss") label(ctx, "REAL MILK", x, top - 20, 20, "#9fd8ff");
  ctx.restore();
}

export { MilkGame };
