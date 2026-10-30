import type { Preload } from "@dustinedwards/site-runtime/preload";
import montserrat600 from "@fontsource/montserrat/files/montserrat-latin-600-normal.woff2?url";
import openSans400 from "@fontsource/open-sans/files/open-sans-latin-400-normal.woff2?url";

/** The fonts the hero paints first: its Montserrat 600 heading and Open Sans body text, the same files app.css loads. */
export const FONT_PRELOADS: Preload[] = [
  { href: montserrat600, as: "font", type: "font/woff2" },
  { href: openSans400, as: "font", type: "font/woff2" },
];
