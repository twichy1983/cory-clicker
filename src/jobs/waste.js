import { CANVAS_WIDTH, CANVAS_HEIGHT, rand, pick, clamp, roundedRect, vgrad, hgrad, emoji } from "./draw.js"
import { shift, floatText, jobAlert, jobStrike, endJob, jobImage, imgReady } from "./framework.js"

/** @typedef {import("./framework.js").Minigame} Minigame */

/* ---------------------------------------------------------
   JOB: WASTE DISPOSAL (Processing Plant)
   Pollute the lake to 100% by opening sludge valves and tossing toxic barrels,
   without the inspector catching you 3 times. Scene art: assets/job-lake.webp.
   --------------------------------------------------------- */
const WASTE = {
  valveRate: 3.6,
  valveOpen: 2.6,
  valveCool: 2.0, // % per second while open, seconds open, seconds before reuse
  barrelAmt: 7,
  barrelEvery: 2.3,
  maxBarrels: 3,
  recover: 3.0, // the lake cleans itself, % per second
  warn: 1.3,
  watch: 2.6,
  gapMin: 4.2,
  gapMax: 6.8,
  firstAt: 5
  // Tuned so flawless instant play finishes in ~20 s; real players need most of the 30 s.
}
const LAKE = [
  [215, 455],
  [400, 447],
  [600, 450],
  [800, 445],
  [1000, 447],
  [1200, 452],
  [1350, 462],
  [1450, 480],
  [1520, 530],
  [1560, 590],
  [1530, 640],
  [1470, 690],
  [1420, 730],
  [1330, 800],
  [1250, 850],
  [1100, 875],
  [950, 880],
  [800, 865],
  [700, 845],
  [600, 820],
  [470, 790],
  [380, 770],
  [280, 738],
  [220, 690],
  [185, 620],
  [175, 560],
  [190, 500]
]
const OUTFALLS = [
  { x: 740, y: 450 },
  { x: 990, y: 450 },
  { x: 1330, y: 466 }
]
const BARREL_SPOTS = [
  { x: 585, y: 885 },
  { x: 1010, y: 908 },
  { x: 1455, y: 885 }
]
// The inspector rises from behind the green bush; the bush is re-drawn from the scene image over his lower half.
const INSPECTOR = {
  x: 1112,
  showY: 338,
  hideY: 448,
  cropX: 1030,
  cropY: 336,
  cropW: 170,
  cropH: 130
}
const OUT_SCALE = 1.35,
  BARREL_SCALE = 1.35
function inLake(x, y) {
  let inside = false
  for (let i = 0, j = LAKE.length - 1; i < LAKE.length; j = i++) {
    const [currentX, currentY] = LAKE[i],
      [previousX, previousY] = LAKE[j]
    if (
      currentY > y !== previousY > y &&
      x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX
    )
      inside = !inside
  }
  return inside
}
function lakePath(ctx) {
  ctx.beginPath()
  LAKE.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
}
const easeOutBack = (progress) => 1 + 2.4 * Math.pow(progress - 1, 3) + 1.4 * Math.pow(progress - 1, 2)

/** @type {Minigame} */
const WasteGame = {
  time: 30,
  strikes: 3,
  meter: "LAKE CONTAMINATION",
  image: "assets/job-lake.webp",
  tagline:
    "Licensed hazardous-waste disposal costs $4 million a year. The lake behind the plant is free. It's also the town's drinking water, which the board described as 'not our department.'",
  rules: [
    "<b>Click a red valve</b> to open a sludge pipe. Click it again to shut it early.",
    "<b>Drag toxic barrels</b> into the lake, or tap one to toss it.",
    "Fill the <b>contamination meter to 100%</b> before time runs out. The lake keeps trying to heal itself. Don't let it.",
    "Watch the bushes. When the <b>inspector</b> is looking, stop dumping. Get caught 3 times and you're busted."
  ],
  winTitle: "Quota met!",
  winText:
    "The town's tap water now glows faintly at night. Legal is calling it a 'feature,' and the fish have stopped filing complaints.",
  lose: {
    busted: "The inspector photographed everything. Legal is already drafting a statement blaming a 'rogue intern.'",
    time: "Time's up. The lake survived, and so did the town's water supply. Embarrassing."
  },
  init(shift) {
    Object.assign(shift, {
      valves: OUTFALLS.map((outfall) => ({
        ...outfall,
        open: false,
        openT: 0,
        cool: 0,
        spin: 0,
        blobT: 0
      })),
      barrels: [],
      nextBarrel: 0.6,
      flying: [],
      blobs: [],
      drops: [],
      rings: [],
      insp: {
        state: "hidden",
        elapsed: 0,
        next: WASTE.firstAt,
        y: INSPECTOR.hideY,
        caught: false
      },
      drag: null
    })
  },
  ambient(shift, dt) {
    shift.blobs.forEach((blob) => {
      blob.radius += (blob.target - blob.radius) * Math.min(1, dt * 1.4)
      blob.x += blob.vx * dt
      blob.y += blob.vy * dt
      blob.vx *= 0.995
      blob.vy *= 0.995
      blob.phase += dt
    })
    for (const drop of shift.drops) {
      drop.vy += 900 * dt
      drop.x += drop.vx * dt
      drop.y += drop.vy * dt
      drop.life -= dt
    }
    shift.drops = shift.drops.filter((drop) => drop.life > 0)
    for (const ring of shift.rings) {
      ring.radius += 70 * dt
      ring.life -= dt
    }
    shift.rings = shift.rings.filter((ring) => ring.life > 0)
    shift.valves.forEach((valve) => {
      if (valve.open) valve.spin += dt * 9
    })
  },
  step(shift, dt) {
    let delta = -WASTE.recover * dt
    for (const valve of shift.valves) {
      if (valve.open) {
        valve.openT += dt
        delta += WASTE.valveRate * dt
        valve.blobT -= dt
        if (valve.blobT <= 0) {
          valve.blobT = 0.18
          wasteBlob(valve.x + rand(-30, 30), valve.y + 70 * OUT_SCALE + rand(0, 30), rand(28, 42), 62)
        }
        if (Math.random() < dt * 30)
          shift.drops.push({
            x: valve.x + rand(-16, 16),
            y: valve.y + 66 * OUT_SCALE,
            vx: rand(-70, 70),
            vy: rand(-240, -90),
            life: 0.5,
            sludge: true
          })
        if (valve.openT >= WASTE.valveOpen) {
          valve.open = false
          valve.cool = WASTE.valveCool
        }
      } else if (valve.cool > 0) valve.cool = Math.max(0, valve.cool - dt)
    }
    shift.nextBarrel -= dt
    if (shift.nextBarrel <= 0) {
      shift.nextBarrel = WASTE.barrelEvery
      const free = BARREL_SPOTS.filter((spot) => !shift.barrels.some((barrel) => barrel.spot === spot))
      if (free.length && shift.barrels.length < WASTE.maxBarrels) {
        const spot = pick(free)
        shift.barrels.push({ spot, x: spot.x, y: spot.y, pop: 0 })
      }
    }
    shift.barrels.forEach((barrel) => {
      barrel.pop = Math.min(1, barrel.pop + dt * 4)
      if (barrel.back) {
        barrel.x += (barrel.spot.x - barrel.x) * Math.min(1, dt * 10)
        barrel.y += (barrel.spot.y - barrel.y) * Math.min(1, dt * 10)
      }
    })
    for (const flyingBarrel of shift.flying) {
      flyingBarrel.elapsed += dt
      if (!flyingBarrel.landed && flyingBarrel.elapsed >= flyingBarrel.dur) {
        flyingBarrel.landed = true
        delta += WASTE.barrelAmt
        wasteSplash(flyingBarrel.targetX, flyingBarrel.targetY, true)
        wasteBlob(flyingBarrel.targetX, flyingBarrel.targetY, rand(55, 75), 90)
        if (shift.insp.state === "watch") wasteStrike()
        floatText("+" + WASTE.barrelAmt + "%", flyingBarrel.targetX, flyingBarrel.targetY - 40)
      }
    }
    shift.flying = shift.flying.filter((flyingBarrel) => flyingBarrel.elapsed < flyingBarrel.dur + 0.55)
    const ins = shift.insp
    ins.elapsed += dt
    if (ins.state === "hidden" && shift.elapsed >= ins.next) {
      ins.state = "warn"
      ins.elapsed = 0
      jobAlert("👀 Someone's coming…", "warn")
    } else if (ins.state === "warn" && ins.elapsed >= WASTE.warn) {
      ins.state = "watch"
      ins.elapsed = 0
      ins.caught = false
      jobAlert("🕵️ INSPECTOR WATCHING. STOP DUMPING!", "bad")
    } else if (ins.state === "watch") {
      if (shift.valves.some((valve) => valve.open)) wasteStrike()
      if (ins.elapsed >= WASTE.watch) {
        ins.state = "leave"
        ins.elapsed = 0
      }
    } else if (ins.state === "leave" && ins.elapsed >= 0.5) {
      ins.state = "hidden"
      ins.elapsed = 0
      ins.next = shift.elapsed + rand(WASTE.gapMin, WASTE.gapMax)
    }
    const targetY =
      ins.state === "watch" ? INSPECTOR.showY : ins.state === "warn" ? INSPECTOR.hideY - 22 : INSPECTOR.hideY
    ins.y += (targetY - ins.y) * Math.min(1, dt * 9)
    shift.pct = clamp(shift.pct + delta, 0, 100)
    if (shift.pct >= 100) endJob("win")
  },
  stop(shift) {
    shift.valves.forEach((valve) => (valve.open = false))
    shift.drag = null
  },
  draw(ctx, shift, now) {
    const img = jobImage(this.image)
    if (imgReady(img)) ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    else {
      ctx.fillStyle = "#4da9d8"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }
    ctx.save()
    lakePath(ctx)
    ctx.clip()
    const murk = shift.pct / 100
    ctx.fillStyle = `rgba(96,118,22,${0.58 * murk})`
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    // cartoon sludge slicks: outline pass first, then fills on top, so overlapping slicks merge into one outlined shape
    ctx.lineJoin = "round"
    ctx.strokeStyle = "#34470b"
    ctx.lineWidth = 9
    for (const blob of shift.blobs) {
      blobPath(ctx, blob)
      ctx.stroke()
    }
    for (const blob of shift.blobs) {
      blobPath(ctx, blob)
      const grd = ctx.createLinearGradient(0, blob.y - blob.radius * 0.6, 0, blob.y + blob.radius * 0.6)
      grd.addColorStop(0, blob.hue < 0.5 ? "#a3cf2e" : "#8fb32a")
      grd.addColorStop(1, blob.hue < 0.5 ? "#5c7f12" : "#6b6a17")
      ctx.fillStyle = grd
      ctx.fill()
    }
    for (const blob of shift.blobs) {
      ctx.fillStyle = "rgba(240,255,190,.55)"
      ctx.beginPath()
      ctx.ellipse(
        blob.x - blob.radius * 0.32,
        blob.y - blob.radius * 0.2,
        blob.radius * 0.26,
        blob.radius * 0.07,
        -0.15,
        0,
        Math.PI * 2
      )
      ctx.fill()
      ctx.fillStyle = "rgba(52,71,11,.5)"
      ctx.beginPath()
      ctx.ellipse(
        blob.x + blob.radius * 0.3,
        blob.y + blob.radius * 0.12,
        blob.radius * 0.1,
        blob.radius * 0.05,
        0,
        0,
        Math.PI * 2
      )
      ctx.fill()
    }
    if (murk > 0.15)
      for (let i = 0; i < 18 * murk; i++) {
        const bubbleX = 260 + ((i * 397) % 1220),
          bubbleY = 480 + ((i * 211) % 360),
          bubblePhase = (now * 1.3 + i * 0.37) % 1
        if (!inLake(bubbleX, bubbleY)) continue
        ctx.strokeStyle = `rgba(200,220,120,${0.55 * (1 - bubblePhase)})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.ellipse(bubbleX, bubbleY, 4 + bubblePhase * 9, (4 + bubblePhase * 9) * 0.5, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    for (const ring of shift.rings) {
      ctx.strokeStyle = `rgba(255,255,255,${0.6 * ring.life})`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.ellipse(ring.x, ring.y, ring.radius, ring.radius * 0.35, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
    // belly-up fish surface as the lake dies (one per 9% contamination)
    const FISH = [
      [420, 600],
      [980, 720],
      [700, 560],
      [1260, 640],
      [560, 740],
      [1120, 540],
      [860, 650],
      [1380, 700],
      [330, 680],
      [1020, 610],
      [640, 660]
    ]
    for (let i = 0; i < Math.min(FISH.length, Math.floor(shift.pct / 9)); i++) {
      const [fishX, fishY] = FISH[i]
      ctx.save()
      ctx.translate(fishX + Math.sin(now * 0.8 + i) * 6, fishY + Math.sin(now * 1.6 + i * 2) * 3)
      ctx.rotate(Math.PI + (i % 2 ? 0.25 : -0.25))
      ctx.filter = "grayscale(1) sepia(.7) hue-rotate(35deg) brightness(1.15)" // pale, sickly, belly-up
      emoji(ctx, "🐟", 0, 0, 62)
      ctx.filter = "none"
      ctx.restore()
    }
    ctx.restore()
    drawInspector(ctx, shift, now, img)
    shift.valves.forEach((valve) => {
      ctx.save()
      ctx.translate(valve.x, valve.y)
      ctx.scale(OUT_SCALE, OUT_SCALE)
      ctx.translate(-valve.x, -valve.y)
      drawOutfall(ctx, valve, now)
      ctx.restore()
    })
    shift.barrels.forEach((barrel) => {
      if (barrel !== shift.drag?.barrel)
        drawBarrel(
          ctx,
          barrel.x,
          barrel.y,
          0.55 + 0.45 * easeOutBack(barrel.pop),
          Math.sin(now * 2 + barrel.spot.x) * 0.03
        )
    })
    for (const flyingBarrel of shift.flying) {
      const progress = Math.min(1, flyingBarrel.elapsed / flyingBarrel.dur)
      if (progress < 1) {
        const x = flyingBarrel.x0 + (flyingBarrel.targetX - flyingBarrel.x0) * progress,
          y =
            flyingBarrel.y0 +
            (flyingBarrel.targetY - flyingBarrel.y0) * progress -
            Math.sin(Math.PI * progress) * flyingBarrel.arc
        drawBarrel(ctx, x, y, 1 - 0.25 * progress, flyingBarrel.spin * progress)
      } else {
        const fade = (flyingBarrel.elapsed - flyingBarrel.dur) / 0.55
        ctx.save()
        ctx.globalAlpha = 1 - fade
        drawBarrel(
          ctx,
          flyingBarrel.targetX,
          flyingBarrel.targetY + 20 * fade,
          0.75 * (1 - 0.4 * fade),
          flyingBarrel.spin + 0.5 * fade
        )
        ctx.restore()
      }
    }
    if (shift.drag) drawBarrel(ctx, shift.drag.x, shift.drag.y, 1.08, Math.sin(now * 10) * 0.08)
    for (const drop of shift.drops) {
      ctx.fillStyle = drop.sludge
        ? `rgba(96,112,26,${Math.min(1, drop.life * 2)})`
        : `rgba(225,248,255,${Math.min(1, drop.life * 2)})`
      ctx.beginPath()
      ctx.arc(drop.x, drop.y, drop.sludge ? 6 : 5, 0, Math.PI * 2)
      ctx.fill()
    }
  },
  cursor(shift, x, y) {
    return !!(wasteValveAt(x, y) || wasteBarrelAt(x, y))
  },
  down(shift, x, y) {
    const valve = wasteValveAt(x, y)
    if (valve) {
      if (valve.open) {
        valve.open = false
        valve.cool = WASTE.valveCool * (valve.openT / WASTE.valveOpen)
      } else if (valve.cool === 0) {
        valve.open = true
        valve.openT = 0
        valve.blobT = 0
        if (shift.insp.state === "watch") wasteStrike()
      }
      return
    }
    const barrel = wasteBarrelAt(x, y)
    if (barrel) shift.drag = { barrel, x, y, startX: x, startY: y, moved: false }
  },
  move(shift, x, y) {
    if (shift.drag) {
      shift.drag.x = x
      shift.drag.y = y + 40
      if (Math.hypot(x - shift.drag.startX, y - shift.drag.startY) > 14) shift.drag.moved = true
    }
  },
  up(shift, x, y) {
    if (!shift.drag) return
    const drag = shift.drag,
      barrel = drag.barrel
    shift.drag = null
    if (!drag.moved) {
      const [targetX, targetY] = wasteLakeTarget(barrel.x)
      wasteThrow(barrel, targetX, targetY)
      return
    }
    if (inLake(x, y)) {
      barrel.x = x
      barrel.y = y + 40
      wasteThrow(barrel, x, y, 0.18, 30)
    } else {
      barrel.x = x
      barrel.y = y + 40
      barrel.back = true
    }
  }
}
function wasteStrike() {
  if (shift.insp.caught) return
  shift.insp.caught = true
  jobStrike("SPOTTED!", INSPECTOR.x, INSPECTOR.showY - 150)
}
function wasteBlob(x, y, radius, max) {
  if (shift.blobs.length > 70) shift.blobs.shift()
  shift.blobs.push({
    x,
    y,
    radius: radius * 0.3,
    target: Math.min(max * 1.7, radius + shift.pct * 1.1),
    vx: rand(-14, 14),
    vy: rand(-4, 10),
    phase: rand(0, 6),
    hue: Math.random(),
    lobes: Array.from({ length: 9 }, () => rand(-0.22, 0.22))
  })
}
function blobPath(ctx, blob) {
  // wobbly, flattened (perspective) puddle outline
  const lobeCount = blob.lobes.length,
    pts = []
  for (let i = 0; i < lobeCount; i++) {
    const angle = (i / lobeCount) * Math.PI * 2,
      wobble = 1 + blob.lobes[i] + Math.sin(blob.phase * 1.6 + i) * 0.05
    pts.push([blob.x + Math.cos(angle) * blob.radius * wobble, blob.y + Math.sin(angle) * blob.radius * wobble * 0.5])
  }
  ctx.beginPath()
  for (let i = 0; i <= lobeCount; i++) {
    const point = pts[i % lobeCount],
      nextPoint = pts[(i + 1) % lobeCount],
      midX = (point[0] + nextPoint[0]) / 2,
      midY = (point[1] + nextPoint[1]) / 2
    i ? ctx.quadraticCurveTo(point[0], point[1], midX, midY) : ctx.moveTo(midX, midY)
  }
  ctx.closePath()
}
function wasteSplash(x, y, big) {
  for (let i = 0; i < (big ? 22 : 8); i++)
    shift.drops.push({
      x: x + rand(-20, 20),
      y,
      vx: rand(-260, 260),
      vy: rand(-520, -220),
      life: 0.7,
      sludge: Math.random() < 0.4
    })
  shift.rings.push({ x, y, radius: 10, life: 0.9 })
  if (big) shift.rings.push({ x, y, radius: 2, life: 1.2 })
}
function wasteValveAt(x, y) {
  return shift.valves.find((valve) => Math.hypot(x - valve.x, y - (valve.y - 62 * OUT_SCALE)) < 100)
}
function wasteBarrelAt(x, y) {
  return [...shift.barrels]
    .reverse()
    .find(
      (barrel) => Math.abs(x - barrel.x) < 66 * BARREL_SCALE && y < barrel.y + 24 && y > barrel.y - 118 * BARREL_SCALE
    )
}
function wasteThrow(barrel, targetX, targetY, dur = 0.5, arc = 170) {
  shift.barrels = shift.barrels.filter((other) => other !== barrel)
  shift.flying.push({
    x0: barrel.x,
    y0: barrel.y,
    targetX,
    targetY,
    elapsed: 0,
    dur,
    arc,
    spin: rand(-1.4, 1.4),
    landed: false
  })
}
function wasteLakeTarget(x) {
  // tap-to-toss: aim straight out into the water
  for (let y = 760; y > 470; y -= 20) if (inLake(x, y) && inLake(x + 40, y) && inLake(x - 40, y)) return [x, y - 60]
  return [870, 640]
}
function drawOutfall(ctx, valve, now) {
  const x = valve.x,
    y = valve.y,
    bodyRadius = 30,
    ready = !valve.open && valve.cool === 0 && shift.phase === "play"
  if (valve.open) {
    // sludge stream pouring out of the pipe mouth into the lake
    const fall = 70,
      wob = Math.sin(now * 14) * 4
    ctx.beginPath()
    ctx.moveTo(x - 22, y + 2)
    ctx.quadraticCurveTo(x - 24 + wob, y + fall * 0.5, x - 30, y + fall)
    ctx.lineTo(x + 30, y + fall)
    ctx.quadraticCurveTo(x + 24 - wob, y + fall * 0.5, x + 22, y + 2)
    ctx.closePath()
    ctx.fillStyle = hgrad(ctx, x - 30, x + 30, [
      [0, "#5e8212"],
      [0.45, "#b5e03a"],
      [1, "#5e8212"]
    ])
    ctx.fill()
    ctx.lineWidth = 4
    ctx.strokeStyle = "#34470b"
    ctx.stroke()
    ctx.strokeStyle = "rgba(240,255,190,.7)"
    ctx.lineWidth = 4
    ctx.lineCap = "round"
    for (let i = 0; i < 3; i++) {
      const offset = ((now * 2.6 + i / 3) % 1) * (fall - 18)
      ctx.beginPath()
      ctx.moveTo(x - 9 + i * 9, y + 6 + offset)
      ctx.lineTo(x - 10 + i * 9, y + 16 + offset)
      ctx.stroke()
    }
    ctx.lineCap = "butt"
    ctx.beginPath()
    ctx.ellipse(x, y + fall, 46 + Math.sin(now * 9) * 5, 14, 0, 0, Math.PI * 2)
    ctx.fillStyle = "#c8ee5a"
    ctx.fill()
    ctx.strokeStyle = "#34470b"
    ctx.lineWidth = 4
    ctx.stroke()
  }
  ctx.lineWidth = 4
  ctx.strokeStyle = "#2c3136"
  roundedRect(ctx, x - bodyRadius, y - 46, bodyRadius * 2, 44, 10)
  ctx.fillStyle = hgrad(ctx, x - bodyRadius, x + bodyRadius, [
    [0, "#5d656d"],
    [0.35, "#dfe4e8"],
    [0.65, "#a7afb7"],
    [1, "#4f565d"]
  ])
  ctx.fill()
  ctx.stroke()
  roundedRect(ctx, x - bodyRadius - 5, y - 24, bodyRadius * 2 + 10, 11, 4)
  ctx.fillStyle = "#7f8890"
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(x, y, bodyRadius + 3, 13, 0, 0, Math.PI * 2)
  ctx.fillStyle = "#8c949b"
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(x, y + 1, bodyRadius - 5, 8, 0, 0, Math.PI * 2)
  ctx.fillStyle = valve.open ? "#6d7f1c" : "#14171a"
  ctx.fill()
  const wheelX = x,
    wheelY = y - 86,
    wheelRadius = 27
  ctx.fillStyle = "#6d757c"
  roundedRect(ctx, x - 5, wheelY, 10, 42, 3)
  ctx.fill()
  ctx.stroke()
  if (ready) {
    ctx.strokeStyle = `rgba(255,236,120,${0.55 + 0.45 * Math.sin(now * 6)})`
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(wheelX, wheelY, wheelRadius + 11, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.save()
  ctx.translate(wheelX, wheelY)
  ctx.rotate(valve.spin)
  ctx.strokeStyle = "#2c1212"
  ctx.lineWidth = 13
  ctx.beginPath()
  ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = valve.cool > 0 ? "#8a6a6a" : "#e0302a"
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 5
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(wheelRadius - 2, 0)
    ctx.stroke()
  }
  ctx.fillStyle = "#3a3f44"
  ctx.beginPath()
  ctx.arc(0, 0, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  if (valve.open) {
    ctx.strokeStyle = "#d8ff6a"
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(
      wheelX,
      wheelY,
      wheelRadius + 11,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * (1 - valve.openT / WASTE.valveOpen)
    )
    ctx.stroke()
  } else if (valve.cool > 0) {
    ctx.strokeStyle = "rgba(255,255,255,.7)"
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(
      wheelX,
      wheelY,
      wheelRadius + 11,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * (1 - valve.cool / WASTE.valveCool)
    )
    ctx.stroke()
  }
}
function drawBarrel(ctx, x, y, scale, rot) {
  // (x, y) is the barrel's base
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.scale(scale * BARREL_SCALE, scale * BARREL_SCALE)
  ctx.fillStyle = "rgba(0,0,0,.25)"
  ctx.beginPath()
  ctx.ellipse(0, 2, 40, 10, 0, 0, Math.PI * 2)
  ctx.fill()
  const width = 68,
    height = 92,
    top = -height
  ctx.lineWidth = 4
  ctx.strokeStyle = "#2a2009"
  roundedRect(ctx, -width / 2, top, width, height, 12)
  ctx.fillStyle = hgrad(ctx, -width / 2, width / 2, [
    [0, "#b8860e"],
    [0.3, "#ffd84a"],
    [0.55, "#f5c22b"],
    [1, "#9c6f08"]
  ])
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = "#1d1d1d"
  ctx.fillRect(-width / 2 + 2, top + 32, width - 4, 26)
  ctx.fillStyle = "#ffd84a"
  ctx.font = "900 26px 'Segoe UI Symbol', sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("☣", 0, top + 46)
  ctx.strokeStyle = "rgba(60,40,0,.55)"
  ctx.lineWidth = 3
  ;[top + 14, top + height - 14].forEach((ribY) => {
    ctx.beginPath()
    ctx.moveTo(-width / 2 + 3, ribY)
    ctx.lineTo(width / 2 - 3, ribY)
    ctx.stroke()
  })
  ctx.beginPath()
  ctx.ellipse(0, top + 3, width / 2 - 4, 7, 0, 0, Math.PI * 2)
  ctx.fillStyle = "#e3ad1d"
  ctx.fill()
  ctx.strokeStyle = "#2a2009"
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.fillStyle = "#7da11f"
  ctx.beginPath()
  ctx.ellipse(-12, top + 2, 9, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
function drawInspector(ctx, shift, now, img) {
  const ins = shift.insp,
    layout = INSPECTOR
  if (ins.state === "watch") {
    // vision cone over the lake
    ctx.save()
    lakePath(ctx)
    ctx.clip()
    ctx.fillStyle = vgrad(ctx, layout.showY - 60, 860, [
      [0, "rgba(255,240,120,.38)"],
      [1, "rgba(255,240,120,.04)"]
    ])
    ctx.beginPath()
    ctx.moveTo(layout.x, layout.showY - 70)
    ctx.lineTo(260, 900)
    ctx.lineTo(1580, 900)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
  if (ins.y < layout.hideY - 2) {
    emoji(ctx, "🕵️", layout.x, ins.y - 44, 112)
    if (ins.state === "watch") emoji(ctx, "🔍", layout.x + 62, ins.y - 70 + Math.sin(now * 6) * 5, 54)
    if (imgReady(img))
      ctx.drawImage(
        img,
        layout.cropX,
        layout.cropY,
        layout.cropW,
        layout.cropH,
        layout.cropX,
        layout.cropY,
        layout.cropW,
        layout.cropH
      ) // bush in front
  }
  if (ins.state === "warn")
    emoji(ctx, "👀", layout.x, layout.cropY - 34 + Math.sin(now * 20) * 3, 64, 0.6 + 0.4 * Math.sin(now * 14))
}

export { WasteGame }
