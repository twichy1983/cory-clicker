// Clickonomics: startup, button wiring and the game loop.
//
// How the code is organised (see docs/architecture.md):
//   core/      game data and rules. No page access, so it runs in Node for the unit tests.
//   ui/        draws the page from the game state
//   jobs/      the minigames and the shared window they run in
//   platform/  where saves go (localStorage, or CrazyGames' SDK)
//   actions.js what happens when the player does something
import { BUILD, TEST_MODE, IS_CRAZYGAMES } from "./config.js"
import { game } from "./game.js"
import { rules } from "./core/rules.js"
import { advance, earn } from "./core/economy.js"
import { sampleMarket } from "./core/market.js"
import { platform } from "./platform/index.js"
import { save } from "./saveload.js"
import * as act from "./actions.js"
import { JOB_BY_ID } from "./jobs/index.js"
import { openJob, wireJobWindow, setJobHooks } from "./jobs/framework.js"
import { $ } from "./ui/dom.js"
import { toast } from "./ui/toast.js"
import { wireModal, isModalOpen, startReportingBreaks } from "./ui/modal.js"
import { wireTooltips, refreshTip, hideTip } from "./ui/tooltip.js"
import { setNews, rotateNews } from "./ui/hud.js"
import { buildBuildingRows, setBuyAmt, toggleShowAllUpgrades } from "./ui/store.js"
import { wireTabs, renderStats, renderAchievements, tabVisible } from "./ui/tabs.js"
import { buildJobList } from "./ui/jobsList.js"
import { wireMarket, drawMarket } from "./ui/market.js"
import { addTestToolbar } from "./ui/testToolbar.js"

if (TEST_MODE) {
  rules.freePurchases = true
  rules.jobCooldown = 5000 // every job can be replayed after 5 seconds
}

/* ---------- wiring: buttons to actions ---------- */

function wire() {
  buildBuildingRows()
  buildJobList()
  wireTooltips()
  wireModal()
  wireTabs()
  wireMarket()
  wireJobWindow()
  setJobHooks({
    onOpen: hideTip,
    onStart: act.startJob,
    onWin: act.winJob,
    onPayOut: act.jobPayOut,
    onClose: () => act.updateJobs(true)
  })

  $("bigDollar").addEventListener("click", act.clickDollar)
  $("payBtn").addEventListener("click", act.payFines)
  $("timerLobbyBtn").addEventListener("click", act.hireTimerLobbyist)
  $("penaltyLobbyBtn").addEventListener("click", act.hirePenaltyLobbyist)
  $("timerFireBtn").addEventListener("click", act.fireTimerLobbyist)
  $("penaltyFireBtn").addEventListener("click", act.firePenaltyLobbyist)

  // Buttons that are rebuilt as the game changes, so listen on their containers
  $("buildings").addEventListener("click", (event) => {
    const button = event.target.closest("[data-bld]")
    if (button && !button.classList.contains("mystery")) act.buyBuilding(+button.dataset.bld)
  })
  $("upgrades").addEventListener("click", (event) => {
    const button = event.target.closest(".upg, .upgMore")
    if (!button) return
    if (button.classList.contains("upgMore")) {
      toggleShowAllUpgrades()
      act.render()
    } else act.buyUpgrade(button.dataset.id)
  })
  $("jobList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-job]")
    if (button) openJob(JOB_BY_ID[button.dataset.job])
  })
  document.querySelectorAll(".buyAmt button").forEach((button) =>
    button.addEventListener("click", () => {
      document
        .querySelectorAll(".buyAmt button")
        .forEach((otherButton) => otherButton.classList.toggle("on", otherButton === button))
      setBuyAmt(+button.dataset.amt)
      act.render()
      refreshTip()
    })
  )

  // Save tab
  $("saveNow").addEventListener("click", () => {
    save()
    toast("Game saved.")
  })
  $("exportBtn").addEventListener("click", act.exportSave)
  $("importBtn").addEventListener("click", act.importSave)
  $("bankruptBtn").addEventListener("click", act.declareBankruptcy)
  $("resetBtn").addEventListener("click", act.hardReset)

  // Company name: typing renames live, Enter keeps it, Escape undoes
  const name = $("companyName")
  let nameBeforeEdit = ""
  name.addEventListener("focus", () => {
    nameBeforeEdit = game.state.company
  })
  name.addEventListener("input", (event) => act.renameCompany(event.target.value))
  name.addEventListener("keydown", (event) => {
    if (event.key === "Enter") event.target.blur()
    if (event.key === "Escape") {
      game.state.company = nameBeforeEdit
      event.target.value = nameBeforeEdit
      event.target.blur()
    }
  })
  name.addEventListener("change", (event) => {
    event.target.value = game.state.company
    save()
    toast(`Company renamed to ${game.state.company}.`)
  })
  $("editName").addEventListener("click", () => {
    name.focus()
    name.select()
  })

  // Save when the tab is hidden or closed (beforeunload alone is unreliable on phones and in iframes)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) save()
  })
  window.addEventListener("pagehide", save)

  if (IS_CRAZYGAMES) {
    // Inside the CrazyGames iframe: keep arrow keys and space from scrolling the host page, and no right-click menu
    window.addEventListener("keydown", (event) => {
      const typing = /^(INPUT|TEXTAREA|BUTTON)$/.test(event.target.tagName)
      if (!typing && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key))
        event.preventDefault()
    })
    document.addEventListener("contextmenu", (event) => event.preventDefault())
  }
}

/* ---------- the game loop ---------- */

let tickCount = 0,
  lastTick = Date.now()

function tick() {
  const now = Date.now()
  act.handleEvents(advance(game.state, game.derived, now))
  act.render()
  // Play time only counts while the game is visible
  if (!document.hidden) game.state.playTime += Math.min(1, Math.max(0, (now - lastTick) / 1000))
  lastTick = now

  tickCount++
  if (tickCount % 10 === 0) {
    // once a second
    act.updateJobs()
    sampleMarket(game.mkt, game.derived.indCps)
    drawMarket()
    act.awardAchievements()
    if (tabVisible("stats")) renderStats()
    refreshTip()
  }
}

/* ---------- startup ---------- */

async function boot() {
  wire()
  platform.loadingStart()
  try {
    await platform.init()
  } catch (error) {
    console.warn("Platform init failed; continuing with local saves.", error)
  }

  $("companyName").value = game.state.company
  act.loadSavedGame()
  act.update()
  act.updateJobs(true)
  setNews()
  for (let sample = 0; sample < 60; sample++) sampleMarket(game.mkt, game.derived.indCps) // a minute of history so the charts aren't empty
  drawMarket()
  act.awardAchievements(true) // quietly award anything an older save already qualifies for
  renderAchievements(true)

  platform.loadingStop()
  startReportingBreaks()
  if (!isModalOpen()) platform.gameplayStart()
  if (TEST_MODE)
    addTestToolbar({
      getState: () => game.state,
      earn: (amount) => earn(game.state, game.derived, amount),
      refresh: act.update
    })

  setInterval(tick, 100)
  setInterval(save, 30000)
  setInterval(rotateNews, 12000)
}

// A handle for the end-to-end tests (source builds only)
if (BUILD === "dev") window.__clickonomics = { game, tick, save, act }

boot()
