// Short messages that slide in at the corner and fade after 5 seconds.
// kind: "bad" (red), "gold" (achievements and payouts) or nothing (normal).
import { $ } from "./dom.js"

export function toast(msg, kind) {
  const div = document.createElement("div")
  div.className = "toast" + (kind === "gold" ? " gold" : kind ? " bad" : "")
  div.textContent = msg
  $("toasts").appendChild(div)
  setTimeout(() => {
    div.style.transition = "opacity .5s"
    div.style.opacity = 0
    setTimeout(() => div.remove(), 500)
  }, 5000)
  while ($("toasts").children.length > 5) $("toasts").firstChild.remove()
}
