# AGENTS.md

Clickonomics: an idle clicker game in plain HTML/CSS/JS ES modules. No framework, no TypeScript, no bundler during development. **keep code, structure and tooling simple**. Don't add dependencies, CI workflows, linters or config files without asking. esbuild is the only dev dependency.

## Commands
- `npm run dev`: static server at http://localhost:8000 (esbuild's serve API, so no Python). Test mode is `/?test`.
- `npm test`: unit tests (`node:test`, about 1 s). Run a single test with `node --test --test-name-pattern="bankruptcy" tests/unit/economy.test.js`.
- `npm run test:e2e`: about 40 s. Needs Chrome or Edge installed (`BROWSER_PATH` overrides the search). The CrazyGames-build test is skipped unless `npm run build` ran first.
- `npm run build`: only the CrazyGames build (`dist/crazygames/` plus a zip). The web version has **no build**: GitHub Pages serves `main` as-is, so every push to `main` goes live.
- Before finishing a change, run `npm test` and `npm run test:e2e`.
- Scripts must stay cross-platform (Windows/macOS/Linux): write them in Node (`scripts/*.js`), never bash or sed.

## Architecture rules
- `src/core/` must not touch `document`, `window`, `localStorage`, `Date.now()` or `Math.random()`. Pass `S`, `D` and `now` in (random numbers come in as an optional `random` argument). It runs in Node for the unit tests.
- Core rules return events (`{ type: "bankrupt", ... }`); `src/actions.js` shows toasts and dialogs. UI modules (`src/ui/`) only draw; buttons are wired in `src/main.js`, often through event delegation on `data-*` attributes.
- The shared state is `game` in `src/game.js`. `game.S` is saved; `game.D` is derived. Call `refreshDerived()` (or `act.update()`) after changing ownership. Loading, importing and hard resetting replace `game.S` entirely, so never cache it.
- Test mode flips switches in `src/core/rules.js`; don't use `if (TEST_MODE)` inside core. `__BUILD__` is defined only by `scripts/build.js`; unbundled code is `"dev"`.
- Minigames read the current shift state through the live `G` export from `src/jobs/framework.js`. The `key()` handler returns `true` for keys it uses (only those get `preventDefault`).
- Avoid import cycles: the framework gets `hideTip`, `save` and similar callbacks through `setJobHooks`, not imports.

## Gotchas
- Imports must be relative, include `.js`, and use lowercase file names: Pages is case-sensitive and the site lives under `/cory-clicker/`. No absolute `/` paths (the build checks this).
- `scripts/build.js` uses exact string replacements on `index.html` (the CSS and module script tags and `<title>`) and fails if they change. Update both together.
- Save compatibility: never rename or reuse achievement, upgrade or job ids; add industries only at the end of `INDUSTRIES` (owned counts are stored by index); new state fields need defaults in `newState()` and type checks in `sanitize()`. Save keys: `coryClicker.save.v1` and `coryClicker.TEST.save.v1`.
- The game saves on `pagehide` and `visibilitychange`, so e2e tests clear storage with `page.clearStorage(origin)` (from `about:blank`), not `localStorage.clear()`.
- `window.__clickonomics` (`game`, `tick`, `save`, `act`) exists only in source builds; e2e tests use it to set up situations and then call `tick()`.
- CrazyGames requirements (SDK in `<head>`, saves only through the SDK Data module, relative paths, no fullscreen button, PEGI 12) are summarised in `docs/releasing.md`.

## Docs
`docs/architecture.md`, `docs/making-changes.md` (recipes for industries, scandals, achievements, minigames and save format changes), `docs/git-workflow.md` (feature branches, merge to `main`, imperative commit messages), `docs/testing.md`, `docs/releasing.md`.
