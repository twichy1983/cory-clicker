// The saved game state. Everything the game needs to remember lives in one plain object (state).
import { BASE_TIMER } from "./constants.js"
import { INDUSTRIES } from "./data/industries.js"

export const MAX_COMPANY_NAME = 128

/**
 * The saved game state (`game.state`). Times are milliseconds since 1970 unless noted.
 * Never rename these fields: they are stored in saves.
 * @typedef {object} GameState
 * @property {number} version  save format version
 * @property {string} company  company name chosen by the player
 * @property {number} dollars  cash on hand
 * @property {number} runEarned  money earned since the last bankruptcy
 * @property {number} allTimeEarned  money earned in total, across bankruptcies
 * @property {number[]} owned  how many of each industry the player owns, by index in INDUSTRIES
 * @property {Record<string, true>} upgrades  ids of the bought upgrades and scandals
 * @property {number} timerLobbyists  lobbyists that lengthen the fine deadline
 * @property {number} penaltyLobbyists  lobbyists that lower fines
 * @property {number} fines  unpaid regulatory fines
 * @property {number} deadline  when unpaid fines cause bankruptcy
 * @property {number} clicks  times the big dollar was clicked
 * @property {number} clickEarned  money earned by clicking
 * @property {number} finesPaid  fines paid in total
 * @property {number} rebatesCollected  rebates for paying fines early
 * @property {number} bankruptcies  times the player went bankrupt
 * @property {number} cyclesSurvived  deadlines survived
 * @property {Record<string, number>} achievements  achievement id -> when it was unlocked
 * @property {number} playTime  seconds played (only while the page is visible)
 * @property {Record<string, number>} jobs  job id -> when its cooldown ends
 * @property {Record<string, number>} jobWins  job id -> shifts won
 * @property {number} startedAt  when this save was created
 * @property {number} lastTick  last time the game advanced (for offline earnings)
 */

/**
 * The parts of the state that a bankruptcy resets
 * @param {number} now
 */
export function freshRun(now) {
  return {
    dollars: 0,
    runEarned: 0,
    owned: INDUSTRIES.map(() => 0),
    upgrades: {},
    timerLobbyists: 0,
    penaltyLobbyists: 0,
    fines: 0,
    deadline: now + BASE_TIMER
  }
}

/**
 * A brand new game. Lifetime stats, achievements and job history survive bankruptcy.
 * @param {number} now
 * @returns {GameState}
 */
export function newState(now) {
  return Object.assign(freshRun(now), {
    version: 1,
    company: "Capital Consolidated Holdings",
    allTimeEarned: 0,
    clicks: 0,
    clickEarned: 0,
    finesPaid: 0,
    rebatesCollected: 0,
    bankruptcies: 0,
    cyclesSurvived: 0,
    achievements: {},
    playTime: 0,
    jobs: {},
    jobWins: {},
    startedAt: now,
    lastTick: now
  })
}
