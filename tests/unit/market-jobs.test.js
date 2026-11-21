import { test } from "node:test";
import assert from "node:assert/strict";
import { newState } from "../../src/core/state.js";
import { derive } from "../../src/core/economy.js";
import { rules } from "../../src/core/rules.js";
import { createMarket, sampleMarket, pctChange, MKT_LEN, scandalShock } from "../../src/core/market.js";
import { JOB_BY_ID, jobCooldown, jobPay, jobTimeLeft, startJobCooldown, recordJobWin, totalJobWins } from "../../src/core/jobs.js";
import { newsLine } from "../../src/core/news.js";

const T0 = 1_000_000_000_000;

test("market: price tracks income times mood, history is capped at 3 minutes", () => {
  const mkt = createMarket(), indCps = [100, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < MKT_LEN + 20; i++) sampleMarket(mkt, indCps, () => 0.5);
  assert.equal(mkt.idx.length, MKT_LEN);
  assert.equal(mkt.ind[0][MKT_LEN - 1], 100); // neutral mood stays at 1
  assert.equal(mkt.ind[1][MKT_LEN - 1], 0);
});

test("market: mood stays between 65% and 135%", () => {
  const mkt = createMarket();
  for (let i = 0; i < 500; i++) sampleMarket(mkt, [1], () => 1);
  assert.ok(mkt.mood[0] <= 1.35);
  for (let i = 0; i < 500; i++) { scandalShock(mkt, 0); sampleMarket(mkt, [1], () => 0); }
  assert.ok(mkt.mood[0] >= 0.65);
});

test("pctChange ignores the zero samples before the first income", () => {
  assert.equal(pctChange([0, 0, 100, 150]), 50);
  assert.equal(pctChange([0, 0]), null);
  assert.equal(pctChange([100, 0]), null);
});

test("jobs: default 5-minute cooldown, waste dumping every 2 minutes for 10 minutes of pay", () => {
  rules.jobCooldown = 0;
  assert.equal(jobCooldown(JOB_BY_ID.lemon), 5 * 60 * 1000);
  assert.equal(jobCooldown(JOB_BY_ID.waste), 2 * 60 * 1000);
  const S = newState(T0);
  S.owned[2] = 10;
  assert.equal(jobPay(derive(S), JOB_BY_ID.waste), 10 * 10 * 600);
});

test("jobs: cooldown starts with the shift; wins are counted", () => {
  const S = newState(T0), job = JOB_BY_ID.milk;
  assert.equal(jobTimeLeft(S, job, T0), 0);
  startJobCooldown(S, job, T0);
  assert.equal(jobTimeLeft(S, job, T0 + 1000), 5 * 60 * 1000 - 1000);
  recordJobWin(S, job); recordJobWin(S, JOB_BY_ID.lemon);
  assert.equal(totalJobWins(S), 2);
});

test("jobs: test mode replays after 5 seconds", () => {
  rules.jobCooldown = 5000;
  assert.equal(jobCooldown(JOB_BY_ID.waste), 5000);
  rules.jobCooldown = 0;
});

test("news: the final hour with fines owed always shows the warning", () => {
  const S = newState(T0);
  S.fines = 10; S.deadline = T0 + 1000;
  assert.match(newsLine(S, derive(S), T0, () => 0.99), /PAY YOUR FINES/);
});
