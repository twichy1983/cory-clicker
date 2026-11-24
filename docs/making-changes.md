# Making changes

Recipes for the most common changes. After any of them, run `npm test` and play the change in `npm run dev`.

## Change a price, an income or a balance number

| What                                                      | Where                                                                                      |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| An industry's price or income                             | `src/core/data/industries.js` (`base` = first one's price, `cps` = income per second each) |
| Price growth, fine rate, deadline length, lobbyist prices | `src/core/constants.js`                                                                    |
| Scandal bonus (+10%) or fine penalty (+1%)                | `derive()` in `src/core/economy.js`                                                        |
| Job pay and cooldowns                                     | `src/core/jobs.js`                                                                         |

If a unit test checks the old number, update the test too. That's expected: the test documents the rule.

## Add a scandal

Add a `["Name.", "Description"]` line to that industry's list in `src/core/data/scandals.js`. Its position in the list decides how many of the industry you need to unlock it (`SCANDAL_THRESHOLDS` in the same file). The store, tooltip, rap sheet and achievements pick it up automatically.

## Add an achievement

Add one line in `src/core/achievements.js`:

```js
A("Clicking", "clicks_1m", "🧠", "Click Singularity", "Click the dollar 1,000,000 times.", (c) => c.S.clicks >= 1e6)
```

- The id (`"clicks_1m"`) is stored in saves. **Never rename or reuse an id.**
- The test receives `c = { S, D, mkt, peakClickRate }`.
- Update the count in `tests/unit/achievements.test.js`.

## Add an industry

1. Add it to `INDUSTRIES` in `src/core/data/industries.js` (keep the list sorted by price) and add a ticker to `TICKERS`.
2. Add scandals for it in `scandals.js`, or doublers in `upgrades.js`.
3. Add its "first one owned" achievement name to `IND_ACH` in `src/core/achievements.js`.
4. Add a job for it (next recipe), or the jobs list will be one short.

Saves store owned counts by position, so **add new industries at the end of the list** or old saves will shift.

## Add a minigame

1. Copy the smallest existing game (`src/jobs/accounts.js`) to `src/jobs/yourgame.js`.
2. Change its object. The comment at the top of `src/jobs/framework.js` lists every field a game can define. A game never changes `game.S` or shows toasts itself: winning pays the reward automatically, and extra cash goes through `payOut(amount, text)` from `framework.js` (see `price.js`).
3. Add the job to `JOB_DEFS` in `src/core/jobs.js` (id, industry, icon, name, blurb).
4. Import the game in `src/jobs/index.js` and add it to `GAMES`.
5. Play it with `npm run dev`, then `npm run test:e2e`. The "every minigame" test plays it with random input to catch crashes.

## Change how the page looks

- Markup: `index.html`. JavaScript finds elements by `id`, so search `src/` before renaming one.
- Styles: `css/main.css` (the main page), `css/jobs.css` (the minigame window).
- Check the result at the CrazyGames frame sizes with `npm run screenshots`.

## Change the save format

1. Add the new field with its default to `newState()` in `src/core/state.js`. Older saves then get the default.
2. If the field isn't a plain number or string, add a check for it in `sanitize()` in `src/core/save.js`.
3. Add a test to `tests/unit/save.test.js` that loads a save without the field.

Never remove or rename a saved field without handling old saves: players would lose progress.
