# Clickonomics

A satirical idle clicker game about running a deeply unethical conglomerate. Plain HTML, CSS and JavaScript, with no framework.

- **Play:** https://twichy1983.github.io/cory-clicker/
- **Test version** (everything free, separate save): https://twichy1983.github.io/cory-clicker/index.html?test

## Getting started

You need [Node.js 22 LTS or newer](https://nodejs.org/) and Git. It works the same on Windows, macOS and Linux.

```sh
git clone https://github.com/twichy1983/cory-clicker.git
cd cory-clicker
npm install        # installs one tool: esbuild
npm run dev        # http://localhost:8000
```

Edit a file and refresh the browser. There's no build step during development.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Runs the game locally at http://localhost:8000 (`/?test` for test mode) |
| `npm test` | Unit tests for the game rules (about 1 second) |
| `npm run test:e2e` | End-to-end tests in a headless Chrome or Edge (about 40 seconds) |
| `npm run test:e2e:headed` | The same tests in a visible browser window, so you can watch them |
| `npm run screenshots` | Saves screenshots at every CrazyGames frame size to `screenshots/` |
| `npm run build` | Builds the CrazyGames upload: `dist/clickonomics-crazygames.zip` |
| `npm run preview` | Runs the CrazyGames build locally, to check it before uploading |

## Project layout

```
index.html          the page (markup only)
css/                styles: main.css, jobs.css (minigame window)
assets/             images
src/
  main.js           startup, button wiring, game loop
  actions.js        what happens when the player does something
  core/             game data and rules (no page access, unit tested)
  ui/               draws the page
  jobs/             the minigames
  platform/         saves: localStorage, or the CrazyGames SDK
tests/unit/         unit tests (node:test)
tests/e2e/          end-to-end tests (node:test + headless browser)
scripts/            dev server, build, test browser, screenshots
docs/               how the project works and how to change it
```

## Docs

- [Architecture](docs/architecture.md): how the code fits together
- [Making changes](docs/making-changes.md): recipes for common changes (new industry, scandal, achievement, minigame)
- [Git workflow](docs/git-workflow.md): branches, commits and getting changes live
- [Testing](docs/testing.md): unit tests, end-to-end tests and manual checks
- [Releasing](docs/releasing.md): GitHub Pages and the CrazyGames upload
