// Carrel's site API, mounted by workers/app.ts at /api/carrel/v1, with its preview links at /preview/<token>. One key
// (CARREL_SITE_KEY, a Worker secret) reaches only that prefix and nothing else on the site.
import { submitIndexNow } from "@drdustinedwards/site-helpers/indexnow";
import { createSiteApi, indexNowHook, webmentionHook, type PublishHook } from "@dustinedwards/site-api";
import { d1SiteApiStore } from "@dustinedwards/site-api/store";
import { schedulePurgeHook } from "@dustinedwards/site-runtime/edge-cache";
import { INDEXNOW_KEY, SITE_URL } from "~/lib/site";
import { createCarrelAdapter } from "./adapter.server";

/**
 * Webmentions for the one page every section belongs to. A section's address is the page with a fragment, so the
 * page is sent as itself, and only a publish changes what it links to: no section is ever taken down, renamed or
 * deleted, and a save to a live section reads as a draft, which the hook would take for a page gone.
 */
function pageWebmentions(hook: PublishHook): PublishHook {
  return { name: hook.name, on: ["publish"], run: (event) => hook.run({ ...event, url: new URL("/", event.url).href }) };
}

export function carrelApi(env: Env, origin: string, stylesheets: string[]) {
  // The replay store (safe retries by change id), preview links, failed hooks' retries and the webmentions sent
  // (drizzle/0006_site_api_store.sql).
  const store = d1SiteApiStore(env.DB);
  return createSiteApi({
    adapter: createCarrelAdapter(env, { origin, stylesheets }),
    key: env.CARREL_SITE_KEY,
    limiter: env.CARREL_RATE_LIMIT,
    log: (entry) => console.log(JSON.stringify(entry)),
    store,
    // A published change tells IndexNow at once; a request from a preview origin sends nothing. A schedule the cron
    // publishes purges the stored page, as the gateway does after a Carrel write.
    hooks: [indexNowHook({ submit: submitIndexNow, origin: SITE_URL, key: INDEXNOW_KEY }), schedulePurgeHook(), pageWebmentions(webmentionHook({ store }))],
  });
}

/**
 * The per-minute cron's job (workers/app.ts): every schedule that is due goes live, with the hooks a Carrel publish
 * runs, and hooks that failed earlier are tried again. A schedule that fails fails the job, and is tried next minute.
 */
export async function runCarrelSchedules(env: Env, now: Date): Promise<void> {
  const run = await carrelApi(env, SITE_URL, []).runSchedules({ now });
  if (run.failed > 0) throw new Error(`${run.failed} Carrel schedule(s) failed`);
}
