# Architecture

Clickonomics is a static web page. `index.html` loads `src/main.js` as an ES module, and the browser loads the rest of `src/` through `import` statements. Nothing is compiled during development.

## Layers

```
            main.js  (startup, wiring, game loop)
               │
           actions.js  (player actions: run a rule, then show the result)
          ┌────┴─────┬───────────┐
        ui/        jobs/      platform/
          └────┬─────┘
             core/  (data + rules, no page access)
```

| Folder | Job | May use |
|---|---|---|
| `src/core/` | Game data and rules: prices, income, fines, deadlines, saves, achievements | Only other `core/` files. **Never** `document`, `window` or `localStorage`. |
| `src/ui/` | Draws the page from the game state | `core/`, the page |
| `src/jobs/` | The minigame window and the ten minigames | `core/`, the page, canvas |
| `src/platform/` | Where saves go and which portal events to send | Browser storage, the CrazyGames SDK |
| `src/actions.js` | Player actions: call a `core/` rule, then toast, show a dialog or redraw | Everything above |
| `src/main.js` | Starts the game, connects buttons to actions, runs the loop | Everything |

**Why `core/` has no page access:** it runs in Node for the unit tests, which are fast and give the same result every time. If a `core/` file touches `document`, `npm test` fails.

## The game state

Everything lives in one object, `game` (from `src/game.js`):

| Field | What | Saved? |
|---|---|---|
| `game.S` | The game state: cash, industries owned, upgrades, fines, deadline, stats. Created by `newState()` in `core/state.js`. | Yes |
| `game.D` | Values worked out from `S`: income per second, click power, fine multiplier. Recompute with `refreshDerived()` after `S` changes. | No |
| `game.mkt` | Stock market history for the charts | No |
| `game.peakClickRate` | Fastest clicking seen, for the click-speed achievements | No |

Rules in `core/` take these as parameters (`buyBuilding(S, i, n)`), and so does anything that depends on the time (`advance(S, D, now)`). That's what makes them testable.

## How a click flows through the code

1. `main.js` connects `#payBtn` to `act.payFines`.
2. `actions.js → payFines()` calls `core/economy.js → payFines(S, D, now)`, which changes `S` and returns `{ type: "paid", amount }`.
3. `actions.js` shows a toast based on that result and calls `render()`.
4. `render()` asks `ui/hud.js` and `ui/store.js` to redraw from the new `S`.

Rules **return what happened** (events); they never show anything themselves. Deadlines work the same way: `advance()` returns `[{ type: "survived" }]` or `[{ type: "bankrupt", ... }]`, and `actions.handleEvents()` shows the toast or dialog.

## The game loop (`main.js`)

- Every 100 ms: earn income (`advance`), handle deadlines, redraw the numbers.
- Every second: update the jobs list, add a stock market sample, redraw the charts, check achievements, refresh the open tooltip.
- Every 30 s: autosave. The game also saves when the tab is hidden or closed.
- Every 12 s: change the news headline.

## Minigames (`src/jobs/`)

- `framework.js` runs the shared window: intro card, timer, progress meter, strikes, result screens, animation loop and input.
- `draw.js` has drawing helpers (rounded boxes, labels, emoji, speech bubbles). Every game draws on the same 1672×941 canvas.
- Each game (`lemon.js`, `milk.js`, ...) exports one object. See the comment at the top of `framework.js` for the fields a game can define.
- `index.js` pairs each job from `core/jobs.js` with its game.

## Versions of the game

`src/config.js` decides which version is running:

| Version | How you get it | Differences |
|---|---|---|
| Normal | `index.html` | None |
| Test mode | `index.html?test` | Everything free, jobs replayable every 5 s, separate save slot, yellow toolbar. Turned on in `main.js` through `core/rules.js`. |
| CrazyGames | `npm run build` | Saves through the CrazyGames SDK, sends gameplay events, no test mode. `__BUILD__` is set to `"crazygames"` by `scripts/build.js`. |

## Code style

- Plain modern JavaScript (ES2020+). No TypeScript, no framework.
- Imports are relative and include `.js` (`./core/economy.js`). Browsers require it.
- File names are lowercase. GitHub Pages and Linux are case-sensitive; Windows and macOS aren't.
- Two-space indentation and LF line endings (set by `.editorconfig` and `.gitattributes`).
- Comments explain *why*, not *what*.
