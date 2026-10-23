// Secrets set with `wrangler secret put` (and .dev.vars locally), never in wrangler.jsonc, so `wrangler types`
// does not know them. Merged into the generated Env here.
interface Env {
  /** Carrel's key for /api/carrel/v1 (32 characters or more). Unset or short refuses every request. */
  CARREL_SITE_KEY?: string;
}
