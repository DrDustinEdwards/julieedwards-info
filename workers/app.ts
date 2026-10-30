// aislop-ignore-next-line ai-slop/hallucinated-import -- a Workers built-in, not an npm package
import { WorkerEntrypoint, cache } from "cloudflare:workers";
import { createRequestHandler, RouterContextProvider, type ServerBuild } from "react-router";
import { applyHeaderSet } from "@dustinedwards/site-runtime/headers";
import { PAGES_CACHE_TAG, cacheKey, forReader, purgeTags, settleCacheHeaders } from "@dustinedwards/site-runtime/edge-cache";
import { preloads } from "@dustinedwards/site-runtime/preload";
import { receiveCspReport } from "@dustinedwards/site-runtime/csp-report";
import { cloudflareContext } from "../app/lib/context.server";
import { carrelApi } from "../app/lib/carrel/handler.server";
import { runBackup } from "../app/lib/backup.server";
import { serveMedia } from "../app/lib/media/serve.server";
import { CSP_REPORT_PATH, securityHeaders } from "./security-headers";

const serverBuild = () => import("virtual:react-router/server-build") as Promise<ServerBuild>;
const requestHandler = createRequestHandler(serverBuild, import.meta.env.MODE);

async function secure(response: Response, origin: string): Promise<Response> {
  const headers = new Headers(response.headers);
  applyHeaderSet(headers, await securityHeaders(origin));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

/**
 * The cacheable entrypoint (wrangler.jsonc.example, `exports`): the page and the small text routes, rendered and then
 * stored by the Workers cache under the key the gateway names. Every header a stored page leaves with is set here, or
 * it is missing from every hit. The policy hashes its one inline script and the page sets no cookie, so a stored page
 * is the same for every reader.
 */
export class Renderer extends WorkerEntrypoint<Env> {
  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const context = new RouterContextProvider();
    context.set(cloudflareContext, { env: this.env, ctx: this.ctx });
    const page = await secure(await requestHandler(request, context), url.origin);
    // Early Hints: the zone answers a page carrying a preload Link header with a 103 first, so the browser starts the
    // render-blocking stylesheet while the Worker still renders (site-runtime ./preload).
    if (page.headers.get("Content-Type")?.startsWith("text/html")) {
      const stylesheets = (await serverBuild()).assets.routes.root?.css ?? [];
      const { header } = preloads(stylesheets.map((href) => ({ href, as: "style" as const })));
      if (header) page.headers.append("Link", header);
    }
    // Last: anything but a shared 200 (/health, the 404 page, an error) leaves private, no-store.
    return settleCacheHeaders(page);
  }
}

/**
 * THE GATEWAY. Cache disabled, so it runs on every request: the CSP report receiver, the media library and Carrel's
 * site API answer here and are never stored; everything else is the Renderer's, through the Workers cache.
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // CSP violation reports, logged to Workers Logs. Per address, through the CSP_REPORT_RATE_LIMIT binding; over it,
    // or without the binding, a report is dropped (still 204).
    if (url.pathname === CSP_REPORT_PATH) {
      const allow = async (r: Request) =>
        Boolean(env.CSP_REPORT_RATE_LIMIT) &&
        (await env.CSP_REPORT_RATE_LIMIT.limit({ key: r.headers.get("cf-connecting-ip") || "anon" })).success;
      return receiveCspReport(request, { allow, headers: await securityHeaders(url.origin) });
    }

    // The media library's files (app/lib/media), each size cached at the edge. `caches.default` is the Workers
    // runtime's; the DOM lib does not declare it.
    if (url.pathname.startsWith("/media/")) {
      return secure(await serveMedia(request, env, (caches as CacheStorage & { default: Cache }).default), url.origin);
    }

    // Carrel's site API. Its own guard (prefix, rate limit, key, route) answers everything under
    // /api/carrel/v1; nothing else is served by it. Its preview links the page's own stylesheet. Any write it
    // accepts (a section, a picture's alt text or crop) can change the page, so the stored page is purged after it.
    const stylesheets = (await serverBuild()).assets.routes.root?.css ?? [];
    const carrel = carrelApi(env, url.origin, stylesheets);
    if (carrel.matches(request)) {
      const response = await carrel.handle(request, ctx);
      if (request.method !== "GET" && request.method !== "HEAD" && response.ok) {
        ctx.waitUntil(purgeTags(cache, [PAGES_CACHE_TAG], `carrel ${request.method} ${url.pathname}`));
      }
      return secure(response, url.origin);
    }

    // The key is the path and query. The Worker version stays in the key (no `cross_version_cache`), so every deploy
    // starts cold. A request with a cookie is told no-store for the browser.
    const page = await ctx.exports.Renderer.fetch(request, { cf: { cacheKey: cacheKey(url) } });
    return forReader(page, request);
  },

  // Nightly D1 backup (wrangler.jsonc triggers.crons). Awaited and rethrown, so a failed run shows as a
  // failed invocation and ages /health's backup reading.
  async scheduled(_controller, env) {
    try {
      await runBackup(env);
    } catch (err) {
      console.error("Nightly backup failed:", err);
      throw err;
    }
  },
} satisfies ExportedHandler<Env>;
