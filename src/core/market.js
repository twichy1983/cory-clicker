// Stock market numbers. Each listed industry's share price = its income per second x investor mood.
// Mood is a mean-reverting random walk (65%-135%); scandals knock it down 15%.
// History lives in memory only (one sample per second, last 3 minutes) and is never saved.
import { INDUSTRIES } from "./data/industries.js"

export const MKT_LEN = 180

export function createMarket() {
  return {
    idx: [],
    ind: INDUSTRIES.map(() => []),
    mood: INDUSTRIES.map(() => 1),
    hover: -1
  }
}

function pushCap(arr, v) {
  arr.push(v)
  if (arr.length > MKT_LEN) arr.shift()
}

// Adds one sample for every industry and the composite index
export function sampleMarket(mkt, indCps, random = Math.random) {
  let total = 0
  INDUSTRIES.forEach((_, i) => {
    let m = mkt.mood[i]
    m += (1 - m) * 0.06 + (random() - 0.5) * 0.05
    m = Math.min(1.35, Math.max(0.65, m))
    mkt.mood[i] = m
    const v = (indCps[i] || 0) * m
    pushCap(mkt.ind[i], v)
    total += v
  })
  pushCap(mkt.idx, total)
}

// Fresh history (new game, import, bankruptcy) seeded with a minute of samples so charts aren't empty
export function resetMarket(mkt, indCps, random = Math.random) {
  mkt.idx.length = 0
  mkt.ind.forEach((h) => {
    h.length = 0
  })
  mkt.mood.fill(1)
  for (let k = 0; k < 60; k++) sampleMarket(mkt, indCps, random)
}

// Bad press from a scandal spooks investors for a while
export function scandalShock(mkt, ind) {
  mkt.mood[ind] *= 0.85
}

// % change from the first non-zero sample to the latest, or null if there isn't one
export function pctChange(h) {
  const first = h.find((v) => v > 0),
    last = h[h.length - 1]
  if (!first || !last) return null
  return (last / first - 1) * 100
}
