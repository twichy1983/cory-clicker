// The right-hand column: industries to acquire, the upgrade store and the rap sheet tab.
// Buttons carry data attributes (data-bld, data-id); main.js turns clicks on them into actions.
import { game } from "../game.js"
import { INDUSTRIES, TICKERS } from "../core/data/industries.js"
import { UPGRADES, UPG_BY_ID } from "../core/data/upgrades.js"
import { buildingCost, availableUpgrades, upgradeCost } from "../core/economy.js"
import { fmt, money } from "../core/format.js"
import { $, esc } from "./dom.js"

// How many of an industry each click buys (the ×1 / ×10 / ×100 switch)
export let buyAmt = 1
export function setBuyAmt(n) {
  buyAmt = n
}

/* ---------- industries ---------- */

const rows = []

export function buildBuildingRows() {
  const wrap = $("buildings")
  wrap.innerHTML = ""
  INDUSTRIES.forEach((ind, i) => {
    const b = document.createElement("button")
    b.className = "bld"
    b.dataset.tt = "bld:" + i
    b.dataset.bld = i
    b.innerHTML = `<div class="bTop"><span class="ic"></span><div class="info"><div class="nm"></div><div class="sec"></div></div><span class="tkr">${TICKERS[i]}</span></div>
      <div class="bBot"><span class="own"></span><span class="rate"></span><span class="cost"></span></div>`
    wrap.appendChild(b)
    rows.push({
      el: b,
      nm: b.querySelector(".nm"),
      sec: b.querySelector(".sec"),
      cost: b.querySelector(".cost"),
      own: b.querySelector(".own"),
      rate: b.querySelector(".rate"),
      ic: b.querySelector(".ic")
    })
  })
}

// Industries not yet revealed show as a single "rumored acquisition" teaser
export const isMystery = (i) => rows[i].el.classList.contains("mystery")

function renderBuildings() {
  const { S, D } = game
  let shownRumor = false
  INDUSTRIES.forEach((ind, i) => {
    const e = rows[i]
    const revealed = S.owned[i] > 0 || i === 0 || S.runEarned >= ind.base * 0.5 || S.owned[i - 1] > 0
    if (revealed) {
      e.el.style.display = ""
      e.el.classList.remove("mystery")
      e.ic.textContent = ind.icon
      e.nm.textContent = ind.name
      e.sec.textContent = ind.sector
      const c = buildingCost(S, i, buyAmt)
      e.cost.textContent = `Acquire ×${buyAmt} · ${money(c)}`
      e.own.textContent = "Owned " + fmt(S.owned[i])
      e.rate.textContent = S.owned[i] ? money(D.indCps[i]) + "/s" : "Not yet acquired"
      e.el.classList.toggle("cant", S.dollars < c)
    } else if (!shownRumor) {
      shownRumor = true
      e.el.style.display = ""
      e.el.classList.add("mystery")
      e.el.classList.remove("cant")
      e.ic.textContent = "🔍"
      e.nm.textContent = "Rumored acquisition"
      e.sec.textContent = "Due diligence underway"
      e.rate.textContent = `Revealed after earning ${money(ind.base * 0.5)} this run`
    } else e.el.style.display = "none"
  })
}

/* ---------- upgrades ---------- */

const UPG_PREVIEW = 6 // the cheapest few are shown; the rest sit behind "Show all"
let lastUpgKey = "",
  showAll = false

export function toggleShowAllUpgrades() {
  showAll = !showAll
}

function upgradeTag(u) {
  if (u.type === "scandal") return "Scandal · " + INDUSTRIES[u.ind].name
  if (u.type === "mult") return "Efficiency · " + INDUSTRIES[u.ind].name
  return u.kind === "x2" ? "Clicking · click power ×2" : "Clicking · +1% of income per click"
}

// Rebuilds the upgrade buttons, but only when the list of available upgrades changed
function rebuildUpgrades() {
  const avail = availableUpgrades(game.S)
  const key = avail.map((u) => u.id).join(",") + "|" + showAll
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
      (u) =>
        `<button class="upg ${u.type}" data-tt="upg:${u.id}" data-id="${u.id}">` +
        `<span class="uIc">${u.icon}</span><span class="uNm">${esc(u.name)}</span><span class="uCost">${money(upgradeCost(u))}</span>` +
        `<span class="uTag">${esc(upgradeTag(u))}</span></button>`
    )
    .join("")
  if (avail.length > UPG_PREVIEW)
    wrap.insertAdjacentHTML(
      "beforeend",
      `<button class="upgMore">${showAll ? "Show fewer" : `Show all ${avail.length} upgrades`}</button>`
    )
}

function renderUpgradeAffordability() {
  document.querySelectorAll("#upgrades .upg").forEach((b) => {
    b.classList.toggle("cant", game.S.dollars < upgradeCost(UPG_BY_ID[b.dataset.id]))
  })
}

/* ---------- rap sheet ---------- */

let lastRapKey = ""

function renderRapSheet() {
  const owned = UPGRADES.filter((u) => u.type === "scandal" && game.S.upgrades[u.id])
  const key = owned.map((u) => u.id).join(",")
  const el = $("rapSheet")
  if (key === lastRapKey && el.childElementCount) return
  lastRapKey = key
  if (!owned.length) {
    el.innerHTML = `<div class="empty">Your record is spotless. For now.</div>`
    return
  }
  el.innerHTML =
    `<div class="note" style="margin-top:0">${owned.length} scandal${owned.length > 1 ? "s" : ""} on record. Click one to read the charges.</div>` +
    owned
      .map(
        (u) =>
          `<details><summary>${u.icon} ${esc(u.name)}<span class="sec">${esc(INDUSTRIES[u.ind].sector)}</span></summary><p>${esc(u.desc)}</p></details>`
      )
      .join("")
}

export function renderStore() {
  rebuildUpgrades()
  renderUpgradeAffordability()
  renderBuildings()
  renderRapSheet()
}
