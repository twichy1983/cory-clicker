// Every upgrade in the store: scandals, efficiency doublers and click upgrades.
import { COST_GROWTH } from "../constants.js"
import { INDUSTRIES, IND_INDEX } from "./industries.js"
import { SCANDALS, SCANDAL_THRESHOLDS } from "./scandals.js"

export const UPGRADES = []
for (const [key, list] of Object.entries(SCANDALS)) {
  const ind = IND_INDEX[key],
    base = INDUSTRIES[ind].base
  list.forEach(([name, desc], i) => {
    const req = SCANDAL_THRESHOLDS[i]
    UPGRADES.push({
      id: `s_${key}_${i}`,
      type: "scandal",
      ind,
      req,
      name,
      desc,
      cost: Math.round(base * Math.pow(COST_GROWTH, req) * 6),
      icon: INDUSTRIES[ind].icon
    })
  })
}
// Doublers for the two industries that have no scandal list
/** @type {[industry: string, required: number, name: string, desc: string][]} */
const DOUBLERS = [
  ["lemon", 1, "Tap Water Concentrate", "Lemonade is mostly water. So is tap water. The math checks out."],
  ["lemon", 10, "Lemon-Adjacent Flavoring", "Legally distinct from lemons. Chemically distinct from food."],
  ["lemon", 50, "Franchise the Sidewalk", "Every sidewalk in the county now hosts a stand you technically don't own."],
  ["offshore", 1, "Cayman Mailbox", "Your global headquarters is a numbered PO box next to a smoothie shop."],
  ["offshore", 10, "Matryoshka LLC", "A company owned by a company owned by a company owned by... you, probably."],
  ["offshore", 50, "Double Irish With a Dutch Sandwich", "Your tax structure is now officially a lunch order."]
]
DOUBLERS.forEach(([key, req, name, desc], i) => {
  const ind = IND_INDEX[key],
    base = INDUSTRIES[ind].base
  UPGRADES.push({
    id: `d_${key}_${i}`,
    type: "mult",
    ind,
    req,
    name,
    desc,
    cost: Math.round(base * Math.pow(COST_GROWTH, req) * 10),
    icon: "⭐"
  })
})
// Click upgrades
/** @type {[id: string, name: string, desc: string, cost: number, kind: string][]} */
const CLICKS = [
  ["c0", "Gold-Plated Mouse", "Every click now feels expensive. Because it was.", 100, "x2"],
  ["c1", "Repetitive Strain Waiver", "Employees sign away their wrists. Productivity doubles.", 1000, "x2"],
  ["c2", "Unpaid Intern Clickers", "Exposure is a currency. Ask any intern.", 25000, "x2"],
  ["c3", "Insider Tapping", "Each click quietly front-runs your own industries.", 500000, "pct"],
  ["c4", "Golden Parachute Index Finger", "A finger so valuable it has its own severance package.", 5e7, "pct"],
  [
    "c5",
    "Fiduciary Duty to Click",
    "The board has determined that clicking is in the shareholders' interest.",
    5e9,
    "pct"
  ],
  ["c6", "Too Big to Click", "If your mouse fails, the taxpayers will buy you a new one.", 5e11, "pct"],
  ["c7", "Click Laundering", "Clicks go offshore, come back clean, and bring friends.", 5e13, "pct"]
]
CLICKS.forEach(([id, name, desc, cost, kind]) => {
  UPGRADES.push({
    id,
    type: "click",
    kind,
    name,
    desc,
    cost,
    unlockAt: cost * 0.4,
    icon: kind === "x2" ? "🖱️" : "👆"
  })
})
export const UPG_BY_ID = Object.fromEntries(UPGRADES.map((upgrade) => [upgrade.id, upgrade]))
