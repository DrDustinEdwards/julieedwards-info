// Secrets set with `wrangler secret put` (and .dev.vars locally), never in wrangler.jsonc, so `wrangler types`
// does not know them. Merged into the generated Env here.
interface Env {
  /** "1" or "true" puts the site in maintenance: every path but /health answers the 503 page (site-runtime ./maintenance). Set in the dashboard. */
  MAINTENANCE?: string;
  /** Carrel's key for /api/carrel/v1 (32 characters or more). Unset or short refuses every request. */
  CARREL_SITE_KEY?: string;
  /** The Anthropic key for the media suggestions (Claude Haiku 5.5, called straight at Anthropic). Unset: no suggestions. */
  ANTHROPIC_API_KEY?: string;
  /** The bearer for /api/operator (32 characters or more), the door Capsid Admin's backups reach the site through. Unset or short closes the route. */
  OPERATOR_TOKEN?: string;
}
