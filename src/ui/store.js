// The right-hand column: industries to acquire, the upgrade store and the rap sheet tab.
// Buttons carry data attributes (data-bld, data-id); main.js turns clicks on them into actions.
import { game } from "../game.js"
import { INDUSTRIES, TICKERS } from "../core/data/industries.js"
import { UPGRADES, UPG_BY_ID } from "../core/data/upgrades.js"
import { buildingCost, availableUpgrades, upgradeCost } from "../core/economy.js"
import { SCANDAL_MULT } from "../core/constants.js"
import { fmt, money } from "../core/format.js"
import { $, esc } from "./dom.js"

// How many of an industry each click buys (the ×1 / ×10 / ×100 switch)
export let buyAmt = 1
export function setBuyAmt(amount) {
  buyAmt = amount
}

/* ---------- industries ---------- */

const rows = []

export function buildBuildingRows() {
  const wrap = $("buildings")
  wrap.innerHTML = ""
  INDUSTRIES.forEach((ind, i) => {
    const button = document.createElement("button")
    button.className = "bld"
    button.dataset.tooltip = "bld:" + i
    button.dataset.bld = String(i)
    button.innerHTML = `<div class="bTop"><span class="ic"></span><div class="info"><div class="nm"></div><div class="sec"></div></div><span class="tkr">${TICKERS[i]}</span></div>
      <div class="bBot"><span class="own"></span><span class="rate"></span><span class="cost"></span></div>`
    wrap.appendChild(button)
    rows.push({
      element: button,
      name: button.querySelector(".nm"),
      sec: button.querySelector(".sec"),
      cost: button.querySelector(".cost"),
      own: button.querySelector(".own"),
      rate: button.querySelector(".rate"),
      icon: button.querySelector(".ic")
    })
  })
}

// Industries not yet revealed show as a single "rumored acquisition" teaser
export const isMystery = (i) => rows[i].element.classList.contains("mystery")

function renderBuildings() {
  const { state, derived } = game
  let shownRumor = false
  INDUSTRIES.forEach((ind, i) => {
    const row = rows[i]
    const revealed = state.owned[i] > 0 || i === 0 || state.runEarned >= ind.base * 0.5 || state.owned[i - 1] > 0
    if (revealed) {
      row.element.style.display = ""
      row.element.classList.remove("mystery")
      row.icon.textContent = ind.icon
      row.name.textContent = ind.name
      row.sec.textContent = ind.sector
      const price = buildingCost(state, i, buyAmt)
      row.cost.textContent = `Acquire ×${buyAmt} · ${money(price)}`
      row.own.textContent = "Owned " + fmt(state.owned[i])
      row.rate.textContent = state.owned[i] ? money(derived.indCps[i]) + "/s" : "Not yet acquired"
      row.element.classList.toggle("cant", state.dollars < price)
    } else if (!shownRumor) {
      shownRumor = true
      row.element.style.display = ""
      row.element.classList.add("mystery")
      row.element.classList.remove("cant")
      row.icon.textContent = "🔍"
      row.name.textContent = "Rumored acquisition"
      row.sec.textContent = "Due diligence underway"
      row.rate.textContent = `Revealed after earning ${money(ind.base * 0.5)} this run`
    } else row.element.style.display = "none"
  })
}

/* ---------- upgrades ---------- */

const UPG_PREVIEW = 6 // the cheapest few are shown; the rest sit behind "Show all"
let lastUpgKey = "",
  showAll = false

export function toggleShowAllUpgrades() {
  showAll = !showAll
}

function upgradeTag(upgrade) {
  if (upgrade.type === "scandal") return "Scandal · " + INDUSTRIES[upgrade.ind].name
  if (upgrade.type === "mult") return "Efficiency · " + INDUSTRIES[upgrade.ind].name
  if (upgrade.type === "global") return "Company-wide · all income ×2"
  return upgrade.kind === "x2" ? "Clicking · click power ×2" : "Clicking · +1% of income per click"
}

// Rebuilds the upgrade buttons, but only when the list of available upgrades changed
function rebuildUpgrades() {
  const avail = availableUpgrades(game.state)
  const key = avail.map((upgrade) => upgrade.id).join(",") + "|" + showAll
  if (key === lastUpgKey) return
  lastUpgKey = key
  $("upgCount").textContent = avail.length ? avail.length + " available" : ""
  const wrap = $("upgrades")
  if (!avail.length) {
    wrap.innerHTML = `<div class="empty">No upgrades available yet. Keep growing.</div>`
    return
  }
  const shown = showAll ? avail : avail.slice(0, UPG_PREVIEW)
  wrap.innerHTML = shown
    .map(
      (upgrade) =>
        `<button class="upg ${upgrade.type}" data-tooltip="upg:${upgrade.id}" data-id="${upgrade.id}">` +
        `<span class="uIc">${upgrade.icon}</span><span class="uNm">${esc(upgrade.name)}</span><span class="uCost">${money(upgradeCost(upgrade))}</span>` +
        `<span class="uTag">${esc(upgradeTag(upgrade))}</span></button>`
    )
    .join("")
  if (avail.length > UPG_PREVIEW)
    wrap.insertAdjacentHTML(
      "beforeend",
      `<button class="upgMore">${showAll ? "Show fewer" : `Show all ${avail.length} upgrades`}</button>`
    )
}

function renderUpgradeAffordability() {
  document.querySelectorAll("#upgrades .upg").forEach((/** @type {HTMLElement} */ button) => {
    button.classList.toggle("cant", game.state.dollars < upgradeCost(UPG_BY_ID[button.dataset.id]))
  })
}

/* ---------- rap sheet ---------- */

let lastRapKey = ""

// Small multipliers keep two decimals (×2.25, where fmt() would round to ×2.3)
const multiplierText = (value) => (value < 10 ? value.toFixed(2) : fmt(value))

function renderRapSheet() {
  const owned = UPGRADES.filter((upgrade) => upgrade.type === "scandal" && game.state.upgrades[upgrade.id])
  const key = owned.map((upgrade) => upgrade.id).join(",")
  const element = $("rapSheet")
  if (key === lastRapKey && element.childElementCount) return
  lastRapKey = key
  if (!owned.length) {
    element.innerHTML = `<div class="empty">Your record is spotless. For now.</div>`
    return
  }
  // Each scandal multiplies its industry's output and adds 1% to the fine multiplier (see derive()).
  const perIndustry = new Map()
  for (const upgrade of owned) perIndustry.set(upgrade.ind, (perIndustry.get(upgrade.ind) || 0) + 1)
  const totals = [...perIndustry]
    .map(
      ([ind, count]) =>
        `<div class="rapTotal"><span>${INDUSTRIES[ind].icon} ${esc(INDUSTRIES[ind].name)} <span class="muted">· ${count} scandal${count > 1 ? "s" : ""}</span></span><span class="gain">output ×${multiplierText(Math.pow(SCANDAL_MULT, count))}</span></div>`
    )
    .join("")
  element.innerHTML =
    `<div class="note first">${owned.length} scandal${owned.length > 1 ? "s" : ""} on record. Combined bonuses:</div>` +
    `<div class="rapTotals">${totals}<div class="rapTotal"><span>⚖️ Regulatory fines</span><span class="loss">+${owned.length}%</span></div></div>` +
    `<div class="note">Click a scandal to read the charges.</div>` +
    owned
      .map(
        (upgrade) =>
          `<details><summary>${upgrade.icon} ${esc(upgrade.name)}<span class="sec">${esc(INDUSTRIES[upgrade.ind].sector)}</span><span class="rapBonus gain">×${SCANDAL_MULT}</span></summary><p>${esc(upgrade.desc)}</p><p class="rapEffect">Bonus: <span class="gain">${esc(INDUSTRIES[upgrade.ind].name)} output ×${SCANDAL_MULT}</span> · <span class="loss">fines +1%</span></p></details>`
      )
      .join("")
}

export function renderStore() {
  rebuildUpgrades()
  renderUpgradeAffordability()
  renderBuildings()
  renderRapSheet()
}
