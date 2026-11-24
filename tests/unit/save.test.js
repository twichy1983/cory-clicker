import { test } from "node:test"
import assert from "node:assert/strict"
import { newState, MAX_COMPANY_NAME } from "../../src/core/state.js"
import { encodeSave, decodeSave, sanitize } from "../../src/core/save.js"

const START_TIME = 1_000_000_000_000
const HOUR_MS = 3600 * 1000

test("save and load gives back the same game", () => {
  const state = newState(START_TIME)
  state.dollars = 1234.5
  state.owned[3] = 7
  state.upgrades.s_food_0 = true
  state.company = "Ünïcode Corp 💸"
  state.achievements.own_10 = START_TIME
  state.jobs.waste = START_TIME + 5
  state.jobWins.lemon = 2
  const loaded = sanitize(decodeSave(encodeSave(state)), START_TIME)
  assert.deepEqual(loaded, state)
})

test("saves made by the old single-file version still load", () => {
  const state = newState(START_TIME)
  state.company = "Café ☕ Holdings"
  const old = btoa(unescape(encodeURIComponent(JSON.stringify(state)))) // how the old version encoded saves
  assert.equal(encodeSave(state), old)
  assert.deepEqual(sanitize(decodeSave(old), START_TIME), state)
})

test("garbage is rejected", () => {
  assert.throws(() => decodeSave("not a save!!"))
  assert.throws(() => sanitize(null, START_TIME))
  assert.throws(() => sanitize("hello", START_TIME))
  assert.throws(() => sanitize({ dollars: Infinity }, START_TIME), /Corrupt/)
})

test("unknown and badly typed fields are dropped", () => {
  const state = sanitize(
    {
      dollars: "lots",
      owned: [5, -3, "x", 2.7],
      upgrades: { s_food_0: true, made_up: true },
      achievements: { own_10: 123, nope: 1 },
      jobs: { waste: 99, fake: 1 },
      timerLobbyists: -4,
      hacked: true
    },
    START_TIME
  )
  assert.equal(state.dollars, 0)
  assert.deepEqual(state.owned.slice(0, 4), [5, 0, 0, 2])
  assert.deepEqual(state.upgrades, { s_food_0: true })
  assert.deepEqual(state.achievements, { own_10: 123 })
  assert.deepEqual(state.jobs, { waste: 99 })
  assert.equal(state.timerLobbyists, 0)
  assert.equal("hacked" in state, false)
})

test("company names are trimmed and capped at 128 characters", () => {
  assert.equal(sanitize({ company: "x".repeat(5000) }, START_TIME).company.length, MAX_COMPANY_NAME)
  assert.equal([...sanitize({ company: "💸".repeat(200) }, START_TIME).company].length, MAX_COMPANY_NAME) // emoji aren't split
  assert.equal(sanitize({ company: "  Acme  " }, START_TIME).company, "Acme")
  assert.equal(sanitize({ company: "   " }, START_TIME).company, newState(START_TIME).company)
})

test("bad dates and negative stats are reset", () => {
  const state = sanitize({ startedAt: Infinity, clicks: -5, bankruptcies: NaN, finesPaid: 1e400 }, START_TIME)
  assert.equal(state.startedAt, START_TIME)
  assert.equal(state.clicks, 0)
  assert.equal(state.bankruptcies, 0)
  assert.equal(state.finesPaid, 0)
  assert.equal(sanitize({ startedAt: START_TIME + HOUR_MS }, START_TIME).startedAt, START_TIME) // a start date in the future
  assert.equal(sanitize({ startedAt: START_TIME - 5 }, START_TIME).startedAt, START_TIME - 5)
})

test("saves from before the jobs list keep their waste-job cooldown", () => {
  assert.equal(sanitize({ jobReadyAt: START_TIME + 60000 }, START_TIME).jobs.waste, START_TIME + 60000)
})
