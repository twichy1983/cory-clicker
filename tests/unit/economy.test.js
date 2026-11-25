import { test, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { HOUR, BASE_TIMER } from "../../src/core/constants.js"
import { newState } from "../../src/core/state.js"
import { rules } from "../../src/core/rules.js"
import * as economy from "../../src/core/economy.js"
import { UPGRADES } from "../../src/core/data/upgrades.js"

const START_TIME = 1_000_000_000_000 // a fixed "now" so tests never depend on the real clock

beforeEach(() => {
  rules.freePurchases = false
  rules.jobCooldown = 0
})

test("a new game: $0, $1 clicks, 24-hour deadline", () => {
  const state = newState(START_TIME),
    derived = economy.derive(state)
  assert.equal(state.dollars, 0)
  assert.equal(derived.clickPower, 1)
  assert.equal(derived.cps, 0)
  assert.equal(state.deadline, START_TIME + BASE_TIMER)
})

test("clicking earns money and accrues 10% fines", () => {
  const state = newState(START_TIME),
    derived = economy.derive(state)
  for (let i = 0; i < 10; i++) economy.clickDollar(state, derived)
  assert.equal(state.dollars, 10)
  assert.equal(state.clicks, 10)
  assert.ok(Math.abs(state.fines - 1) < 1e-9)
})

test("industry prices grow 14% each and bulk prices add up", () => {
  const state = newState(START_TIME)
  assert.equal(economy.buildingCost(state, 0, 1), 12)
  state.owned[0] = 1
  assert.equal(economy.buildingCost(state, 0, 1), Math.ceil(12 * 1.14))
  state.owned[0] = 0
  const ten = economy.buildingCost(state, 0, 10)
  let sum = 0
  for (let step = 0; step < 10; step++) sum += 12 * Math.pow(1.14, step)
  assert.equal(ten, Math.ceil(sum))
})

test("buying an industry needs enough cash", () => {
  const state = newState(START_TIME)
  assert.equal(economy.buyBuilding(state, 0, 1), false)
  state.dollars = 12
  assert.equal(economy.buyBuilding(state, 0, 1), true)
  assert.equal(state.owned[0], 1)
  assert.equal(state.dollars, 0)
  assert.equal(economy.derive(state).cps, 0.15)
})

test("scandals multiply income by 1.5 each and add 1% fines; doublers double", () => {
  const state = newState(START_TIME)
  state.owned[1] = 10
  state.upgrades.s_food_0 = true
  let derived = economy.derive(state)
  assert.ok(Math.abs(derived.indCps[1] - 10 * 1.2 * 1.5) < 1e-9)
  assert.ok(Math.abs(derived.fineMult - 1.01) < 1e-9)
  state.upgrades.s_food_1 = true
  derived = economy.derive(state)
  assert.ok(Math.abs(derived.indCps[1] - 10 * 1.2 * 1.5 * 1.5) < 1e-9) // they stack multiplicatively
  assert.ok(Math.abs(derived.fineMult - 1.02) < 1e-9)
  state.owned[0] = 1
  state.upgrades.d_lemon_0 = true
  derived = economy.derive(state)
  assert.ok(Math.abs(derived.indCps[0] - 0.3) < 1e-9)
})

test("company-wide upgrades double all income and achievements add 1% each", () => {
  const state = newState(START_TIME)
  state.owned[0] = 10
  state.owned[1] = 10
  const before = economy.derive(state).cps
  state.upgrades.g0 = true
  assert.ok(Math.abs(economy.derive(state).cps - before * 2) < 1e-9)
  state.achievements = { ind_lemon: 1, own_10: 1, clicks_100: 1 }
  const derived = economy.derive(state)
  assert.ok(Math.abs(derived.achievementMult - 1.03) < 1e-9)
  assert.ok(Math.abs(derived.allMult - 2 * 1.03) < 1e-9)
  assert.ok(Math.abs(derived.cps - before * 2 * 1.03) < 1e-9)
})

test("company-wide upgrades unlock from this run's earnings", () => {
  const state = newState(START_TIME)
  state.dollars = 1e9
  assert.equal(economy.buyUpgrade(state, "g0"), false) // needs $40 million earned this run
  state.runEarned = 4e7
  assert.equal(economy.buyUpgrade(state, "g0"), true)
})

test("an early scandal now beats buying more of that industry once you own a few", () => {
  // At 25 owned the 25-threshold scandal adds half the industry's output for 6× one building's price,
  // which pays back faster than one more building does.
  const state = newState(START_TIME)
  state.owned[5] = 25
  const derived = economy.derive(state)
  const scandal = UPGRADES.find((upgrade) => upgrade.id === "s_pharma_3")
  const scandalGain = derived.indCps[5] * 0.5
  const buildingGain = derived.indCps[5] / 25
  assert.ok(scandalGain / scandal.cost > buildingGain / economy.buildingCost(state, 5, 1))
})

test("locked upgrades can't be bought", () => {
  const state = newState(START_TIME)
  state.dollars = 1e12
  assert.equal(economy.buyUpgrade(state, "s_food_0"), false) // needs 1 Ingredient Supplier
  state.owned[1] = 1
  assert.equal(economy.buyUpgrade(state, "s_food_0"), true)
  assert.equal(economy.buyUpgrade(state, "s_food_0"), false) // already owned
})

test("offline income is earned up to now", () => {
  const state = newState(START_TIME)
  state.owned[0] = 100 // 15/s
  const derived = economy.derive(state)
  const events = economy.advance(state, derived, START_TIME + 10_000)
  assert.deepEqual(events, [])
  assert.ok(Math.abs(state.dollars - 150) < 1e-6)
  assert.equal(state.lastTick, START_TIME + 10_000)
})

test("unpaid fines at the deadline cause bankruptcy, keeping lifetime stats", () => {
  const state = newState(START_TIME)
  state.owned[0] = 5
  state.dollars = 500
  state.fines = 50
  state.clicks = 42
  state.timerLobbyists = 2
  state.achievements.ind_lemon = START_TIME
  const derived = economy.derive(state)
  const events = economy.advance(state, derived, state.deadline + 1000)
  assert.equal(events.length, 1)
  assert.equal(events[0].type, "bankrupt")
  assert.equal(events[0].owed > 50, true) // plus fines on the income earned before the deadline
  assert.equal(state.dollars, 0)
  assert.deepEqual(state.owned, new Array(10).fill(0))
  assert.equal(state.timerLobbyists, 0)
  assert.equal(state.bankruptcies, 1)
  assert.equal(state.clicks, 42)
  assert.equal(state.achievements.ind_lemon, START_TIME)
})

test("a clean ledger survives the deadline and the clock restarts", () => {
  const state = newState(START_TIME)
  const derived = economy.derive(state)
  const deadline = state.deadline
  const events = economy.advance(state, derived, deadline + 1000)
  assert.deepEqual(events, [{ type: "survived", rebate: 0 }])
  assert.equal(state.deadline, deadline + BASE_TIMER)
  assert.equal(state.cyclesSurvived, 1)
})

test("a negative fine multiplier pays a rebate at the deadline", () => {
  const state = newState(START_TIME)
  state.penaltyLobbyists = 150 // multiplier -49%
  state.owned[0] = 100
  const derived = economy.derive(state)
  assert.ok(derived.fineMult < 0)
  const events = economy.advance(state, derived, state.deadline + 1)
  assert.equal(events[0].type, "survived")
  assert.ok(events[0].rebate > 0)
  assert.ok(state.rebatesCollected > 0)
})

test("several days away with a rebate survives several deadlines", () => {
  const state = newState(START_TIME)
  state.penaltyLobbyists = 150
  const derived = economy.derive(state)
  const events = economy.advance(state, derived, START_TIME + 3 * BASE_TIMER + 1)
  assert.equal(events.length, 3)
  assert.equal(state.cyclesSurvived, 3)
})

test("paying fines early restarts the clock", () => {
  const state = newState(START_TIME)
  state.dollars = 100
  state.fines = 30
  const derived = economy.derive(state)
  const now = START_TIME + 2 * HOUR
  assert.deepEqual(economy.payFines(state, derived, now), { type: "paid", amount: 30 })
  assert.equal(state.dollars, 70)
  assert.equal(state.fines, 0)
  assert.equal(state.finesPaid, 30)
  assert.equal(state.deadline, now + BASE_TIMER)
})

test("can't pay fines you can't afford", () => {
  const state = newState(START_TIME)
  state.dollars = 10
  state.fines = 30
  assert.equal(economy.payFines(state, economy.derive(state), START_TIME), null)
  assert.equal(state.fines, 30)
})

test("bug fix: clicking 'file compliance report' repeatedly doesn't count as surviving deadlines", () => {
  const state = newState(START_TIME)
  const derived = economy.derive(state)
  for (let i = 0; i < 10; i++) economy.payFines(state, derived, START_TIME + i * 1000)
  assert.equal(state.cyclesSurvived, 0)
  // Settling after the clock has run for an hour or more does count
  economy.payFines(state, derived, START_TIME + 10_000 + HOUR)
  assert.equal(state.cyclesSurvived, 1)
})

test("bug fix: paying fines just after the deadline reports the bankruptcy instead of hiding it", () => {
  const state = newState(START_TIME)
  state.dollars = 100
  state.fines = 30
  const res = economy.payFines(state, economy.derive(state), state.deadline + 50)
  assert.equal(res.type, "deadline")
  assert.equal(res.events.length, 1)
  assert.equal(res.events[0].type, "bankrupt")
  assert.equal(res.events[0].owed, 30)
  assert.equal(state.bankruptcies, 1)
  assert.equal(state.finesPaid, 0)
})

test("filing a report just after a clean deadline reports the survived deadline once", () => {
  const state = newState(START_TIME)
  const deadline = state.deadline
  const res = economy.payFines(state, economy.derive(state), deadline + 50)
  assert.equal(res.type, "deadline")
  assert.deepEqual(res.events, [{ type: "survived", rebate: 0 }])
  assert.equal(state.cyclesSurvived, 1)
  assert.equal(state.deadline, deadline + BASE_TIMER)
})

test("timer lobbyists add an hour to the window and the countdown", () => {
  const state = newState(START_TIME)
  state.dollars = 50000
  const deadline = state.deadline
  assert.equal(economy.hireTimerLobbyist(state), true)
  assert.equal(state.deadline, deadline + HOUR)
  assert.equal(economy.maxTimer(state), BASE_TIMER + HOUR)
  assert.equal(economy.timerLobbyCost(state), Math.ceil(50000 * 1.6))
})

test("firing costs double the last hire and removes an hour", () => {
  const state = newState(START_TIME)
  state.timerLobbyists = 2
  state.dollars = 1e9
  const deadline = state.deadline
  assert.equal(economy.timerFireCost(state), 2 * Math.ceil(50000 * 1.6))
  economy.fireTimerLobbyist(state, START_TIME)
  assert.equal(state.timerLobbyists, 1)
  assert.equal(state.deadline, deadline - HOUR)
})

test("bug fix: firing a timer lobbyist never adds time", () => {
  const state = newState(START_TIME)
  state.timerLobbyists = 1
  state.dollars = 1e9
  state.deadline = START_TIME + 10_000 // 10 seconds left
  economy.fireTimerLobbyist(state, START_TIME)
  assert.equal(state.deadline, START_TIME + 10_000)
})

test("firing nobody does nothing", () => {
  const state = newState(START_TIME)
  state.dollars = 1e9
  assert.equal(economy.fireTimerLobbyist(state, START_TIME), false)
  assert.equal(economy.firePenaltyLobbyist(state), false)
})

test("penalty lobbyists lower the fine multiplier, below zero if you keep going", () => {
  const state = newState(START_TIME)
  state.dollars = 1e9
  economy.hirePenaltyLobbyist(state)
  assert.ok(Math.abs(economy.derive(state).fineMult - 0.99) < 1e-9)
})

test("voluntary bankruptcy wipes the run", () => {
  const state = newState(START_TIME)
  state.dollars = 99
  state.owned[2] = 3
  state.fines = 10
  const event = economy.goBankrupt(state, START_TIME + 5, true)
  assert.deepEqual(event, {
    type: "bankrupt",
    owed: 10,
    lost: 99,
    voluntary: true
  })
  assert.equal(state.dollars, 0)
  assert.equal(state.fines, 0)
  assert.equal(state.deadline, START_TIME + 5 + BASE_TIMER)
})

test("test mode: everything is free and click upgrades unlock at once", () => {
  rules.freePurchases = true
  const state = newState(START_TIME)
  assert.equal(economy.buildingCost(state, 9, 100), 0)
  assert.equal(economy.timerLobbyCost(state), 0)
  assert.ok(economy.availableUpgrades(state).some((upgrade) => upgrade.id === "c7"))
  assert.equal(economy.buyUpgrade(state, "c7"), true)
})
