// The Jobs list under the big dollar: one button per job, showing locked / ready / cooling down.
import { game } from "../game.js"
import { INDUSTRIES } from "../core/data/industries.js"
import { jobPay, jobPaySecs, jobTimeLeft, jobUnlocked } from "../core/jobs.js"
import { JOBS } from "../jobs/index.js"
import { money, mmss } from "../core/format.js"
import { $ } from "./dom.js"

const els = {}

// Builds the buttons. Each carries data-job; main.js opens the job when it's clicked.
export function buildJobList() {
  const wrap = $("jobList")
  wrap.innerHTML = ""
  for (const job of JOBS) {
    const button = document.createElement("button")
    button.className = "job locked"
    button.dataset.tt = "job:" + job.id
    button.dataset.job = job.id
    button.innerHTML = `<span class="ji">${job.icon}</span><span class="jm"><span class="jt">${job.name}</span><span class="jd"></span></span><span class="js"></span>`
    wrap.appendChild(button)
    els[job.id] = {
      el: button,
      desc: button.querySelector(".jd"),
      st: button.querySelector(".js")
    }
  }
}

// Updates every button
export function renderJobs() {
  const { state, derived } = game,
    now = Date.now()
  let unlockedCount = 0
  for (const job of JOBS) {
    const entry = els[job.id],
      unlocked = jobUnlocked(state, job),
      left = jobTimeLeft(state, job, now),
      ready = unlocked && left === 0
    if (unlocked) unlockedCount++
    entry.el.className = "job " + (!unlocked ? "locked" : ready ? "ready" : "wait")
    if (!unlocked) {
      entry.desc.textContent = `Acquire ${INDUSTRIES[job.ind].name} to unlock`
      entry.st.textContent = "🔒"
    } else {
      entry.desc.textContent = `Pays ${money(jobPay(derived, job))} · ${jobPaySecs(job) / 60} min of income`
      entry.st.textContent = ready ? "GO ▶" : "⏳ " + mmss(left)
    }
  }
  $("jobsCount").textContent = `${unlockedCount} / ${JOBS.length}`
}
