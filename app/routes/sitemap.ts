import { sitemapDocument } from "@drdustinedwards/site-helpers/sitemap";
import type { Route } from "./+types/sitemap";
import { getEnv } from "~/lib/context.server";
import { loadContent } from "~/lib/content.server";
import { SITE_URL } from "~/lib/site";

// One page, with the photo it shows. Its lastmod is the newest publish of any section, not the time of the request.
export async function loader({ context }: Route.LoaderArgs) {
  const { content, updatedAt } = await loadContent(getEnv(context));
  const photo = content.profile.images.about;
  const images = photo ? [new URL(photo, SITE_URL).href] : undefined;
  const xml = sitemapDocument([{ loc: SITE_URL, lastmod: updatedAt, changefreq: "monthly", priority: 1, images }], {
    layout: "expanded",
    lastmodFormat: "datetime",
  });
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
