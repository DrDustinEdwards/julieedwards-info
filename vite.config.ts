import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { siteScript } from "@dustinedwards/devkit/vite/site-script";
import { defineConfig, type Plugin } from "vite";
import { STATIC_HEADERS_FILE } from "./workers/header-set.ts";

// The static files never reach the Worker, so the build writes the Worker's header set into their `_headers`.
const staticHeaders: Plugin = {
  name: "static-headers",
  generateBundle() {
    if (this.environment.name === "client") this.emitFile({ type: "asset", fileName: "_headers", source: STATIC_HEADERS_FILE });
  },
};

// siteScript: app/site.ts and the Capsomer behavior it imports, bundled into /site.js, the page's only script.
// remoteBindings: false, so `npm run dev` needs no Cloudflare sign-in; Workers AI (AI), the one binding that only
// runs remotely, is then refused locally, which only the media suggestions use.
export default defineConfig({
  plugins: [siteScript(), staticHeaders, cloudflare({ viteEnvironment: { name: "ssr" }, remoteBindings: false }), reactRouter()],
  resolve: { tsconfigPaths: true },
});
