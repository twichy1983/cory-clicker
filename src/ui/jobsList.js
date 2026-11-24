// The Jobs list under the big dollar: one button per job, showing locked / ready / cooling down.
import { game } from "../game.js";
import { INDUSTRIES } from "../core/data/industries.js";
import { jobPay, jobPaySecs, jobTimeLeft, jobUnlocked } from "../core/jobs.js";
import { JOBS } from "../jobs/index.js";
import { money, mmss } from "../core/format.js";
import { $ } from "./dom.js";

const els = {};

// Builds the buttons. Each carries data-job; main.js opens the job when it's clicked.
export function buildJobList() {
  const wrap = $("jobList");
  wrap.innerHTML = "";
  for (const j of JOBS) {
    const b = document.createElement("button");
    b.className = "job locked";
    b.dataset.tt = "job:" + j.id;
    b.dataset.job = j.id;
    b.innerHTML = `<span class="ji">${j.icon}</span><span class="jm"><span class="jt">${j.name}</span><span class="jd"></span></span><span class="js"></span>`;
    wrap.appendChild(b);
    els[j.id] = {
      el: b,
      d: b.querySelector(".jd"),
      st: b.querySelector(".js"),
    };
  }
}

// Updates every button
export function renderJobs() {
  const { S, D } = game,
    now = Date.now();
  let unlockedCount = 0;
  for (const j of JOBS) {
    const e = els[j.id],
      unlocked = jobUnlocked(S, j),
      left = jobTimeLeft(S, j, now),
      ready = unlocked && left === 0;
    if (unlocked) unlockedCount++;
    e.el.className = "job " + (!unlocked ? "locked" : ready ? "ready" : "wait");
    if (!unlocked) {
      e.d.textContent = `Acquire ${INDUSTRIES[j.ind].name} to unlock`;
      e.st.textContent = "🔒";
    } else {
      e.d.textContent = `Pays ${money(jobPay(D, j))} · ${jobPaySecs(j) / 60} min of income`;
      e.st.textContent = ready ? "GO ▶" : "⏳ " + mmss(left);
    }
  }
  $("jobsCount").textContent = `${unlockedCount} / ${JOBS.length}`;
}
