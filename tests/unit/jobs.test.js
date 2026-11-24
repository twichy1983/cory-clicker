// Unit tests for the ten minigame rules (src/jobs/*.js). The e2e suite only opens each game and
// checks it doesn't crash; these drive the real framework (a shift in the "play" phase) and the
// games' own step/input handlers, then check the outcome: strikes, wins, meters and payouts.
//
// A shift is opened through the real framework so the games that read the live `shift` export
// (waste, gauge, shell, shred, dye, accounts, defeat) see the same object the test is poking.
// tests/unit/helpers/fake-dom.js installs quiet DOM/canvas stubs and a no-op requestAnimationFrame
// so the framework imports and runs in Node without drawing or waiting on real timers.
// tests/unit/helpers/shift.js opens the shift and steps frames by hand.
import { test, afterEach } from "node:test"
import assert from "node:assert/strict"
import { startShift, stepFrame, play, closeShift } from "./helpers/shift.js"

afterEach(closeShift)

// Canvas x of the venting wheel for a waste valve (the clickable spot is above the valve body).
const wasteValveClickY = (valve) => valve.y - 62 * 1.35
// Where the three shells sit; shellPos maps slot index -> this x.
const SHELL_X = [486, 836, 1186]

/* ---------- SHARED: three strikes and you're busted ---------- */

test("jobs: three strikes busts the shift (gauge pipes bursting)", () => {
  const { shift } = startShift("gauge")
  for (let i = 0; i < 3; i++) {
    shift.gauges[0].pressure = 1 // past the red: the pipe bursts, which is a strike
    stepFrame(shift, 0.01)
  }
  assert.equal(shift.strikes, 3)
  assert.equal(shift.phase, "over")
  assert.equal(shift.result, "busted")
})

/* ---------- LEMON: short pour ---------- */

test("lemon: a pour inside the green zone sells a recycled cup", () => {
  const { shift } = startShift("lemon")
  shift.served = 0
  shift.game.down(shift)
  shift.level = shift.line + 0.04 // just above the legal minimum, within the 0.08 zone
  shift.game.up(shift)
  assert.equal(shift.served, 1)
  assert.equal(shift.strikes, 0)
})

test("lemon: under the line is a complaint (strike), way over wastes backwash (no credit)", () => {
  const { shift } = startShift("lemon")
  shift.served = 0
  shift.game.down(shift)
  shift.level = shift.line - 0.1 // short of the minimum
  shift.game.up(shift)
  assert.equal(shift.strikes, 1)
  assert.equal(shift.served, 0)
  shift.game.down(shift)
  shift.level = shift.line + 0.5 // way over the line
  shift.game.up(shift)
  assert.equal(shift.served, 0) // no credit, but no new strike either
  assert.equal(shift.strikes, 1)
})

test("lemon: serving the goal number of cups wins the shift", () => {
  const { shift } = startShift("lemon")
  shift.served = 7 // one short of the goal of 8
  shift.game.down(shift)
  shift.level = shift.line + 0.02
  shift.game.up(shift)
  assert.equal(shift.served, 8)
  assert.equal(shift.phase, "over")
  assert.equal(shift.result, "win")
})

/* ---------- MILK: rhythm dosing ---------- */

test("milk: dosing a jug with the right chemical on the beat is a perfect", () => {
  const { shift } = startShift("milk")
  shift.jugs = [{ hitTime: 5, chem: 0, res: null }] // needs chemical 0 (tap water)
  shift.elapsed = 5 // exactly on the jug's beat
  const used = shift.game.key(shift, "1") // key "1" selects chemical 0
  assert.equal(used, true)
  assert.equal(shift.jugs[0].res, "perfect")
  assert.equal(shift.done, 1)
  assert.equal(shift.combo, 1)
})

test("milk: hitting a jug off the exact beat (but in time) is a good, not a perfect", () => {
  const { shift } = startShift("milk")
  shift.jugs = [{ hitTime: 5, chem: 0, res: null }]
  shift.elapsed = 5.15 // inside the good window (0.2) but past the perfect window (0.09)
  shift.game.key(shift, "1")
  assert.equal(shift.jugs[0].res, "good")
})

test("milk: the wrong chemical is a strike and resets the combo", () => {
  const { shift } = startShift("milk")
  shift.combo = 4
  shift.jugs = [{ hitTime: 5, chem: 0, res: null }] // needs tap water
  shift.elapsed = 5
  shift.game.key(shift, "2") // key "2" is chalk: wrong
  assert.equal(shift.jugs[0].res, "wrong")
  assert.equal(shift.strikes, 1)
  assert.equal(shift.combo, 0)
})

test("milk: a key for no chemical isn't used, and an off-beat press just breaks the combo", () => {
  const { shift } = startShift("milk")
  assert.equal(shift.game.key(shift, "q"), false) // unrelated key: framework won't preventDefault it
  shift.combo = 4
  shift.jugs = [{ hitTime: 20, chem: 0, res: null }] // nearest jug is far away
  shift.elapsed = 5
  shift.game.key(shift, "1")
  assert.equal(shift.judge, "OFF BEAT")
  assert.equal(shift.combo, 0)
  assert.equal(shift.strikes, 0)
})

test("milk: a jug that sails past the line undosed is a miss (combo resets, no strike)", () => {
  const { shift } = startShift("milk")
  shift.combo = 5
  shift.jugs = [{ hitTime: 1, chem: 0, res: null }]
  shift.elapsed = 1.3 // past the good window without a press
  stepFrame(shift, 0.01)
  assert.equal(shift.jugs[0].res, "miss")
  assert.equal(shift.combo, 0)
  assert.equal(shift.strikes, 0)
})

test("milk: dosing the goal number of jugs wins", () => {
  const { shift } = startShift("milk")
  shift.done = 23 // one short of the goal of 24
  shift.jugs = [{ hitTime: 5, chem: 0, res: null }]
  shift.elapsed = 5
  shift.game.key(shift, "1")
  assert.equal(shift.done, 24)
  assert.equal(shift.result, "win")
})

/* ---------- WASTE: pollute the lake ---------- */

test("waste: the lake heals itself over time when nothing is dumping", () => {
  const { shift } = startShift("waste")
  shift.pct = 50
  play(shift, 0.1, 10) // one second with no valves open: recover is 3% per second
  assert.ok(shift.pct < 50, "contamination should fall as the lake recovers")
  assert.ok(Math.abs(shift.pct - 47) < 0.01)
})

test("waste: tossing a toxic barrel into the lake raises contamination", () => {
  const { shift } = startShift("waste")
  shift.pct = 0
  const barrel = { spot: { x: 585, y: 885 }, x: 585, y: 885, pop: 1 }
  shift.barrels = [barrel]
  shift.game.down(shift, 585, 820) // tap a barrel (no drag)
  shift.game.up(shift, 585, 820) // let go without moving: it gets tossed into the lake
  assert.equal(shift.flying.length, 1)
  play(shift, 0.1, 8) // let it land (flight is ~0.5s)
  assert.ok(shift.pct > 0, "landed barrel adds contamination")
})

test("waste: opening a valve while the inspector is watching is a strike", () => {
  const { shift } = startShift("waste")
  shift.insp.state = "watch"
  shift.insp.caught = false
  const valve = shift.valves[0]
  shift.game.down(shift, valve.x, wasteValveClickY(valve))
  assert.equal(shift.strikes, 1)
})

test("waste: a closed valve on cooldown can't be reopened", () => {
  const { shift } = startShift("waste")
  const valve = shift.valves[0]
  valve.open = false
  valve.cool = 2
  shift.game.down(shift, valve.x, wasteValveClickY(valve))
  assert.equal(valve.open, false)
})

test("waste: reaching 100% contamination wins", () => {
  const { shift } = startShift("waste")
  shift.pct = 99
  const valve = shift.valves[0]
  shift.game.down(shift, valve.x, wasteValveClickY(valve)) // open a valve to push past 100
  play(shift, 0.1, 20)
  assert.equal(shift.phase, "over")
  assert.equal(shift.result, "win")
})

/* ---------- GAUGE: skip maintenance ---------- */

test("gauge: a gauge can only be vented once its needle is past the yellow line", () => {
  const { shift } = startShift("gauge")
  const gauge = shift.gauges[0]
  gauge.pressure = 0.3 // below the vent threshold of 0.55
  shift.game.down(shift, gauge.x, gauge.y)
  assert.equal(gauge.pressure, 0.3, "too-low gauge is not vented")
  gauge.pressure = 0.7 // past yellow
  shift.game.down(shift, gauge.x, gauge.y)
  assert.ok(gauge.pressure < 0.1, "a venting drops the pressure right down")
})

test("gauge: a needle reaching the red bursts the pipe (a strike) and resets the gauge", () => {
  const { shift } = startShift("gauge")
  const gauge = shift.gauges[0]
  gauge.pressure = 1
  stepFrame(shift, 0.01)
  assert.equal(shift.strikes, 1)
  assert.ok(gauge.pressure < 0.5, "pressure drops back after the burst")
  assert.ok(gauge.fire > 0, "the burst sets a fire")
})

test("gauge: more gauges come online as the shift goes on", () => {
  const { shift } = startShift("gauge")
  assert.equal(shift.gauges.length, 3)
  shift.elapsed = 22
  shift.gauges.forEach((gauge) => (gauge.pressure = 0.05)) // keep them calm so none burst
  stepFrame(shift, 0.01)
  assert.equal(shift.gauges.length, 6)
})

test("gauge: surviving the full shift wins (time up is a win here)", () => {
  const { shift } = startShift("gauge")
  let frames = 0
  while (shift.phase === "play" && frames < 4000) {
    shift.gauges.forEach((gauge) => (gauge.pressure = 0.05)) // vent everything, never burst
    stepFrame(shift, 0.05)
    frames++
  }
  assert.ok(shift.elapsed >= shift.game.time)
  assert.equal(shift.result, "win")
})

/* ---------- SHELL: follow the money ---------- */

test("shell: picking the shell hiding the money finds it", () => {
  const { shift } = startShift("shell")
  shift.stage = "pick"
  shift.found = 0
  shift.money = 1
  shift.slot = [0, 1, 2]
  shift.game.down(shift, SHELL_X[shift.slot[1]], 640) // click the shell at the money's slot
  assert.equal(shift.found, 1)
  assert.equal(shift.pickI, 1)
  assert.equal(shift.stage, "reveal")
})

test("shell: picking the wrong shell is a strike", () => {
  const { shift } = startShift("shell")
  shift.stage = "pick"
  shift.found = 0
  shift.money = 1
  shift.slot = [0, 1, 2]
  shift.game.down(shift, SHELL_X[shift.slot[0]], 640) // money is under index 1, not 0
  assert.equal(shift.strikes, 1)
  assert.equal(shift.found, 0)
})

test("shell: finding the money the goal number of times wins", () => {
  const { shift } = startShift("shell")
  shift.stage = "pick"
  shift.found = 4 // one short of the goal of 5
  shift.money = 1
  shift.slot = [0, 1, 2]
  shift.game.down(shift, SHELL_X[shift.slot[1]], 640)
  assert.equal(shift.found, 5)
  play(shift, 0.2, 10) // the reveal animation plays out, then the shift ends
  assert.equal(shift.phase, "over")
  assert.equal(shift.result, "win")
})

test("shell: a shuffle actually swaps the two shells' positions", () => {
  const { shift } = startShift("shell")
  shift.stage = "shuffle"
  shift.stageTimer = 0
  shift.swapsLeft = 1
  shift.swap = { indexA: 0, indexB: 1, dur: 0.3 }
  play(shift, 0.1, 5)
  assert.deepEqual(shift.slot, [1, 0, 2]) // slots 0 and 1 traded places
})

/* ---------- SHRED: destroy the evidence ---------- */

test("shred: clicking an incriminating letter shreds it", () => {
  const { shift } = startShift("shred")
  shift.spawn = 999 // stop new letters spawning during the test
  shift.shredded = 0
  shift.letters = [{ x: 400, y: 400, vy: 0, phase: 0, sway: 0, keep: false }]
  shift.game.down(shift, 400, 400)
  assert.equal(shift.shredded, 1)
})

test("shred: shredding a KEEP folder costs progress", () => {
  const { shift } = startShift("shred")
  shift.spawn = 999
  shift.shredded = 5
  shift.letters = [{ x: 400, y: 400, vy: 0, phase: 0, sway: 0, keep: true, text: "YACHT TITLE" }]
  shift.game.down(shift, 400, 400)
  assert.equal(shift.shredded, 2) // 5 minus the 3-document penalty
})

test("shred: a letter that reaches the inbox is a strike", () => {
  const { shift } = startShift("shred")
  shift.spawn = 999
  shift.letters = [{ x: 400, y: 900, vy: 0, phase: 0, sway: 0, keep: false }] // already past the inbox line
  stepFrame(shift, 0.01)
  assert.equal(shift.strikes, 1)
})

test("shred: shredding the goal number of documents wins", () => {
  const { shift } = startShift("shred")
  shift.spawn = 999
  shift.shredded = 19 // one short of the goal of 20
  shift.letters = [{ x: 400, y: 400, vy: 0, phase: 0, sway: 0, keep: false }]
  shift.game.down(shift, 400, 400)
  assert.equal(shift.shredded, 20)
  assert.equal(shift.result, "win")
})

/* ---------- ACCOUNTS: surprise accounts ---------- */

test("accounts: a ghost customer counts double", () => {
  const { shift } = startShift("accounts")
  shift.opened = 0
  const slot = shift.slots[0]
  Object.assign(slot, { who: "👻", ghost: true, aud: false, age: 0.2, life: 2 })
  shift.game.down(shift, slot.x, slot.y)
  assert.equal(shift.opened, 2)
})

test("accounts: clicking an auditor is a strike", () => {
  const { shift } = startShift("accounts")
  const slot = shift.slots[0]
  Object.assign(slot, { who: "🕵️", aud: true, ghost: false, age: 0.2, life: 2 })
  shift.game.down(shift, slot.x, slot.y)
  assert.equal(shift.strikes, 1)
})

test("accounts: a customer who just appeared can't be clicked yet", () => {
  const { shift } = startShift("accounts")
  shift.opened = 0
  const slot = shift.slots[0]
  Object.assign(slot, { who: "🧑", aud: false, ghost: false, age: 0.05, life: 2 }) // age below 0.08
  shift.game.down(shift, slot.x, slot.y)
  assert.equal(shift.opened, 0)
})

test("accounts: opening the goal number of accounts wins (and the count is capped at the goal)", () => {
  const { shift } = startShift("accounts")
  shift.opened = 24 // one short of the goal of 25
  const slot = shift.slots[0]
  Object.assign(slot, { who: "👻", ghost: true, aud: false, age: 0.2, life: 2 }) // a ghost would add 2
  shift.game.down(shift, slot.x, slot.y)
  assert.equal(shift.opened, 25) // capped at the goal, not 26
  assert.equal(shift.result, "win")
})

/* ---------- DEFEAT: defeat device ---------- */

test("defeat: beast mode on the road fills the profit meter; clean mode earns nothing", () => {
  const { shift } = startShift("defeat")
  shift.env = "road"
  shift.next = 999 // no test interrupts
  shift.mode = "beast"
  shift.pct = 0
  stepFrame(shift, 0.5)
  assert.ok(shift.pct > 0, "beast mode on the road prints money")
  shift.mode = "clean"
  shift.pct = 0
  stepFrame(shift, 0.5)
  assert.equal(shift.pct, 0, "clean mode on the road earns nothing")
})

test("defeat: beast mode during an emissions test gets caught (a strike)", () => {
  const { shift } = startShift("defeat")
  shift.env = "test"
  shift.mode = "beast"
  shift.caught = false
  stepFrame(shift, 0.1)
  assert.equal(shift.strikes, 1)
  assert.equal(shift.caught, true)
})

test("defeat: a warning flashes just before each test", () => {
  const { shift } = startShift("defeat")
  shift.env = "road"
  shift.envT = 0
  shift.next = 2
  shift.warned = false
  shift.mode = "clean"
  stepFrame(shift, 1.1) // one second before the test is due
  assert.equal(shift.warned, true)
  assert.equal(shift.env, "road")
})

test("defeat: filling the profit meter wins", () => {
  const { shift } = startShift("defeat")
  shift.env = "road"
  shift.mode = "beast"
  shift.pct = 99.9
  shift.next = 999
  stepFrame(shift, 0.5)
  assert.equal(shift.phase, "over")
  assert.equal(shift.result, "win")
})

/* ---------- PRICE: price hike ---------- */

test("price: outrage climbs faster at a higher price", () => {
  function outrageAfterASecond(price) {
    const { shift } = startShift("price")
    shift.price = price
    shift.outrage = 0
    shift.nextNews = 999 // no random viral stories
    play(shift, 0.1, 10)
    const outrage = shift.outrage
    closeShift()
    return outrage
  }
  assert.ok(outrageAfterASecond(5000) > outrageAfterASecond(50))
})

test("price: at the base price outrage stays calm", () => {
  const { shift } = startShift("price")
  shift.price = 5 // the floor: heat is zero, so the calm term wins
  shift.outrage = 10
  shift.nextNews = 999
  play(shift, 0.1, 30)
  assert.ok(shift.outrage < 10, "outrage falls back toward zero at the base price")
})

test("price: PR spin cuts outrage and spends a charge; bribe cuts more but costs revenue", () => {
  const { shift } = startShift("price")
  shift.outrage = 80
  shift.spins = 3
  shift.game.down(shift, 910, 770) // the PR SPIN button
  assert.equal(shift.outrage, 58) // down by the 22 spin
  assert.equal(shift.spins, 2)
  shift.outrage = 90
  shift.bribeCd = 0
  shift.pct = 50
  shift.game.down(shift, 1280, 770) // the BRIBE button
  assert.equal(shift.outrage, 30) // down by the 60 bribe
  assert.equal(shift.pct, 42) // minus 8% revenue
  assert.ok(shift.bribeCd > 0, "the bribe goes on cooldown")
})

test("price: outrage reaching 100% busts you, but the gouging profit is still paid out", () => {
  const { shift, payOuts } = startShift("price")
  shift.outrage = 99.9
  shift.price = 100
  shift.profit = 1000
  stepFrame(shift, 1)
  assert.equal(shift.phase, "over")
  assert.equal(shift.result, "busted")
  assert.equal(payOuts.length, 1)
  assert.equal(payOuts[0].amount, shift.paidProfit)
  assert.ok(payOuts[0].amount > 0)
})

test("price: filling the revenue meter wins", () => {
  const { shift } = startShift("price")
  shift.pct = 99.9
  shift.price = 5 // keep outrage from rising while we top up revenue
  shift.nextNews = 999
  stepFrame(shift, 0.5)
  assert.equal(shift.phase, "over")
  assert.equal(shift.result, "win")
})

/* ---------- DYE: neon snack lab ---------- */

test("dye: clicking a bottle sends a drop that lands in the batch", () => {
  const { shift } = startShift("dye")
  shift.drops = { red: 0, yellow: 0, blue: 0 }
  shift.falling = []
  shift.game.down(shift, 210, 610) // the red dye bottle
  assert.equal(shift.falling.length, 1)
  play(shift, 0.1, 5) // the drop falls (0.35s) and lands
  assert.equal(shift.drops.red, 1)
})

test("dye: a 100% colour match ships the batch automatically", () => {
  const { shift } = startShift("dye")
  shift.order = { name: "Cheese Dust", red: 0, yellow: 3, blue: 0 }
  shift.drops = { red: 0, yellow: 3, blue: 0 } // exactly the order
  shift.falling = []
  shift.shipT = 0
  stepFrame(shift, 0.1)
  assert.ok(shift.shipT > 0, "a matching batch starts shipping")
})

test("dye: the flush button empties the batch", () => {
  const { shift } = startShift("dye")
  shift.drops = { red: 3, yellow: 1, blue: 0 }
  shift.game.down(shift, 1120, 700) // the FLUSH button
  assert.deepEqual(shift.drops, { red: 0, yellow: 0, blue: 0 })
  assert.ok(shift.flushT > 0)
})

test("dye: shipping the goal number of formulas wins", () => {
  const { shift } = startShift("dye")
  shift.shipped = 4 // one short of the goal of 5
  shift.order = { name: "Cheese Dust", red: 0, yellow: 3, blue: 0 }
  shift.drops = { red: 0, yellow: 3, blue: 0 }
  shift.falling = []
  shift.shipT = 0
  stepFrame(shift, 0.1) // starts shipping
  play(shift, 0.1, 12) // the ship animation finishes and the fifth formula completes
  assert.equal(shift.phase, "over")
  assert.equal(shift.result, "win")
})
