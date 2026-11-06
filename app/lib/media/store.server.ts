// The media library's rows in D1 (drizzle/0002_media.sql) as the page reads them, and the one rule for where a file is
// used. The bytes are the MEDIA object under the same key; site-api's media library (app/lib/carrel/media-adapter.server.ts)
// writes both together.
import { eq } from "drizzle-orm";
import type { MediaUse } from "@dustinedwards/site-api";
import { getDb } from "~/db/index.server";
import { media, sections, type MediaRow } from "~/db/schema";
import { LIBRARY_ADDRESS } from "~/lib/media/images";
import { isSectionId, SECTIONS } from "~/lib/source";

export async function mediaRow(env: Env, key: string): Promise<MediaRow | null> {
  const rows = await getDb(env).select().from(media).where(eq(media.key, key)).limit(1);
  return rows[0] ?? null;
}

/** Every library address in a section's source, by the rule the page resolves by. */
const ADDRESS = new RegExp(LIBRARY_ADDRESS.source, "g");

/**
 * Every place a file is used: each section whose published text or waiting draft names its address. A draft
 * counts, so a file is never deleted out from under a save that has yet to publish.
 */
export async function usesByKey(env: Env): Promise<Map<string, MediaUse[]>> {
  const rows = await getDb(env).select().from(sections);
  const uses = new Map<string, MediaUse[]>();
  for (const row of rows) {
    if (!isSectionId(row.id)) continue;
    const title = SECTIONS[row.id].title;
    const sources: Array<[string | null, string]> = [
      [row.published, "published text"],
      [row.draft, "draft waiting to publish"],
    ];
    for (const [source, detail] of sources) {
      if (!source) continue;
      const keys = new Set([...source.matchAll(ADDRESS)].map((m) => m[1]));
      for (const key of keys) uses.set(key, [...(uses.get(key) ?? []), { type: "section", id: row.id, title, detail }]);
    }
  }
  return uses;
}
