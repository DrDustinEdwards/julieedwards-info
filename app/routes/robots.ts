// robots.txt from Prelum's robotsDocument, the family bot policy: search engines and AI search agents crawl free,
// training crawlers are allowed so Cloudflare Pay Per Crawl can charge or block them, and the denied bots get Disallow: /.
// A workers.dev copy is told Disallow: / for everyone.
import { robotsDocument } from "@drdustinedwards/site-helpers/robots";
import { SITE_URL } from "~/lib/site";
import type { Route } from "./+types/robots";

export function loader({ request }: Route.LoaderArgs) {
  const body = robotsDocument({
    origin: SITE_URL,
    notes: [`LLM guide: ${SITE_URL}/llms.txt`],
    preview: new URL(request.url).origin !== SITE_URL,
  });
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
