// Carrel's site API, mounted by workers/app.ts at /api/carrel/v1, with its preview links at /preview/<token>. One key
// (CARREL_SITE_KEY, a Worker secret) reaches only that prefix and nothing else on the site.
import { standardSiteApi, type PublishHook } from "@dustinedwards/site-api";
import { INDEXNOW_KEY, SITE_URL } from "~/lib/site";
import { createCarrelAdapter } from "./adapter.server";

/**
 * Every hook hears only a publish, the one write that changes what the page says: a save to a section stays a draft
 * and a section is never taken down, renamed or deleted, so no other action touches the page. The webmention hook
 * also sends the page itself, since a section's address is the page with a fragment.
 */
function onPublish(hook: PublishHook | undefined, page = false): PublishHook | undefined {
  return (
    hook && {
      name: hook.name,
      on: ["publish"],
      run: (event) =>
        page && event.url !== null
          ? hook.run({ ...event, url: new URL("/", event.url).href })
          : hook.run(event),
    }
  );
}

export function carrelApi(env: Env, origin: string, stylesheets: string[]) {
  // The replay store, preview links, hook retries and webmentions live in D1 (drizzle/0006_site_api_store.sql). A
  // published change tells IndexNow at once (a request from a preview origin sends nothing); a schedule the cron
  // publishes purges the stored page.
  return standardSiteApi({
    adapter: createCarrelAdapter(env, { origin, stylesheets }),
    key: env.CARREL_SITE_KEY,
    limiter: env.CARREL_RATE_LIMIT,
    db: env.DB,
    indexNow: { origin: SITE_URL, key: INDEXNOW_KEY },
    hooks: ({ indexNow, purge, webmention }) => [
      onPublish(indexNow),
      onPublish(purge),
      onPublish(webmention, true),
    ],
  });
}

/**
 * The per-minute cron's job (workers/app.ts): every schedule that is due goes live, with the hooks a Carrel publish
 * runs, and hooks that failed earlier are tried again. A schedule that fails fails the job, and is tried next minute.
 */
export async function runCarrelSchedules(env: Env, now: Date): Promise<void> {
  await carrelApi(env, SITE_URL, []).runSchedulesOrThrow({ now });
}
