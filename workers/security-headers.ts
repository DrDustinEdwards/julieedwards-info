// Every security header the site sends, in one place; workers/app.ts applies them to every response.
import { buildSecurityHeaders } from "@dustinedwards/site-runtime/headers";
import { buildContentSecurityPolicy, reportingEndpoints, scriptHash } from "@dustinedwards/site-runtime/csp";
import { THEME_SCRIPT } from "../app/lib/theme";

export const CSP_REPORT_PATH = "/csp-report";
const CSP_ENDPOINT = "csp-endpoint";

// What the page loads beyond itself: the profile photo's hosts, the theme script by hash (the page ships
// no other inline script; /site.js is 'self'), the contact grid's style attributes, and the
// Cloudflare Web Analytics beacon the edge injects.
async function contentSecurityPolicy(): Promise<string> {
  return buildContentSecurityPolicy({
    sources: { img: ["data:", "https://content.julieedwards.info", "https://blog.julieedwards.info"] },
    scriptHashes: [await scriptHash(THEME_SCRIPT)],
    styleAttributesInline: true,
    cloudflareWebAnalytics: true,
    reportUri: CSP_REPORT_PATH,
    reportTo: CSP_ENDPOINT,
  }).value;
}

const STANDARD = buildSecurityHeaders({
  overrides: {
    "Cross-Origin-Resource-Policy": {
      value: "cross-origin",
      reason: "Carrel's preview, on Carrel's own origin, loads this site's stylesheet and images",
    },
  },
});

let headers: Promise<Record<string, string>> | undefined;

/** The whole set, built once per isolate (the policy hashes a constant), with the report group at `origin`. */
export async function securityHeaders(origin: string): Promise<Record<string, string>> {
  headers ??= contentSecurityPolicy().then((csp) => ({ ...STANDARD, "Content-Security-Policy": csp }));
  return { ...(await headers), "Reporting-Endpoints": reportingEndpoints(CSP_ENDPOINT, new URL(CSP_REPORT_PATH, origin)) };
}
