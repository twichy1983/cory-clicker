// Clickonomics: startup, button wiring and the game loop.
//
// How the code is organised (see docs/architecture.md):
//   core/      game data and rules. No page access, so it runs in Node for the unit tests.
//   ui/        draws the page from the game state
//   jobs/      the minigames and the shared window they run in
//   platform/  where saves go (localStorage, or CrazyGames' SDK)
//   actions.js what happens when the player does something
import { BUILD, TEST_MODE, IS_CRAZYGAMES } from "./config.js";
import { game } from "./game.js";
import { rules } from "./core/rules.js";
import { advance, earn } from "./core/economy.js";
import { sampleMarket } from "./core/market.js";
import { platform } from "./platform/index.js";
import { save } from "./saveload.js";
import * as act from "./actions.js";
import { JOB_BY_ID } from "./jobs/index.js";
import { openJob, wireJobWindow, setJobHooks } from "./jobs/framework.js";
import { $ } from "./ui/dom.js";
import { toast } from "./ui/toast.js";
import { wireModal, isModalOpen, startReportingBreaks } from "./ui/modal.js";
import { wireTooltips, refreshTip, hideTip } from "./ui/tooltip.js";
import { setNews, rotateNews } from "./ui/hud.js";
import { buildBuildingRows, setBuyAmt, toggleShowAllUpgrades } from "./ui/store.js";
import { wireTabs, renderStats, renderAchievements, tabVisible } from "./ui/tabs.js";
import { buildJobList } from "./ui/jobsList.js";
import { wireMarket, drawMarket } from "./ui/market.js";
import { addTestToolbar } from "./ui/testToolbar.js";

if (TEST_MODE) {
  rules.freePurchases = true;
  rules.jobCooldown = 5000; // every job can be replayed after 5 seconds
}

/* ---------- wiring: buttons to actions ---------- */

function wire() {
  buildBuildingRows();
  buildJobList();
  wireTooltips();
  wireModal();
  wireTabs();
  wireMarket();
  wireJobWindow();
  setJobHooks({ onOpen: hideTip, onStart: act.startJob, onWin: act.winJob, onPayOut: act.jobPayOut, onClose: () => act.updateJobs(true) });

  $("bigDollar").addEventListener("click", act.clickDollar);
  $("payBtn").addEventListener("click", act.payFines);
  $("timerLobbyBtn").addEventListener("click", act.hireTimerLobbyist);
  $("penaltyLobbyBtn").addEventListener("click", act.hirePenaltyLobbyist);
  $("timerFireBtn").addEventListener("click", act.fireTimerLobbyist);
  $("penaltyFireBtn").addEventListener("click", act.firePenaltyLobbyist);

  // Buttons that are rebuilt as the game changes, so listen on their containers
  $("buildings").addEventListener("click", e => {
    const b = e.target.closest("[data-bld]");
    if (b && !b.classList.contains("mystery")) act.buyBuilding(+b.dataset.bld);
  });
  $("upgrades").addEventListener("click", e => {
    const b = e.target.closest(".upg, .upgMore");
    if (!b) return;
    if (b.classList.contains("upgMore")) { toggleShowAllUpgrades(); act.render(); }
    else act.buyUpgrade(b.dataset.id);
  });
  $("jobList").addEventListener("click", e => {
    const b = e.target.closest("[data-job]");
    if (b) openJob(JOB_BY_ID[b.dataset.job]);
  });
  document.querySelectorAll(".buyAmt button").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll(".buyAmt button").forEach(x => x.classList.toggle("on", x === b));
    setBuyAmt(+b.dataset.amt);
    act.render();
    refreshTip();
  }));

  // Save tab
  $("saveNow").addEventListener("click", () => { save(); toast("Game saved."); });
  $("exportBtn").addEventListener("click", act.exportSave);
  $("importBtn").addEventListener("click", act.importSave);
  $("bankruptBtn").addEventListener("click", act.declareBankruptcy);
  $("resetBtn").addEventListener("click", act.hardReset);

  // Company name: typing renames live, Enter keeps it, Escape undoes
  const name = $("companyName");
  let nameBeforeEdit = "";
  name.addEventListener("focus", () => { nameBeforeEdit = game.S.company; });
  name.addEventListener("input", e => act.renameCompany(e.target.value));
  name.addEventListener("keydown", e => {
    if (e.key === "Enter") e.target.blur();
    if (e.key === "Escape") { game.S.company = nameBeforeEdit; e.target.value = nameBeforeEdit; e.target.blur(); }
  });
  name.addEventListener("change", e => { e.target.value = game.S.company; save(); toast(`Company renamed to ${game.S.company}.`); });
  $("editName").addEventListener("click", () => { name.focus(); name.select(); });

  // Save when the tab is hidden or closed (beforeunload alone is unreliable on phones and in iframes)
  document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
  window.addEventListener("pagehide", save);

  if (IS_CRAZYGAMES) {
    // Inside the CrazyGames iframe: keep arrow keys and space from scrolling the host page, and no right-click menu
    window.addEventListener("keydown", e => {
      const typing = /^(INPUT|TEXTAREA|BUTTON)$/.test(e.target.tagName);
      if (!typing && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
    });
    document.addEventListener("contextmenu", e => e.preventDefault());
  }
}

/* ---------- the game loop ---------- */

let tickCount = 0, lastTick = Date.now();

function tick() {
  const now = Date.now();
  act.handleEvents(advance(game.S, game.D, now));
  act.render();
  // Play time only counts while the game is visible
  if (!document.hidden) game.S.playTime += Math.min(1, Math.max(0, (now - lastTick) / 1000));
  lastTick = now;

  if (++tickCount % 10 === 0) { // once a second
    act.updateJobs();
    sampleMarket(game.mkt, game.D.indCps);
    drawMarket();
    act.awardAchievements();
    if (tabVisible("stats")) renderStats();
    refreshTip();
  }
}

/* ---------- startup ---------- */

async function boot() {
  wire();
  platform.loadingStart();
  try { await platform.init(); } catch (e) { console.warn("Platform init failed; continuing with local saves.", e); }

  $("companyName").value = game.S.company;
  act.loadSavedGame();
  act.update();
  act.updateJobs(true);
  setNews();
  for (let k = 0; k < 60; k++) sampleMarket(game.mkt, game.D.indCps); // a minute of history so the charts aren't empty
  drawMarket();
  act.awardAchievements(true); // quietly award anything an older save already qualifies for
  renderAchievements(true);

  platform.loadingStop();
  startReportingBreaks();
  if (!isModalOpen()) platform.gameplayStart();
  if (TEST_MODE) addTestToolbar({ getState: () => game.S, earn: amount => earn(game.S, game.D, amount), refresh: act.update });

  setInterval(tick, 100);
  setInterval(save, 30000);
  setInterval(rotateNews, 12000);
}

// A handle for the end-to-end tests (source builds only)
if (BUILD === "dev") window.__clickonomics = { game, tick, save, act };

boot();
