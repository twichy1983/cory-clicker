// Local web server for development.
//   npm run dev              serves the source files at http://localhost:8000
//   npm run preview          serves the CrazyGames build in dist/crazygames (run `npm run build` first)
//   add -- --lan             to reach the server from a phone on the same Wi-Fi
import * as esbuild from "esbuild";
import { existsSync } from "node:fs";

const args = process.argv.slice(2);
const dir = args.includes("--dist") ? "dist/crazygames" : ".";
const host = args.includes("--lan") ? "0.0.0.0" : "127.0.0.1";

if (!existsSync(dir)) {
  console.error(`${dir} does not exist. Run "npm run build" first.`);
  process.exit(1);
}

const ctx = await esbuild.context({});
const { port } = await ctx.serve({ servedir: dir, host, port: 8000 });
console.log(`Serving ${dir === "." ? "the source files" : dir} at http://localhost:${port}/`);
if (dir === ".") console.log(`Test mode (everything free): http://localhost:${port}/?test`);
console.log("Press Ctrl+C to stop.");
