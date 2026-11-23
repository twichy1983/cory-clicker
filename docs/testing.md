# Testing

Both kinds of test use Node's built-in test runner (`node:test`) and `node:assert`, so there's nothing extra to install.

## Unit tests: `npm test`

`tests/unit/*.test.js` test the game rules in `src/core/`. They run in Node in about a second.

- Every test uses a fixed time (`T0`) instead of the real clock, so results never depend on when you run them.
- Rules that use random numbers accept a `random` function, so tests can pass a fixed one: `sampleMarket(mkt, cps, () => 0.5)`.
- Test mode switches (`rules.freePurchases`) are reset in `beforeEach`.

A typical test:

```js
test("unpaid fines at the deadline cause bankruptcy", () => {
  const S = newState(T0);
  S.fines = 50;
  const events = advance(S, derive(S), S.deadline + 1000);
  assert.equal(events[0].type, "bankrupt");
});
```

**When you fix a bug in `core/`:** first write a test that fails because of the bug, then fix it. The test stops it from coming back. Tests named "bug fix: ..." are examples.

## End-to-end tests: `npm run test:e2e`

`tests/e2e/game.e2e.js` runs the real game in a headless Chrome or Edge and plays it: clicking, buying, paying fines, going bankrupt, exporting and importing a save, test mode, every minigame, and the CrazyGames build (if `npm run build` has been run).

- **The browser:** `scripts/browser.js` finds an installed Chrome or Edge and controls it over the Chrome DevTools Protocol, using Node's built-in WebSocket. Edge comes with Windows, so it works there out of the box. To use a specific browser, set `BROWSER_PATH`:
  - macOS/Linux: `BROWSER_PATH="/path/to/chrome" npm run test:e2e`
  - Windows PowerShell: `$env:BROWSER_PATH="C:\path\to\chrome.exe"; npm run test:e2e`
- **Watching the tests:** `npm run test:e2e:headed` opens a visible browser window instead of running headless (or set `HEADED=1` when running anything that uses `scripts/browser.js`). Keep your hands off it while it runs.
- **Fresh state:** each test starts a new game with a fresh browser profile and cleared storage.
- **Test hook:** source builds expose `window.__clickonomics` (`game`, `tick`, `save`, `act`) so tests can set up situations, for example `S.deadline = Date.now() - 1`, then `tick()`. The CrazyGames build doesn't include it.
- **No network:** the CrazyGames SDK is blocked during tests, so they run offline.
- **Errors fail tests:** any uncaught error or `console.error` in the page is collected in `page.errors`, and tests check it's empty.

Useful page helpers: `page.goto(url)`, `page.click(selector)`, `page.text(selector)`, `page.eval("js expression")`, `page.wait(ms)`, `page.screenshot()`.

## Manual checks

Automated tests can't judge whether something is fun, readable or looks right. Before a release:

- [ ] Play each changed minigame by hand. The e2e test only checks it doesn't crash.
- [ ] `npm run screenshots` and look at `screenshots/`. 907×510 is the most common CrazyGames size.
- [ ] Try it on a phone: `npm run dev -- --lan`, then open `http://<your computer's IP>:8000` on the same Wi-Fi.
- [ ] Safari (macOS/iOS): CrazyGames disables games that don't work there.
- [ ] Load an old save: export one from the live site first, then import it locally.
