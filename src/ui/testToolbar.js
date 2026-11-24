// Yellow toolbar shown only in test mode (?test): shortcuts for the regulatory clock, cash and fines.
const BUTTONS = [
  ["deadline10", "Deadline → 10s"],
  ["deadline1h", "Deadline → 59m"],
  ["cash", "+$1 billion"],
  ["fines", "+$1 billion fines"],
  ["rebate", "Fines → −$1 million"]
]

export function addTestToolbar({ getState, earn, refresh }) {
  const bar = document.createElement("div")
  bar.id = "testBar"
  bar.innerHTML =
    `<span>TEST MODE · all purchases free</span>` +
    BUTTONS.map(([id, text]) => `<button data-tool="${id}">${text}</button>`).join("")
  bar.addEventListener("click", (event) => {
    const tool = event.target.dataset.tool
    if (!tool) return
    const state = getState(),
      now = Date.now()
    if (tool === "deadline10") state.deadline = now + 10000
    if (tool === "deadline1h") state.deadline = now + 59 * 60000
    if (tool === "cash") earn(1e9)
    if (tool === "fines") state.fines += 1e9
    if (tool === "rebate") state.fines = -1e6
    refresh()
  })
  document.body.appendChild(bar)
}
