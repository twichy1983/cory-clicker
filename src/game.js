// The running game, shared by every module:
//   game.S    the saved state (see core/state.js)
//   game.D    values derived from S: income, click power, fine multiplier (see core/economy.js derive)
//   game.mkt  the in-memory stock market history (never saved)
//   game.peakClickRate  the most clicks seen within one second (for the click-speed achievements)
import { newState } from "./core/state.js";
import { derive } from "./core/economy.js";
import { createMarket } from "./core/market.js";

export const game = {
  S: newState(Date.now()),
  D: null,
  mkt: createMarket(),
  peakClickRate: 0,
};
game.D = derive(game.S);

// Call after anything that changes what the player owns
export function refreshDerived() {
  game.D = derive(game.S);
}
