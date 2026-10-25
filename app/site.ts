// Everything the page does in the browser, without a framework, bundled into /site.js by vite.config.ts:
// Capsomer's site header (the phone menu's sheet, the tips) and theme button, and the sections that rise
// into view. The pre-paint theme choice is the inline script in app/lib/theme.ts.
import { enhance as enhanceHeader } from "capsomer/behavior/site-header";
import { enhance as enhanceTheme } from "capsomer/behavior/theme-switch";

enhanceHeader();
enhanceTheme();

const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }
  },
  { threshold: 0.12 },
);
for (const el of document.querySelectorAll(".reveal")) io.observe(el);
