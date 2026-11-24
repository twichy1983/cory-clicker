// CrazyGames version: routes saves and game events to the CrazyGames HTML5 SDK v3.
// The SDK <script> is added to the page <head> by scripts/build.js.
// Saves use the SDK's Data module (synced to CrazyGames accounts, localStorage for guests).
// If the SDK is missing (ad blocker, offline) or disabled (any non-CrazyGames site),
// everything falls back to localStorage and the events do nothing.
let sdk = null

function call(fn) {
  if (!sdk) return
  try {
    fn(sdk)
  } catch (error) {
    console.warn("CrazyGames SDK call failed", error)
  }
}

export const crazyGamesPlatform = {
  async init() {
    const found = window.CrazyGames && window.CrazyGames.SDK
    // CrazyGames always runs games in an iframe. Opened directly anywhere else, the SDK stalls for
    // several seconds before reporting "disabled", so skip it (localhost keeps it, for testing).
    const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    const framed = window.top !== window.self
    if (!found || (!framed && !local)) return
    const timeout = new Promise((_, fail) => setTimeout(() => fail(new Error("CrazyGames SDK init timed out")), 15000))
    await Promise.race([found.init(), timeout])
    if (found.environment === "disabled") return
    sdk = found
    call((api) => api.game.loadingStart())
  },
  getItem: (key) => (sdk ? sdk.data.getItem(key) : localStorage.getItem(key)),
  setItem: (key, value) => (sdk ? sdk.data.setItem(key, value) : localStorage.setItem(key, value)),
  loadingStart() {}, // reported from init(), once the SDK is ready
  loadingStop() {
    call((api) => api.game.loadingStop())
  },
  gameplayStart() {
    call((api) => api.game.gameplayStart())
  },
  gameplayStop() {
    call((api) => api.game.gameplayStop())
  },
  happytime() {
    call((api) => api.game.happytime())
  }
}
