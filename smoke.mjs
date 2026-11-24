import { serve, launch } from "/Users/christianmendy/Development/cory-clicker/scripts/browser.js"
const dir = process.argv[2] || "."
const paths = process.argv.slice(3).length ? process.argv.slice(3) : ["/", "/?test"]
process.chdir("/Users/christianmendy/Development/cory-clicker")
const srv = await serve(dir)
const page = await launch()
try {
  for (const p of paths) {
    await page.goto(srv.url + p)
    for (let i = 0; i < 5; i++) await page.click("#bigDollar")
    const r = await page.eval(`({ dollars: document.querySelector("#dollars").textContent, title: document.title,
      testBar: !!document.querySelector("#testBar"), bld: document.querySelectorAll("#buildings .bld").length,
      jobs: document.querySelectorAll("#jobList .job").length, upg: document.querySelector("#upgrades").textContent.slice(0,60),
      ach: document.querySelector("#achTabCount").textContent })`)
    console.log(p, JSON.stringify(r))
  }
  // exercise tooltips, tabs, jobs
  await page.eval(
    `(() => { for (const el of document.querySelectorAll("[data-tt]")) el.dispatchEvent(new MouseEvent("mouseover", {bubbles:true})); document.querySelectorAll(".tab").forEach(t => t.click()); })()`
  )
  await page.wait(1200)
  console.log("errors:", page.errors.length ? page.errors : "none")
} finally {
  await page.close()
  await srv.stop()
}
