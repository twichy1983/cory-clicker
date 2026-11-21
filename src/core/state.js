// The saved game state. Everything the game needs to remember lives in one plain object (S).
import { BASE_TIMER } from "./constants.js";
import { INDUSTRIES } from "./data/industries.js";

// The parts of the state that a bankruptcy resets
export function freshRun(now) {
  return {
    dollars: 0, runEarned: 0,
    owned: INDUSTRIES.map(() => 0),
    upgrades: {},
    timerLobbyists: 0, penaltyLobbyists: 0,
    fines: 0, deadline: now + BASE_TIMER,
  };
}

// A brand new game. Lifetime stats, achievements and job history survive bankruptcy.
export function newState(now) {
  return Object.assign(freshRun(now), {
    version: 1, company: "Capital Consolidated Holdings",
    allTimeEarned: 0, clicks: 0, clickEarned: 0,
    finesPaid: 0, rebatesCollected: 0, bankruptcies: 0, cyclesSurvived: 0,
    achievements: {}, playTime: 0, jobs: {}, jobWins: {},
    startedAt: now, lastTick: now,
  });
}
