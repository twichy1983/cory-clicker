// The ten industries (buildings) you can acquire, cheapest first.
// base = price of the first one; cps = income per second each one earns.
export const INDUSTRIES = [
  {
    key: "lemon",
    name: "Unlicensed Lemonade Stand",
    sector: "Street Commerce",
    icon: "🍋",
    base: 12,
    cps: 0.15,
    flavor: "No permits. No lemons. No problem."
  },
  {
    key: "food",
    name: "Ingredient Supplier",
    sector: "Food / Ingredient",
    icon: "🌾",
    base: 120,
    cps: 1.2,
    flavor: "Sourcing ingredients from the lowest bidder since forever."
  },
  {
    key: "mfg",
    name: "Processing Plant",
    sector: "Food Manufacturing",
    icon: "🏭",
    base: 1500,
    cps: 10,
    flavor: "The line never stops. Neither does the inspector's paperwork."
  },
  {
    key: "additives",
    name: "Additive Laboratory",
    sector: "Food Additives / Industrial Processing",
    icon: "🧪",
    base: 18000,
    cps: 60,
    flavor: "Shelf life: eternal. Ingredient list: classified."
  },
  {
    key: "consumer",
    name: "Consumer Goods Factory",
    sector: "Consumer Products",
    icon: "🧸",
    base: 2.2e5,
    cps: 380,
    flavor: "Safety testing is just a really long customer beta."
  },
  {
    key: "pharma",
    name: "Pharma Conglomerate",
    sector: "Health Care / Pharmaceuticals",
    icon: "💊",
    base: 3e6,
    cps: 2200,
    flavor: "A cure is a one-time sale. A treatment is forever."
  },
  {
    key: "industrial",
    name: "Refinery Complex",
    sector: "Industrial / Energy / Workplace Safety",
    icon: "🛢️",
    base: 4.5e7,
    cps: 13000,
    flavor: "Hard hats optional. Hard numbers mandatory."
  },
  {
    key: "auto",
    name: "Auto & Aero Works",
    sector: "Automotive / Aviation",
    icon: "✈️",
    base: 7e8,
    cps: 80000,
    flavor: "Moves fast. Breaks things. Sometimes the things are physics."
  },
  {
    key: "tech",
    name: "Megabank Data Silo",
    sector: "Technology / Banking / Financial Services",
    icon: "🏦",
    base: 1.1e10,
    cps: 5e5,
    flavor: "Your data, your money, our terms of service."
  },
  {
    key: "offshore",
    name: "Offshore Shell Network",
    sector: "Offshore Holdings",
    icon: "🏝️",
    base: 1.8e11,
    cps: 3.2e6,
    flavor: "A mailbox on an island that owns a mailbox on another island."
  }
]
export const IND_INDEX = Object.fromEntries(INDUSTRIES.map((industry, i) => [industry.key, i]))

// Stock ticker symbol for each industry, in the same order
export const TICKERS = ["LMON", "GRAN", "PROC", "ADTV", "GOOD", "PHRM", "BOOM", "CRSH", "DATA", "SHEL"]
