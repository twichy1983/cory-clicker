// Drives an installed Chrome or Edge (headless by default), with no extra packages.
// Talks to the browser over the Chrome DevTools Protocol using Node's built-in WebSocket.
// Used by the end-to-end tests (tests/e2e) and scripts/screenshots.js.
// Set BROWSER_PATH to use a specific browser executable.
import { spawn } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { delimiter, join } from "node:path"
import * as esbuild from "esbuild"

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export function findBrowser() {
  if (process.env.BROWSER_PATH) return process.env.BROWSER_PATH
  const env = process.env
  const candidates =
    {
      darwin: [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        "/Applications/Chromium.app/Contents/MacOS/Chromium"
      ],
      win32: [
        join(env.ProgramFiles || "", "Google/Chrome/Application/chrome.exe"),
        join(env["ProgramFiles(x86)"] || "", "Google/Chrome/Application/chrome.exe"),
        join(env.LOCALAPPDATA || "", "Google/Chrome/Application/chrome.exe"),
        join(env["ProgramFiles(x86)"] || "", "Microsoft/Edge/Application/msedge.exe"),
        join(env.ProgramFiles || "", "Microsoft/Edge/Application/msedge.exe")
      ]
    }[process.platform] ||
    ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge"].flatMap((name) =>
      (env.PATH || "").split(delimiter).map((dir) => join(dir, name))
    )
  const found = candidates.find((p) => p && existsSync(p))
  if (!found) throw new Error("No Chrome or Edge found. Install one, or set BROWSER_PATH to its executable.")
  return found
}

// Serves `dir` on a free local port. Returns { url, stop }.
export async function serve(dir = ".") {
  const ctx = await esbuild.context({})
  const { port } = await ctx.serve({
    servedir: dir,
    host: "127.0.0.1",
    port: 0
  })
  return { url: `http://127.0.0.1:${port}`, stop: () => ctx.dispose() }
}

// Shows the browser window instead of running headless: `npm run test:e2e:headed`, or set HEADED=1.
// npm passes the script name to child processes, which works on every OS (unlike setting env vars in package.json).
const HEADED = !!process.env.HEADED || process.env.npm_lifecycle_event === "test:e2e:headed"

// Starts a headless browser with a fresh profile (so saves never leak between runs). Returns a page object.
export async function launch({ width = 1400, height = 900 } = {}) {
  const profile = mkdtempSync(join(tmpdir(), "clickonomics-browser-"))
  const proc = spawn(
    findBrowser(),
    [
      ...(HEADED
        ? // A visible window that loses focus must keep full speed, or the minigame timers would slow down
          [
            "--disable-background-timer-throttling",
            "--disable-renderer-backgrounding",
            "--disable-backgrounding-occluded-windows"
          ]
        : ["--headless=new"]),
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      `--window-size=${width},${height}`,
      "about:blank"
    ],
    { stdio: "ignore" }
  )

  // The browser writes its debugging port to DevToolsActivePort once it is ready
  const portFile = join(profile, "DevToolsActivePort")
  for (let i = 0; i < 100 && !existsSync(portFile); i++) await sleep(100)
  if (!existsSync(portFile)) {
    proc.kill()
    throw new Error("The browser did not start.")
  }
  await sleep(100)
  const port = readFileSync(portFile, "utf8").split("\n")[0].trim()
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl)
  await new Promise((ok, fail) => {
    ws.onopen = ok
    ws.onerror = fail
  })

  let nextId = 1
  const pending = new Map(),
    listeners = [],
    errors = []
  ws.onmessage = (msg) => {
    const m = JSON.parse(msg.data)
    if (m.id && pending.has(m.id)) {
      const { ok, fail } = pending.get(m.id)
      pending.delete(m.id)
      m.error ? fail(new Error(m.error.message)) : ok(m.result)
    } else if (m.method) listeners.forEach((fn) => fn(m))
  }
  const send = (method, params = {}) =>
    new Promise((ok, fail) => {
      const id = nextId++
      pending.set(id, { ok, fail })
      ws.send(JSON.stringify({ id, method, params }))
    })
  const once = (method) =>
    new Promise((ok) => {
      const fn = (m) => {
        if (m.method === method) {
          listeners.splice(listeners.indexOf(fn), 1)
          ok(m.params)
        }
      }
      listeners.push(fn)
    })

  // Collect uncaught errors and console.error calls so tests can assert there were none
  listeners.push((m) => {
    if (m.method === "Runtime.exceptionThrown") {
      const d = m.params.exceptionDetails
      errors.push((d.exception && d.exception.description) || d.text)
    }
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error")
      errors.push(m.params.args.map((a) => a.value ?? a.description).join(" "))
  })
  await send("Runtime.enable")
  await send("Page.enable")
  await send("Network.enable")
  // Keep tests offline and fast: the CrazyGames SDK is blocked, so the game falls back to localStorage
  await send("Network.setBlockedURLs", { urls: ["*sdk.crazygames.com*"] })
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false
  })

  const page = {
    errors,
    async goto(url) {
      const loaded = once("Page.loadEventFired")
      await send("Page.navigate", { url })
      await loaded
      await sleep(300) // let the game's async boot finish
    },
    // Runs `expression` in the page and returns its (JSON-serialisable) value. Promises are awaited.
    async eval(expression) {
      const r = await send("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true
      })
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
      return r.result.value
    },
    // Wipes saved data for a site (leaves the page first, so its save-on-close can't write it back)
    async clearStorage(origin) {
      await page.goto("about:blank")
      await send("Storage.clearDataForOrigin", { origin, storageTypes: "all" })
    },
    async click(selector) {
      const ok = await page.eval(
        `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.click(); return true; })()`
      )
      if (!ok) throw new Error(`click: no element matches ${selector}`)
    },
    text: (selector) => page.eval(`document.querySelector(${JSON.stringify(selector)})?.textContent ?? null`),
    async resize(w, h) {
      await send("Emulation.setDeviceMetricsOverride", {
        width: w,
        height: h,
        deviceScaleFactor: 1,
        mobile: false
      })
    },
    async screenshot() {
      return Buffer.from((await send("Page.captureScreenshot", { format: "png" })).data, "base64")
    },
    wait: sleep,
    async close() {
      try {
        await send("Browser.close")
      } catch {
        /* already closing */
      }
      ws.close()
      proc.kill()
      await sleep(200)
      rmSync(profile, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 200
      })
    }
  }
  return page
}
