// Screenshots of the game at every frame size CrazyGames embeds games at, to check the layout is readable.
//   npm run screenshots        -> screenshots/*.png
import { mkdirSync, writeFileSync } from "node:fs"
import { serve, launch } from "./browser.js"

// From the CrazyGames technical requirements (desktop, plus the mobile and tablet sizes)
const SIZES = [
  [907, 510],
  [1216, 684],
  [1077, 606],
  [821, 462],
  [1366, 768],
  [1920, 1080],
  [1536, 864],
  [1280, 720],
  [800, 450],
  [1080, 607]
]

mkdirSync("screenshots", { recursive: true })
const server = await serve(".")
const page = await launch()
try {
  await page.goto(server.url + "/")
  for (const [w, h] of SIZES) {
    await page.resize(w, h)
    await page.wait(300)
    writeFileSync(`screenshots/${w}x${h}.png`, await page.screenshot())
    console.log(`screenshots/${w}x${h}.png`)
  }
} finally {
  await page.close()
  await server.stop()
}
