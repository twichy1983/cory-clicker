// Builds the CrazyGames version into dist/crazygames/ and zips it for upload.
//   npm run build
// The web version needs no build: GitHub Pages serves the source files directly.
import * as esbuild from "esbuild";
import {
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { zipFolder } from "./zip.js";

const OUT = "dist/crazygames";
const ZIP = "dist/clickonomics-crazygames.zip";
const SDK_TAG = `<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>`;

// Replaces `find` with `replace` in `text`, and stops the build if `find` doesn't appear exactly once.
function replaceOnce(text, find, replace) {
  const count = text.split(find).length - 1;
  if (count !== 1)
    throw new Error(
      `build: expected "${find}" exactly once in index.html, found ${count}`,
    );
  return text.replace(find, () => replace);
}

rmSync("dist", { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// 1. Bundle every JS module into one file
await esbuild.build({
  entryPoints: ["src/main.js"],
  outfile: `${OUT}/game.js`,
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  define: { __BUILD__: '"crazygames"' },
  logLevel: "warning",
});

// 2. The page: point at the bundle and load the SDK in <head>, as CrazyGames requires
let html = readFileSync("index.html", "utf8");
html = replaceOnce(
  html,
  `<script type="module" src="./src/main.js"></script>`,
  `<script src="./game.js"></script>`,
);
html = replaceOnce(
  html,
  `<title>Clickonomics</title>`,
  `<title>Clickonomics</title>\n${SDK_TAG}`,
);
writeFileSync(`${OUT}/index.html`, html);

// 3. Styles and images, copied as they are
cpSync("css", `${OUT}/css`, { recursive: true });
cpSync("assets", `${OUT}/assets`, { recursive: true });

// 4. CrazyGames only accepts relative paths
if (/(src|href)="\//.test(html))
  throw new Error(
    "build: index.html uses an absolute path; use ./relative paths",
  );

// 5. Zip for upload
const files = zipFolder(OUT, ZIP);
const kb = (f) => (statSync(f).size / 1024).toFixed(0) + " KB";
console.log(`Built ${OUT}/ (${files} files) and ${ZIP} (${kb(ZIP)}).`);
console.log(`Check it locally with: npm run preview`);
