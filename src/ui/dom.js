// Tiny DOM helpers used by every UI module.
/**
 * The element with this id. Typed loosely (any) so inputs, buttons and canvases need no type casts.
 * @param {string} id
 * @returns {any}
 */
export const $ = (id) => document.getElementById(id)

// Escapes text for safe use inside HTML
export function esc(value) {
  return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char])
}
