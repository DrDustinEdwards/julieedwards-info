import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const svg = await readFile(resolve(root, "app", "icon.svg"));
const out = await sharp(svg).resize(180, 180).png().toBuffer();
await writeFile(resolve(root, "app", "apple-icon.png"), out);
console.log("wrote app/apple-icon.png (180x180)");
