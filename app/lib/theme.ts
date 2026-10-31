// Capsomer's pre-paint theme script (capsomer/theme-server), with the key the site has always used ("theme", the theme
// button's data-cap-pref), so a visitor's choice survives. The policy trusts this exact text by hash (workers/security-headers.ts).
import { themeScript } from "capsomer/theme-server";

export const THEME_KEY = "theme";
export const THEME_SCRIPT = themeScript(THEME_KEY);

/**
 * The one inline style, in Carrel's previews: .reveal sections start hidden until /site.js shows them, and a preview runs
 * no script, so it shows them. The policy trusts it by hash too, for a preview link served on this site.
 */
export const PREVIEW_STYLE = ".reveal{opacity:1;transform:none}";
