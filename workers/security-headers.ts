// Every security header the site sends, from site-runtime's pageSecurity; workers/app.ts applies them to every response.
import { scriptHash } from "@dustinedwards/site-runtime/csp";
import { pageSecurity } from "@dustinedwards/site-runtime/page-headers";
import { TRUSTED_TYPES_NAMES } from "@dustinedwards/site-runtime/trusted-types";
import { THEME_SCRIPT } from "../app/lib/theme";
import { SECURITY_HEADERS } from "./header-set";

// The page ships no other inline script, so the theme script is trusted by hash (a constant, hashed once per isolate).
const themeHash = await scriptHash(THEME_SCRIPT);

/**
 * What the page loads beyond itself: the profile photo's hosts, the theme script by hash (/site.js is 'self'), the
 * style attributes Capsomer's Picture paints its placeholder with and the Cloudflare Web Analytics beacon the edge
 * injects. Nothing unlisted (media, frames, workers); the manifest is named. Trusted Types is enforced: every sink takes a
 * policy's value (site-runtime ./trusted-types, installed by startPage).
 */
export const { withSecurityHeaders } = pageSecurity({
  set: SECURITY_HEADERS,
  // The page's scripts also carry the render's nonce, renewed for each reader of a stored page (site-runtime ./worker).
  policy: ({ nonce }) => ({
    nonce,
    sources: {
      img: ["data:", "https://content.julieedwards.info", "https://blog.julieedwards.info"],
    },
    scriptHashes: [themeHash],
    styleAttributesInline: true,
    cloudflareWebAnalytics: true,
    denyUnlisted: true,
    extraDirectives: ["manifest-src 'self'"],
    trustedTypes: TRUSTED_TYPES_NAMES,
  }),
  staged: false,
  // Cross-Origin-Resource-Policy follows the content type, so the media library's pictures may be embedded.
  corp: true,
});
