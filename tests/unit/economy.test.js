import { test, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { HOUR, BASE_TIMER } from "../../src/core/constants.js"
import { newState } from "../../src/core/state.js"
import { rules } from "../../src/core/rules.js"
import * as E from "../../src/core/economy.js"

const T0 = 1_000_000_000_000 // a fixed "now" so tests never depend on the real clock

beforeEach(() => {
  rules.freePurchases = false
  rules.jobCooldown = 0
})

test("a new game: $0, $1 clicks, 24-hour deadline", () => {
  const S = newState(T0),
    D = E.derive(S)
  assert.equal(S.dollars, 0)
  assert.equal(D.clickPower, 1)
  assert.equal(D.cps, 0)
  assert.equal(S.deadline, T0 + BASE_TIMER)
})

test("clicking earns money and accrues 10% fines", () => {
  const S = newState(T0),
    D = E.derive(S)
  for (let i = 0; i < 10; i++) E.clickDollar(S, D)
  assert.equal(S.dollars, 10)
  assert.equal(S.clicks, 10)
  assert.ok(Math.abs(S.fines - 1) < 1e-9)
})

test("industry prices grow 14% each and bulk prices add up", () => {
  const S = newState(T0)
  assert.equal(E.buildingCost(S, 0, 1), 12)
  S.owned[0] = 1
  assert.equal(E.buildingCost(S, 0, 1), Math.ceil(12 * 1.14))
  S.owned[0] = 0
  const ten = E.buildingCost(S, 0, 10)
  let sum = 0
  for (let k = 0; k < 10; k++) sum += 12 * Math.pow(1.14, k)
  assert.equal(ten, Math.ceil(sum))
})

test("buying an industry needs enough cash", () => {
  const S = newState(T0)
  assert.equal(E.buyBuilding(S, 0, 1), false)
  S.dollars = 12
  assert.equal(E.buyBuilding(S, 0, 1), true)
  assert.equal(S.owned[0], 1)
  assert.equal(S.dollars, 0)
  assert.equal(E.derive(S).cps, 0.15)
})

test("scandals add 10% income and 1% fines; doublers double", () => {
  const S = newState(T0)
  S.owned[1] = 10
  S.upgrades.s_food_0 = true
  let D = E.derive(S)
  assert.ok(Math.abs(D.indCps[1] - 10 * 1.2 * 1.1) < 1e-9)
  assert.ok(Math.abs(D.fineMult - 1.01) < 1e-9)
  S.owned[0] = 1
  S.upgrades.d_lemon_0 = true
  D = E.derive(S)
  assert.ok(Math.abs(D.indCps[0] - 0.3) < 1e-9)
})

test("locked upgrades can't be bought", () => {
  const S = newState(T0)
  S.dollars = 1e12
  assert.equal(E.buyUpgrade(S, "s_food_0"), false) // needs 1 Ingredient Supplier
  S.owned[1] = 1
  assert.equal(E.buyUpgrade(S, "s_food_0"), true)
  assert.equal(E.buyUpgrade(S, "s_food_0"), false) // already owned
})

test("offline income is earned up to now", () => {
  const S = newState(T0)
  S.owned[0] = 100 // 15/s
  const D = E.derive(S)
  const events = E.advance(S, D, T0 + 10_000)
  assert.deepEqual(events, [])
  assert.ok(Math.abs(S.dollars - 150) < 1e-6)
  assert.equal(S.lastTick, T0 + 10_000)
})

test("unpaid fines at the deadline cause bankruptcy, keeping lifetime stats", () => {
  const S = newState(T0)
  S.owned[0] = 5
  S.dollars = 500
  S.fines = 50
  S.clicks = 42
  S.timerLobbyists = 2
  S.achievements.ind_lemon = T0
  const D = E.derive(S)
  const events = E.advance(S, D, S.deadline + 1000)
  assert.equal(events.length, 1)
  assert.equal(events[0].type, "bankrupt")
  assert.equal(events[0].owed > 50, true) // plus fines on the income earned before the deadline
  assert.equal(S.dollars, 0)
  assert.deepEqual(S.owned, new Array(10).fill(0))
  assert.equal(S.timerLobbyists, 0)
  assert.equal(S.bankruptcies, 1)
  assert.equal(S.clicks, 42)
  assert.equal(S.achievements.ind_lemon, T0)
})

test("a clean ledger survives the deadline and the clock restarts", () => {
  const S = newState(T0)
  const D = E.derive(S)
  const deadline = S.deadline
  const events = E.advance(S, D, deadline + 1000)
  assert.deepEqual(events, [{ type: "survived", rebate: 0 }])
  assert.equal(S.deadline, deadline + BASE_TIMER)
  assert.equal(S.cyclesSurvived, 1)
})

test("a negative fine multiplier pays a rebate at the deadline", () => {
  const S = newState(T0)
  S.penaltyLobbyists = 150 // multiplier -49%
  S.owned[0] = 100
  const D = E.derive(S)
  assert.ok(D.fineMult < 0)
  const events = E.advance(S, D, S.deadline + 1)
  assert.equal(events[0].type, "survived")
  assert.ok(events[0].rebate > 0)
  assert.ok(S.rebatesCollected > 0)
})

test("several days away with a rebate survives several deadlines", () => {
  const S = newState(T0)
  S.penaltyLobbyists = 150
  const D = E.derive(S)
  const events = E.advance(S, D, T0 + 3 * BASE_TIMER + 1)
  assert.equal(events.length, 3)
  assert.equal(S.cyclesSurvived, 3)
})

test("paying fines early restarts the clock", () => {
  const S = newState(T0)
  S.dollars = 100
  S.fines = 30
  const D = E.derive(S)
  const now = T0 + 2 * HOUR
  assert.deepEqual(E.payFines(S, D, now), { type: "paid", amount: 30 })
  assert.equal(S.dollars, 70)
  assert.equal(S.fines, 0)
  assert.equal(S.finesPaid, 30)
  assert.equal(S.deadline, now + BASE_TIMER)
})

test("can't pay fines you can't afford", () => {
  const S = newState(T0)
  S.dollars = 10
  S.fines = 30
  assert.equal(E.payFines(S, E.derive(S), T0), null)
  assert.equal(S.fines, 30)
})

test("bug fix: clicking 'file compliance report' repeatedly doesn't count as surviving deadlines", () => {
  const S = newState(T0)
  const D = E.derive(S)
  for (let i = 0; i < 10; i++) E.payFines(S, D, T0 + i * 1000)
  assert.equal(S.cyclesSurvived, 0)
  // Settling after the clock has run for an hour or more does count
  E.payFines(S, D, T0 + 10_000 + HOUR)
  assert.equal(S.cyclesSurvived, 1)
})

test("bug fix: paying fines just after the deadline reports the bankruptcy instead of hiding it", () => {
  const S = newState(T0)
  S.dollars = 100
  S.fines = 30
  const res = E.payFines(S, E.derive(S), S.deadline + 50)
  assert.equal(res.type, "deadline")
  assert.equal(res.events.length, 1)
  assert.equal(res.events[0].type, "bankrupt")
  assert.equal(res.events[0].owed, 30)
  assert.equal(S.bankruptcies, 1)
  assert.equal(S.finesPaid, 0)
})

test("filing a report just after a clean deadline reports the survived deadline once", () => {
  const S = newState(T0)
  const deadline = S.deadline
  const res = E.payFines(S, E.derive(S), deadline + 50)
  assert.equal(res.type, "deadline")
  assert.deepEqual(res.events, [{ type: "survived", rebate: 0 }])
  assert.equal(S.cyclesSurvived, 1)
  assert.equal(S.deadline, deadline + BASE_TIMER)
})

test("timer lobbyists add an hour to the window and the countdown", () => {
  const S = newState(T0)
  S.dollars = 50000
  const deadline = S.deadline
  assert.equal(E.hireTimerLobbyist(S), true)
  assert.equal(S.deadline, deadline + HOUR)
  assert.equal(E.maxTimer(S), BASE_TIMER + HOUR)
  assert.equal(E.timerLobbyCost(S), Math.ceil(50000 * 1.6))
})

test("firing costs double the last hire and removes an hour", () => {
  const S = newState(T0)
  S.timerLobbyists = 2
  S.dollars = 1e9
  const deadline = S.deadline
  assert.equal(E.timerFireCost(S), 2 * Math.ceil(50000 * 1.6))
  E.fireTimerLobbyist(S, T0)
  assert.equal(S.timerLobbyists, 1)
  assert.equal(S.deadline, deadline - HOUR)
})

test("bug fix: firing a timer lobbyist never adds time", () => {
  const S = newState(T0)
  S.timerLobbyists = 1
  S.dollars = 1e9
  S.deadline = T0 + 10_000 // 10 seconds left
  E.fireTimerLobbyist(S, T0)
  assert.equal(S.deadline, T0 + 10_000)
})

test("firing nobody does nothing", () => {
  const S = newState(T0)
  S.dollars = 1e9
  assert.equal(E.fireTimerLobbyist(S, T0), false)
  assert.equal(E.firePenaltyLobbyist(S), false)
})

test("penalty lobbyists lower the fine multiplier, below zero if you keep going", () => {
  const S = newState(T0)
  S.dollars = 1e9
  E.hirePenaltyLobbyist(S)
  assert.ok(Math.abs(E.derive(S).fineMult - 0.99) < 1e-9)
})

test("voluntary bankruptcy wipes the run", () => {
  const S = newState(T0)
  S.dollars = 99
  S.owned[2] = 3
  S.fines = 10
  const ev = E.goBankrupt(S, T0 + 5, true)
  assert.deepEqual(ev, {
    type: "bankrupt",
    owed: 10,
    lost: 99,
    voluntary: true
  })
  assert.equal(S.dollars, 0)
  assert.equal(S.fines, 0)
  assert.equal(S.deadline, T0 + 5 + BASE_TIMER)
})

test("test mode: everything is free and click upgrades unlock at once", () => {
  rules.freePurchases = true
  const S = newState(T0)
  assert.equal(E.buildingCost(S, 9, 100), 0)
  assert.equal(E.timerLobbyCost(S), 0)
  assert.ok(E.availableUpgrades(S).some((u) => u.id === "c7"))
  assert.equal(E.buyUpgrade(S, "c7"), true)
})
