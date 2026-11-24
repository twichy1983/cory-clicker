// Drawing helpers shared by every minigame. All games draw in the same 1672x941 (16:9) canvas space.
export const JW = 1672,
  JH = 941
export const rand = (min, max) => min + Math.random() * (max - min)
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
export function rr(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.roundRect ? ctx.roundRect(x, y, width, height, radius) : ctx.rect(x, y, width, height)
}
export function vgrad(ctx, y0, y1, stops) {
  const gradient = ctx.createLinearGradient(0, y0, 0, y1)
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color))
  return gradient
}
export function hgrad(ctx, x0, x1, stops) {
  const gradient = ctx.createLinearGradient(x0, 0, x1, 0)
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color))
  return gradient
}
export const INK = "#1f2a1c" // cartoon outline colour
export function emoji(ctx, character, x, y, size, alpha = 1) {
  // emoji take their opacity from fillStyle, so always reset it
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = "#000"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = `${size}px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif`
  ctx.fillText(character, x, y)
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
  const width = ctx.measureText(text).width + size * 1.2,
    height = size * 1.9
  rr(ctx, x - width / 2, y - height, width, height, height / 2)
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
  ctx.fillText(text, x, y - height / 2)
  ctx.restore()
}
export function button(ctx, x, y, width, height, text, color, active, disabled) {
  ctx.save()
  rr(ctx, x, y + (active ? 6 : 0), width, height, 22)
  ctx.fillStyle = disabled ? "#555c58" : color
  ctx.fill()
  ctx.lineWidth = 6
  ctx.strokeStyle = INK
  ctx.stroke()
  if (!active) {
    rr(ctx, x, y + height - 4, width, 12, 8)
    ctx.fillStyle = "rgba(0,0,0,.35)"
    ctx.fill()
  }
  label(
    ctx,
    text,
    x + width / 2,
    y + height / 2 + (active ? 6 : 0),
    Math.min(44, height * 0.42),
    disabled ? "#ccc" : "#fff"
  )
  ctx.restore()
}
export const inBox = (x, y, box) => x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height
export function cloud(ctx, x, y, scale) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  ctx.fillStyle = "#fff"
  ctx.beginPath()
  ctx.arc(0, 0, 50, 0, Math.PI * 2)
  ctx.arc(55, -18, 60, 0, Math.PI * 2)
  ctx.arc(115, 0, 46, 0, Math.PI * 2)
  ctx.rect(0, 0, 115, 46)
  ctx.fill()
  ctx.restore()
}
