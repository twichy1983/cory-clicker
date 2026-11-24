// Number and time formatting.
const SMALL_ILLIONS = [
  "million",
  "billion",
  "trillion",
  "quadrillion",
  "quintillion",
  "sextillion",
  "septillion",
  "octillion",
  "nonillion"
]
const UNITS = ["", "un", "duo", "tre", "quattuor", "quin", "sex", "septen", "octo", "novem"]
const TENS = [
  "",
  "dec",
  "vigint",
  "trigint",
  "quadragint",
  "quinquagint",
  "sexagint",
  "septuagint",
  "octogint",
  "nonagint"
]

// magnitude = 1 -> million (10^6), magnitude = 10 -> decillion (10^33), up to centillion
function illionName(magnitude) {
  if (magnitude <= 9) return SMALL_ILLIONS[magnitude - 1]
  if (magnitude === 100) return "centillion"
  if (magnitude > 100) return null
  return UNITS[magnitude % 10] + TENS[Math.floor(magnitude / 10)] + "illion"
}

// 12 -> "12", 1234 -> "1,234", 1.5e9 -> "1.500 billion"
export function fmt(num) {
  if (!isFinite(num)) return "∞"
  const neg = num < 0
  num = Math.abs(num)
  let text
  if (num < 1000)
    text = num < 1 && num % 1 ? num.toFixed(2) : num < 100 && num % 1 ? num.toFixed(1) : Math.floor(num).toString()
  else if (num < 1e6) text = Math.floor(num).toLocaleString("en-US")
  else {
    let magnitude = Math.floor(parseInt(num.toExponential().split("e")[1], 10) / 3)
    let mantissa = (num / Math.pow(10, magnitude * 3)).toFixed(3)
    if (mantissa === "1000.000") {
      magnitude++
      mantissa = "1.000"
    }
    const name = illionName(magnitude - 1)
    text = name ? mantissa + " " + name : num.toExponential(3)
  }
  return (neg ? "-" : "") + text
}

export const money = (num) => (num < 0 ? "-$" : "$") + fmt(Math.abs(num))

// Compact money for chart labels: 1234 -> "$1.23K"
const SHORT = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"]
export function fmtShort(num) {
  if (!isFinite(num) || num <= 0) return "$0"
  if (num < 1000) return "$" + (num < 10 ? num.toFixed(2) : num < 100 ? num.toFixed(1) : num.toFixed(0))
  const magnitude = Math.floor(Math.log10(num) / 3)
  if (magnitude >= SHORT.length) return "$" + num.toExponential(2)
  const mantissa = num / Math.pow(1000, magnitude)
  return (
    "$" +
    (mantissa < 10 ? mantissa.toFixed(2) : mantissa < 100 ? mantissa.toFixed(1) : mantissa.toFixed(0)) +
    SHORT[magnitude]
  )
}

// milliseconds -> "HH:MM:SS"
export function fmtTime(milliseconds) {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000)
  const hours = Math.floor(totalSeconds / 3600),
    minutes = Math.floor((totalSeconds % 3600) / 60),
    seconds = totalSeconds % 60
  return (
    String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0")
  )
}

// milliseconds -> "2d 3h 15m"
export function fmtDuration(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000),
    days = Math.floor(totalSeconds / 86400),
    hours = Math.floor((totalSeconds % 86400) / 3600),
    minutes = Math.floor((totalSeconds % 3600) / 60)
  return (days ? days + "d " : "") + (hours ? hours + "h " : "") + minutes + "m"
}

// milliseconds -> "M:SS", rounding up
export function mmss(milliseconds) {
  const totalSeconds = Math.ceil(milliseconds / 1000)
  return Math.floor(totalSeconds / 60) + ":" + String(totalSeconds % 60).padStart(2, "0")
}

// 1 -> "1st", 2 -> "2nd", 11 -> "11th", 23 -> "23rd"
export function ordinal(num) {
  const suffix = [11, 12, 13].includes(num % 100) ? "th" : ["st", "nd", "rd"][(num % 10) - 1] || "th"
  return num + suffix
}
