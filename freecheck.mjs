// Usage: node freecheck.mjs <original main.js> <file...>
// Reports identifiers that were top-level names in the original script and are used in a file
// without being declared or imported there.
import { readFileSync } from "node:fs"
const [orig, ...files] = process.argv.slice(2)
const src = readFileSync(orig, "utf8")
const names = new Set()
for (const m of src.matchAll(
  /^(?:export\s+)?(?:const|let|var|function|async function|class)\s+([\s\S]*?)(?:=|\(|\{|;)/gm
)) {
  const n = m[1].trim().split(/\s/)[0]
  if (/^[A-Za-z_$][\w$]*$/.test(n)) names.add(n)
}
// extra names declared in comma lists
for (const m of src.matchAll(/^(?:const|let)\s+(.*)$/gm))
  for (const p of m[1].matchAll(/(?:^|,\s*)([A-Za-z_$][\w$]*)\s*=/g)) names.add(p[1])
for (const m of src.matchAll(/;\s*let\s+([^;]*);/g))
  for (const p of m[1].matchAll(/(?:^|,\s*)([A-Za-z_$][\w$]*)\s*=/g)) names.add(p[1])
const strip = (s) =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:\\])\/\/.*$/gm, "$1")
    .replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g, '""')
for (const f of files) {
  const raw = readFileSync(f, "utf8"),
    s = strip(raw)
  const declared = new Set()
  for (const m of s.matchAll(/\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1])
  for (const m of s.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*\s*=[^;]*)/g))
    for (const p of m[1].matchAll(/,\s*([A-Za-z_$][\w$]*)\s*=/g)) declared.add(p[1])
  for (const m of s.matchAll(/import\s*\{([^}]*)\}/g))
    m[1].split(",").forEach((x) => {
      const n = x
        .trim()
        .split(/\s+as\s+/)
        .pop()
      if (n) declared.add(n)
    })
  for (const m of s.matchAll(/import\s+\*\s+as\s+(\w+)/g)) declared.add(m[1])
  const missing = new Set()
  for (const m of s.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\b/g)) {
    const n = m[1]
    if (!names.has(n) || declared.has(n)) continue
    const after = s.slice(m.index + n.length, m.index + n.length + 3)
    if (/^\s*:/.test(after) && !/\?\s*$/.test(s.slice(Math.max(0, m.index - 3), m.index))) continue // object key
    missing.add(n)
  }
  console.log(f.padEnd(40), missing.size ? [...missing].join(" ") : "ok")
}
