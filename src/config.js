// Which version of the game is running.
// __BUILD__ is replaced by scripts/build.js ("crazygames"). Unbundled source (npm run dev, GitHub Pages) is "dev".
/* global __BUILD__ */
export const BUILD = typeof __BUILD__ !== "undefined" ? __BUILD__ : "dev"
export const IS_CRAZYGAMES = BUILD === "crazygames"

// Test mode (everything free, separate save slot, test toolbar): add ?test to the URL. Never in the CrazyGames build.
export const TEST_MODE = BUILD === "dev" && new URLSearchParams(location.search).has("test")

export const SAVE_KEY = TEST_MODE ? "coryClicker.TEST.save.v1" : "coryClicker.save.v1"
export const GAME_TITLE = TEST_MODE ? "Clickonomics [TEST]" : "Clickonomics"
