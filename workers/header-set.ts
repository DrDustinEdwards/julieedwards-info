// The header set every response carries, Worker and static file alike, and the static files' `_headers`, which the
// build writes from it (vite.config.ts). Package imports only, so Vite's config can load it.
import { TDM_RESERVATION_HEADERS } from "@drdustinedwards/site-helpers/robots";
import { buildSecurityHeaders, headersFile } from "@dustinedwards/site-runtime/headers";

// The standard set plus Prelum's TDMRep header, which reserves training rights as /ai.txt says.
export const SECURITY_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  ...buildSecurityHeaders(),
  ...TDM_RESERVATION_HEADERS,
});

// What another origin may embed: Carrel's preview, on Carrel's own origin, loads the stylesheet (/assets/*) and the
// library pictures (/media/*), and the share card is fetched by every platform a link is posted to. Everything else
// stays same-origin.
export const SHARED_MEDIA_HEADERS: Readonly<Record<string, string>> = Object.freeze({ "Cross-Origin-Resource-Policy": "cross-origin" });

// Built files: Vite names each one by its content hash, so a year is safe. Files at stable paths keep the default
// revalidation.
const IMMUTABLE = { "Cache-Control": "public, max-age=31536000, immutable" };

export const STATIC_HEADERS_FILE = headersFile(SECURITY_HEADERS, {
  comment: "Written by the build from workers/header-set.ts. Do not edit.",
  paths: { "/assets/*": { ...IMMUTABLE, ...SHARED_MEDIA_HEADERS }, "/opengraph-image.png": SHARED_MEDIA_HEADERS },
});
