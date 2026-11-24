// Switches that change the rules for test mode (?test). main.js turns them on; the real game leaves them off.
export const rules = {
  freePurchases: false, // industries, upgrades and lobbyists cost $0, and click upgrades unlock immediately
  jobCooldown: 0 // ms; when set, every job can be replayed after this long instead of its normal cooldown
}
