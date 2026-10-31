// The header set every response carries, Worker and static file alike, and the static files' `_headers`, which
// scripts/headers-file.ts writes from it. Package imports only, so Node runs it as it is.
import { TDM_RESERVATION_HEADERS } from "@drdustinedwards/site-helpers/robots";
import { buildSecurityHeaders, headersFile } from "@dustinedwards/site-runtime/headers";
import { julieedwardsInfo } from "@dustinedwards/site-runtime/sites";

// The site's registry entry (site-runtime ./sites) plus Prelum's TDMRep header, which reserves training rights as /ai.txt says.
export const SECURITY_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  ...buildSecurityHeaders({ site: julieedwardsInfo }),
  ...TDM_RESERVATION_HEADERS,
});

// Built files: Vite names each one by its content hash, so a year is safe. Files at stable paths keep the default
// revalidation. The share card is an image other origins load, so it is cross-origin, as corpFor marks the library's.
export const STATIC_HEADERS_FILE = headersFile(SECURITY_HEADERS, {
  comment: "Written by scripts/headers-file.ts from workers/header-set.ts (npm run build). Do not edit.",
  paths: {
    "/assets/*": { "Cache-Control": "public, max-age=31536000, immutable" },
    "/opengraph-image.png": { "Cross-Origin-Resource-Policy": "cross-origin" },
  },
});
