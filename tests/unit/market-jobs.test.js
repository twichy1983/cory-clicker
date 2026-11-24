import { test } from "node:test"
import assert from "node:assert/strict"
import { newState } from "../../src/core/state.js"
import { derive } from "../../src/core/economy.js"
import { rules } from "../../src/core/rules.js"
import { createMarket, sampleMarket, pctChange, MKT_LEN, scandalShock } from "../../src/core/market.js"
import { JOB_BY_ID, jobCooldown, jobPay, jobTimeLeft, startJobCooldown } from "../../src/core/jobs.js"
import { recordJobWin, totalJobWins, winJob, jobChanges } from "../../src/core/jobs.js"
import { newsLine } from "../../src/core/news.js"

const T0 = 1_000_000_000_000

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
  const S = newState(T0)
  S.owned[2] = 10
  assert.equal(jobPay(derive(S), JOB_BY_ID.waste), 10 * 10 * 600)
})

test("jobs: cooldown starts with the shift; wins are counted", () => {
  const S = newState(T0),
    job = JOB_BY_ID.milk
  assert.equal(jobTimeLeft(S, job, T0), 0)
  startJobCooldown(S, job, T0)
  assert.equal(jobTimeLeft(S, job, T0 + 1000), 5 * 60 * 1000 - 1000)
  recordJobWin(S, job)
  recordJobWin(S, JOB_BY_ID.lemon)
  assert.equal(totalJobWins(S), 2)
})

test("jobs: winning pays the reward, counts the win and reports it", () => {
  const S = newState(T0),
    job = JOB_BY_ID.lemon
  S.owned[0] = 10
  const D = derive(S),
    reward = jobPay(D, job)
  assert.ok(reward > 0)
  const ev = winJob(S, D, job)
  assert.deepEqual(ev, { type: "jobWon", job, reward })
  assert.equal(S.dollars, reward)
  assert.equal(S.allTimeEarned, reward)
  assert.ok(S.fines > 0) // job pay is income like any other, so fines accrue on it
  assert.equal(S.jobWins.lemon, 1)
})

test("jobs: changes are reported once, and never on the first check", () => {
  rules.jobCooldown = 0
  const S = newState(T0),
    seen = {},
    lemon = JOB_BY_ID.lemon
  S.owned[0] = 1
  assert.deepEqual(jobChanges(seen, S, T0), []) // first look: nothing to compare against

  S.owned[1] = 1
  assert.deepEqual(jobChanges(seen, S, T0), [{ type: "jobUnlocked", job: JOB_BY_ID.milk }])
  assert.deepEqual(jobChanges(seen, S, T0), [])

  startJobCooldown(S, lemon, T0)
  assert.deepEqual(jobChanges(seen, S, T0 + 1000), [])
  assert.deepEqual(jobChanges(seen, S, T0 + jobCooldown(lemon)), [{ type: "jobReady", job: lemon }])
  assert.deepEqual(jobChanges(seen, S, T0 + jobCooldown(lemon) + 1000), [])
})

test("jobs: a job that unlocks while still cooling down isn't reported as ready", () => {
  const S = newState(T0),
    seen = {},
    milk = JOB_BY_ID.milk
  startJobCooldown(S, milk, T0)
  jobChanges(seen, S, T0)
  S.owned[1] = 1
  assert.deepEqual(jobChanges(seen, S, T0), [{ type: "jobUnlocked", job: milk }])
  assert.deepEqual(jobChanges(seen, S, T0 + jobCooldown(milk)), [{ type: "jobReady", job: milk }])
})

test("jobs: test mode replays after 5 seconds", () => {
  rules.jobCooldown = 5000
  assert.equal(jobCooldown(JOB_BY_ID.waste), 5000)
  rules.jobCooldown = 0
})

test("news: the final hour with fines owed always shows the warning", () => {
  const S = newState(T0)
  S.fines = 10
  S.deadline = T0 + 1000
  assert.match(
    newsLine(S, derive(S), T0, () => 0.99),
    /PAY YOUR FINES/
  )
})
