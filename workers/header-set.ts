// The header set every response carries, Worker and static file alike, and the static files' `_headers`, which
// scripts/headers-file.ts writes from it. Package imports only, so Node runs it as it is.
import { TDM_RESERVATION_HEADERS } from "@drdustinedwards/site-helpers/robots";
import { buildSecurityHeaders, corpFor, headersFile } from "@dustinedwards/site-runtime/headers";
import { julieedwardsInfo } from "@dustinedwards/site-runtime/sites";

// The site's registry entry (site-runtime ./sites) plus Prelum's TDMRep header, which reserves training rights as /ai.txt says.
// COEP credentialless: the page embeds no frame, and its photos and the beacon load without cookies.
export const SECURITY_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  ...buildSecurityHeaders({ site: julieedwardsInfo, coep: { value: "credentialless" } }),
  ...TDM_RESERVATION_HEADERS,
});

// Built files: Vite names each one by its content hash, so a year is safe, and they are the stylesheets, scripts and
// fonts Carrel's sandboxed preview loads from an opaque origin, so CORP is what corpFor gives them. Files at stable paths
// keep the default revalidation. The share card is an image other origins load, marked as corpFor marks an image.
// `charset: true` adds Content-Type with charset=utf-8 on the text files, which the asset server sends without one.
export const STATIC_HEADERS_FILE = headersFile(SECURITY_HEADERS, {
  comment: "Written by scripts/headers-file.ts from workers/header-set.ts (npm run build). Do not edit.",
  charset: true,
  paths: {
    "/assets/*": {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Cross-Origin-Resource-Policy": corpFor("text/css"),
    },
    "/opengraph-image.png": { "Cross-Origin-Resource-Policy": corpFor("image/png") },
  },
});
