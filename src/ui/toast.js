// Short messages that slide in at the corner and fade after 5 seconds.
// kind: "bad" (red), "gold" (achievements and payouts) or nothing (normal).
import { $ } from "./dom.js"

export function toast(msg, kind) {
  const t = document.createElement("div")
  t.className = "toast" + (kind === "gold" ? " gold" : kind ? " bad" : "")
  t.textContent = msg
  $("toasts").appendChild(t)
  setTimeout(() => {
    t.style.transition = "opacity .5s"
    t.style.opacity = 0
    setTimeout(() => t.remove(), 500)
  }, 5000)
  while ($("toasts").children.length > 5) $("toasts").firstChild.remove()
}
