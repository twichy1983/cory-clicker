import { test } from "node:test"
import assert from "node:assert/strict"
import { newState } from "../../src/core/state.js"
import { derive } from "../../src/core/economy.js"
import { rules } from "../../src/core/rules.js"
import { createMarket, sampleMarket, pctChange, MKT_LEN, scandalShock } from "../../src/core/market.js"
import { JOB_BY_ID, jobCooldown, jobPay, jobTimeLeft, startJobCooldown } from "../../src/core/jobs.js"
import { recordJobWin, totalJobWins, winJob, jobChanges } from "../../src/core/jobs.js"
import { newsLine } from "../../src/core/news.js"

const START_TIME = 1_000_000_000_000

test("market: price tracks income times mood, history is capped at 3 minutes", () => {
  const mkt = createMarket(),
    indCps = [100, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  for (let i = 0; i < MKT_LEN + 20; i++) sampleMarket(mkt, indCps, () => 0.5)
  assert.equal(mkt.idx.length, MKT_LEN)
  assert.equal(mkt.ind[0][MKT_LEN - 1], 100) // neutral mood stays at 1
  assert.equal(mkt.ind[1][MKT_LEN - 1], 0)
})

test("market: mood stays between 65% and 135%", () => {
  const mkt = createMarket()
  for (let i = 0; i < 500; i++) sampleMarket(mkt, [1], () => 1)
  assert.ok(mkt.mood[0] <= 1.35)
  for (let i = 0; i < 500; i++) {
    scandalShock(mkt, 0)
    sampleMarket(mkt, [1], () => 0)
  }
  assert.ok(mkt.mood[0] >= 0.65)
})

test("pctChange ignores the zero samples before the first income", () => {
  assert.equal(pctChange([0, 0, 100, 150]), 50)
  assert.equal(pctChange([0, 0]), null)
  assert.equal(pctChange([100, 0]), null)
})

test("jobs: default 5-minute cooldown, waste dumping every 2 minutes for 10 minutes of pay", () => {
  rules.jobCooldown = 0
  assert.equal(jobCooldown(JOB_BY_ID.lemon), 5 * 60 * 1000)
  assert.equal(jobCooldown(JOB_BY_ID.waste), 2 * 60 * 1000)
  const state = newState(START_TIME)
  state.owned[2] = 10
  assert.equal(jobPay(derive(state), JOB_BY_ID.waste), 10 * 10 * 600)
})

test("jobs: cooldown starts with the shift; wins are counted", () => {
  const state = newState(START_TIME),
    job = JOB_BY_ID.milk
  assert.equal(jobTimeLeft(state, job, START_TIME), 0)
  startJobCooldown(state, job, START_TIME)
  assert.equal(jobTimeLeft(state, job, START_TIME + 1000), 5 * 60 * 1000 - 1000)
  recordJobWin(state, job)
  recordJobWin(state, JOB_BY_ID.lemon)
  assert.equal(totalJobWins(state), 2)
})

test("jobs: winning pays the reward, counts the win and reports it", () => {
  const state = newState(START_TIME),
    job = JOB_BY_ID.lemon
  state.owned[0] = 10
  const derived = derive(state),
    reward = jobPay(derived, job)
  assert.ok(reward > 0)
  const event = winJob(state, derived, job)
  assert.deepEqual(event, { type: "jobWon", job, reward })
  assert.equal(state.dollars, reward)
  assert.equal(state.allTimeEarned, reward)
  assert.ok(state.fines > 0) // job pay is income like any other, so fines accrue on it
  assert.equal(state.jobWins.lemon, 1)
})

test("jobs: changes are reported once, and never on the first check", () => {
  rules.jobCooldown = 0
  const state = newState(START_TIME),
    seen = {},
    lemon = JOB_BY_ID.lemon
  state.owned[0] = 1
  assert.deepEqual(jobChanges(seen, state, START_TIME), []) // first look: nothing to compare against

  state.owned[1] = 1
  assert.deepEqual(jobChanges(seen, state, START_TIME), [{ type: "jobUnlocked", job: JOB_BY_ID.milk }])
  assert.deepEqual(jobChanges(seen, state, START_TIME), [])

  startJobCooldown(state, lemon, START_TIME)
  assert.deepEqual(jobChanges(seen, state, START_TIME + 1000), [])
  assert.deepEqual(jobChanges(seen, state, START_TIME + jobCooldown(lemon)), [{ type: "jobReady", job: lemon }])
  assert.deepEqual(jobChanges(seen, state, START_TIME + jobCooldown(lemon) + 1000), [])
})

test("jobs: a job that unlocks while still cooling down isn't reported as ready", () => {
  const state = newState(START_TIME),
    seen = {},
    milk = JOB_BY_ID.milk
  startJobCooldown(state, milk, START_TIME)
  jobChanges(seen, state, START_TIME)
  state.owned[1] = 1
  assert.deepEqual(jobChanges(seen, state, START_TIME), [{ type: "jobUnlocked", job: milk }])
  assert.deepEqual(jobChanges(seen, state, START_TIME + jobCooldown(milk)), [{ type: "jobReady", job: milk }])
})

test("jobs: test mode replays after 5 seconds", () => {
  rules.jobCooldown = 5000
  assert.equal(jobCooldown(JOB_BY_ID.waste), 5000)
  rules.jobCooldown = 0
})

test("news: the final hour with fines owed always shows the warning", () => {
  const state = newState(START_TIME)
  state.fines = 10
  state.deadline = START_TIME + 1000
  assert.match(
    newsLine(state, derive(state), START_TIME, () => 0.99),
    /PAY YOUR FINES/
  )
})
