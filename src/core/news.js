// Headlines for the news ticker under the big dollar.
import { HOUR } from "./constants.js"
import { UPGRADES } from "./data/upgrades.js"
import { ordinal } from "./format.js"

const NEWS = [
  "Analysts upgrade your stock to 'Morally Bankrupt (Strong Buy)'.",
  "PR department replaces the word 'scandal' with 'learning journey' in all communications.",
  "Local regulator threatens to send a 'very stern letter'.",
  "Your lobbyist spotted golfing with an entire Senate subcommittee. Again.",
  "Quarterly earnings call ends with standing ovation and three subpoenas.",
  "Company pledges to be 'carbon neutral by 2099, conditions apply'.",
  "Ethics hotline rerouted to the sales department for 'synergy'.",
  "Board approves record bonuses to celebrate record settlements.",
  "New mission statement: 'Doing well by doing whatever.'",
  "Compliance department downsized to a single motivational poster.",
  "Your annual report is printed on paper made from shredded internal memos.",
  "Survey finds 0 out of 10 customers recommend you. Shareholders: 10 out of 10.",
  "Whistleblower promoted to Director of Not Saying Anything.",
  "Corporate retreat theme announced: 'Plausible Deniability'."
]

// Picks a headline that fits the current situation
export function newsLine(S, D, now, random = Math.random) {
  const left = S.deadline - now
  if (S.fines > 0 && left < HOUR) return "BREAKING: Federal marshals are warming up the padlock truck. PAY YOUR FINES."
  if (S.fines > 0 && S.dollars < S.fines && random() < 0.4)
    return "Auditors note that your fines now exceed your cash. Someone in accounting is sweating."
  if (D.fineMult < 0 && random() < 0.4)
    return "Regulators issue a refund check to you and thank you for your continued patronage."
  if (S.bankruptcies > 0 && random() < 0.15)
    return `Business press notes this is your company's ${ordinal(S.bankruptcies + 1)} incarnation.`
  if (D.scandals > 0 && random() < 0.3) {
    const owned = UPGRADES.filter((u) => u.type === "scandal" && S.upgrades[u.id])
    const u = owned[Math.floor(random() * owned.length)]
    return `Op-ed: "${u.name}" called "a bold business decision" by people who own your stock.`
  }
  return NEWS[Math.floor(random() * NEWS.length)]
}
