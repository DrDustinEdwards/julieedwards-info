// The page's copy, read from D1: every section's published source, parsed. A section that will not
// parse is a server error, never a page with a hole in it (Carrel's saves are parsed before they land).
import { getDb } from "~/db/index.server";
import { sections } from "~/db/schema";
import { libraryKeyOf, libraryPhoto, type Photos } from "./media/images";
import { mediaRow } from "./media/store.server";
import { parseSection, SECTION_IDS, type Content } from "./source";

/**
 * The media library's files the sections name (app/lib/media), with their sizes, focal point and alt text. An
 * address outside the library, or one the library no longer holds, is left to the page as written. The alt text is
 * the file's own where it has one, else the candidate's name, as the page has always written it.
 */
export async function libraryPhotos(env: Env, content: Content, origin = ""): Promise<Photos> {
  const key = libraryKeyOf(content.profile.images.about);
  const row = key ? await mediaRow(env, key) : null;
  return row ? { about: libraryPhoto({ ...row, alt: row.alt.trim() || content.profile.name }, "about", origin) } : {};
}

export async function loadContent(env: Env): Promise<{ content: Content; updatedAt: string; photos: Photos }> {
  const rows = await getDb(env).select().from(sections);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const content = {} as Record<string, unknown>;
  for (const id of SECTION_IDS) {
    const row = byId.get(id);
    if (!row) throw new Error(`Section "${id}" is missing from D1; apply the migrations.`);
    content[id] = parseSection(id, row.published);
  }
  const updatedAt = rows.reduce((max, r) => (r.publishedAt > max ? r.publishedAt : max), "");
  return { content: content as Content, updatedAt, photos: await libraryPhotos(env, content as Content) };
}
