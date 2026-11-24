// The running game, shared by every module:
//   game.state    the saved state (see core/state.js)
//   game.derived  values derived from state: income, click power, fine multiplier (see core/economy.js derive)
//   game.mkt  the in-memory stock market history (never saved)
//   game.peakClickRate  the most clicks seen within one second (for the click-speed achievements)
import { newState } from "./core/state.js"
import { derive } from "./core/economy.js"
import { createMarket } from "./core/market.js"

export const game = {
  state: newState(Date.now()),
  derived: null,
  mkt: createMarket(),
  peakClickRate: 0
}
game.derived = derive(game.state)

// Call after anything that changes what the player owns
export function refreshDerived() {
  game.derived = derive(game.state)
}
