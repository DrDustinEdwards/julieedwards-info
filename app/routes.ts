import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("robots.txt", "routes/robots.ts"),
  route("sitemap.xml", "routes/sitemap.ts"),
  route("llms.txt", "routes/llms.ts"),
  route("ai.txt", "routes/ai-txt.ts"),
  route("health", "routes/health.ts"),
  // Anything else is the 404 page, in the site's own chrome (root ErrorBoundary).
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
