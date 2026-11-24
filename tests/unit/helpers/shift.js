// Helpers for driving a real minigame shift in a unit test, through the real framework.
// fake-dom.js must already be imported (this module imports it first, as a side effect).
import "./fake-dom.js"
import { game, refreshDerived } from "../../../src/game.js"
import * as framework from "../../../src/jobs/framework.js"
import { JOB_BY_ID } from "../../../src/jobs/index.js"

// Open a shift for a job and put it straight into the "play" phase, the way the framework does
// when the player presses "Start shift". Returns the live `shift` object the game reads and writes,
// plus `payOuts`: every payOut(amount, text) the minigame makes, so price-gouging can be checked.
export function startShift(jobId) {
  const job = JOB_BY_ID[jobId]
  // Owning the industry unlocks the job; clear any cooldown so openJob accepts it.
  game.state.owned[job.ind] = Math.max(1, game.state.owned[job.ind])
  game.state.jobs[job.id] = 0
  refreshDerived()
  const payOuts = []
  framework.setJobHooks({
    onStart() {},
    onWin() {
      return 0
    },
    onPayOut(amount, text) {
      payOuts.push({ amount, text })
    }
  })
  if (framework.jobIsOpen()) framework.closeJob()
  framework.openJob(job)
  const shift = framework.shift
  shift.phase = "play" // the framework flips this when the Start button is pressed
  return { shift, payOuts, job }
}

// Advance one animation frame with the framework's own stepJob (game step, timer, time-up ending, particles)
export function stepFrame(shift, dt) {
  framework.stepJob(dt)
  return shift
}

// Run many equal frames of play. Stops early once the shift is no longer playing (won or busted).
export function play(shift, dt, frames) {
  for (let i = 0; i < frames && shift.phase === "play"; i++) stepFrame(shift, dt)
  return shift
}

export function closeShift() {
  if (framework.jobIsOpen()) framework.closeJob()
}

export { framework }
