import type { PublishHook } from "@dustinedwards/site-api";
import { SITE_URL } from "~/lib/site";

/**
 * Webmentions for the one page every section belongs to. A section's path is the page with its anchor (/#about), and
 * the page served there is "/", whose links the hook reads, so "/" on the site's own origin is the source. Every
 * change to the live page is told: a publish, a scheduled update at its time, and whatever else the shared hook hears.
 * A request's update is a draft saved beside the live section, which leaves the page as it was, so it tells nothing,
 * and neither does a request on another origin (a preview or a dev server), as with IndexNow.
 */
export function pageWebmentions(hook: PublishHook): PublishHook {
  return {
    name: hook.name,
    ...(hook.on ? { on: hook.on } : {}),
    run: (event) => {
      if (event.action === "update" && event.trigger === "request") return true;
      if (event.request && new URL(event.request.url).origin !== SITE_URL) return true;
      return hook.run({ ...event, path: "/", url: new URL("/", SITE_URL).href });
    },
  };
}

