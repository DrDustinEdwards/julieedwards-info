// aislop-ignore-next-line ai-slop/hallucinated-import -- a Workers built-in, not an npm package
import { WorkerEntrypoint } from "cloudflare:workers";
import { createRequestHandler, RouterContextProvider, type ServerBuild } from "react-router";
import { corpFor } from "@dustinedwards/site-runtime/headers";
import {
  cacheKey,
  forReader,
  forRenderer,
  purgeAfterWrite,
  settleCacheHeaders,
  withPurgePages,
} from "@dustinedwards/site-runtime/edge-cache";
import {
  SPECULATION_RULES_HEADER,
  SPECULATION_RULES_PATH,
  speculationRulesResponse,
} from "@dustinedwards/site-runtime/prefetch";
import { preloads, rootStylesheets, withPreloadHeader } from "@dustinedwards/site-runtime/preload";
import { timedRender } from "@dustinedwards/site-runtime/server-timing";
import { canonicalRedirect } from "@dustinedwards/site-runtime/url";
import { receiveCspReport } from "@dustinedwards/site-runtime/csp-report";
import { markdownCopies } from "@drdustinedwards/site-helpers/markdown-copy";
import { allCronJobs, cronJobs } from "../app/lib/cron.server";
import { runJobs, runJobTool } from "@dustinedwards/site-runtime/cron";
import { operatorResponse } from "@dustinedwards/site-runtime/operator";
import { maintenanceOn, maintenanceResponse } from "@dustinedwards/site-runtime/maintenance";
import { logEvent, withRequestLog } from "@dustinedwards/site-runtime/log";
import { countNotFound } from "@dustinedwards/site-runtime/not-found";
import { cloudflareContext } from "../app/lib/context.server";
import { carrelApi } from "../app/lib/carrel/handler.server";
import { backupStatus } from "../app/lib/backup.server";
import { serveMedia } from "../app/lib/media/serve.server";
import { SITE_URL } from "../app/lib/site";
import { CSP_REPORT_PATH, withSecurityHeaders } from "./security-headers";
import { FONT_PRELOADS } from "../app/lib/preloads";

// site-runtime's limiter class, bound as RATE_LIMITER (wrangler.jsonc); the operator API counts through it.
export { RateLimiter } from "@dustinedwards/site-runtime/rate-limit/durable-object";

// A preview link's token (Carrel's /preview/<token>), cut from a logged path.
const PREVIEW_TOKEN = /\/(preview)\/[^/?#\s'"]+/g;

const serverBuild = () => import("virtual:react-router/server-build") as Promise<ServerBuild>;
const requestHandler = createRequestHandler(serverBuild, import.meta.env.MODE);

/**
 * The cacheable entrypoint (wrangler.jsonc.example, `exports`): the page and the small text routes, rendered and then
 * stored by the Workers cache under the key the gateway names. Every header a stored page leaves with is set here, or
 * it is missing from every hit. The policy hashes its one inline script and the page sets no cookie, so a stored page
 * is the same for every reader.
 */
export class Renderer extends withPurgePages(WorkerEntrypoint<Env>) {
  override async fetch(request: Request): Promise<Response> {
    const context = new RouterContextProvider();
    context.set(cloudflareContext, { env: this.env, ctx: this.ctx });
    const page = await timedRender(async () =>
      withSecurityHeaders(await requestHandler(request, context), request),
    );
    if (page.headers.get("Content-Type")?.startsWith("text/html"))
      page.headers.set(SPECULATION_RULES_HEADER.name, SPECULATION_RULES_HEADER.value);
    // Early Hints: the zone answers a page carrying a preload Link header with a 103 first, so the browser starts the
    // render-blocking stylesheet and the hero's fonts while the Worker still renders (site-runtime ./preload).
    const hints = withPreloadHeader(
      page,
      preloads([...rootStylesheets(await serverBuild()), ...FONT_PRELOADS]).header,
    );
    // Last: anything but a shared 200 (/health, the 404 page, an error) leaves private, no-store.
    return settleCacheHeaders(hints, request);
  }
}

/**
 * THE GATEWAY. Cache disabled, so it runs on every request: the CSP report receiver, the media library and Carrel's
 * site API answer here and are never stored; everything else is the Renderer's, through the Workers cache.
 */
const site = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // One hop to the canonical address: https, the bare host (www answers with a move, never a second copy of the
    // site), no trailing slash. The move carries the security set like every other response.
    const redirect = canonicalRedirect(request, { host: new URL(SITE_URL).hostname });
    if (redirect) return withSecurityHeaders(redirect, request);
    // The maintenance page (site-runtime ./maintenance): every path but /health answers 503 while the MAINTENANCE var is on.
    if (maintenanceOn(env) && url.pathname !== "/health")
      return withSecurityHeaders(maintenanceResponse({ siteName: "Julie Edwards" }), request);
    // The prefetch rules the page's header names (site-runtime ./prefetch): the next page starts loading on hover.
    if (url.pathname === SPECULATION_RULES_PATH)
      return withSecurityHeaders(speculationRulesResponse(undefined, request), request);
    // CSP violation reports, logged to Workers Logs. Per address, through the CSP_REPORT_RATE_LIMIT binding; over it,
    // or without the binding, a report is dropped (still 204).
    if (url.pathname === CSP_REPORT_PATH) {
      const allow = async (r: Request) =>
        Boolean(env.CSP_REPORT_RATE_LIMIT) &&
        (
          await env.CSP_REPORT_RATE_LIMIT.limit({
            key: r.headers.get("cf-connecting-ip") || "anon",
          })
        ).success;
      return withSecurityHeaders(await receiveCspReport(request, { allow }), request);
    }

    // The operator API Capsid Admin calls (backup_status, run_job): a bearer, not Access, never stored.
    if (url.pathname === "/api/operator") {
      return withSecurityHeaders(
        await operatorResponse(request, {
          token: env.OPERATOR_TOKEN,
          limiter: env.RATE_LIMITER,
          tools: {
            backup_status: {
              description:
                "Reads the backup state now, uncached: the newest complete D1 dump's age and the media files pass, with when each last completed, and a warning when either is past 26 hours. The same read as /health's backup field.",
              run: () => backupStatus(env),
            },
            run_job: runJobTool(env.DB, () => allCronJobs(env)),
          },
        }),
        request,
      );
    }

    // The media library's files (app/lib/media), each size cached at the edge. `caches.default` is the Workers
    // runtime's; the DOM lib does not declare it.
    if (url.pathname.startsWith("/media/")) {
      const media = withSecurityHeaders(
        await serveMedia(request, env, (caches as CacheStorage & { default: Cache }).default),
        request,
      );
      media.headers.set("Cross-Origin-Resource-Policy", corpFor(media.headers.get("Content-Type")));
      return media;
    }

    // Carrel's site API. Its own guard (prefix, rate limit, key, route) answers everything under
    // /api/carrel/v1; nothing else is served by it. Its preview links the page's own stylesheet. Any write it
    // accepts (a section, a picture's alt text or crop) can change the page, so the stored page is purged after it.
    const stylesheets = (await serverBuild()).assets.routes.root?.css ?? [];
    const carrel = carrelApi(env, url.origin, stylesheets);
    // A preview link Carrel made (/preview/<token>, no key): the section's current source drawn as the page. The token
    // is the address; the set's Referrer-Policy (no-referrer, the standard) keeps it from being sent on.
    if (carrel.matchesPreviewLink(request))
      return withSecurityHeaders(await carrel.servePreviewLink(request), request);
    if (carrel.matches(request)) {
      const response = await carrel.handle(request, ctx);
      purgeAfterWrite(request, response, ctx, `carrel ${request.method} ${url.pathname}`);
      return withSecurityHeaders(response, request);
    }

    // The key is the path and the query without tracking parameters. The Worker version stays in the key (no
    // `cross_version_cache`), so every deploy starts cold. A request with a cookie is told no-store for the browser; a
    // reader who already holds the page gets a 304.
    const page = await ctx.exports.Renderer.fetch(forRenderer(request), {
      cf: { cacheKey: cacheKey(url) },
    });
    // A 404 is never stored, so each one reaches here: counted per path and referring host (site-runtime ./not-found).
    countNotFound(env.DB, request, page, ctx);
    return forReader(page, request);
  },

  // The jobs (wrangler.jsonc triggers.crons), one list per cron (app/lib/cron.server.ts), each isolated, timed out and
  // recorded in cron_runs by site-runtime ./cron, which /health reads. A failed job fails the invocation after the
  // others have run. A cron with no list (a trigger added in the dashboard or a misspelt key) runs nothing and says so,
  // and the jobs it was meant for warn "never ran" on /health.
  async scheduled(controller, env) {
    const jobs = cronJobs(env, new Date(controller.scheduledTime))[controller.cron];
    if (!jobs) {
      logEvent("cron_unknown", { cron: controller.cron }, { level: "warn" });
      return;
    }
    await runJobs(env.DB, jobs);
  },
} satisfies ExportedHandler<Env>;

// Every request writes one `request` line (site-runtime ./log: path, status, ms and the deployed commit), a preview
// link's token cut from its path.
type IncomingRequest = Parameters<typeof site.fetch>[0];

// Prelum's markdownCopies: every public page has a Markdown copy at its path plus .md and answers Accept: text/markdown,
// which llms.txt promises, and the site has an llms-full.txt built from its sitemap. The media library, Carrel's site API
// and the preview links are not pages and get no copy.
const withMarkdownCopies = markdownCopies(
  // The wrapper types the request as a plain Request; it hands on the one the runtime gave it, or a GET it made from it.
  (request: Request, env: Env, ctx: ExecutionContext) =>
    site.fetch(request as IncomingRequest, env, ctx),
  {
    origin: SITE_URL,
    skip: (path) =>
      path.startsWith("/media/") || path.startsWith("/api/") || path.startsWith("/preview/"),
  },
);

export default {
  ...site,
  fetch: withRequestLog(
    (request: Request, env: Env, ctx: ExecutionContext) => withMarkdownCopies(request, env, ctx),
    {
      sha: (env) => (env as { DEPLOY_SHA?: string }).DEPLOY_SHA,
      tokenPath: PREVIEW_TOKEN,
    },
  ),
} satisfies ExportedHandler<Env>;
