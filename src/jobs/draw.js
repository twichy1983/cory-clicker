// Drawing helpers shared by every minigame. All games draw in the same 1672x941 (16:9) canvas space.
export const JW = 1672,
  JH = 941
export const rand = (a, b) => a + Math.random() * (b - a)
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h)
}
export function vgrad(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1)
  stops.forEach(([o, c]) => g.addColorStop(o, c))
  return g
}
export function hgrad(ctx, x0, x1, stops) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0)
  stops.forEach(([o, c]) => g.addColorStop(o, c))
  return g
}
export const INK = "#1f2a1c" // cartoon outline colour
export function emoji(ctx, ch, x, y, size, alpha = 1) {
  // emoji take their opacity from fillStyle, so always reset it
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = "#000"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = `${size}px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif`
  ctx.fillText(ch, x, y)
  ctx.restore()
}
export function label(ctx, text, x, y, size, fill = "#fff", align = "center", weight = 900) {
  ctx.save()
  ctx.font = `${weight} ${size}px 'Segoe UI', sans-serif`
  ctx.textAlign = align
  ctx.textBaseline = "middle"
  ctx.lineJoin = "round"
  ctx.lineWidth = Math.max(3, size * 0.2)
  ctx.strokeStyle = "#111"
  ctx.strokeText(text, x, y)
  ctx.fillStyle = fill
  ctx.fillText(text, x, y)
  ctx.restore()
}
export function plainText(ctx, text, x, y, size, fill, align = "center", weight = 800) {
  ctx.save()
  ctx.font = `${weight} ${size}px 'Segoe UI', sans-serif`
  ctx.textAlign = align
  ctx.textBaseline = "middle"
  ctx.fillStyle = fill
  ctx.fillText(text, x, y)
  ctx.restore()
}
export function bubble(ctx, text, x, y, size = 34) {
  // speech bubble centred above (x, y)
  ctx.save()
  ctx.font = `800 ${size}px 'Segoe UI', sans-serif`
  const w = ctx.measureText(text).width + size * 1.2,
    h = size * 1.9
  rr(ctx, x - w / 2, y - h, w, h, h / 2)
  ctx.fillStyle = "#fff"
  ctx.fill()
  ctx.lineWidth = 5
  ctx.strokeStyle = INK
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x - 14, y - 3)
  ctx.lineTo(x, y + 22)
  ctx.lineTo(x + 14, y - 3)
  ctx.fillStyle = "#fff"
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(x - 14, y)
  ctx.lineTo(x, y + 22)
  ctx.lineTo(x + 14, y)
  ctx.stroke()
  ctx.fillStyle = "#1b1b1b"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, x, y - h / 2)
  ctx.restore()
}
export function button(ctx, x, y, w, h, text, color, active, disabled) {
  ctx.save()
  rr(ctx, x, y + (active ? 6 : 0), w, h, 22)
  ctx.fillStyle = disabled ? "#555c58" : color
  ctx.fill()
  ctx.lineWidth = 6
  ctx.strokeStyle = INK
  ctx.stroke()
  if (!active) {
    rr(ctx, x, y + h - 4, w, 12, 8)
    ctx.fillStyle = "rgba(0,0,0,.35)"
    ctx.fill()
  }
  label(ctx, text, x + w / 2, y + h / 2 + (active ? 6 : 0), Math.min(44, h * 0.42), disabled ? "#ccc" : "#fff")
  ctx.restore()
}
export const inBox = (x, y, b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h
export function cloud(ctx, x, y, s) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.fillStyle = "#fff"
  ctx.beginPath()
  ctx.arc(0, 0, 50, 0, Math.PI * 2)
  ctx.arc(55, -18, 60, 0, Math.PI * 2)
  ctx.arc(115, 0, 46, 0, Math.PI * 2)
  ctx.rect(0, 0, 115, 46)
  ctx.fill()
  ctx.restore()
}
