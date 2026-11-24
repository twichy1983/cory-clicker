import { test } from "node:test"
import assert from "node:assert/strict"
import { newState } from "../../src/core/state.js"
import { derive, goBankrupt } from "../../src/core/economy.js"
import { createMarket, sampleMarket, resetMarket } from "../../src/core/market.js"
import { ACH, ACH_BY_ID, checkAchievements } from "../../src/core/achievements.js"

const START_TIME = 1_000_000_000_000
const ctxFor = (state) => ({
  state,
  derived: derive(state),
  mkt: createMarket(),
  peakClickRate: 0
})

test("there are 65 achievements with unique ids", () => {
  assert.equal(ACH.length, 65)
  assert.equal(Object.keys(ACH_BY_ID).length, 65)
})

test("a fresh game unlocks nothing", () => {
  assert.deepEqual(checkAchievements(ctxFor(newState(START_TIME)), START_TIME), [])
})

test("unlocks are stored with their time and only reported once", () => {
  const state = newState(START_TIME)
  state.owned[0] = 1
  const fresh = checkAchievements(ctxFor(state), START_TIME + 1).map((achievement) => achievement.id)
  assert.deepEqual(fresh, ["ind_lemon"])
  assert.equal(state.achievements.ind_lemon, START_TIME + 1)
  assert.deepEqual(checkAchievements(ctxFor(state), START_TIME + 2), [])
})

test("click speed and income thresholds", () => {
  const state = newState(START_TIME)
  state.owned[9] = 1 // 3.2 million per second
  const ctx = ctxFor(state)
  ctx.peakClickRate = 10
  const ids = checkAchievements(ctx, START_TIME).map((achievement) => achievement.id)
  for (const id of ["cspeed_5", "cspeed_10", "cps_10", "cps_1000", "cps_1000000"]) assert.ok(ids.includes(id), id)
  assert.ok(!ids.includes("cspeed_15"))
  assert.ok(!ids.includes("cps_1000000000"))
})

test("bug fix: going bankrupt doesn't unlock Black Monday", () => {
  const state = newState(START_TIME)
  state.owned[0] = 50
  const mkt = createMarket()
  for (let i = 0; i < 30; i++) sampleMarket(mkt, derive(state).indCps, () => 0.5)
  goBankrupt(state, START_TIME, true)
  const derived = derive(state)
  for (let i = 0; i < 30; i++) sampleMarket(mkt, derived.indCps, () => 0.5) // index falls to $0
  const ids = checkAchievements({ state, derived, mkt, peakClickRate: 0 }, START_TIME).map(
    (achievement) => achievement.id
  )
  assert.ok(!ids.includes("mkt_crash"))
})

test("a real 90% crash while owning industries does unlock Black Monday", () => {
  const state = newState(START_TIME)
  state.owned[0] = 100
  const mkt = createMarket()
  resetMarket(mkt, derive(state).indCps, () => 0.5)
  mkt.idx.push(mkt.idx[0] * 0.05)
  assert.ok(
    checkAchievements({ state, derived: derive(state), mkt, peakClickRate: 0 }, START_TIME).some(
      (achievement) => achievement.id === "mkt_crash"
    )
  )
})
