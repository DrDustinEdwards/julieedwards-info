import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { siteScript } from "@dustinedwards/devkit/vite/site-script";
import { defineConfig } from "vite";

// siteScript: app/site.ts and the Capsomer behavior it imports, bundled into /site.js, the page's only script.
// remoteBindings: false, so `npm run dev` needs no Cloudflare sign-in; Workers AI (AI), the one binding that only
// runs remotely, is then refused locally, which only the media suggestions use.
export default defineConfig({
  plugins: [siteScript(), cloudflare({ viteEnvironment: { name: "ssr" }, remoteBindings: false }), reactRouter()],
  // The Worker bundle; Vite leaves SSR output unminified by default.
  environments: { ssr: { build: { minify: true } } },
  resolve: { tsconfigPaths: true },
});
