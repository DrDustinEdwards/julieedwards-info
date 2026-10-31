// The header set every response carries. The static files' `_headers` is written from the same registry entry by
// site-runtime's `site-runtime-headers` bin (npm run build), with the same TDMRep header. Package imports only.
import { TDM_RESERVATION_HEADERS } from "@drdustinedwards/site-helpers/robots";
import { buildSecurityHeaders } from "@dustinedwards/site-runtime/headers";
import { julieedwardsInfo } from "@dustinedwards/site-runtime/sites";

// The site's registry entry (site-runtime ./sites: COEP and the Integrity-Policy Report-Only come from it) plus
// Prelum's TDMRep header, which reserves training rights as /ai.txt says.
export const SECURITY_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  ...buildSecurityHeaders({ site: julieedwardsInfo }),
  ...TDM_RESERVATION_HEADERS,
});
