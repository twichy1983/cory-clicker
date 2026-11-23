# Releasing

Builds and deploys are manual. Nothing runs automatically.

## GitHub Pages (the web version)

GitHub Pages serves the `main` branch as-is: `index.html` loads the files in `src/` directly, with no build step.

**To release:** merge to `main` and push. It's live at https://twichy1983.github.io/cory-clicker/ within a few minutes.

- Testers use `index.html?test`. The old `test.html` link redirects there.
- Pages caches files for about 10 minutes. If testers see a mix of old and new, a hard refresh (Ctrl+Shift+R, or Cmd+Shift+R on Mac) fixes it.
- The empty `.nojekyll` file tells Pages to serve files as they are.
- One-time setup (already done): repo **Settings → Pages → Deploy from a branch → `main` / root**.

## CrazyGames

### Build

```sh
npm test
npm run build          # -> dist/crazygames/ and dist/clickonomics-crazygames.zip
npm run test:e2e       # includes a check that the build boots
npm run preview        # play the build at http://localhost:8000
```

The build bundles all of `src/` into one `game.js`, adds the CrazyGames SDK `<script>` to the page `<head>`, copies `css/` and `assets/`, and zips the result. If something it expects in `index.html` is missing, it stops with an error instead of producing a broken build.

### Upload

1. CrazyGames Developer Portal → your game → upload `dist/clickonomics-crazygames.zip`.
2. Turn on **Progress Save** in the submission form. The game saves through the SDK's Data module.
3. Check it in the portal's **QA tool**:
   - The game loads and you can play it straight away.
   - Progress survives a reload.
   - There are no console errors.

### What the build already handles (from the CrazyGames requirements)

- SDK v3 loaded in `<head>`, with `init()` awaited before use
- `loadingStart`/`loadingStop` while booting, `gameplayStart`/`gameplayStop` around dialogs, `happytime` for job wins and major achievements
- Saves only through the SDK Data module (it falls back to localStorage when the SDK isn't available)
- Only relative paths (the build checks this)
- Arrow keys and space don't scroll the page around the game, and there's no right-click menu
- No test mode, no test hooks, no fullscreen button
- Under 1 MB in total

### Still to check by hand

- The layout at small frame sizes (`npm run screenshots`). Below about 1050 px wide, the game switches to a single scrolling column.
- Content against PEGI 12 guidelines

## Version numbers

Optional, but handy for knowing what testers are playing: bump `"version"` in `package.json` and tag the release:

```sh
git tag v1.1.0
git push --tags
```
