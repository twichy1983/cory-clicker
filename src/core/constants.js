// Game balance numbers shared across the game.
export const HOUR = 3600 * 1000;
export const BASE_TIMER = 24 * HOUR;          // regulatory deadline window before any Timer Lobbyists
export const BASE_FINE_RATE = 0.10;           // fines accrue as 10% of all revenue, times the fine multiplier
export const COST_GROWTH = 1.14;              // each industry costs 14% more than the last one
export const TIMER_LOBBY = { base: 50000, growth: 1.6 };
export const PENALTY_LOBBY = { base: 10000, growth: 1.3 };
