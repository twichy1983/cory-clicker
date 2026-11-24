// Jobs: one minigame per industry, unlocked by owning that industry.
// Each job pays several minutes of its industry's income and can be played once per cooldown
// (the cooldown starts when a shift starts, win or lose). The minigames themselves live in src/jobs/.
import { rules } from "./rules.js";
import { earn } from "./economy.js";

const JOB_COOLDOWN = 5 * 60 * 1000; // default: once every 5 minutes
const JOB_PAY_SECS = 5 * 60; // default: pays 5 minutes of the industry's income

export const JOB_DEFS = [
  {
    id: "lemon",
    ind: 0,
    icon: "🍋",
    name: "Backwash Refills",
    blurb: "Resell customers' half-drunk leftovers as fresh lemonade.",
  },
  {
    id: "milk",
    ind: 1,
    icon: "🥛",
    name: "School Milk Contract",
    blurb: "Dose the school milk with chalk and formaldehyde, on the beat.",
  },
  {
    id: "waste",
    ind: 2,
    icon: "🛢️",
    name: "Toxic Dumping",
    blurb: "Dump the plant's waste into the town's drinking water.",
    cooldown: 2 * 60 * 1000,
    paySecs: 10 * 60,
  },
  {
    id: "dye",
    ind: 3,
    icon: "🧪",
    name: "Toddler Cereal Lab",
    blurb: "Make kids' cereal glow with industrial dyes.",
  },
  {
    id: "shred",
    ind: 4,
    icon: "🧸",
    name: "Destroy the Evidence",
    blurb: "Shred the memos proving you knew the heaters catch fire.",
  },
  {
    id: "price",
    ind: 5,
    icon: "💊",
    name: "Your Money or Your Life",
    blurb: "Price-gouge a life-saving pill until the outrage boils over.",
  },
  {
    id: "gauge",
    ind: 6,
    icon: "⏲️",
    name: "Skip Maintenance",
    blurb: "Run the refinery flat-out with the crew still inside.",
  },
  {
    id: "defeat",
    ind: 7,
    icon: "🚗",
    name: "Defeat Device",
    blurb: "Smog the city on the road, fool the regulators on the test rig.",
  },
  {
    id: "accounts",
    ind: 8,
    icon: "🏦",
    name: "Surprise Accounts",
    blurb: "Open accounts for everyone, including the dead. Avoid auditors.",
  },
  {
    id: "shell",
    ind: 9,
    icon: "🐚",
    name: "Hide the Pension",
    blurb: "Stash the raided pension fund in offshore shell companies.",
  },
];
export const JOB_BY_ID = Object.fromEntries(JOB_DEFS.map((j) => [j.id, j]));

export const jobCooldown = (j) =>
  rules.jobCooldown || j.cooldown || JOB_COOLDOWN;
export const jobPaySecs = (j) => j.paySecs || JOB_PAY_SECS;
export const jobPay = (D, j) => D.indCps[j.ind] * jobPaySecs(j);
export const jobUnlocked = (S, j) => S.owned[j.ind] > 0;
// ms until the job can be played again (0 = ready)
export const jobTimeLeft = (S, j, now) =>
  Math.max(0, (S.jobs[j.id] || 0) - now);

export function startJobCooldown(S, j, now) {
  S.jobs[j.id] = now + jobCooldown(j);
}

export function recordJobWin(S, j) {
  S.jobWins[j.id] = (S.jobWins[j.id] || 0) + 1;
}

export const totalJobWins = (S) =>
  Object.values(S.jobWins).reduce((a, b) => a + b, 0);

// A won shift: pays the job's reward and counts the win. Returns { type: "jobWon", job, reward }.
export function winJob(S, D, j) {
  const reward = jobPay(D, j);
  earn(S, D, reward);
  recordJobWin(S, j);
  return { type: "jobWon", job: j, reward };
}

// Compares every job with how it was last time and returns what changed:
// { type: "jobUnlocked", job } and { type: "jobReady", job } (ready again after a cooldown).
// `seen` is the caller's memory between calls ({} to start); the first look at a job reports nothing.
export function jobChanges(seen, S, now) {
  const events = [];
  for (const j of JOB_DEFS) {
    const unlocked = jobUnlocked(S, j),
      ready = unlocked && jobTimeLeft(S, j, now) === 0,
      prev = seen[j.id];
    if (prev && !prev.unlocked && unlocked)
      events.push({ type: "jobUnlocked", job: j });
    if (prev && prev.unlocked && !prev.ready && ready)
      events.push({ type: "jobReady", job: j });
    seen[j.id] = { unlocked, ready };
  }
  return events;
}
