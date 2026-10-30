// The page's edge cache (workers/app.ts): the Renderer's responses are stored by the Workers cache, and every write
// Carrel makes purges them by tag. The same scheme as dustinedwards.info (app/lib/seo.ts, app/lib/cache-purge.server.ts).
// aislop-ignore-next-line ai-slop/hallucinated-import -- a Workers built-in, not an npm package
import { cache } from "cloudflare:workers";

/** Stored at the edge, never in a browser: a purge cannot reach a browser, so its max-age stays 0. */
export const SHARED_CACHE_CONTROL = "public, max-age=0";

/** The one tag every stored page carries, and the one a write purges. */
export const PAGES_CACHE_TAG = "pages";

/**
 * A day fresh is safe because every write purges and every deploy starts cold. Sent as `Cloudflare-CDN-Cache-Control`,
 * not `s-maxage`: `s-maxage` implies proxy-revalidate, so Cloudflare would refuse to serve stale while it re-renders.
 */
const EDGE_CACHE_CONTROL = "max-age=86400, stale-while-revalidate=604800";

/** The headers a route sends to have its response stored at the edge. */
export function publicHtmlHeaders(): Record<string, string> {
  return { "Cache-Control": SHARED_CACHE_CONTROL, "Cloudflare-CDN-Cache-Control": EDGE_CACHE_CONTROL, "Cache-Tag": PAGES_CACHE_TAG };
}

type PurgeResult = { success: boolean; errors?: Array<{ code: number; message: string }> };

/**
 * Drops every stored page. Never throws: a failed purge is a stale page until the day is up and a log line, not a
 * failed save. Miniflare has no Workers cache, so there the purge is skipped.
 * @param why one phrase naming the write that caused it, for the log line
 */
export async function purgePages(why: string): Promise<void> {
  const purge = (cache as typeof cache & { purge?: (o: unknown) => Promise<PurgeResult> })?.purge;
  if (typeof purge !== "function") return;
  try {
    const result = await purge({ tags: [PAGES_CACHE_TAG] });
    if (!result?.success) console.error(JSON.stringify({ alert: "cache-purge-refused", why, errors: result?.errors ?? [] }));
  } catch (error) {
    console.error(JSON.stringify({ alert: "cache-purge-threw", why, detail: String(error) }));
  }
}
