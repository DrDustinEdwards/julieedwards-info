// Carrel's site API, mounted by workers/app.ts at /api/carrel/v1. One key (CARREL_SITE_KEY, a Worker
// secret) reaches only that prefix and nothing else on the site.
import { createSiteApi } from "@dustinedwards/site-api";
import { createCarrelAdapter } from "./adapter.server";

export function carrelApi(env: Env, origin: string, stylesheets: string[]) {
  return createSiteApi({
    adapter: createCarrelAdapter(env, { origin, stylesheets }),
    key: env.CARREL_SITE_KEY,
    limiter: env.CARREL_RATE_LIMIT,
    log: (entry) => console.log(JSON.stringify(entry)),
  });
}
