// What happens when the player does something: run the rule in core/, then show the result.
// UI modules only draw; main.js connects buttons to the functions here.
import { game, refreshDerived } from "./game.js";
import { HOUR, BASE_TIMER } from "./core/constants.js";
import { UPG_BY_ID } from "./core/data/upgrades.js";
import * as E from "./core/economy.js";
import * as J from "./core/jobs.js";
import { newState, MAX_COMPANY_NAME } from "./core/state.js";
import { decodeSave, encodeSave, sanitize } from "./core/save.js";
import { checkAchievements, MAJOR_ACH } from "./core/achievements.js";
import { resetMarket, scandalShock } from "./core/market.js";
import { money, fmtDuration, fmtTime } from "./core/format.js";
import { platform } from "./platform/index.js";
import { save, readSave } from "./saveload.js";
import { jobIsOpen, closeJob } from "./jobs/framework.js";
import { $ } from "./ui/dom.js";
import { toast } from "./ui/toast.js";
import { showModal, hideModal } from "./ui/modal.js";
import { refreshTip, hideTip } from "./ui/tooltip.js";
import { renderHud, showClickFeedback } from "./ui/hud.js";
import { renderStore, buyAmt } from "./ui/store.js";
import { renderAchievements } from "./ui/tabs.js";
import { renderJobs } from "./ui/jobsList.js";
import { drawMarket, resetTickers } from "./ui/market.js";

/* ---------- redrawing ---------- */

export function render() {
  renderHud();
  renderStore();
}

// After anything that changes what the player owns
export function update() {
  refreshDerived();
  render();
  updateJobs();
  refreshTip();
}

// Redraws the jobs list and announces jobs that just unlocked or came off cooldown. `quiet` skips the toasts.
const seenJobs = {};
export function updateJobs(quiet) {
  renderJobs();
  const events = J.jobChanges(seenJobs, game.S, Date.now());
  if (!quiet) handleEvents(events);
}

/* ---------- achievements ---------- */

const recentClicks = [];

function recordClick() {
  const now = performance.now();
  recentClicks.push(now);
  while (recentClicks.length && now - recentClicks[0] > 1000)
    recentClicks.shift();
  game.peakClickRate = Math.max(game.peakClickRate, recentClicks.length);
}

// Awards anything newly earned. `quiet` skips the toasts (used when loading a save).
export function awardAchievements(quiet) {
  const fresh = checkAchievements(game, Date.now());
  if (fresh.length && !quiet) {
    if (fresh.some((a) => MAJOR_ACH.has(a.id))) platform.happytime(); // portal confetti, saved for big milestones
    if (fresh.length <= 3)
      fresh.forEach((a) => toast(`🏆 Achievement unlocked: ${a.name}`, "gold"));
    else toast(`🏆 ${fresh.length} achievements unlocked!`, "gold");
  }
  renderAchievements();
}

/* ---------- deadlines ---------- */

// Shows what the core rules reported: deadlines survived, a bankruptcy, or job news
export function handleEvents(events) {
  for (const ev of events) {
    if (ev.type === "survived") {
      toast(
        ev.rebate > 0
          ? `Deadline reached. Regulators paid YOU a ${money(ev.rebate)} rebate.`
          : "Deadline reached with a clean ledger. The clock resets.",
      );
    } else if (ev.type === "bankrupt") {
      showBankruptcy(ev);
    } else if (ev.type === "jobUnlocked") {
      toast(`${ev.job.icon} New job unlocked: ${ev.job.name}`);
    } else if (ev.type === "jobReady") {
      toast(`${ev.job.icon} ${ev.job.name} is ready again.`);
    } else if (ev.type === "jobWon") {
      toast(
        `${ev.job.icon} ${ev.job.name} done. You made ${money(ev.reward)}.`,
        "gold",
      );
      platform.happytime();
    }
  }
}

function showBankruptcy({ owed, lost, voluntary }) {
  if (jobIsOpen()) closeJob();
  update();
  save();
  const S = game.S;
  if (voluntary) {
    showModal(
      "📉 Chapter 11 Filed",
      `<p>You walked into bankruptcy court with <b>${money(lost)}</b> in cash and <b style="color:var(--red)">${money(Math.max(0, owed))}</b> in unpaid fines, and walked out with neither.</p>
       <p>Every industry has been dissolved, every upgrade voided and every lobbyist let go. The regulators' slate, and their clock, start fresh.</p>
       <p>Achievements, play time and lifetime stats are untouched.</p>
       <p class="note">Bankruptcies so far: ${S.bankruptcies}.</p>`,
      [["Start the next venture", hideModal]],
      true,
    );
    return;
  }
  showModal(
    "🚨 CEASE & DESIST 🚨",
    `<p>You failed to pay <b style="color:var(--red)">${money(owed)}</b> in regulatory fines before the deadline.</p>
     <p>Federal regulators have seized your <b>${money(lost)}</b> in cash, dissolved every industry, voided every upgrade and fired your lobbyists.</p>
     <p>Your CEO has received a $40 million severance package and a book deal.</p>
     <p class="note">Bankruptcies so far: ${S.bankruptcies}. Start over. Pay your fines this time.</p>`,
    [["Rebuild the empire", hideModal]],
    true,
  );
}

/* ---------- player actions ---------- */

export function clickDollar(ev) {
  const amount = E.clickDollar(game.S, game.D);
  recordClick();
  showClickFeedback(amount, ev);
  render();
}

export function buyBuilding(i) {
  if (E.buyBuilding(game.S, i, buyAmt)) update();
}

export function buyUpgrade(id) {
  if (!E.buyUpgrade(game.S, id)) return;
  const u = UPG_BY_ID[id];
  hideTip(); // the button disappears
  update();
  if (u.type === "scandal") {
    scandalShock(game.mkt, u.ind);
    toast(`Scandal committed: “${u.name}” Regulatory fines +1%.`, true);
  }
}

export function hireTimerLobbyist() {
  if (!E.hireTimerLobbyist(game.S)) return;
  toast("A lobbyist bought you another hour. Deadline +1h.");
  update();
}

export function hirePenaltyLobbyist() {
  if (!E.hirePenaltyLobbyist(game.S)) return;
  update();
  const m = game.D.fineMult;
  if (m < 0 && m > -0.011)
    toast(
      "Fine multiplier is now NEGATIVE. The government now pays you to exist.",
    );
}

export function fireTimerLobbyist() {
  const cost = E.fireTimerLobbyist(game.S, Date.now());
  if (cost === false) return;
  toast(
    `Fired a Timer Lobbyist for ${money(cost)} in severance. Deadline −1h.`,
    true,
  );
  update();
}

export function firePenaltyLobbyist() {
  const cost = E.firePenaltyLobbyist(game.S);
  if (cost === false) return;
  toast(
    `Fired a Penalty Lobbyist for ${money(cost)} in severance. Fines +1%.`,
    true,
  );
  update();
}

export function payFines() {
  const ev = E.payFines(game.S, game.D, Date.now());
  if (!ev) return;
  if (ev.type === "deadline") {
    handleEvents(ev.events);
    render();
    return;
  }
  if (ev.type === "paid")
    toast(`Paid ${money(ev.amount)} in fines. No wrongdoing admitted.`);
  else if (ev.type === "rebate")
    toast(`Collected a ${money(ev.amount)} regulatory rebate.`);
  else toast("Filed a spotless compliance report.");
  render();
}

/* ---------- job shifts (main.js connects these to the minigame window with setJobHooks) ---------- */

export function startJob(job) {
  J.startJobCooldown(game.S, job, Date.now()); // the cooldown starts with the shift, win or lose
  save();
  updateJobs(true);
}

// Returns the reward, for the window's result screen
export function winJob(job) {
  const ev = J.winJob(game.S, game.D, job);
  handleEvents([ev]);
  save();
  return ev.reward;
}

// Extra cash a minigame pays on top of the reward (the price-gouging profits)
export function jobPayOut(amount, text) {
  E.earn(game.S, game.D, amount);
  if (text) toast(text, "gold");
}

export function renameCompany(name) {
  game.S.company =
    [...name.trim()].slice(0, MAX_COMPANY_NAME).join("") || "Unnamed Holdings";
}

/* ---------- loading, importing and resetting ---------- */

// Replaces the game with loaded data, catching up on time spent away
function loadGame(data, isImport) {
  game.S = sanitize(data, Date.now());
  refreshDerived();
  const S = game.S,
    now = Date.now(),
    away = now - S.lastTick;
  const before = S.dollars,
    finesBefore = S.fines;
  const events = E.advance(S, game.D, now);
  $("companyName").value = S.company;
  update();
  handleEvents(events);
  if (!events.some((e) => e.type === "bankrupt") && away > 60000 && !isImport) {
    showModal(
      "Welcome back",
      `<p>You were away for <b>${fmtDuration(away)}</b>.</p>
       <p>Your industries earned <b style="color:var(--green)">${money(S.dollars - before)}</b> while you were gone.</p>
       <p>Regulatory fines changed by <b style="color:var(--red)">${money(S.fines - finesBefore)}</b>. Time left to pay: <b>${fmtTime(S.deadline - now)}</b>.</p>`,
      [["Back to work", hideModal]],
    );
  }
}

// Loads the saved game at startup, if there is one
export function loadSavedGame() {
  let raw = null;
  try {
    raw = readSave();
  } catch {
    toast(
      "This browser blocks local storage here, so autosave is off. Use Export to keep your progress.",
      true,
    );
    return;
  }
  if (!raw) return;
  try {
    loadGame(decodeSave(raw), false);
  } catch (e) {
    console.warn(e);
    toast("Couldn't read your save; starting fresh.", true);
  }
}

// After an import or hard reset: fresh charts, achievements re-checked quietly
function afterReplace() {
  resetMarket(game.mkt, game.D.indCps);
  resetTickers();
  drawMarket();
  awardAchievements(true);
  renderAchievements(true);
  updateJobs(true);
  save();
}

export function exportSave() {
  save();
  showModal(
    "Export save",
    `<p class="note" style="margin-top:0">Copy this text somewhere safe.</p><textarea id="exportTxt" readonly>${encodeSave(game.S)}</textarea>`,
    [
      [
        "Copy",
        () => {
          const t = $("exportTxt");
          t.select();
          if (navigator.clipboard)
            navigator.clipboard
              .writeText(t.value)
              .then(() => toast("Save copied to clipboard."));
          else document.execCommand("copy");
        },
      ],
      ["Close", hideModal],
    ],
  );
}

export function importSave() {
  showModal(
    "Import save",
    `<p class="note" style="margin-top:0">Paste a save string. This replaces your current game.</p><textarea id="importTxt" placeholder="Paste save here..."></textarea>`,
    [
      [
        "Load",
        () => {
          let data;
          try {
            data = sanitize(decodeSave($("importTxt").value), Date.now());
          } catch {
            toast("That save string is invalid.", true);
            return;
          }
          hideModal();
          loadGame(data, true);
          afterReplace();
          toast("Save imported.");
        },
      ],
      ["Cancel", hideModal],
    ],
  );
}

export function declareBankruptcy() {
  showModal(
    "Declare bankruptcy?",
    `<p>You lose your cash, every industry, every upgrade and every lobbyist, and your unpaid fines are wiped. The regulatory clock restarts at its full ${BASE_TIMER / HOUR} hours.</p>
     <p>You keep your achievements, play time and lifetime stats. This counts as a bankruptcy and can't be undone.</p>`,
    [
      [
        "File for bankruptcy",
        () => {
          hideModal();
          handleEvents([E.goBankrupt(game.S, Date.now(), true)]);
        },
        "danger",
      ],
      ["Cancel", hideModal],
    ],
    true,
  );
}

export function hardReset() {
  showModal(
    "Hard reset?",
    `<p>This wipes everything: cash, industries, upgrades, lobbyists and lifetime stats. It cannot be undone.</p>`,
    [
      [
        "Wipe it all",
        () => {
          game.S = newState(Date.now());
          game.peakClickRate = 0;
          recentClicks.length = 0;
          $("companyName").value = game.S.company;
          update();
          afterReplace();
          hideModal();
          toast("Fresh start. The regulators have forgotten you.");
        },
        "danger",
      ],
      ["Cancel", hideModal],
    ],
    true,
  );
}
