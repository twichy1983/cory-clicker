import { test } from "node:test";
import assert from "node:assert/strict";
import { newState } from "../../src/core/state.js";
import { encodeSave, decodeSave, sanitize } from "../../src/core/save.js";

const T0 = 1_000_000_000_000;

test("save and load gives back the same game", () => {
  const S = newState(T0);
  S.dollars = 1234.5; S.owned[3] = 7; S.upgrades.s_food_0 = true; S.company = "Ünïcode Corp 💸";
  S.achievements.own_10 = T0; S.jobs.waste = T0 + 5; S.jobWins.lemon = 2;
  const loaded = sanitize(decodeSave(encodeSave(S)), T0);
  assert.deepEqual(loaded, S);
});

test("saves made by the old single-file version still load", () => {
  const S = newState(T0);
  S.company = "Café ☕ Holdings";
  const old = btoa(unescape(encodeURIComponent(JSON.stringify(S)))); // how the old version encoded saves
  assert.equal(encodeSave(S), old);
  assert.deepEqual(sanitize(decodeSave(old), T0), S);
});

test("garbage is rejected", () => {
  assert.throws(() => decodeSave("not a save!!"));
  assert.throws(() => sanitize(null, T0));
  assert.throws(() => sanitize("hello", T0));
  assert.throws(() => sanitize({ dollars: Infinity }, T0), /Corrupt/);
});

test("unknown and badly typed fields are dropped", () => {
  const S = sanitize({
    dollars: "lots", owned: [5, -3, "x", 2.7], upgrades: { s_food_0: true, made_up: true },
    achievements: { own_10: 123, nope: 1 }, jobs: { waste: 99, fake: 1 }, timerLobbyists: -4, hacked: true,
  }, T0);
  assert.equal(S.dollars, 0);
  assert.deepEqual(S.owned.slice(0, 4), [5, 0, 0, 2]);
  assert.deepEqual(S.upgrades, { s_food_0: true });
  assert.deepEqual(S.achievements, { own_10: 123 });
  assert.deepEqual(S.jobs, { waste: 99 });
  assert.equal(S.timerLobbyists, 0);
  assert.equal("hacked" in S, false);
});

test("saves from before the jobs list keep their waste-job cooldown", () => {
  assert.equal(sanitize({ jobReadyAt: T0 + 60000 }, T0).jobs.waste, T0 + 60000);
});
