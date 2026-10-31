// The page's copy, read from D1: every section's published source, parsed. A section that will not
// parse is a server error, never a page with a hole in it (Carrel's saves are parsed before they land).
import { getDb } from "~/db/index.server";
import { sections } from "~/db/schema";
import type { HeadImage } from "@drdustinedwards/site-helpers/head";
import { libraryKeyOf, libraryPhoto, mediaUrl, type Photos } from "./media/images";
import { SITE_URL } from "./site";
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

/**
 * The share card the profile's search field `image` names: a library file at its stored size, its alt the field's
 * own, else the file's, else the candidate's name. Null when the field is blank or names no library file.
 */
async function shareImage(env: Env, profile: Content["profile"]): Promise<HeadImage | null> {
  const key = profile.image ? libraryKeyOf(profile.image) : null;
  const row = key ? await mediaRow(env, key) : null;
  if (!row) return null;
  const alt = profile.imageAlt?.trim() || row.alt.trim() || profile.name;
  return { url: `${SITE_URL}${mediaUrl(row.key)}?v=${row.sha256.slice(0, 12)}`, width: row.width ?? undefined, height: row.height ?? undefined, alt };
}

export async function loadContent(env: Env): Promise<{ content: Content; updatedAt: string; photos: Photos; shareImage: HeadImage | null }> {
  const rows = await getDb(env).select().from(sections);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const content = {} as Record<string, unknown>;
  for (const id of SECTION_IDS) {
    const row = byId.get(id);
    if (!row) throw new Error(`Section "${id}" is missing from D1; apply the migrations.`);
    content[id] = parseSection(id, row.published);
  }
  const updatedAt = rows.reduce((max, r) => (r.publishedAt > max ? r.publishedAt : max), "");
  const [photos, share] = await Promise.all([libraryPhotos(env, content as Content), shareImage(env, (content as Content).profile)]);
  return { content: content as Content, updatedAt, photos, shareImage: share };
}
