import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { build, defineConfig, type Plugin } from "vite";

// /site.js: app/site.ts and the Capsomer behaviour it imports, bundled on its own into one classic script,
// so no framework code reaches the page and the policy's script-src 'self' covers it (no inline script).
async function bundleSiteScript(): Promise<string> {
  const out = await build({
    configFile: false,
    logLevel: "warn",
    build: {
      write: false,
      minify: true,
      lib: { entry: "app/site.ts", formats: ["iife"], name: "site", fileName: () => "site.js" },
    },
  });
  const result = Array.isArray(out) ? out[0] : out;
  if (!("output" in result)) throw new Error("site.js: the bundle produced no output");
  return result.output[0].code;
}

const siteScript = (): Plugin => ({
  name: "site-script",
  configureServer(server) {
    server.middlewares.use("/site.js", async (_req, res) => {
      res.setHeader("Content-Type", "text/javascript");
      res.end(await bundleSiteScript());
    });
  },
  async generateBundle() {
    if (this.environment.name !== "client") return;
    this.emitFile({ type: "asset", fileName: "site.js", source: await bundleSiteScript() });
  },
});

export default defineConfig({
  plugins: [siteScript(), cloudflare({ viteEnvironment: { name: "ssr" } }), reactRouter()],
  resolve: { tsconfigPaths: true },
});
