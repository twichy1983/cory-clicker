// Game balance numbers shared across the game.
export const HOUR = 3600 * 1000
export const BASE_TIMER = 24 * HOUR // regulatory deadline window before any Timer Lobbyists
export const BASE_FINE_RATE = 0.1 // fines accrue as 10% of all revenue, times the fine multiplier
export const COST_GROWTH = 1.14 // each industry costs 14% more than the last one
export const SCANDAL_MULT = 1.5 // each scandal multiplies its industry's income (they stack: 10 scandals = ×57.7)
export const DOUBLER_MULT = 2 // each efficiency upgrade doubles its industry's income
export const GLOBAL_MULT = 2 // each company-wide upgrade doubles all income
export const ACHIEVEMENT_BONUS = 0.01 // each achievement adds 1% to all income
export const TIMER_LOBBY = { base: 50000, growth: 1.6 }
export const PENALTY_LOBBY = { base: 10000, growth: 1.3 }
