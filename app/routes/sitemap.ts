import { sitemapDocument } from "@drdustinedwards/site-helpers/sitemap";
import type { Route } from "./+types/sitemap";
import { getEnv } from "@dustinedwards/site-runtime/context";
import { loadContent } from "~/lib/content.server";
import { ACCESSIBILITY_PATH } from "@drdustinedwards/site-helpers/accessibility";
import { ACCESSIBILITY_REVIEWED, SITE_URL } from "~/lib/site";

// The page, with the photo it shows, and the accessibility statement. The page's lastmod is the newest publish of any
// section, not the time of the request; the statement's is the day it was reviewed.
export async function loader({ context }: Route.LoaderArgs) {
  const { content, updatedAt } = await loadContent(getEnv(context));
  const photo = content.profile.images.about;
  const images = photo ? [new URL(photo, SITE_URL).href] : undefined;
  // The profile's noindex search field leaves the one page out.
  const pages = [
    ...(content.profile.noindex
      ? []
      : [
          {
            loc: SITE_URL,
            lastmod: updatedAt,
            changefreq: "monthly" as const,
            priority: 1,
            images,
          },
        ]),
    { loc: new URL(ACCESSIBILITY_PATH, SITE_URL).href, lastmod: ACCESSIBILITY_REVIEWED },
  ];
  const xml = sitemapDocument(pages, {
    layout: "expanded",
    lastmodFormat: "datetime",
  });
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
