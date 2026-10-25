import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { siteScript } from "@dustinedwards/devkit/vite/site-script";
import { defineConfig } from "vite";

// siteScript: app/site.ts and the Capsomer behavior it imports, bundled into /site.js, the page's only script.
export default defineConfig({
  plugins: [siteScript(), cloudflare({ viteEnvironment: { name: "ssr" } }), reactRouter()],
  resolve: { tsconfigPaths: true },
});
