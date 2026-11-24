import { test } from "node:test";
import assert from "node:assert/strict";
import { newState } from "../../src/core/state.js";
import { derive, goBankrupt } from "../../src/core/economy.js";
import {
  createMarket,
  sampleMarket,
  resetMarket,
} from "../../src/core/market.js";
import {
  ACH,
  ACH_BY_ID,
  checkAchievements,
} from "../../src/core/achievements.js";

const T0 = 1_000_000_000_000;
const ctxFor = (S) => ({
  S,
  D: derive(S),
  mkt: createMarket(),
  peakClickRate: 0,
});

test("there are 65 achievements with unique ids", () => {
  assert.equal(ACH.length, 65);
  assert.equal(Object.keys(ACH_BY_ID).length, 65);
});

test("a fresh game unlocks nothing", () => {
  assert.deepEqual(checkAchievements(ctxFor(newState(T0)), T0), []);
});

test("unlocks are stored with their time and only reported once", () => {
  const S = newState(T0);
  S.owned[0] = 1;
  const fresh = checkAchievements(ctxFor(S), T0 + 1).map((a) => a.id);
  assert.deepEqual(fresh, ["ind_lemon"]);
  assert.equal(S.achievements.ind_lemon, T0 + 1);
  assert.deepEqual(checkAchievements(ctxFor(S), T0 + 2), []);
});

test("click speed and income thresholds", () => {
  const S = newState(T0);
  S.owned[9] = 1; // 3.2 million per second
  const ctx = ctxFor(S);
  ctx.peakClickRate = 10;
  const ids = checkAchievements(ctx, T0).map((a) => a.id);
  for (const id of [
    "cspeed_5",
    "cspeed_10",
    "cps_10",
    "cps_1000",
    "cps_1000000",
  ])
    assert.ok(ids.includes(id), id);
  assert.ok(!ids.includes("cspeed_15"));
  assert.ok(!ids.includes("cps_1000000000"));
});

test("bug fix: going bankrupt doesn't unlock Black Monday", () => {
  const S = newState(T0);
  S.owned[0] = 50;
  const mkt = createMarket();
  for (let i = 0; i < 30; i++) sampleMarket(mkt, derive(S).indCps, () => 0.5);
  goBankrupt(S, T0, true);
  const D = derive(S);
  for (let i = 0; i < 30; i++) sampleMarket(mkt, D.indCps, () => 0.5); // index falls to $0
  const ids = checkAchievements({ S, D, mkt, peakClickRate: 0 }, T0).map(
    (a) => a.id,
  );
  assert.ok(!ids.includes("mkt_crash"));
});

test("a real 90% crash while owning industries does unlock Black Monday", () => {
  const S = newState(T0);
  S.owned[0] = 100;
  const mkt = createMarket();
  resetMarket(mkt, derive(S).indCps, () => 0.5);
  mkt.idx.push(mkt.idx[0] * 0.05);
  assert.ok(
    checkAchievements({ S, D: derive(S), mkt, peakClickRate: 0 }, T0).some(
      (a) => a.id === "mkt_crash",
    ),
  );
});
