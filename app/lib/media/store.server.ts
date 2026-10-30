// The media library's rows in D1 (drizzle/0002_media.sql) and the one rule for where a file is used. The bytes are
// the MEDIA object under the same key; the adapter (app/lib/carrel/media-adapter.server.ts) moves both together.
import { and, asc, desc, eq, gt, inArray, lte, max, sql } from "drizzle-orm";
import type { MediaUse } from "@dustinedwards/site-api";
import { getDb } from "~/db/index.server";
import { media, mediaChanges, mediaRevisions, sections, type MediaRevisionRow, type MediaRow } from "~/db/schema";
import { LIBRARY_ADDRESS } from "~/lib/media/images";
import { isSectionId, SECTIONS } from "~/lib/source";

export type RevisionReason = "upload" | "import" | "replace" | "transform" | "resize" | "revert";

/** The columns a write may set; `rev` is the version, and only writeAtRev moves it. */
export type MediaFields = Partial<Omit<MediaRow, "key" | "rev">>;

export async function mediaRow(env: Env, key: string): Promise<MediaRow | null> {
  const rows = await getDb(env).select().from(media).where(eq(media.key, key)).limit(1);
  return rows[0] ?? null;
}

/** Every file, newest upload first. A campaign site's library is small, so lists filter and sort in the Worker. */
export function allMedia(env: Env): Promise<MediaRow[]> {
  return getDb(env).select().from(media).orderBy(desc(media.uploadedAt), desc(media.key));
}

export function mediaRows(env: Env, keys: string[]): Promise<MediaRow[]> {
  return keys.length === 0 ? Promise.resolve([]) : getDb(env).select().from(media).where(inArray(media.key, keys));
}

/**
 * The file holding these bytes, trashed or not: its current bytes, or the bytes it was uploaded with before the
 * upload shrank them, so the same camera file sent twice is found either way.
 */
export async function mediaByHash(env: Env, sha256: string): Promise<MediaRow | null> {
  const db = getDb(env);
  const [current] = await db.select().from(media).where(eq(media.sha256, sha256)).orderBy(asc(media.uploadedAt)).limit(1);
  if (current) return current;
  const [original] = await db
    .select({ key: mediaRevisions.mediaKey })
    .from(mediaRevisions)
    .where(and(eq(mediaRevisions.sha256, sha256), inArray(mediaRevisions.reason, ["upload", "import"])))
    .orderBy(asc(mediaRevisions.id))
    .limit(1);
  return original ? mediaRow(env, original.key) : null;
}

export async function insertMedia(env: Env, row: typeof media.$inferInsert): Promise<void> {
  await getDb(env).insert(media).values(row);
}

/**
 * Writes `fields` only if the row is still at `expectedRev`, bumping the rev in the same statement, so a stale write
 * is refused, never lost. `missing`: no such file; `stale`: it moved, and `rev` is where it is now.
 */
export async function writeAtRev(
  env: Env,
  key: string,
  fields: MediaFields,
  expectedRev: number,
): Promise<{ ok: true; row: MediaRow } | { ok: false; reason: "missing" | "stale"; rev: number }> {
  const [row] = await getDb(env)
    .update(media)
    .set({ ...fields, rev: sql`${media.rev} + 1` })
    .where(and(eq(media.key, key), eq(media.rev, expectedRev)))
    .returning();
  if (row) return { ok: true, row };
  const now = await mediaRow(env, key);
  return now ? { ok: false, reason: "stale", rev: now.rev } : { ok: false, reason: "missing", rev: -1 };
}

/** Columns that follow a byte change the caller has already claimed with writeAtRev. */
export async function followBytes(env: Env, key: string, fields: MediaFields): Promise<MediaRow> {
  const [row] = await getDb(env).update(media).set(fields).where(eq(media.key, key)).returning();
  if (!row) throw new Error(`${key} changed its bytes, but its row is gone`);
  return row;
}

export async function addRevision(env: Env, row: typeof mediaRevisions.$inferInsert): Promise<void> {
  await getDb(env).insert(mediaRevisions).values(row);
}

/** A file's byte history, newest first: the first is its current bytes. */
export function revisionsOf(env: Env, key: string, limit = 100): Promise<MediaRevisionRow[]> {
  return getDb(env).select().from(mediaRevisions).where(eq(mediaRevisions.mediaKey, key)).orderBy(desc(mediaRevisions.id)).limit(limit);
}

export async function keepRevisionCopy(env: Env, id: number, copyKey: string): Promise<void> {
  await getDb(env).update(mediaRevisions).set({ copyKey }).where(eq(mediaRevisions.id, id));
}

/**
 * Removes the file's row and its history rows, only if no section names it at this moment: one batch, so a section
 * saved between the caller's check and this write keeps the file. False when the row stayed.
 */
export async function claimForDelete(env: Env, key: string): Promise<boolean> {
  const address = `/media/${key}`;
  const db = getDb(env);
  const [removed] = await db.batch([
    db
      .delete(media)
      .where(
        and(
          eq(media.key, key),
          sql`NOT EXISTS (SELECT 1 FROM ${sections} WHERE instr(${sections.published}, ${address}) > 0 OR instr(coalesce(${sections.draft}, ''), ${address}) > 0)`,
        ),
      )
      .returning({ key: media.key }),
    db.delete(mediaRevisions).where(and(eq(mediaRevisions.mediaKey, key), sql`NOT EXISTS (SELECT 1 FROM ${media} WHERE ${media.key} = ${key})`)),
  ]);
  return removed.length === 1;
}

/** Where the next poll of the change log starts: the newest entry's number, or 0 before the first. */
export async function changeCursor(env: Env): Promise<number> {
  const [row] = await getDb(env).select({ seq: max(mediaChanges.seq) }).from(mediaChanges);
  return row?.seq ?? 0;
}

/** Each file changed after `from` (up to `head`) once, at its latest change, oldest first; `limit + 1` at most. */
export function changedSince(env: Env, from: number, head: number, limit: number): Promise<Array<{ key: string; seq: number }>> {
  const seq = max(mediaChanges.seq);
  return getDb(env)
    .select({ key: mediaChanges.mediaKey, seq: sql<number>`${seq}` })
    .from(mediaChanges)
    .where(and(gt(mediaChanges.seq, from), lte(mediaChanges.seq, head)))
    .groupBy(mediaChanges.mediaKey)
    .orderBy(asc(seq))
    .limit(limit + 1);
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
