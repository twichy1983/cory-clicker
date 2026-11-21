// The centred dialog box. Only one is open at a time; opening another replaces it.
// Dialogs count as a break in play, which portal SDKs (CrazyGames) want to know about.
import { $ } from "./dom.js";
import { platform } from "../platform/index.js";

let open = false, reportBreaks = false;

export const isModalOpen = () => open;

// Called once the game has booted: before that, the loading screen already counts as a break
export function startReportingBreaks() { reportBreaks = true; }

// buttons: [[label, onClick, extraClass?], ...]. `bad` makes it red and stops a click outside from closing it.
export function showModal(title, html, buttons, bad) {
  if (!open && reportBreaks) platform.gameplayStop();
  open = true;
  const m = $("modal");
  m.className = bad ? "bad" : "";
  m.innerHTML = `<h3>${title}</h3><div>${html}</div><div class="row"></div>`;
  const row = m.querySelector(".row");
  for (const [label, onClick, cls] of buttons) {
    const b = document.createElement("button");
    b.className = "btn " + (cls || "");
    b.textContent = label;
    b.addEventListener("click", onClick);
    row.appendChild(b);
  }
  $("modalBg").style.display = "flex";
}

export function hideModal() {
  if (open && reportBreaks) platform.gameplayStart();
  open = false;
  $("modalBg").style.display = "none";
}

export function wireModal() {
  $("modalBg").addEventListener("click", e => {
    if (e.target === $("modalBg") && !$("modal").classList.contains("bad")) hideModal();
  });
}
