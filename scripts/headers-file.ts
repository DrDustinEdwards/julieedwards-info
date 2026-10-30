// Writes public/_headers from the Worker's own set (workers/header-set.ts). `npm run build` and `npm run dev` run it
// first, so a deploy always ships the current set; the committed copy is what it last wrote.
import { writeFileSync } from "node:fs";
import { STATIC_HEADERS_FILE } from "../workers/header-set.ts";

writeFileSync(new URL("../public/_headers", import.meta.url), STATIC_HEADERS_FILE);
