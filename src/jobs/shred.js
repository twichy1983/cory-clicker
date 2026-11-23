import { JW, JH, rand, pick, rr, vgrad, INK, emoji, label, plainText } from "./draw.js";
import { G, floatText, jobAlert, jobStrike, endJob } from "./framework.js";

/* ---------------------------------------------------------
   JOB: SHRED THE COMPLAINTS (Consumer Goods Factory)
   Click falling complaint letters before they reach the regulator.
   --------------------------------------------------------- */
const SHRED = { goal: 20, inbox: 815, keepChance: .28, keepPenalty: 3 };
const SHRED_EVIDENCE = { icons: ["🔥", "⚠️", "📎", "🧯", "🚑", "⚖️"],
  texts: ["ENGINEER: IT WILL BURN", "INJURY REPORT #212", "SUBPOENA", "MEMO: DO NOT SHIP", "WE KNEW IN 2019", "BURN CLAIM #88", "WHISTLEBLOWER DRAFT", "TEST RESULT: FAILED", "CEO: SHIP IT ANYWAY"] };
// documents the company actually needs: shredding one costs progress
const SHRED_KEEP = { icons: ["💰", "📈", "🏝️", "⛳", "🛥️", "🖋️"],
  texts: ["CEO BONUS PLAN", "STOCK OPTIONS", "OFFSHORE ACCOUNTS", "Q3 RECORD PROFITS", "LOBBYIST CONTACTS", "YACHT TITLE", "SENATOR'S IOU"] };
const ShredGame = {
  time: 30, strikes: 3, meter: "EVIDENCE SHREDDED",
  tagline: "Your own engineers warned that the space heater catches fire. Then the fires started. Now the memos, injury reports and subpoenas are flying in. If any reach federal investigators, it's a recall, and maybe a prison term.",
  rules: [
    "Incriminating documents (<b>white envelopes, red text</b>) fall toward the investigators' inbox. <b>Click one</b> to shred it.",
    `<b>Don't shred the gold folders marked KEEP</b>: bonus plans, stock options, offshore accounts. Shredding one costs you ${SHRED.keepPenalty} shredded documents. Let them drop; they get filed safely.`,
    "Every piece of evidence that reaches the inbox is a strike. 3 strikes and the FBI is in the lobby.",
    `Shred <b>${SHRED.goal} documents</b> before time runs out. The evidence piles up faster as the shift goes on.`,
  ],
  winTitle: "Plausible deniability!", winText: "Twenty documents shredded. Officially, nobody knew anything, and now nobody can prove otherwise.",
  lose: { busted: "Three documents reached federal investigators. Your lawyer recommends a long vacation in a country without extradition.", time: "Time's up. The pile of evidence is now taller than the CEO, and it has a press agent." },
  init(G){ Object.assign(G, { letters: [], spawn: .3, shredded: 0 }); },
  step(G, dt){
    if ((G.spawn -= dt) <= 0) {
      const keep = Math.random() < SHRED.keepChance, src = keep ? SHRED_KEEP : SHRED_EVIDENCE;
      G.letters.push({ x: rand(170, 1500), y: -60, vy: rand(175, 220) + G.t * 9, ph: rand(0, 6), sway: rand(20, 50), keep, icon: pick(src.icons), text: pick(src.texts) });
      G.spawn = Math.max(.36, .85 - G.t * .018);
    }
    for (const l of G.letters) { l.y += l.vy * dt; l.ph += dt * 2; }
    for (const l of G.letters) if (!l.gone && l.y > SHRED.inbox) {
      l.gone = true;
      if (l.keep) floatText("Filed ✓", l.x, SHRED.inbox - 60);
      else jobStrike("Evidence leaked!", l.x, SHRED.inbox - 80);
    }
    G.letters = G.letters.filter(l => !l.gone);
    G.pct = G.shredded / SHRED.goal * 100; G.meterText = `${G.shredded} / ${SHRED.goal}`;
  },
  cursor(G, x, y){ return !!shredLetterAt(x, y); },
  down(G, x, y){
    const l = shredLetterAt(x, y); if (!l) return;
    l.gone = true;
    for (let i = 0; i < 14; i++) G.parts.push({ x: l.x + rand(-50, 50), y: l.y + rand(-20, 20), vx: rand(-200, 200), vy: rand(-350, -50), life: rand(.5, .9),
      color: l.keep ? (i % 3 ? "#f2c94c" : "#d4a72c") : (i % 3 ? "#fffdf0" : "#e8e1c8"), r: 6, w: 8, h: 30, grav: 900, rot: rand(0, 3) });
    if (l.keep) {
      G.shredded = Math.max(0, G.shredded - SHRED.keepPenalty);
      floatText(`−${SHRED.keepPenalty}! You needed that!`, l.x, l.y - 60, true);
      jobAlert(`💸 That was the ${l.text.toLowerCase()}!`, "bad");
      return;
    }
    G.shredded++;
    floatText("Shredded!", l.x, l.y - 60);
    if (G.shredded >= SHRED.goal) endJob("win");
  },
  draw(ctx, G, now){
    ctx.fillStyle = vgrad(ctx, 0, SHRED.inbox, [[0, "#3a4a63"], [1, "#2a364a"]]); ctx.fillRect(0, 0, JW, JH);
    rr(ctx, 110, 120, 560, 360, 14); ctx.fillStyle = vgrad(ctx, 120, 480, [[0, "#ffb36b"], [1, "#ffd9a1"]]); ctx.fill();
    ctx.fillStyle = "#3d3a55"; [[140, 300, 70, 180], [220, 240, 90, 240], [320, 330, 60, 150], [390, 210, 100, 270], [500, 280, 80, 200], [590, 320, 60, 160]].forEach(([x, y, w, h]) => ctx.fillRect(x, y, w, h));
    ctx.lineWidth = 12; ctx.strokeStyle = "#cfd6df"; rr(ctx, 110, 120, 560, 360, 14); ctx.stroke(); ctx.beginPath(); ctx.moveTo(390, 120); ctx.lineTo(390, 480); ctx.stroke();
    ctx.save(); ctx.translate(1170, 120); ctx.rotate(-.03);
    rr(ctx, 0, 0, 380, 230, 10); ctx.fillStyle = "#f5f1e6"; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = "#8a6b3f"; ctx.stroke();
    plainText(ctx, "SAFETY IS OUR", 190, 80, 34, "#333", "center", 900); plainText(ctx, "#2 PRIORITY", 190, 135, 50, "#d62828", "center", 900);
    plainText(ctx, "(after shipping)", 190, 185, 24, "#777", "center", 700);
    ctx.restore();
    // office furniture: filing cabinet, plant, wall clock
    rr(ctx, 1290, 470, 230, 345, 12); ctx.fillStyle = "#7c8a99"; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    [490, 600, 710].forEach(y => { rr(ctx, 1310, y, 190, 90, 8); ctx.fillStyle = "#9aa8b6"; ctx.fill(); ctx.stroke(); rr(ctx, 1375, y + 36, 60, 16, 6); ctx.fillStyle = "#3d4650"; ctx.fill(); });
    plainText(ctx, "INCIDENTS", 1405, 532, 22, "#1b2430", "center", 900); plainText(ctx, "(EMPTY)", 1405, 642, 22, "#1b2430", "center", 900);
    emoji(ctx, "🪴", 1590, 700, 150); emoji(ctx, "🪑", 870, 720, 170);
    ctx.beginPath(); ctx.arc(836, 120, 62, 0, Math.PI * 2); ctx.fillStyle = "#fffdf3"; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
    ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(836, 120); ctx.lineTo(836 + Math.cos(now) * 44, 120 + Math.sin(now) * 44); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(836, 120); ctx.lineTo(836 + Math.cos(now / 12) * 28, 120 + Math.sin(now / 12) * 28); ctx.stroke();
    // regulator's inbox along the bottom
    ctx.fillStyle = vgrad(ctx, SHRED.inbox, JH, [[0, "#8c2a2a"], [1, "#5e1515"]]); ctx.fillRect(0, SHRED.inbox, JW, JH - SHRED.inbox);
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, SHRED.inbox); ctx.lineTo(JW, SHRED.inbox); ctx.stroke();
    label(ctx, "📥 TO: FEDERAL INVESTIGATORS", 836, SHRED.inbox + 60, 44, "#ffd9d9");
    for (const l of G.letters) drawLetter(ctx, l);
  },
};
const LETTER_SCALE = 1.3;
function shredLetterAt(x, y){ return [...G.letters].reverse().find(l => Math.abs(x - (l.x + Math.sin(l.ph) * l.sway)) < 95 * LETTER_SCALE && Math.abs(y - l.y) < 72 * LETTER_SCALE); }
function drawLetter(ctx, l){
  const x = l.x + Math.sin(l.ph) * l.sway, y = l.y;
  ctx.save(); ctx.translate(x, y); ctx.scale(LETTER_SCALE, LETTER_SCALE); ctx.translate(-x, -y);
  drawLetterShape(ctx, l, x, y);
  ctx.restore();
}
function drawLetterShape(ctx, l, x, y){
  if (l.keep) return drawKeepFolder(ctx, l, x, y);
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(l.ph) * .12);
  rr(ctx, -85, -55, 170, 110, 10); ctx.fillStyle = "#fffaf0"; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-85, -55); ctx.lineTo(0, 10); ctx.lineTo(85, -55); ctx.strokeStyle = "#9a8f74"; ctx.lineWidth = 4; ctx.stroke();
  ctx.restore();
  emoji(ctx, l.icon, x + 50, y - 30, 40);
  label(ctx, l.text, x, y + 34, l.text.length > 14 ? 15 : 20, "#ff6b5b");
}
function drawKeepFolder(ctx, l, x, y){   // a gold manila folder with a green KEEP stamp: do not shred
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(l.ph) * .12);
  ctx.lineWidth = 5; ctx.strokeStyle = INK;
  rr(ctx, -85, -70, 70, 26, 8); ctx.fillStyle = "#e0b43a"; ctx.fill(); ctx.stroke();          // folder tab
  rr(ctx, -85, -55, 170, 110, 10); ctx.fillStyle = vgrad(ctx, -55, 55, [[0, "#ffd866"], [1, "#e8b331"]]); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "rgba(120,80,0,.45)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-80, -38); ctx.lineTo(80, -38); ctx.stroke();
  ctx.save(); ctx.rotate(-.18); rr(ctx, -46, -30, 92, 38, 8); ctx.lineWidth = 5; ctx.strokeStyle = "#1f9d55"; ctx.stroke();
  plainText(ctx, "KEEP", 0, -11, 26, "#1f9d55", "center", 900); ctx.restore();
  ctx.restore();
  emoji(ctx, l.icon, x + 56, y - 34, 38);
  label(ctx, l.text, x, y + 34, l.text.length > 14 ? 15 : 19, "#9dff9d");
}

export { ShredGame };
