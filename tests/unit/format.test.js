import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fmt,
  money,
  fmtShort,
  fmtTime,
  fmtDuration,
  mmss,
  ordinal,
} from "../../src/core/format.js";

test("fmt: small numbers", () => {
  assert.equal(fmt(0), "0");
  assert.equal(fmt(0.15), "0.15");
  assert.equal(fmt(12.5), "12.5");
  assert.equal(fmt(999.9), "999");
  assert.equal(fmt(1234), "1,234");
  assert.equal(fmt(999999), "999,999");
});

test("fmt: illion names", () => {
  assert.equal(fmt(1e6), "1.000 million");
  assert.equal(fmt(1.5e9), "1.500 billion");
  assert.equal(fmt(999999999), "1.000 billion"); // rounds up into the next name
  assert.equal(fmt(1e33), "1.000 decillion");
  assert.equal(fmt(1e36), "1.000 undecillion");
  assert.equal(fmt(1e303), "1.000 centillion");
  assert.equal(fmt(1e306), "1.000e+306"); // past centillion
});

test("fmt: negatives and infinity", () => {
  assert.equal(fmt(-1234), "-1,234");
  assert.equal(fmt(Infinity), "∞");
});

test("money", () => {
  assert.equal(money(5), "$5");
  assert.equal(money(-2500), "-$2,500");
});

test("fmtShort", () => {
  assert.equal(fmtShort(0), "$0");
  assert.equal(fmtShort(5), "$5.00");
  assert.equal(fmtShort(1234), "$1.23K");
  assert.equal(fmtShort(4.5e9), "$4.50B");
});

test("time formats", () => {
  assert.equal(fmtTime(24 * 3600 * 1000), "24:00:00");
  assert.equal(fmtTime(-5), "00:00:00");
  assert.equal(fmtTime(61500), "00:01:01");
  assert.equal(
    fmtDuration((2 * 86400 + 3 * 3600 + 15 * 60) * 1000),
    "2d 3h 15m",
  );
  assert.equal(fmtDuration(30000), "0m");
  assert.equal(mmss(61001), "1:02");
});

test("ordinal", () => {
  assert.deepEqual(
    [1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111].map(ordinal),
    [
      "1st",
      "2nd",
      "3rd",
      "4th",
      "11th",
      "12th",
      "13th",
      "21st",
      "22nd",
      "23rd",
      "101st",
      "111th",
    ],
  );
});
