// The site's side of Carrel's contract (@dustinedwards/site-api): the sections and their schedules
// (sections.server.ts), the media library and the preview.
//
// MEDIA. The library Carrel uploads to is its own group (media-adapter.server.ts); a section uses a file by
// naming its /media/ address, which the page draws at responsive sizes.
//
// NOT HERE. No renderVersion: the page is drawn from the sections by the site's own components, not from HTML a
// Prelum render stored, so there is no render for Carrel to find behind. No search or post fields: a section has
// no excerpt, authors or series.
import { renderToStaticMarkup } from "react-dom/server";
import { previewDocument, RefusedError, type SiteAdapter } from "@dustinedwards/site-api";
import { escapeHtml } from "@dustinedwards/site-runtime/html";
import { HomeSections } from "~/components/Sections";
import { libraryPhotos, loadContent } from "~/lib/content.server";
import { PREVIEW_STYLE } from "~/lib/theme";
import { isSectionId, parseSection, SECTION_IDS, SECTIONS, type Content } from "~/lib/source";
import { carrelMediaAdapter } from "./media-adapter.server";
import { carrelSections, parsed } from "./sections.server";

/** The page's own document attributes, so the stylesheet draws the preview as it draws the page. */
const ATTRIBUTES = { "data-theme": "light", "data-family": "forest", "data-cap-site": "julieedwards" };

export function createCarrelAdapter(
  env: Env,
  options: { origin: string; stylesheets: string[] },
  log: (entry: Record<string, unknown>) => void = console.log,
): SiteAdapter {
  const page = (title: string, body: string) =>
    previewDocument({ title, body, stylesheets: options.stylesheets, origin: options.origin, attributes: ATTRIBUTES, style: PREVIEW_STYLE });

  return {
    site: { id: "julieedwards", name: "Julie Edwards", origin: options.origin },

    ...carrelSections(env, log),

    // The media library (media-adapter.server.ts): files a section names by address, as the About photo does.
    media: carrelMediaAdapter(env),

    // The home page as it would read with this source in place of its section's published one, from the
    // site's own components and stylesheet. Without an id, the first section the source fits is used, and a
    // source that fits none is shown as written.
    preview: {
      async render({ id, source }) {
        const target = id && isSectionId(id) ? id : SECTION_IDS.find((s) => {
          try {
            parseSection(s, source);
            return true;
          } catch {
            return false;
          }
        });
        if (!target) {
          if (id) throw new RefusedError("The source does not fit any section of this page.");
          return page("Preview", `<main><p>This text fits no section of the page, so it is shown as written.</p><pre>${escapeHtml(source)}</pre></main>`);
        }
        const { content } = await loadContent(env);
        const next: Content = { ...content, [target]: parsed(target, source) };
        // Library pictures by their full address on this site, since the preview is shown on Carrel's origin.
        const photos = await libraryPhotos(env, next, options.origin);
        return page(SECTIONS[target].title, renderToStaticMarkup(<main><HomeSections content={next} photos={photos} /></main>));
      },
    },
  };
}
