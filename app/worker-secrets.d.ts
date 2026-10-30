// Secrets set with `wrangler secret put` (and .dev.vars locally), never in wrangler.jsonc, so `wrangler types`
// does not know them. Merged into the generated Env here.
interface Env {
  /** Carrel's key for /api/carrel/v1 (32 characters or more). Unset or short refuses every request. */
  CARREL_SITE_KEY?: string;
  /**
   * The AI Gateway the media suggestions run through, as site-runtime's ./ai-gateway spells it:
   * https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/anthropic. Unset: Workers AI is called directly.
   * A secret only because it carries the account id; the AI binding authenticates itself.
   */
  AI_GATEWAY_BASE_URL?: string;
}
