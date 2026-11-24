# AGENTS.md

Clickonomics: an idle clicker game in plain HTML/CSS/JS ES modules. No framework, no TypeScript, no bundler during development. **keep code, structure and tooling simple**. Don't add dependencies, CI workflows, linters or config files without asking. The only dev dependencies are esbuild and Prettier.

## Commands

- `npm run dev`: static server at http://localhost:8000 (esbuild's serve API, so no Python). Test mode is `/?test`.
- `npm test`: unit tests (`node:test`, about 1 s). Run a single test with `node --test --test-name-pattern="bankruptcy" tests/unit/economy.test.js`.
- `npm run test:e2e`: about 40 s. Needs Chrome or Edge installed (`BROWSER_PATH` overrides the search). The CrazyGames-build test is skipped unless `npm run build` ran first.
- `npm run build`: only the CrazyGames build (`dist/crazygames/` plus a zip). The web version has **no build**: GitHub Pages serves `main` as-is, so every push to `main` goes live.
- `npm run format`: formats every file with Prettier (`.prettierrc.json`: 120 columns, no semicolons, no trailing commas). Keep each import on one line; if one gets too long, split it into two imports from the same file. `npm run format:check` only reports.
- Before finishing a change, run `npm run format`, `npm test` and `npm run test:e2e`.
- Scripts must stay cross-platform (Windows/macOS/Linux): write them in Node (`scripts/*.js`), never bash or sed.

## Naming

- Names must be clear and easy to read: `state`, `upgrade`, `radius`, `elapsed`, not `S`, `u`, `r`, `t`. This applies to variables, parameters, functions and object properties.
- No single-letter names, except `i`/`j` as a plain loop index, `x`/`y` for coordinates, `_` for an unused parameter and the `$` DOM helper. Write `width`/`height`, never `w`/`h`, and `event`, not `e`.
- The shared objects are `game.state` (saved), `game.derived` (worked out from it) and `shift` (the open minigame shift, from `src/jobs/framework.js`).

## Architecture rules

- `src/core/` must not touch `document`, `window`, `localStorage`, `Date.now()` or `Math.random()`. Pass `state`, `derived` and `now` in (random numbers come in as an optional `random` argument). It runs in Node for the unit tests.
- Core rules return events (`{ type: "bankrupt", ... }`); `src/actions.js` shows toasts and dialogs. UI modules (`src/ui/`) only draw; buttons are wired in `src/main.js`, often through event delegation on `data-*` attributes.
- The shared state is `game` in `src/game.js`. `game.state` is saved; `game.derived` is derived. Call `refreshDerived()` (or `act.update()`) after changing ownership. Loading, importing and hard resetting replace `game.state` entirely, so never cache it.
- Test mode flips switches in `src/core/rules.js`; don't use `if (TEST_MODE)` inside core. `__BUILD__` is defined only by `scripts/build.js`; unbundled code is `"dev"`.
- Minigames read the current shift state through the live `shift` export from `src/jobs/framework.js`. The `key()` handler returns `true` for keys it uses (only those get `preventDefault`).
- The job framework only runs the window. Shift effects (cooldown, pay, toasts, saving) go through `setJobHooks` (`onStart`, `onWin`, `onPayOut`, ...) to `src/actions.js`, which also avoids import cycles. Minigames never change `game.state` or toast; extra cash goes through `payOut(amount, text)`.
- UI modules only draw. Change detection (like jobs unlocking) is a core rule that returns events (`jobChanges()`), shown by `actions.handleEvents()`.

## Gotchas

- Imports must be relative, include `.js`, and use lowercase file names: Pages is case-sensitive and the site lives under `/cory-clicker/`. No absolute `/` paths (the build checks this).
- `scripts/build.js` uses exact string replacements on `index.html` (the CSS and module script tags and `<title>`) and fails if they change. Update both together.
- Save compatibility: never rename or reuse achievement, upgrade or job ids; add industries only at the end of `INDUSTRIES` (owned counts are stored by index); new state fields need defaults in `newState()` and type checks in `sanitize()`. Save keys: `coryClicker.save.v1` and `coryClicker.TEST.save.v1`.
- The game saves on `pagehide` and `visibilitychange`, so e2e tests clear storage with `page.clearStorage(origin)` (from `about:blank`), not `localStorage.clear()`.
- `window.__clickonomics` (`game`, `tick`, `save`, `act`) exists only in source builds; e2e tests use it to set up situations and then call `tick()`.
- CrazyGames requirements (SDK in `<head>`, saves only through the SDK Data module, relative paths, no fullscreen button, PEGI 12) are summarised in `docs/releasing.md`.

## Docs

`docs/architecture.md`, `docs/making-changes.md` (recipes for industries, scandals, achievements, minigames and save format changes), `docs/testing.md`, `docs/releasing.md`.
