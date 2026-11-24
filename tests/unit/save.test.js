import { test } from "node:test"
import assert from "node:assert/strict"
import { newState, MAX_COMPANY_NAME } from "../../src/core/state.js"
import { encodeSave, decodeSave, sanitize } from "../../src/core/save.js"

const T0 = 1_000_000_000_000
const HOUR_MS = 3600 * 1000

test("save and load gives back the same game", () => {
  const state = newState(T0)
  state.dollars = 1234.5
  state.owned[3] = 7
  state.upgrades.s_food_0 = true
  state.company = "Ünïcode Corp 💸"
  state.achievements.own_10 = T0
  state.jobs.waste = T0 + 5
  state.jobWins.lemon = 2
  const loaded = sanitize(decodeSave(encodeSave(state)), T0)
  assert.deepEqual(loaded, state)
})

test("saves made by the old single-file version still load", () => {
  const state = newState(T0)
  state.company = "Café ☕ Holdings"
  const old = btoa(unescape(encodeURIComponent(JSON.stringify(state)))) // how the old version encoded saves
  assert.equal(encodeSave(state), old)
  assert.deepEqual(sanitize(decodeSave(old), T0), state)
})

test("garbage is rejected", () => {
  assert.throws(() => decodeSave("not a save!!"))
  assert.throws(() => sanitize(null, T0))
  assert.throws(() => sanitize("hello", T0))
  assert.throws(() => sanitize({ dollars: Infinity }, T0), /Corrupt/)
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
    T0
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
  assert.equal(sanitize({ company: "x".repeat(5000) }, T0).company.length, MAX_COMPANY_NAME)
  assert.equal([...sanitize({ company: "💸".repeat(200) }, T0).company].length, MAX_COMPANY_NAME) // emoji aren't split
  assert.equal(sanitize({ company: "  Acme  " }, T0).company, "Acme")
  assert.equal(sanitize({ company: "   " }, T0).company, newState(T0).company)
})

test("bad dates and negative stats are reset", () => {
  const state = sanitize({ startedAt: Infinity, clicks: -5, bankruptcies: NaN, finesPaid: 1e400 }, T0)
  assert.equal(state.startedAt, T0)
  assert.equal(state.clicks, 0)
  assert.equal(state.bankruptcies, 0)
  assert.equal(state.finesPaid, 0)
  assert.equal(sanitize({ startedAt: T0 + HOUR_MS }, T0).startedAt, T0) // a start date in the future
  assert.equal(sanitize({ startedAt: T0 - 5 }, T0).startedAt, T0 - 5)
})

test("saves from before the jobs list keep their waste-job cooldown", () => {
  assert.equal(sanitize({ jobReadyAt: T0 + 60000 }, T0).jobs.waste, T0 + 60000)
})
