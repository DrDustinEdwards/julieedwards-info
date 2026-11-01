import { type RouteConfig, index, route } from "@react-router/dev/routes";
import { INDEXNOW_KEY } from "./lib/site";

export default [
  index("routes/home.tsx"),
  route("accessibility", "routes/accessibility.tsx"),
  route("robots.txt", "routes/robots.ts"),
  route("sitemap.xml", "routes/sitemap.ts"),
  route("llms.txt", "routes/llms.ts"),
  route("ai.txt", "routes/ai-txt.ts"),
  route("site.webmanifest", "routes/manifest.ts"),
  route("health", "routes/health.ts"),
  route(".well-known/security.txt", "routes/security-txt.ts"),
  route(`${INDEXNOW_KEY}.txt`, "routes/indexnow-key.ts"),
  // Anything else is the 404 page, in the site's own chrome (root ErrorBoundary).
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
