// Carrel's site API, mounted by workers/app.ts at /api/carrel/v1. One key (CARREL_SITE_KEY, a Worker
// secret) reaches only that prefix and nothing else on the site.
import { submitIndexNow } from "@drdustinedwards/site-helpers/indexnow";
import { createSiteApi } from "@dustinedwards/site-api";
import { INDEXNOW_KEY, SITE_URL } from "~/lib/site";
import { createCarrelAdapter } from "./adapter.server";

export function carrelApi(env: Env, origin: string, stylesheets: string[]) {
  return createSiteApi({
    adapter: createCarrelAdapter(env, { origin, stylesheets }),
    key: env.CARREL_SITE_KEY,
    limiter: env.CARREL_RATE_LIMIT,
    log: (entry) => console.log(JSON.stringify(entry)),
    // A published change tells IndexNow at once; a request from a preview origin sends nothing.
    onPageChange: (paths, request) =>
      submitIndexNow({ origin: SITE_URL, key: INDEXNOW_KEY, urls: paths.map((path) => `${SITE_URL}${path}`), from: request.url }),
  });
}
