// aislop-ignore-next-line ai-slop/hallucinated-import -- a Workers built-in, not an npm package
import { WorkerEntrypoint } from "cloudflare:workers";
import type { ServerBuild } from "react-router";
import { siteApiStep } from "@dustinedwards/site-api";
import { standardFiles } from "@drdustinedwards/site-helpers/files";
import { markdownCopies } from "@drdustinedwards/site-helpers/markdown-copy";
import { operatorJobTools } from "@dustinedwards/site-runtime/cron";
import { defineSite, siteRenderer, siteWorker } from "@dustinedwards/site-runtime/worker";
import { allCronJobs, cronJobs } from "../app/lib/cron.server";
import { carrelApi } from "../app/lib/carrel/handler.server";
import { backupStatus } from "../app/lib/backup.server";
import { loadContent } from "../app/lib/content.server";
import { serveMedia } from "../app/lib/media/serve.server";
import { INDEXNOW_KEY, SITE_URL } from "../app/lib/site";
import { withSecurityHeaders } from "./security-headers";
import { FONT_PRELOADS } from "../app/lib/preloads";

// site-runtime's limiter class, bound as RATE_LIMITER (wrangler.jsonc); the operator API counts through it.
export { RateLimiter } from "@dustinedwards/site-runtime/rate-limit/durable-object";

/**
 * The site's Worker: site-runtime's gateway, Renderer, request log and cron (./worker), with what is this site's own:
 * the bare host, its machine files, the operator tools, the media library and Carrel's site API.
 */
const site = defineSite<Env>({
  name: "Julie Edwards",
  serverBuild: () => import("virtual:react-router/server-build") as Promise<ServerBuild>,
  mode: import.meta.env.MODE,
  withSecurityHeaders,
  // www answers with a move, never a second copy of the site.
  canonical: { host: new URL(SITE_URL).hostname },
  // robots.txt, ai.txt (named from the profile in D1), site.webmanifest and the IndexNow key file (Prelum ./files).
  files: (request, env) =>
    standardFiles({
      origin: SITE_URL,
      indexNowKey: INDEXNOW_KEY,
      ai: async () => {
        const { profile } = (await loadContent(env)).content;
        return { name: profile.name, contact: profile.email };
      },
      manifest: async () => {
        const { profile } = (await loadContent(env)).content;
        return {
          name: profile.name,
          description: profile.description,
          themeColor: "#15532E",
          backgroundColor: "#15532E",
          lang: "en",
        };
      },
    })(request),
  operator: (env) =>
    operatorJobTools({
      db: env.DB,
      jobs: () => allCronJobs(env),
      backupStatus: () => backupStatus(env),
      files: ["media"],
    }),
  steps: [
    // The media library's files, each size cached at the edge (`caches.default` is the Workers runtime's).
    (request, env, _ctx, { url }) =>
      url.pathname.startsWith("/media/")
        ? serveMedia(request, env, (caches as CacheStorage & { default: Cache }).default)
        : undefined,
    // Carrel's site API under /api/carrel/v1 and its preview links (site-api's step); a write it accepts (a section,
    // a picture's alt text or crop) can change the page, so the stored page is purged after it.
    siteApiStep(async (env, kit) => carrelApi(env, kit.url.origin, await kit.stylesheets())),
  ],
  preloads: FONT_PRELOADS,
  // Every public page has a Markdown copy at its path plus .md, which llms.txt promises, and llms-full.txt.
  wrap: (handler) =>
    markdownCopies(handler, {
      origin: SITE_URL,
      siteMarkdown: false,
      skip: (path) =>
        path.startsWith("/media/") || path.startsWith("/api/") || path.startsWith("/preview/"),
    }),
  cron: cronJobs,
});

export class Renderer extends siteRenderer(WorkerEntrypoint<Env>, site) {}

export default siteWorker(site) satisfies ExportedHandler<Env>;
