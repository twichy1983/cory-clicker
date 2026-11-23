// Yellow toolbar shown only in test mode (?test): shortcuts for the regulatory clock, cash and fines.
const BUTTONS = [
  ["deadline10", "Deadline → 10s"],
  ["deadline1h", "Deadline → 59m"],
  ["cash", "+$1 billion"],
  ["fines", "+$1 billion fines"],
  ["rebate", "Fines → −$1 million"],
];

export function addTestToolbar({ getState, earn, refresh }) {
  const bar = document.createElement("div");
  bar.id = "testBar";
  bar.innerHTML = `<span>TEST MODE · all purchases free</span>` +
    BUTTONS.map(([id, text]) => `<button data-t="${id}">${text}</button>`).join("");
  bar.addEventListener("click", e => {
    const t = e.target.dataset.t;
    if (!t) return;
    const S = getState(), now = Date.now();
    if (t === "deadline10") S.deadline = now + 10000;
    if (t === "deadline1h") S.deadline = now + 59 * 60000;
    if (t === "cash") earn(1e9);
    if (t === "fines") S.fines += 1e9;
    if (t === "rebate") S.fines = -1e6;
    refresh();
  });
  document.body.appendChild(bar);
}
