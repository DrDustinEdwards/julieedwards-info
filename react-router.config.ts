import type { Config } from "@react-router/dev/config";

// subResourceIntegrity: an import map with every chunk's hash, should the page ever render <Scripts /> (today it
// ships no React to the browser; /site.js is its script).
export default { ssr: true, subResourceIntegrity: true } satisfies Config;
