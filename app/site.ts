// Everything the page does in the browser, without a framework, bundled into /site.js by vite.config.ts:
// Capsomer's site header (the phone menu's sheet, the tips) and theme button. The sections rise into view
// in CSS (Capsomer's reveal). The pre-paint theme choice is the inline script in app/lib/theme.ts.
import { enhance as enhanceHeader } from "capsomer/behavior/site-header";
import { enhance as enhanceTheme } from "capsomer/behavior/theme-switch";

enhanceHeader();
enhanceTheme();
