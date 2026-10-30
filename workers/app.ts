import { createRequestHandler, RouterContextProvider, type ServerBuild } from "react-router";
import { applyHeaderSet } from "@dustinedwards/site-runtime/headers";
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === CSP_REPORT_PATH) return receiveCspReport(request, { headers: await securityHeaders(url.origin) });

    // The media library's files (app/lib/media), each size cached at the edge. `caches.default` is the Workers
    // runtime's; the DOM lib does not declare it.
    if (url.pathname.startsWith("/media/")) {
      return secure(await serveMedia(request, env, (caches as CacheStorage & { default: Cache }).default), url.origin);
    }

    // Carrel's site API. Its own guard (prefix, rate limit, key, route) answers everything under
    // /api/carrel/v1; nothing else is served by it. Its preview links the page's own stylesheet.
    const stylesheets = (await serverBuild()).assets.routes.root?.css ?? [];
    const carrel = carrelApi(env, url.origin, stylesheets);
    if (carrel.matches(request)) return secure(await carrel.handle(request, ctx), url.origin);

    const context = new RouterContextProvider();
    context.set(cloudflareContext, { env, ctx });
    return secure(await requestHandler(request, context), url.origin);
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
