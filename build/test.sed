s|<title>Clickonomics</title>|<title>Clickonomics [TEST]</title>|
s|const SAVE_KEY = "coryClicker.save.v1";|const SAVE_KEY = "coryClicker.TEST.save.v1"; // TEST: separate from the real save|
s|^  return Math.ceil(b \* (Math.pow(COST_GROWTH, n) - 1) / (COST_GROWTH - 1));|  return 0; // TEST: free|
s|^const timerLobbyCost   = () => .*|const timerLobbyCost   = () => 0; // TEST: free|
s|^const penaltyLobbyCost = () => .*|const penaltyLobbyCost = () => 0; // TEST: free|
s|^const UPG_BY_ID = .*|UPGRADES.forEach(u => { u.cost = 0; if (u.type === "click") u.unlockAt = 0; }); // TEST: free\n&|
s|· Clickonomics`|· Clickonomics [TEST]`|
s|^const timerFireCost    = () => .*|const timerFireCost    = () => 0; // TEST: free|
s|^const penaltyFireCost  = () => .*|const penaltyFireCost  = () => 0; // TEST: free|
