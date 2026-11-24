# Architecture

Clickonomics is a static web page. `index.html` loads `src/main.js` as an ES module, and the browser loads the rest of `src/` through `import` statements. Nothing is compiled during development.

## Layers

```
            main.js  (startup, wiring, game loop)
               │
           actions.js  (player actions: run a rule, then show the result)
          ┌────┴─────┬───────────┐
        ui/   ──▶  jobs/     platform/
          └────┬─────┘
             core/  (data + rules, no page access)

  game.js (shared state), config.js (which version) and saveload.js (saving)
  sit beside these layers and are used by everything above core/.
```

The arrow points from the importer to the imported: `ui/` reads the job list from `jobs/`. Apart from that, `ui/modal.js` reports dialogs to `platform/` as breaks in play. Everything else that changes the game, saves or talks to the portal goes through `actions.js`.

| Folder or file    | Job                                                                                                                  | May use                                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `src/core/`       | Game data and rules (see below)                                                                                      | Only other `core/` files. **Never** `document`, `window`, `localStorage`, `Date.now()` or `Math.random()`.             |
| `src/ui/`         | Draws the page from the game state. Reads `game.S` but doesn't change it (except the test-mode toolbar's shortcuts). | `core/`, `game.js`, `config.js`, `jobs/index.js` (the job list), `platform/` (dialogs report breaks in play), the page |
| `src/jobs/`       | The minigame window and the ten minigames. Reads `game.S`; changes to it go through the hooks (see Minigames).       | `core/`, `game.js`, `ui/dom.js`, the page, canvas                                                                      |
| `src/platform/`   | Where saves go and which portal events to send                                                                       | Browser storage, the CrazyGames SDK                                                                                    |
| `src/game.js`     | The shared `game` object and `refreshDerived()`                                                                      | `core/`                                                                                                                |
| `src/config.js`   | Which version is running, the save key and the title                                                                 | Nothing                                                                                                                |
| `src/saveload.js` | `save()` and `readSave()`: the save string through the platform                                                      | `game.js`, `config.js`, `core/save.js`, `platform/`                                                                    |
| `src/actions.js`  | Player actions: call a `core/` rule, then toast, show a dialog or redraw                                             | Everything above                                                                                                       |
| `src/main.js`     | Starts the game, connects buttons to actions, runs the loop                                                          | Everything                                                                                                             |

Outside `src/`: `tests/unit/` (Node, `core/` only), `tests/e2e/` (a real browser) and `scripts/` (dev server, build, zip, screenshots). See `docs/testing.md` and `docs/releasing.md`.

**Why `core/` has no page access:** it runs in Node for the unit tests, which are fast and give the same result every time. Anything that depends on the time or on chance takes it as a parameter: the current time as `now`, random numbers through an optional `random` argument (`sampleMarket(mkt, indCps, random = Math.random)`).

### What's in `core/`

| File                                                         | What                                                                                                                    |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `data/industries.js`, `data/upgrades.js`, `data/scandals.js` | The game's content: industries, upgrades and scandal texts                                                              |
| `constants.js`                                               | Timer lengths, fine rate, price growth, lobbyist effects                                                                |
| `state.js`                                                   | `newState()` (a new game) and `freshRun()` (what a bankruptcy resets)                                                   |
| `economy.js`                                                 | `derive()`, income, prices, purchases, lobbyists, fines, deadlines, bankruptcy                                          |
| `jobs.js`                                                    | Job definitions, unlocking, cooldowns, pay, `winJob()` and `jobChanges()` (the minigames themselves are in `src/jobs/`) |
| `market.js`                                                  | Stock market history and investor mood                                                                                  |
| `achievements.js`                                            | Achievement list and checks                                                                                             |
| `news.js`                                                    | News ticker headlines                                                                                                   |
| `save.js`                                                    | Encoding, decoding and `sanitize()` for saves                                                                           |
| `format.js`                                                  | Number, money and time formatting                                                                                       |
| `rules.js`                                                   | Switches that test mode turns on (free purchases, short job cooldowns)                                                  |

## The game state

Everything lives in one object, `game` (from `src/game.js`):

| Field                | What                                                                                                                                                                                           | Saved? |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `game.S`             | The game state: cash, industries owned, upgrades, fines, deadline, stats. Created by `newState()` in `core/state.js`.                                                                          | Yes    |
| `game.D`             | Values worked out from `S`: income per second, click power, fine multiplier. Recompute with `refreshDerived()` (or `act.update()`, which also redraws) after `S` changes what the player owns. | No     |
| `game.mkt`           | Stock market history for the charts                                                                                                                                                            | No     |
| `game.peakClickRate` | Fastest clicking seen, for the click-speed achievements                                                                                                                                        | No     |

Loading, importing and hard resetting **replace `game.S` with a new object**. Always read `game.S` when you need it; never keep a reference to it in a variable that outlives the call.

Rules in `core/` take these as parameters (`buyBuilding(S, i, n)`), and so does anything that depends on the time (`advance(S, D, now)`). That's what makes them testable.

## How a click flows through the code

1. `main.js` connects `#payBtn` to `act.payFines`.
2. `actions.js → payFines()` calls `core/economy.js → payFines(S, D, now)`, which changes `S` and returns what happened: `{ type: "paid" | "rebate" | "filed", amount }`, `null` if the player can't afford it, or `{ type: "deadline", events }` if a deadline passed first.
3. `actions.js` shows a toast (or hands the deadline events to `handleEvents()`) and calls `render()`.
4. `render()` asks `ui/hud.js` and `ui/store.js` to redraw from the new `S`.

Rules **return what happened** (events); they never show anything themselves. `actions.handleEvents()` turns events into toasts and dialogs:

| Event                                                       | Returned by                      | Shown as                                                |
| ----------------------------------------------------------- | -------------------------------- | ------------------------------------------------------- |
| `{ type: "survived", rebate }`                              | `advance()` in `core/economy.js` | Toast                                                   |
| `{ type: "bankrupt", owed, lost, voluntary }`               | `advance()`, `goBankrupt()`      | Dialog                                                  |
| `{ type: "jobUnlocked", job }`, `{ type: "jobReady", job }` | `jobChanges()` in `core/jobs.js` | Toast                                                   |
| `{ type: "jobWon", job, reward }`                           | `winJob()` in `core/jobs.js`     | Gold toast and portal confetti (`platform.happytime()`) |

UI modules never detect changes like these themselves. `renderJobs()`, for example, only draws the jobs list; `actions.updateJobs()` draws it and then asks `jobChanges()` what changed since last time. `jobChanges()` remembers the previous state in an object the caller passes in, so the first call after startup reports nothing.

Buttons that are rebuilt as the game changes (industries, upgrades, jobs) are wired once in `main.js` by listening on their container and reading `data-*` attributes (`data-bld`, `data-id`, `data-job`).

## The game loop (`main.js`)

- Every 100 ms: earn income (`advance`), handle deadlines, redraw the numbers, add to the play time (only while the tab is visible).
- Every second: update the jobs list (and announce jobs that unlocked or came off cooldown), add a stock market sample, redraw the charts, check achievements, redraw the Stats tab if it's open, refresh the open tooltip.
- Every 30 s: autosave. The game also saves on `visibilitychange` (tab hidden) and `pagehide`.
- Every 12 s: change the news headline.

## Minigames (`src/jobs/`)

- `framework.js` runs the shared window: intro card, timer, progress meter, strikes, result screens, animation loop and input. See the comment at the top for the fields a game can define.
- The current shift's state is the live export `G` (`null` when no job is open). Minigames import it and read it; they don't receive their own copy.
- A game's `key()` handler returns `true` for keys it uses; only those get `preventDefault()`.
- The framework only runs the window. What a shift does to the game happens in `actions.js`, which `main.js` connects with `setJobHooks()` (hooks also avoid an import cycle):

  | Hook                     | When                       | Connected to                                                                                |
  | ------------------------ | -------------------------- | ------------------------------------------------------------------------------------------- |
  | `onOpen()`               | The window opens           | `hideTip`                                                                                   |
  | `onStart(job)`           | A shift starts             | `act.startJob`: starts the cooldown (win or lose), saves                                    |
  | `onWin(job)` → reward    | A shift is won             | `act.winJob`: `core/jobs.js → winJob()` pays and counts the win, then toast, confetti, save |
  | `onPayOut(amount, text)` | A minigame pays extra cash | `act.jobPayOut`: earns the cash and toasts `text`                                           |
  | `onClose()`              | The window closes          | `act.updateJobs(true)`                                                                      |

- Minigames don't touch `game.S`, toasts or the platform. A game that pays something extra (like the price-gouging profits in `price.js`) calls `payOut(amount, text)` from `framework.js`.
- `draw.js` has drawing helpers (rounded boxes, labels, emoji, speech bubbles). Every game draws on the same 1672×941 canvas.
- Each game (`lemon.js`, `milk.js`, ...) exports one object.
- `index.js` pairs each job definition from `core/jobs.js` with its game, and throws at startup if a job has no game.

## Versions of the game

`src/config.js` decides which version is running:

| Version    | How you get it    | Differences                                                                                                                                                                                                          |
| ---------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Normal     | `index.html`      | None                                                                                                                                                                                                                 |
| Test mode  | `index.html?test` | Everything free, jobs replayable every 5 s, separate save slot (`coryClicker.TEST.save.v1`), yellow toolbar. `main.js` turns it on by flipping switches in `core/rules.js`; `core/` never checks `TEST_MODE` itself. |
| CrazyGames | `npm run build`   | Saves through the CrazyGames SDK, sends gameplay events, no test mode. `__BUILD__` is set to `"crazygames"` by `scripts/build.js`; unbundled code is `"dev"`.                                                        |

In source builds (`BUILD === "dev"`), `main.js` also exposes `window.__clickonomics = { game, tick, save, act }`. The end-to-end tests use it to set up a situation and then call `tick()`.

## Code style

- Plain modern JavaScript (ES2020+). No TypeScript, no framework.
- Imports are relative and include `.js` (`./core/economy.js`). Browsers require it.
- File names are lowercase. GitHub Pages and Linux are case-sensitive; Windows and macOS aren't.
- Two-space indentation and LF line endings (set by `.editorconfig` and `.gitattributes`).
- Comments explain _why_, not _what_.
