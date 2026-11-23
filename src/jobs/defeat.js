import { JW, JH, rand, rr, vgrad, hgrad, INK, emoji, label, inBox, cloud } from "./draw.js";
import { jobAlert, jobStrike, endJob } from "./framework.js";

/* ---------------------------------------------------------
   JOB: DEFEAT DEVICE (Auto & Aero Works)
   Keep the car in BEAST mode on the road and CLEAN mode during tests.
   --------------------------------------------------------- */
const DEFEAT_SWITCH = { x: 586, y: 790, w: 500, h: 110 };
const DefeatGame = {
  time: 30, strikes: 3, meter: "PROFIT FROM POWER",
  tagline: "Your engine can tell when it's being tested and suddenly becomes an environmentalist. On the road it pumps out forty times the legal limit. Childhood asthma is a 'societal issue.' You're the switch.",
  rules: [
    "The sign shows whether the car is on the <b>ROAD</b> or in an <b>EMISSIONS TEST</b>.",
    "<b>Click the car or the switch</b> to flip between 🌱 CLEAN and 💨 BEAST mode.",
    "On the road, BEAST mode prints money. CLEAN mode earns nothing.",
    "In a test, BEAST mode gets you caught: a strike. Watch for the warning before every test!",
    "Fill the profit meter before time runs out. 3 strikes and you're busted.",
  ],
  winTitle: "Clean on paper!", winText: "Every test passed and every road trip a smog cloud. The city's air-quality alerts have never been busier.",
  lose: { busted: "Caught three times on the test rig. Executives are 'shocked and appalled' and blaming two junior engineers.", time: "Time's up. The car spent too long being well-behaved. Marketing is horrified." },
  init(G){ Object.assign(G, { mode: "clean", env: "road", envT: 0, next: rand(2.4, 3.4), warned: false, caught: false, road: 0, wheel: 0 }); },
  step(G, dt){
    G.envT += dt;
    if (G.env === "road") {
      G.road += (G.mode === "beast" ? 900 : 380) * dt; G.wheel += (G.mode === "beast" ? 14 : 6) * dt;
      if (G.mode === "beast") { G.pct = Math.min(100, G.pct + 12 * dt); if (Math.random() < dt * 25) G.parts.push({ x: 360, y: 610, vx: rand(-260, -120), vy: rand(-60, 10), life: .9, color: "rgba(60,60,60,.55)", r: rand(18, 30), grav: -30 }); }
      if (!G.warned && G.envT >= G.next - 1) { G.warned = true; jobAlert("⚠️ TEST INCOMING!", "warn"); }
      if (G.envT >= G.next) { G.env = "test"; G.envT = 0; G.next = rand(1.8, 2.8); G.caught = false; jobAlert("🧪 EMISSIONS TEST", "bad"); }
    } else {
      if (G.mode === "beast" && !G.caught) { G.caught = true; jobStrike("Caught on the test rig!", 836, 300); }
      if (G.envT >= G.next) { G.env = "road"; G.envT = 0; G.next = Math.max(1.8, rand(2.6, 4.2) - G.t * .03); G.warned = false; jobAlert("🛣️ Back on the road", "warn"); }
    }
    if (G.pct >= 100) endJob("win");
  },
  cursor(G, x, y){ return inBox(x, y, DEFEAT_SWITCH) || (x > 380 && x < 1300 && y > 380 && y < 720); },
  down(G, x, y){ if (inBox(x, y, DEFEAT_SWITCH) || (x > 380 && x < 1300 && y > 380 && y < 720)) G.mode = G.mode === "beast" ? "clean" : "beast"; },
  draw(ctx, G, now){
    const road = G.env === "road";
    if (road) {
      ctx.fillStyle = vgrad(ctx, 0, 520, [[0, "#64c3ff"], [1, "#cdeeff"]]); ctx.fillRect(0, 0, JW, 520);
      [[300 - (G.road * .05) % 1900, 120, 1.1], [1100 - (G.road * .05) % 1900, 80, .9], [1900 - (G.road * .05) % 1900, 160, 1]].forEach(([x, y, s]) => cloud(ctx, ((x % 1900) + 1900) % 1900 - 150, y, s));
      ctx.fillStyle = "#7cc65a"; ctx.beginPath(); for (let i = -1; i < 6; i++) { const hx = i * 400 - (G.road * .2) % 400; ctx.ellipse(hx, 520, 260, 120, 0, Math.PI, 0); } ctx.fill();
      ctx.fillStyle = "#4f5359"; ctx.fillRect(0, 520, JW, JH - 520);
      ctx.fillStyle = "#ffd23f"; for (let x = -(G.road % 220); x < JW; x += 220) ctx.fillRect(x, 700, 120, 16);
      ctx.fillStyle = "#3d9a3d"; ctx.fillRect(0, 500, JW, 26);
    } else {
      ctx.fillStyle = vgrad(ctx, 0, 620, [[0, "#cfd6dc"], [1, "#b3bcc4"]]); ctx.fillRect(0, 0, JW, 620);
      ctx.fillStyle = "#8a949c"; ctx.fillRect(0, 620, JW, JH - 620);
      rr(ctx, 520, 90, 640, 100, 14); ctx.fillStyle = "#1e3a5f"; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      label(ctx, "OFFICIAL EMISSIONS LAB", 840, 140, 44, "#fff");
      [[560, 645], [1110, 645]].forEach(([x, y]) => { rr(ctx, x - 110, y - 20, 220, 50, 22); ctx.fillStyle = "#3a4046"; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); });
      emoji(ctx, "🧑‍🔬", 1420, 470, 190); emoji(ctx, "📋", 1340, 540, 70);
      rr(ctx, 230, 560, 140, 26, 10); ctx.fillStyle = "#555"; ctx.fill(); ctx.stroke();
      if (G.mode === "beast") emoji(ctx, "😱", 1420, 300, 80);
    }
    drawCar(ctx, 836, road ? 600 + Math.sin(now * 20) * 3 : 605, G.wheel, G.mode === "beast");
    if (G.mode === "clean") for (let i = 0; i < 3; i++) emoji(ctx, "🌱", 330 - i * 60, 600 - ((now * 60 + i * 30) % 80), 34, .8);
    const sign = road ? ["🛣️ ON THE ROAD", "#2fb35a"] : ["🧪 EMISSIONS TEST", "#e03131"];
    const warnFlash = road && G.warned && Math.sin(now * 18) > 0;
    rr(ctx, 1240, 60, 380, 90, 18); ctx.fillStyle = warnFlash ? "#ffd23f" : sign[1]; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    label(ctx, warnFlash ? "⚠️ TEST SOON" : sign[0], 1430, 105, 36, "#fff");
    // mode switch
    const S1 = DEFEAT_SWITCH, beast = G.mode === "beast";
    rr(ctx, S1.x, S1.y, S1.w, S1.h, 55); ctx.fillStyle = "#1b1f23"; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    rr(ctx, S1.x + (beast ? S1.w / 2 : 6), S1.y + 6, S1.w / 2 - 6, S1.h - 12, 50); ctx.fillStyle = beast ? "#e8590c" : "#2fb35a"; ctx.fill();
    label(ctx, "🌱 CLEAN", S1.x + S1.w / 4, S1.y + S1.h / 2, 38, beast ? "#888" : "#fff");
    label(ctx, "💨 BEAST", S1.x + S1.w * .75, S1.y + S1.h / 2, 38, beast ? "#fff" : "#888");
  },
};
function drawCar(ctx, x, y, wheel, beast){
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(0, 60, 380, 26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-400, 20); ctx.quadraticCurveTo(-400, -60, -320, -70); ctx.lineTo(-170, -80); ctx.quadraticCurveTo(-90, -190, 60, -190);
  ctx.quadraticCurveTo(180, -190, 240, -90); ctx.lineTo(360, -70); ctx.quadraticCurveTo(410, -60, 410, 0); ctx.lineTo(410, 30); ctx.lineTo(-400, 30); ctx.closePath();
  ctx.fillStyle = hgrad(ctx, -400, 410, [[0, "#c92a2a"], [.5, "#ff5c4d"], [1, "#b02020"]]); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-130, -85); ctx.quadraticCurveTo(-70, -165, 30, -168); ctx.lineTo(30, -85); ctx.closePath(); ctx.fillStyle = "#bfe6ff"; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(60, -168); ctx.quadraticCurveTo(160, -165, 205, -85); ctx.lineTo(60, -85); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#ffe066"; rr(ctx, 360, -50, 46, 30, 10); ctx.fill(); ctx.stroke();
  rr(ctx, -420, 0, 44, 20, 6); ctx.fillStyle = "#555"; ctx.fill(); ctx.stroke();
  if (beast) { ctx.fillStyle = "#ffd23f"; ctx.beginPath(); ctx.moveTo(-200, -30); ctx.lineTo(-120, -30); ctx.lineTo(-150, 0); ctx.closePath(); ctx.fill(); }
  [-240, 250].forEach(wx => {
    ctx.beginPath(); ctx.arc(wx, 30, 78, 0, Math.PI * 2); ctx.fillStyle = "#1d1d1d"; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(wx, 30, 42, 0, Math.PI * 2); ctx.fillStyle = "#c9ced3"; ctx.fill();
    ctx.save(); ctx.translate(wx, 30); ctx.rotate(wheel); ctx.strokeStyle = "#6b7177"; ctx.lineWidth = 7;
    for (let i = 0; i < 5; i++) { ctx.rotate(Math.PI * 2 / 5); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(38, 0); ctx.stroke(); } ctx.restore();
  });
  ctx.restore();
}

export { DefeatGame };
