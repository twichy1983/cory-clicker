// Tiny DOM helpers used by every UI module.
export const $ = id => document.getElementById(id);

// Escapes text for safe use inside HTML
export function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
