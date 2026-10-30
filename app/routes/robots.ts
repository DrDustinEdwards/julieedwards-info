// robots.txt from Prelum's robotsResponse, the family bot policy: search engines and AI search agents crawl free,
// training crawlers are allowed so Cloudflare Pay Per Crawl can charge or block them, and the denied bots get Disallow: /.
// A request on any other origin (a workers.dev copy) is told Disallow: / for everyone. The notes are Prelum's default,
// the ai.txt and llms.txt pointers.
import { robotsResponse } from "@drdustinedwards/site-helpers/robots";
import { SITE_URL } from "~/lib/site";
import type { Route } from "./+types/robots";

export function loader({ request }: Route.LoaderArgs) {
  return robotsResponse({ origin: SITE_URL, request });
}
