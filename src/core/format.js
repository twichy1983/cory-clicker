// Number and time formatting.
const SMALL_ILLIONS = ["million", "billion", "trillion", "quadrillion", "quintillion", "sextillion", "septillion", "octillion", "nonillion"];
const UNITS = ["", "un", "duo", "tre", "quattuor", "quin", "sex", "septen", "octo", "novem"];
const TENS = ["", "dec", "vigint", "trigint", "quadragint", "quinquagint", "sexagint", "septuagint", "octogint", "nonagint"];

// i = 1 -> million (10^6), i = 10 -> decillion (10^33), up to centillion
function illionName(i) {
  if (i <= 9) return SMALL_ILLIONS[i - 1];
  if (i === 100) return "centillion";
  if (i > 100) return null;
  return UNITS[i % 10] + TENS[Math.floor(i / 10)] + "illion";
}

// 12 -> "12", 1234 -> "1,234", 1.5e9 -> "1.500 billion"
export function fmt(n) {
  if (!isFinite(n)) return "∞";
  const neg = n < 0;
  n = Math.abs(n);
  let s;
  if (n < 1000) s = (n < 1 && n % 1) ? n.toFixed(2) : (n < 100 && n % 1) ? n.toFixed(1) : Math.floor(n).toString();
  else if (n < 1e6) s = Math.floor(n).toLocaleString("en-US");
  else {
    let k = Math.floor(parseInt(n.toExponential().split("e")[1], 10) / 3);
    let v = (n / Math.pow(10, k * 3)).toFixed(3);
    if (v === "1000.000") { k++; v = "1.000"; }
    const name = illionName(k - 1);
    s = name ? v + " " + name : n.toExponential(3);
  }
  return (neg ? "-" : "") + s;
}

export const money = n => (n < 0 ? "-$" : "$") + fmt(Math.abs(n));

// Compact money for chart labels: 1234 -> "$1.23K"
const SHORT = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
export function fmtShort(n) {
  if (!isFinite(n) || n <= 0) return "$0";
  if (n < 1000) return "$" + (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : n.toFixed(0));
  const k = Math.floor(Math.log10(n) / 3);
  if (k >= SHORT.length) return "$" + n.toExponential(2);
  const v = n / Math.pow(1000, k);
  return "$" + (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : v.toFixed(0)) + SHORT[k];
}

// ms -> "HH:MM:SS"
export function fmtTime(ms) {
  const t = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

// ms -> "2d 3h 15m"
export function fmtDuration(ms) {
  const t = Math.floor(ms / 1000), d = Math.floor(t / 86400), h = Math.floor(t % 86400 / 3600), m = Math.floor(t % 3600 / 60);
  return (d ? d + "d " : "") + (h ? h + "h " : "") + m + "m";
}

// ms -> "M:SS", rounding up
export function mmss(ms) {
  const s = Math.ceil(ms / 1000);
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

// 1 -> "1st", 2 -> "2nd", 11 -> "11th", 23 -> "23rd"
export function ordinal(n) {
  const suffix = [11, 12, 13].includes(n % 100) ? "th" : ["st", "nd", "rd"][(n % 10) - 1] || "th";
  return n + suffix;
}
