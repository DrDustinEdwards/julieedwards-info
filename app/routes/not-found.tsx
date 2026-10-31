import { goneResponse } from "@dustinedwards/site-runtime/url";
import type { Route } from "./+types/not-found";

// Pages taken down on purpose: each answers 410 Gone (site-runtime ./url goneResponse), so a crawler drops it sooner
// than a 404 and a reader is told it is not a typo. An entry is a path, a "/prefix*" or a RegExp (pathListed). None yet:
// the site is one page, so add a path here if a page it once had is taken down.
const GONE: readonly (string | RegExp)[] = [];

// Every path the site does not have: a 410 for one on GONE, else a 404, drawn by the root ErrorBoundary in the site's
// chrome (Capsomer's ErrorPage).
export function loader({ request }: Route.LoaderArgs): never {
  throw goneResponse(request, GONE) ?? new Response("Not Found", { status: 404 });
}

export default function NotFound() {
  return null;
}
