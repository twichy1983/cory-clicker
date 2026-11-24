import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  rand,
  pick,
  clamp,
  roundedRect,
  vgrad,
  hgrad,
  INK,
  emoji,
  label,
  plainText,
  button,
  inBox
} from "./draw.js"
import { floatText, burst, jobAlert, endJob, jobReward, payOut } from "./framework.js"
import { money } from "../core/format.js"

/* ---------------------------------------------------------
   JOB: PRICE HIKE (Pharma Conglomerate)
   Hold to raise the price for revenue; keep public outrage below 100%.
   --------------------------------------------------------- */
const PRICE_BTNS = {
  hike: { x: 70, y: 760, width: 330, height: 120 },
  cut: { x: 430, y: 760, width: 330, height: 120 },
  spin: { x: 900, y: 760, width: 330, height: 120 },
  bribe: { x: 1270, y: 760, width: 330, height: 120 }
}
const PRICE = {
  revRate: 4.6, // revenue % per second scales with log10(price/5 + 1)
  heatK: 8,
  calm: 3, // outrage per second = heat² × heatK − calm   (heat = log10(price / 5))
  spin: 22,
  spinMax: 3,
  spinRecharge: 3.5, // PR SPIN: up to 3 charges, one refills every 3.5 s, so save some
  bribe: 60,
  bribeCd: 9,
  bribeCost: 8, // BRIBE: big drop, long recharge, costs revenue
  viralMin: 3.2,
  viralMax: 5.2,
  viralHit: 26,
  viralHeat: 6, // viral stories: big, sudden outrage spikes
  profitShare: 0.6 // a full revenue meter also pays 60% of the job reward as cash, win or lose
}
const PRICE_NEWS = [
  "📰 Grandma rations her pills, internet furious",
  "📰 Kid's GoFundMe for LIFEPILL goes viral",
  "📰 Senator calls price 'obscene' on live TV",
  "📰 Patients charter buses to Canada",
  "📰 Leaked memo: 'They'll pay. They have to.'",
  "📰 CEO spotted buying third island",
  "📰 Nurses' union calls for boycott"
]
const PriceGame = {
  time: 30,
  meter: "QUARTERLY REVENUE",
  tagline:
    "You bought the only factory still making an old life-saving pill. Patients can't skip it, so the price is whatever you say. Squeeze them dry, but don't let the outrage reach Congress.",
  rules: [
    "<b>Hold HIKE</b> to raise the price and <b>hold CUT</b> to lower it. The higher the price, the faster the money pours in.",
    "High prices make <b>public outrage</b> climb fast. If it reaches 100%, Congress drags you to a hearing and you're busted.",
    `<b>🎤 PR SPIN</b> issues a fake apology (−${PRICE.spin} outrage). You hold <b>${PRICE.spinMax} charges</b> and one refills every ${PRICE.spinRecharge} seconds, so don't waste them.`,
    `<b>💼 BRIBE</b> a senator for a big drop (−${PRICE.bribe} outrage), but it eats ${PRICE.bribeCost}% of your revenue and takes ${PRICE.bribeCd} seconds to recharge.`,
    "<b>Viral stories</b> hit without warning and spike outrage hard. Keep an eye on the meter and a PR spin in reserve.",
    "Fill the <b>revenue meter</b> before time runs out.",
    "<b>💵 Every dollar of gouging profit is yours to keep</b> as cash, even if you get busted. Capitalism."
  ],
  winTitle: "Your money or your life!",
  winText:
    "Record quarter. Patients are now choosing between their pill and their rent. The shareholders chose a second yacht.",
  lose: {
    busted:
      "Outrage boiled over. You testified before Congress and smirked the whole time, which somehow made it worse.",
    time: "Time's up. Patients can still afford rent. You left money on the table."
  },
  init(shift) {
    Object.assign(shift, {
      price: 5,
      outrage: 0,
      hike: false,
      cut: false,
      spins: PRICE.spinMax,
      spinT: 0,
      bribeCd: 0,
      hist: [5],
      histT: 0,
      nextNews: rand(PRICE.viralMin, PRICE.viralMax),
      news: "",
      newsT: 0,
      profit: 0,
      paidProfit: 0
    })
  },
  step(shift, dt) {
    if (shift.hike) shift.price = Math.min(99999, shift.price * Math.pow(2.3, dt))
    if (shift.cut) shift.price = Math.max(5, shift.price * Math.pow(0.3, dt))
    const gain = Math.log10(shift.price / 5 + 1) * PRICE.revRate * dt
    shift.pct = Math.min(100, shift.pct + gain)
    shift.profit += (gain / 100) * jobReward() * PRICE.profitShare // real cash, paid out when the shift ends
    const heat = Math.max(0, Math.log10(shift.price / 5))
    shift.outrage = clamp(shift.outrage + (heat * heat * PRICE.heatK - PRICE.calm) * dt, 0, 100)
    if (shift.spins < PRICE.spinMax) {
      shift.spinT += dt
      if (shift.spinT >= PRICE.spinRecharge) {
        shift.spins++
        shift.spinT = 0
      }
    }
    shift.bribeCd = Math.max(0, shift.bribeCd - dt)
    shift.newsT = Math.max(0, shift.newsT - dt)
    if (shift.elapsed >= shift.nextNews) {
      // a viral story; worse when the price is already high
      shift.nextNews = shift.elapsed + rand(PRICE.viralMin, PRICE.viralMax)
      const hit = Math.round(PRICE.viralHit + heat * PRICE.viralHeat)
      shift.outrage = Math.min(100, shift.outrage + hit)
      shift.news = pick(PRICE_NEWS)
      shift.newsT = 2.6
      floatText(`+${hit}% outrage`, 1565, 140, true)
      jobAlert("📰 GOING VIRAL!", "bad")
    }
    shift.histT += dt
    if (shift.histT > 0.25) {
      shift.histT = 0
      shift.hist.push(shift.price)
      if (shift.hist.length > 60) shift.hist.shift()
    }
    if (shift.outrage >= 100) {
      jobAlert("🏛️ CONGRESSIONAL HEARING!", "bad")
      endJob("busted")
    } else if (shift.pct >= 100) endJob("win")
  },
  extra(shift) {
    return `😠 ${Math.floor(shift.outrage)}% · 💵 ${money(shift.profit)}`
  },
  resultNote(shift, kind) {
    return `💵 You keep ${money(shift.paidProfit)} in price-gouging profits${kind === "win" ? "." : ", even though you lost. Capitalism."}`
  },
  cursor(shift, x, y) {
    return Object.values(PRICE_BTNS).some((box) => inBox(x, y, box))
  },
  down(shift, x, y) {
    if (inBox(x, y, PRICE_BTNS.hike)) shift.hike = true
    else if (inBox(x, y, PRICE_BTNS.cut)) shift.cut = true
    else if (inBox(x, y, PRICE_BTNS.spin) && shift.spins > 0) {
      shift.outrage = Math.max(0, shift.outrage - PRICE.spin)
      shift.spins--
      floatText(
        pick([
          "“Thoughts and prayers.”",
          "“We hear you.”",
          "“Blame the middlemen.”",
          "“It's complicated.”",
          "“Innovation isn't free.”",
          "“Have you tried being healthy?”"
        ]),
        1065,
        700
      )
    } else if (inBox(x, y, PRICE_BTNS.bribe) && shift.bribeCd === 0) {
      shift.outrage = Math.max(0, shift.outrage - PRICE.bribe)
      shift.bribeCd = PRICE.bribeCd
      shift.pct = Math.max(0, shift.pct - PRICE.bribeCost)
      floatText(`Senator bought! −${PRICE.bribeCost}% revenue`, 1300, 700)
      burst(1435, 760, "#7cfc7c", 16, 300)
    }
  },
  up(shift) {
    shift.hike = false
    shift.cut = false
  },
  stop(shift) {
    // whatever happened, the gouging profits are paid out as real cash
    shift.hike = false
    shift.cut = false
    if (shift.profit > 0 && !shift.paidProfit) {
      shift.paidProfit = shift.profit
      payOut(shift.profit, `💵 You kept ${money(shift.profit)} in price-gouging profits.`)
    }
  },
  draw(ctx, shift, now) {
    ctx.fillStyle = vgrad(ctx, 0, CANVAS_HEIGHT, [
      [0, "#3b2418"],
      [1, "#24150e"]
    ])
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.fillStyle = "rgba(255,255,255,.04)"
    for (let x = 0; x < CANVAS_WIDTH; x += 120) ctx.fillRect(x, 0, 60, 700)
    // wall screen with the price chart
    const chartBox = { x: 110, y: 110, width: 900, height: 560 }
    roundedRect(ctx, chartBox.x - 14, chartBox.y - 14, chartBox.width + 28, chartBox.height + 28, 18)
    ctx.fillStyle = "#121212"
    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = INK
    ctx.stroke()
    ctx.fillStyle = "#0d1b14"
    ctx.fillRect(chartBox.x, chartBox.y, chartBox.width, chartBox.height)
    ctx.strokeStyle = "rgba(124,252,124,.12)"
    ctx.lineWidth = 2
    for (let i = 1; i < 6; i++) {
      ctx.beginPath()
      ctx.moveTo(chartBox.x, chartBox.y + (i * chartBox.height) / 6)
      ctx.lineTo(chartBox.x + chartBox.width, chartBox.y + (i * chartBox.height) / 6)
      ctx.stroke()
    }
    const logMin = Math.log10(5),
      logMax = Math.max(Math.log10(200), Math.log10(Math.max(...shift.hist)) + 0.2)
    ctx.beginPath()
    shift.hist.forEach((price, i) => {
      const x = chartBox.x + 30 + (i * (chartBox.width - 60)) / 59,
        y =
          chartBox.y +
          chartBox.height -
          40 -
          ((Math.log10(price) - logMin) / (logMax - logMin)) * (chartBox.height - 120)
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
    })
    ctx.lineWidth = 8
    ctx.strokeStyle = "#ff4d4d"
    ctx.lineJoin = "round"
    ctx.stroke()
    plainText(ctx, "LIFEPILL™ PRICE PER BOTTLE", chartBox.x + 30, chartBox.y + 40, 28, "#7cfc7c", "left", 900)
    plainText(ctx, "cost to make: $1.20", chartBox.x + 30, chartBox.y + 76, 22, "rgba(124,252,124,.6)", "left", 700)
    label(
      ctx,
      "$" + (shift.price < 100 ? shift.price.toFixed(2) : Math.round(shift.price).toLocaleString("en-US")),
      chartBox.x + chartBox.width - 30,
      chartBox.y + 60,
      64,
      "#ff6b5b",
      "right"
    )
    // pill bottle with a price tag
    ctx.save()
    ctx.translate(1230, 380)
    roundedRect(ctx, -95, -150, 190, 290, 30)
    ctx.fillStyle = hgrad(ctx, -95, 95, [
      [0, "#c25e00"],
      [0.4, "#ff9a2f"],
      [1, "#b05000"]
    ])
    ctx.fill()
    ctx.lineWidth = 7
    ctx.strokeStyle = INK
    ctx.stroke()
    roundedRect(ctx, -110, -215, 220, 75, 16)
    ctx.fillStyle = "#fff"
    ctx.fill()
    ctx.stroke()
    roundedRect(ctx, -80, -70, 160, 130, 12)
    ctx.fillStyle = "#fffdf3"
    ctx.fill()
    ctx.lineWidth = 4
    ctx.stroke()
    plainText(ctx, "LIFEPILL™", 0, -30, 30, "#c25e00", "center", 900)
    plainText(ctx, "Skip a dose? Don't.", 0, 10, 17, "#555")
    ctx.restore()
    ctx.save()
    ctx.translate(1350, 250)
    ctx.rotate(0.25 + Math.sin(now * 3) * 0.05)
    roundedRect(ctx, 0, 0, 190, 90, 14)
    ctx.fillStyle = "#fff36b"
    ctx.fill()
    ctx.lineWidth = 5
    ctx.strokeStyle = INK
    ctx.stroke()
    plainText(
      ctx,
      "$" + (shift.price < 1000 ? Math.round(shift.price) : Math.round(shift.price / 1000) + "K"),
      95,
      45,
      40,
      "#1b1b1b",
      "center",
      900
    )
    ctx.restore()
    // outrage thermometer
    roundedRect(ctx, 1530, 110, 70, 520, 35)
    ctx.fillStyle = "#1b1b1b"
    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = INK
    ctx.stroke()
    const outrageHeight = (500 * shift.outrage) / 100
    roundedRect(ctx, 1540, 620 - outrageHeight, 50, outrageHeight, 25)
    ctx.fillStyle = shift.outrage > 70 ? "#ff3b30" : shift.outrage > 40 ? "#ff9f1c" : "#ffd23f"
    ctx.fill()
    plainText(ctx, "OUTRAGE", 1565, 670, 22, "#ffb3b3", "center", 900)
    const crowd = Math.floor(shift.outrage / 9)
    for (let i = 0; i < crowd; i++)
      emoji(
        ctx,
        ["😠", "🪧", "😷", "🤬", "👵", "🪧"][i % 6],
        1080 + (i % 6) * 70,
        610 - Math.floor(i / 6) * 60 + Math.sin(now * 8 + i) * 6,
        54
      )
    button(
      ctx,
      PRICE_BTNS.hike.x,
      PRICE_BTNS.hike.y,
      PRICE_BTNS.hike.width,
      PRICE_BTNS.hike.height,
      "📈 HIKE",
      "#2fb35a",
      shift.hike
    )
    button(
      ctx,
      PRICE_BTNS.cut.x,
      PRICE_BTNS.cut.y,
      PRICE_BTNS.cut.width,
      PRICE_BTNS.cut.height,
      "📉 CUT",
      "#5c7cfa",
      shift.cut
    )
    button(
      ctx,
      PRICE_BTNS.spin.x,
      PRICE_BTNS.spin.y,
      PRICE_BTNS.spin.width,
      PRICE_BTNS.spin.height,
      shift.spins > 0 ? "🎤 PR SPIN" : `PR SPIN ${(PRICE.spinRecharge - shift.spinT).toFixed(1)}s`,
      "#e8590c",
      false,
      shift.spins === 0
    )
    for (let i = 0; i < PRICE.spinMax; i++) {
      // charge pips, with the next one filling up
      const pipX = PRICE_BTNS.spin.x + PRICE_BTNS.spin.width / 2 + (i - 1) * 46,
        pipY = PRICE_BTNS.spin.y - 28
      ctx.beginPath()
      ctx.arc(pipX, pipY, 15, 0, Math.PI * 2)
      ctx.fillStyle = "#2a1a12"
      ctx.fill()
      ctx.lineWidth = 4
      ctx.strokeStyle = INK
      ctx.stroke()
      if (i < shift.spins) {
        ctx.beginPath()
        ctx.arc(pipX, pipY, 11, 0, Math.PI * 2)
        ctx.fillStyle = "#ff9f1c"
        ctx.fill()
      } else if (i === shift.spins) {
        ctx.beginPath()
        ctx.moveTo(pipX, pipY)
        ctx.arc(pipX, pipY, 11, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * shift.spinT) / PRICE.spinRecharge)
        ctx.closePath()
        ctx.fillStyle = "rgba(255,159,28,.5)"
        ctx.fill()
      }
    }
    button(
      ctx,
      PRICE_BTNS.bribe.x,
      PRICE_BTNS.bribe.y,
      PRICE_BTNS.bribe.width,
      PRICE_BTNS.bribe.height,
      shift.bribeCd > 0 ? `BRIBE ${Math.ceil(shift.bribeCd)}s` : "💼 BRIBE",
      "#7048e8",
      false,
      shift.bribeCd > 0
    )
    plainText(
      ctx,
      `−${PRICE.spin} outrage`,
      PRICE_BTNS.spin.x + PRICE_BTNS.spin.width / 2,
      PRICE_BTNS.spin.y + PRICE_BTNS.spin.height + 28,
      22,
      "#d9c2a8"
    )
    plainText(
      ctx,
      `−${PRICE.bribe} outrage, −${PRICE.bribeCost}% revenue`,
      PRICE_BTNS.bribe.x + PRICE_BTNS.bribe.width / 2,
      PRICE_BTNS.bribe.y + PRICE_BTNS.bribe.height + 28,
      22,
      "#d9c2a8"
    )
    if (shift.newsT > 0) {
      // breaking-news banner across the price screen
      const alpha = Math.min(1, shift.newsT * 2),
        y0 = 600
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = "#c92a2a"
      ctx.fillRect(110, y0, 900, 70)
      ctx.fillStyle = "#fff"
      ctx.fillRect(110, y0, 170, 70)
      plainText(ctx, "BREAKING", 195, y0 + 35, 30, "#c92a2a", "center", 900)
      plainText(ctx, shift.news.replace("📰 ", ""), 300, y0 + 35, 28, "#fff", "left", 800)
      ctx.restore()
    }
    plainText(
      ctx,
      "hold",
      PRICE_BTNS.hike.x + PRICE_BTNS.hike.width / 2,
      PRICE_BTNS.hike.y + PRICE_BTNS.hike.height + 28,
      22,
      "#d9c2a8"
    )
    plainText(
      ctx,
      "hold",
      PRICE_BTNS.cut.x + PRICE_BTNS.cut.width / 2,
      PRICE_BTNS.cut.y + PRICE_BTNS.cut.height + 28,
      22,
      "#d9c2a8"
    )
  }
}

export { PriceGame }
