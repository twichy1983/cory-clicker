// What happens when the player does something: run the rule in core/, then show the result.
// UI modules only draw; main.js connects buttons to the functions here.
import { game, refreshDerived } from "./game.js"
import { HOUR, BASE_TIMER } from "./core/constants.js"
import { UPG_BY_ID } from "./core/data/upgrades.js"
import * as economy from "./core/economy.js"
import * as jobRules from "./core/jobs.js"
import { newState, MAX_COMPANY_NAME } from "./core/state.js"
import { decodeSave, encodeSave, sanitize } from "./core/save.js"
import { checkAchievements, MAJOR_ACH } from "./core/achievements.js"
import { resetMarket, scandalShock } from "./core/market.js"
import { money, fmtDuration, fmtTime } from "./core/format.js"
import { platform } from "./platform/index.js"
import { save, readSave } from "./saveload.js"
import { jobIsOpen, closeJob } from "./jobs/framework.js"
import { $ } from "./ui/dom.js"
import { toast } from "./ui/toast.js"
import { showModal, hideModal } from "./ui/modal.js"
import { refreshTip, hideTip } from "./ui/tooltip.js"
import { renderHud, showClickFeedback } from "./ui/hud.js"
import { renderStore, buyAmt } from "./ui/store.js"
import { renderAchievements } from "./ui/tabs.js"
import { renderJobs } from "./ui/jobsList.js"
import { drawMarket, resetTickers } from "./ui/market.js"

/* ---------- redrawing ---------- */

export function render() {
  renderHud()
  renderStore()
}

// After anything that changes what the player owns
export function update() {
  refreshDerived()
  render()
  updateJobs()
  refreshTip()
}

// Redraws the jobs list and announces jobs that just unlocked or came off cooldown. `quiet` skips the toasts.
const seenJobs = {}
export function updateJobs(quiet) {
  renderJobs()
  const events = jobRules.jobChanges(seenJobs, game.state, Date.now())
  if (!quiet) handleEvents(events)
}

/* ---------- achievements ---------- */

const recentClicks = []

function recordClick() {
  const now = performance.now()
  recentClicks.push(now)
  while (recentClicks.length && now - recentClicks[0] > 1000) recentClicks.shift()
  game.peakClickRate = Math.max(game.peakClickRate, recentClicks.length)
}

// Awards anything newly earned. `quiet` skips the toasts (used when loading a save).
export function awardAchievements(quiet) {
  const fresh = checkAchievements(game, Date.now())
  if (fresh.length && !quiet) {
    if (fresh.some((achievement) => MAJOR_ACH.has(achievement.id))) platform.happytime() // portal confetti, saved for big milestones
    if (fresh.length <= 3) fresh.forEach((achievement) => toast(`🏆 Achievement unlocked: ${achievement.name}`, "gold"))
    else toast(`🏆 ${fresh.length} achievements unlocked!`, "gold")
  }
  renderAchievements()
}

/* ---------- deadlines ---------- */

// Shows what the core rules reported: deadlines survived, a bankruptcy, or job news
export function handleEvents(events) {
  for (const event of events) {
    if (event.type === "survived") {
      toast(
        event.rebate > 0
          ? `Deadline reached. Regulators paid YOU a ${money(event.rebate)} rebate.`
          : "Deadline reached with a clean ledger. The clock resets."
      )
    } else if (event.type === "bankrupt") {
      showBankruptcy(event)
    } else if (event.type === "jobUnlocked") {
      toast(`${event.job.icon} New job unlocked: ${event.job.name}`)
    } else if (event.type === "jobReady") {
      toast(`${event.job.icon} ${event.job.name} is ready again.`)
    } else if (event.type === "jobWon") {
      toast(`${event.job.icon} ${event.job.name} done. You made ${money(event.reward)}.`, "gold")
      platform.happytime()
    }
  }
}

function showBankruptcy({ owed, lost, voluntary }) {
  if (jobIsOpen()) closeJob()
  update()
  save()
  const state = game.state
  if (voluntary) {
    showModal(
      "📉 Chapter 11 Filed",
      `<p>You walked into bankruptcy court with <b>${money(lost)}</b> in cash and <b class="loss">${money(Math.max(0, owed))}</b> in unpaid fines, and walked out with neither.</p>
       <p>Every industry has been dissolved, every upgrade voided and every lobbyist let go. The regulators' slate, and their clock, start fresh.</p>
       <p>Achievements, play time and lifetime stats are untouched.</p>
       <p class="note">Bankruptcies so far: ${state.bankruptcies}.</p>`,
      [["Start the next venture", hideModal]],
      true
    )
    return
  }
  showModal(
    "🚨 CEASE & DESIST 🚨",
    `<p>You failed to pay <b class="loss">${money(owed)}</b> in regulatory fines before the deadline.</p>
     <p>Federal regulators have seized your <b>${money(lost)}</b> in cash, dissolved every industry, voided every upgrade and fired your lobbyists.</p>
     <p>Your CEO has received a $40 million severance package and a book deal.</p>
     <p class="note">Bankruptcies so far: ${state.bankruptcies}. Start over. Pay your fines this time.</p>`,
    [["Rebuild the empire", hideModal]],
    true
  )
}

/* ---------- player actions ---------- */

export function clickDollar(clickEvent) {
  const amount = economy.clickDollar(game.state, game.derived)
  recordClick()
  showClickFeedback(amount, clickEvent)
  render()
}

export function buyBuilding(i) {
  if (economy.buyBuilding(game.state, i, buyAmt)) update()
}

export function buyUpgrade(id) {
  if (!economy.buyUpgrade(game.state, id)) return
  const upgrade = UPG_BY_ID[id]
  hideTip() // the button disappears
  update()
  if (upgrade.type === "scandal") {
    scandalShock(game.mkt, upgrade.ind)
    toast(`Scandal committed: “${upgrade.name}” Regulatory fines +1%.`, true)
  }
}

export function hireTimerLobbyist() {
  if (!economy.hireTimerLobbyist(game.state)) return
  toast("A lobbyist bought you another hour. Deadline +1h.")
  update()
}

export function hirePenaltyLobbyist() {
  if (!economy.hirePenaltyLobbyist(game.state)) return
  update()
  const mult = game.derived.fineMult
  if (mult < 0 && mult > -0.011) toast("Fine multiplier is now NEGATIVE. The government now pays you to exist.")
}

export function fireTimerLobbyist() {
  const cost = economy.fireTimerLobbyist(game.state, Date.now())
  if (cost === false) return
  toast(`Fired a Timer Lobbyist for ${money(cost)} in severance. Deadline −1h.`, true)
  update()
}

export function firePenaltyLobbyist() {
  const cost = economy.firePenaltyLobbyist(game.state)
  if (cost === false) return
  toast(`Fired a Penalty Lobbyist for ${money(cost)} in severance. Fines +1%.`, true)
  update()
}

export function payFines() {
  const event = economy.payFines(game.state, game.derived, Date.now())
  if (!event) return
  if (event.type === "deadline") {
    handleEvents(event.events)
    render()
    return
  }
  if (event.type === "paid") toast(`Paid ${money(event.amount)} in fines. No wrongdoing admitted.`)
  else if (event.type === "rebate") toast(`Collected a ${money(event.amount)} regulatory rebate.`)
  else toast("Filed a spotless compliance report.")
  render()
}

/* ---------- job shifts (main.js connects these to the minigame window with setJobHooks) ---------- */

export function startJob(job) {
  jobRules.startJobCooldown(game.state, job, Date.now()) // the cooldown starts with the shift, win or lose
  save()
  updateJobs(true)
}

// Returns the reward, for the window's result screen
export function winJob(job) {
  const event = jobRules.winJob(game.state, game.derived, job)
  handleEvents([event])
  save()
  return event.reward
}

// Extra cash a minigame pays on top of the reward (the price-gouging profits)
export function jobPayOut(amount, text) {
  economy.earn(game.state, game.derived, amount)
  if (text) toast(text, "gold")
}

export function renameCompany(name) {
  game.state.company = [...name.trim()].slice(0, MAX_COMPANY_NAME).join("") || "Unnamed Holdings"
}

/* ---------- loading, importing and resetting ---------- */

// Replaces the game with loaded data, catching up on time spent away
function loadGame(data, isImport) {
  game.state = sanitize(data, Date.now())
  refreshDerived()
  const state = game.state,
    now = Date.now(),
    away = now - state.lastTick
  const before = state.dollars,
    finesBefore = state.fines
  const events = economy.advance(state, game.derived, now)
  $("companyName").value = state.company
  update()
  handleEvents(events)
  if (!events.some((event) => event.type === "bankrupt") && away > 60000 && !isImport) {
    showModal(
      "Welcome back",
      `<p>You were away for <b>${fmtDuration(away)}</b>.</p>
       <p>Your industries earned <b class="gain">${money(state.dollars - before)}</b> while you were gone.</p>
       <p>Regulatory fines changed by <b class="loss">${money(state.fines - finesBefore)}</b>. Time left to pay: <b>${fmtTime(state.deadline - now)}</b>.</p>`,
      [["Back to work", hideModal]]
    )
  }
}

// Loads the saved game at startup, if there is one
export function loadSavedGame() {
  let raw = null
  try {
    raw = readSave()
  } catch {
    toast("This browser blocks local storage here, so autosave is off. Use Export to keep your progress.", true)
    return
  }
  if (!raw) return
  try {
    loadGame(decodeSave(raw), false)
  } catch (error) {
    console.warn(error)
    toast("Couldn't read your save; starting fresh.", true)
  }
}

// After an import or hard reset: fresh charts, achievements re-checked quietly
function afterReplace() {
  resetMarket(game.mkt, game.derived.indCps)
  resetTickers()
  drawMarket()
  awardAchievements(true)
  renderAchievements(true)
  updateJobs(true)
  save()
}

export function exportSave() {
  save()
  showModal(
    "Export save",
    `<p class="note first">Copy this text somewhere safe.</p><textarea id="exportTxt" readonly>${encodeSave(game.state)}</textarea>`,
    [
      [
        "Copy",
        () => {
          const textarea = $("exportTxt")
          textarea.select()
          if (navigator.clipboard)
            navigator.clipboard.writeText(textarea.value).then(() => toast("Save copied to clipboard."))
          else document.execCommand("copy")
        }
      ],
      ["Close", hideModal]
    ]
  )
}

export function importSave() {
  showModal(
    "Import save",
    `<p class="note first">Paste a save string. This replaces your current game.</p><textarea id="importTxt" placeholder="Paste save here..."></textarea>`,
    [
      [
        "Load",
        () => {
          let data
          try {
            data = sanitize(decodeSave($("importTxt").value), Date.now())
          } catch {
            toast("That save string is invalid.", true)
            return
          }
          hideModal()
          loadGame(data, true)
          afterReplace()
          toast("Save imported.")
        }
      ],
      ["Cancel", hideModal]
    ]
  )
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
          hideModal()
          handleEvents([economy.goBankrupt(game.state, Date.now(), true)])
        },
        "danger"
      ],
      ["Cancel", hideModal]
    ],
    true
  )
}

export function hardReset() {
  showModal(
    "Hard reset?",
    `<p>This wipes everything: cash, industries, upgrades, lobbyists and lifetime stats. It cannot be undone.</p>`,
    [
      [
        "Wipe it all",
        () => {
          game.state = newState(Date.now())
          game.peakClickRate = 0
          recentClicks.length = 0
          $("companyName").value = game.state.company
          update()
          afterReplace()
          hideModal()
          toast("Fresh start. The regulators have forgotten you.")
        },
        "danger"
      ],
      ["Cancel", hideModal]
    ],
    true
  )
}
