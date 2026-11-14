import { defineHead } from "@drdustinedwards/site-helpers/head";
import type { Content } from "./source";

// The site's canonical origin: canonical link, Open Graph, sitemap, robots and llms.txt all name it.
export const SITE_URL = "https://julieedwards.info";

/** The site's IndexNow key, public by the protocol's design: served as /<key>.txt and sent with each changed page. */
export const INDEXNOW_KEY = "b4b92607de2a2c1bbe46b4b6bf963d13";

/** The day the accessibility statement was last reviewed: the date it states, and its sitemap lastmod. */
export const ACCESSIBILITY_REVIEWED = "2026-11-01";

/** A page's head: the origin, site name and share-card image every page names; the page passes its own path and copy. */
export const pageHead = (profile: Content["profile"]) =>
  defineHead({
    origin: SITE_URL,
    siteName: profile.name,
    image: {
      url: "/opengraph-image.png",
      width: 1200,
      height: 630,
      alt: `${profile.name}, ${profile.office}`,
    },
    locale: "en_US",
  });
