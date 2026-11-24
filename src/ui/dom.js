// Tiny DOM helpers used by every UI module.
export const $ = (id) => document.getElementById(id)

// Escapes text for safe use inside HTML
export function esc(value) {
  return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char])
}
