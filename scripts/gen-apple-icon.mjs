import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// iOS renders transparency as black, so the home-screen icon needs to be
// composited onto a solid brand-green tile even though the browser favicon
// (app/icon.svg) is transparent.

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const svg = await readFile(resolve(root, "app", "icon.svg"));
const out = await sharp(svg)
  .resize(180, 180, { fit: "contain", background: "#15532E" })
  .flatten({ background: "#15532E" })
  .png()
  .toBuffer();
await writeFile(resolve(root, "app", "apple-icon.png"), out);
console.log("wrote app/apple-icon.png (180x180, brand-green tile)");
