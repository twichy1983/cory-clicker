// End-to-end tests: the real game in a headless Chrome or Edge, driven like a player.
// Run with: npm run test:e2e   (needs Chrome or Edge installed; set BROWSER_PATH to pick one)
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { serve, launch } from "../../scripts/browser.js";

let server, page;

before(async () => {
  server = await serve(".");
  page = await launch();
});
after(async () => {
  await page?.close();
  await server?.stop();
});

// Each test starts from a brand new game
async function freshGame(path = "/") {
  await page.clearStorage(server.url);
  await page.goto(server.url + path);
  page.errors.length = 0;
}
const state = () => page.eval("window.__clickonomics.game.S");
const tick = () => page.eval("window.__clickonomics.tick()");

beforeEach(() => freshGame());

test("the game boots with no errors and a new company", async () => {
  assert.equal(await page.text("#dollars"), "$0");
  assert.equal(await page.eval("document.title"), "$0 · Clickonomics");
  assert.equal(
    await page.eval(`document.querySelectorAll("#buildings .bld").length`),
    10,
  );
  assert.equal(
    await page.eval(`document.querySelectorAll("#jobList .job").length`),
    10,
  );
  assert.equal(await page.eval(`!!document.querySelector("#testBar")`), false);
  assert.deepEqual(page.errors, []);
});

test("clicking the dollar earns money, and the save survives a reload", async () => {
  for (let i = 0; i < 15; i++) await page.click("#bigDollar");
  assert.equal(await page.text("#dollars"), "$15");
  await page.click("#saveNow");
  await page.goto(server.url + "/");
  assert.equal((await state()).clicks, 15);
  assert.equal(await page.text("#dollars"), "$15");
});

test("buying an industry starts income and unlocks its job", async () => {
  for (let i = 0; i < 12; i++) await page.click("#bigDollar");
  await page.click(`[data-bld="0"]`);
  const S = await state();
  assert.equal(S.owned[0], 1);
  assert.equal(S.dollars, 0);
  assert.match(await page.text("#cps"), /0\.15/);
  assert.equal(
    await page.eval(`document.querySelector('[data-job="lemon"]').className`),
    "job ready",
  );
});

test("paying fines restarts the clock", async () => {
  for (let i = 0; i < 20; i++) await page.click("#bigDollar");
  assert.match(await page.text("#payBtn"), /^PAY \$2(\.0)? NOW$/);
  await page.click("#payBtn");
  const S = await state();
  assert.equal(S.fines, 0);
  assert.ok(Math.abs(S.finesPaid - 2) < 1e-9);
});

test("unpaid fines at the deadline mean bankruptcy", async () => {
  await page.eval(
    `(() => { const S = window.__clickonomics.game.S; S.owned[0] = 5; S.fines = 100; S.deadline = Date.now() - 1; })()`,
  );
  await tick();
  assert.match(await page.text("#modal h3"), /CEASE & DESIST/);
  const S = await state();
  assert.equal(S.bankruptcies, 1);
  assert.equal(S.owned[0], 0);
});

test("export and import a save through the Save tab", async () => {
  for (let i = 0; i < 7; i++) await page.click("#bigDollar");
  await page.click(`.tab[data-tab="save"]`);
  await page.click("#exportBtn");
  const saved = await page.eval(`document.querySelector("#exportTxt").value`);
  await page.click("#modal .row button:last-child"); // Close

  await freshGame();
  await page.click("#importBtn");
  await page.eval(
    `document.querySelector("#importTxt").value = ${JSON.stringify(saved)}`,
  );
  await page.click("#modal .row button:first-child"); // Load
  assert.equal((await state()).clicks, 7);
  assert.equal(await page.text("#dollars"), "$7");
});

test("a bad import string is rejected without changing the game", async () => {
  await page.click("#bigDollar");
  await page.click("#importBtn");
  await page.eval(
    `document.querySelector("#importTxt").value = "definitely not a save"`,
  );
  await page.click("#modal .row button:first-child");
  assert.equal((await state()).clicks, 1);
  assert.match(await page.text("#toasts"), /invalid/);
});

test("test mode: free purchases, a separate save slot and the toolbar", async () => {
  await freshGame("/?test");
  assert.equal(await page.eval("document.title"), "$0 · Clickonomics [TEST]");
  assert.equal(await page.eval(`!!document.querySelector("#testBar")`), true);
  await page.click(`[data-bld="9"]`);
  assert.equal((await state()).owned[9], 1);
  await page.click(`#testBar [data-t="cash"]`);
  assert.ok((await state()).dollars >= 1e9);
});

test("every minigame opens, plays and quits without errors", async () => {
  await freshGame("/?test");
  for (let i = 0; i < 10; i++) await page.click(`[data-bld="${i}"]`);
  const jobs = await page.eval(
    `[...document.querySelectorAll("#jobList [data-job]")].map(b => b.dataset.job)`,
  );
  assert.equal(jobs.length, 10);
  for (const id of jobs) {
    await page.click(`[data-job="${id}"]`);
    assert.equal(
      await page.eval(`document.querySelector("#jobOverlay").hidden`),
      false,
      id,
    );
    await page.click(`#jobPanel [data-act="start"]`);
    // Random clicks, drags and keys across the canvas for about two seconds
    await page.eval(`(async () => {
      const c = document.querySelector("#jobCanvas"), r = c.getBoundingClientRect();
      const fire = (type, x, y) => c.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: r.left + x * r.width, clientY: r.top + y * r.height, pointerId: 1 }));
      for (let i = 0; i < 40; i++) {
        const x = Math.random(), y = Math.random();
        fire("pointerdown", x, y); fire("pointermove", x + 0.02, y); fire("pointerup", x + 0.02, y);
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "123asdjkl"[i % 9], bubbles: true }));
        await new Promise(r => setTimeout(r, 50));
      }
    })()`);
    await page.click("#jobClose"); // quit (or close the result screen)
    await page.wait(700);
    if (!(await page.eval(`document.querySelector("#jobOverlay").hidden`)))
      await page.click("#jobClose");
    assert.equal(
      await page.eval(`document.querySelector("#jobOverlay").hidden`),
      true,
      id,
    );
    assert.deepEqual(page.errors, [], id);
  }
});

test(
  "the CrazyGames build boots (run npm run build first)",
  { skip: !existsSync("dist/crazygames/index.html") },
  async () => {
    const dist = await serve("dist/crazygames");
    try {
      await page.clearStorage(dist.url);
      await page.goto(dist.url + "/");
      page.errors.length = 0;
      await page.click("#bigDollar");
      assert.equal(await page.text("#dollars"), "$1");
      assert.equal(
        await page.eval("typeof window.__clickonomics"),
        "undefined",
      ); // no test hooks in the release
      // The SDK is blocked in tests, so the only allowed error is the failed SDK download
      assert.deepEqual(
        page.errors.filter((e) => !/crazygames/i.test(e)),
        [],
      );
    } finally {
      await dist.stop();
    }
  },
);
