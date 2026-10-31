// Carrel's media group (site-api v0.13): the library Carrel's media page shows for this site, over the `media`
// table and the MEDIA bucket (app/lib/media). A section uses a file by naming its address (/media/<key>) in its
// source, and that is the whole reference check: "used by", the usage counts, the unattached lens and every
// delete read the sections' published text and waiting drafts (usesByKey).
//
// VERSIONS. A file's version is its row's `rev`, which every write to its metadata or bytes bumps in the statement
// that checks it (writeAtRev), so a stale write is a 409, never a lost update. A write that must touch R2 claims the
// version first, then changes the object, then the row's byte columns.
//
// BYTES. A replace, turn, mirror, shrink or revert keeps the bytes it overwrites in MEDIA under history/<key>/<hash>,
// which /media never serves, and records them in media_revisions, so each one can be taken back.
//
// Offered: everything in v0.13 (upload, alt, tags, trash, focal point, caption, replace, duplicates, usage, filters,
// import, credit, transform, history and revert, changes, resize at upload and the resize pass, embedded metadata,
// suggestions). An upload, a replace and a shrink go through site-api's prepareUpload (HEIC to JPEG, the location
// taken out, the shrink, the embedded fields, the placeholder and main color). A turn and a revert make the placeholder
// and color again for their bytes. Carrel's library shows both; the page does not use them.
import {
  MediaInUseError,
  NotFoundError,
  RefusedError,
  VersionConflictError,
  kindOf,
  orientationOf,
  placeholderAndColor,
  prepareUpload,
  sha256Hex,
  transformFocus,
  turnsSize,
  LARGE_MEDIA_BYTES,
  type MediaAdapter,
  type MediaItem,
  type MediaLens,
  type MediaResize,
  type MediaTransformOp,
} from "@dustinedwards/site-api";
import { replaceObject, writeFocus, type R2BucketLike } from "@dustinedwards/site-api/r2";
import { slugify } from "@drdustinedwards/site-helpers/slug";
import { editImage } from "@dustinedwards/site-runtime/image";
import type { MediaRow } from "~/db/schema";
import { mediaUrl, UPLOAD_PREFIX } from "~/lib/media/images";
import {
  addRevision,
  allMedia,
  changeCursor,
  changedSince,
  claimForDelete,
  followBytes,
  insertMedia,
  keepRevisionCopy,
  mediaByHash,
  mediaRow,
  mediaRows,
  revisionsOf,
  usesByKey,
  writeAtRev,
  type MediaFields,
  type RevisionReason,
} from "~/lib/media/store.server";
import { suggestFor } from "~/lib/media/suggest.server";

/** Pictures only: the page shows pictures. No SVG, which would be script on this site's own origin. */
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif" };
/** HEIC and HEIF (an iPhone's photos) are taken too, and stored as JPEG. */
const LIMITS = { maxBytes: 20 * 1024 * 1024, types: [...Object.keys(TYPES), "image/heic", "image/heif"] };

const LENSES: readonly MediaLens[] = ["unattached", "no-alt", "large", "duplicates", "license-expired", "oversized"];

/**
 * What an upload shrinks to unless it says `resize=no`: a phone photo (4032 pixels) keeps its size, a larger camera
 * file is shrunk, and its original is kept in the file's history.
 */
const RESIZE: MediaResize = { maxEdge: 4096, quality: 85 };

/** The quality a turn or a mirror encodes at: high, since each one re-encodes a lossy picture. */
const TRANSFORM_QUALITY = 92;

/** What the Images binding re-encodes in its own type. Not a GIF: it may be animated, and an edit keeps one frame. */
type Encoded = "image/jpeg" | "image/png" | "image/webp" | "image/avif";
const REENCODED = new Set<string>(["image/jpeg", "image/png", "image/webp", "image/avif"]);

/** Each transform as editImage's options. A quarter turn is clockwise, as the contract's rotate-90 is. */
const TRANSFORMS: Record<MediaTransformOp, { rotate?: 90 | 180 | 270; flip?: "h" | "v" }> = {
  "rotate-90": { rotate: 90 },
  "rotate-180": { rotate: 180 },
  "rotate-270": { rotate: 270 },
  "flip-h": { flip: "h" },
  "flip-v": { flip: "v" },
};

const versionOf = (rev: number) => `r${rev}`;

/** The rev a version names, or -1 (which no row holds) for anything this site never answered. */
const revOf = (version: string) => (/^r(0|[1-9]\d{0,15})$/.test(version) ? Number(version.slice(1)) : -1);

const storedTags = (row: MediaRow): string[] => {
  try {
    const tags: unknown = JSON.parse(row.tags);
    return Array.isArray(tags) ? tags.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
};

/** One file in the contract's terms. */
function itemOf(row: MediaRow, usedCount: number): MediaItem {
  return {
    id: row.key,
    url: mediaUrl(row.key),
    downloadUrl: mediaUrl(row.key),
    filename: row.filename,
    contentType: row.contentType,
    bytes: row.bytes,
    width: row.width,
    height: row.height,
    alt: row.alt,
    uploadedAt: row.uploadedAt,
    deletable: true,
    version: versionOf(row.rev),
    tags: storedTags(row),
    trashedAt: row.trashedAt,
    focus: row.focus,
    caption: row.caption,
    usedCount,
    placeholder: row.placeholder,
    color: row.color,
    credit: row.credit,
    license: row.license,
    sourceUrl: row.sourceUrl,
    licenseExpires: row.licenseExpires,
    takenAt: row.takenAt,
  };
}

/** A failed versioned write as the contract's error. */
function refuse(outcome: { reason: "missing" | "stale"; rev: number }): never {
  if (outcome.reason === "missing") throw new NotFoundError("No such media.");
  throw new VersionConflictError(versionOf(outcome.rev), "The file changed since it was loaded.");
}

export function carrelMediaAdapter(env: Env): MediaAdapter {
  // The binding's `put` takes a wider `onlyIf` than the helpers' narrow interface names; the shapes they use agree.
  const bucket = env.MEDIA as unknown as R2BucketLike;

  /** Bytes as the library stores them (site-api's prepareUpload); a replace or a shrink is not an upload, so it has no alt. */
  const prepare = (bytes: Uint8Array, contentType: string, filename: string, resize = false) =>
    prepareUpload(env.IMAGES, { bytes, contentType, filename, alt: "", changeId: "", resize }, { resize: RESIZE });

  /** The item with its usage count. */
  async function itemWithUse(row: MediaRow): Promise<MediaItem> {
    return itemOf(row, (await usesByKey(env)).get(row.key)?.length ?? 0);
  }

  /** A new key for an upload: uploads/<year>/<month>/<name>-<hash>.<ext>, never one in use. */
  async function freshKey(filename: string, type: string, sha256: string): Promise<string> {
    const now = new Date().toISOString();
    const base = `${UPLOAD_PREFIX}${now.slice(0, 4)}/${now.slice(5, 7)}/${slugify(filename.replace(/\.[^.]*$/, ""), { max: 60 }) || "file"}-${sha256.slice(0, 8)}`;
    for (let n = 1; ; n++) {
      const key = `${base}${n === 1 ? "" : `-${n}`}.${TYPES[type]}`;
      if (!(await mediaRow(env, key)) && !(await env.MEDIA.head(key))) return key;
    }
  }

  /** Keeps a set of bytes in the file's history (MEDIA under history/), and answers where. */
  async function keepCopy(key: string, sha256: string, body: ReadableStream | Uint8Array, contentType: string): Promise<string> {
    const copyKey = `history/${key}/${sha256}`;
    await env.MEDIA.put(copyKey, body, { httpMetadata: { contentType } });
    return copyKey;
  }

  /**
   * Puts new bytes under a file's key as its newest revision, the old ones kept first: the one way a stored file's
   * bytes change. The caller has already claimed the version. `fields` are the columns that move with the bytes.
   */
  async function swapBytes(
    row: MediaRow,
    next: { bytes: Uint8Array; width: number | null; height: number | null; reason: RevisionReason },
    fields: MediaFields = {},
  ): Promise<MediaRow> {
    const current = await env.MEDIA.get(row.key);
    if (!current) throw new NotFoundError("No such media.");
    const [latest] = await revisionsOf(env, row.key, 1);
    const copyKey = await keepCopy(row.key, row.sha256, current.body, row.contentType);
    if (latest) await keepRevisionCopy(env, latest.id, copyKey);
    else await addRevision(env, { mediaKey: row.key, at: row.uploadedAt, bytes: row.bytes, width: row.width, height: row.height, reason: row.sourceUrl ? "import" : "upload", sha256: row.sha256, copyKey });
    await replaceObject(bucket, row.key, { bytes: next.bytes, contentType: row.contentType });
    const sha256 = await sha256Hex(next.bytes);
    await addRevision(env, { mediaKey: row.key, at: new Date().toISOString(), bytes: next.bytes.byteLength, width: next.width, height: next.height, reason: next.reason, sha256 });
    return followBytes(env, row.key, { ...fields, bytes: next.bytes.byteLength, width: next.width, height: next.height, sha256 });
  }

  /** Claims the version for a write that changes the object: the rev moves first, so a stale writer changes nothing. */
  async function claim(id: string, expectedVersion: string): Promise<MediaRow> {
    const claimed = await writeAtRev(env, id, {}, revOf(expectedVersion));
    if (!claimed.ok) refuse(claimed);
    return claimed.row;
  }

  /** A metadata write at the version the editor loaded. */
  async function write(id: string, expectedVersion: string, fields: MediaFields): Promise<{ version: string }> {
    const written = await writeAtRev(env, id, fields, revOf(expectedVersion));
    if (!written.ok) refuse(written);
    return { version: versionOf(written.row.rev) };
  }

  /** Trash and restore: a file already in the asked state, at the version it holds, answers that version. */
  async function moveTrash(id: string, expectedVersion: string, trashedAt: string | null): Promise<{ version: string }> {
    const row = await mediaRow(env, id);
    if (!row) throw new NotFoundError("No such media.");
    if (row.rev === revOf(expectedVersion) && (row.trashedAt === null) === (trashedAt === null)) return { version: versionOf(row.rev) };
    return write(id, expectedVersion, { trashedAt });
  }

  return {
    limits: LIMITS,
    lenses: LENSES,
    usage: true,
    filters: true,
    resize: RESIZE,
    readsEmbedded: true,
    // The package checks every address and each redirect before this fetch runs (importRefusal, fetchImport).
    importFetch: ((input: RequestInfo | URL, init?: RequestInit) => fetch(input, init)) as typeof fetch,

    async list(query) {
      // The cursor first: a change that lands while the page is read is in the next poll, not lost between them.
      const cursor = String(await changeCursor(env));
      const [rows, uses] = await Promise.all([allMedia(env), usesByKey(env)]);
      const used = (row: MediaRow) => uses.get(row.key)?.length ?? 0;
      const hashes = new Map<string, number>();
      for (const row of rows) hashes.set(row.sha256, (hashes.get(row.sha256) ?? 0) + 1);
      const today = new Date().toISOString().slice(0, 10);
      const lens: Record<MediaLens, (row: MediaRow) => boolean> = {
        unattached: (r) => used(r) === 0,
        "no-alt": (r) => r.alt.trim() === "",
        large: (r) => r.bytes > LARGE_MEDIA_BYTES,
        duplicates: (r) => (hashes.get(r.sha256) ?? 0) > 1,
        "license-expired": (r) => Boolean(r.licenseExpires && r.licenseExpires < today),
        oversized: (r) => Math.max(r.width ?? 0, r.height ?? 0) > RESIZE.maxEdge,
      };
      const needle = query.q?.trim().toLowerCase();
      const matching = rows.filter(
        (r) =>
          (query.trashed === "only" ? r.trashedAt !== null : r.trashedAt === null) &&
          (!query.tag || storedTags(r).includes(query.tag)) &&
          (!needle || [r.key, r.filename ?? "", r.alt, r.caption].some((t) => t.toLowerCase().includes(needle))) &&
          (!query.lens || lens[query.lens](r)) &&
          (!query.orientation || orientationOf(r.width, r.height) === query.orientation) &&
          (!query.kind || kindOf(r.contentType) === query.kind),
      );
      // The contract's defaults: added, size and used run largest first, name A to Z. Ties keep newest first.
      const sort = query.sort ?? "added";
      const dir = query.dir ?? (sort === "name" ? "asc" : "desc");
      const keyOf = (r: MediaRow): string | number =>
        sort === "size" ? r.bytes : sort === "used" ? used(r) : sort === "name" ? (r.filename ?? r.key).toLowerCase() : r.uploadedAt;
      const sorted = matching
        .map((row, n) => ({ row, n }))
        .sort((a, b) => {
          const [x, y] = [keyOf(a.row), keyOf(b.row)];
          const by = typeof x === "number" ? x - (y as number) : x.localeCompare(y as string);
          return (dir === "asc" ? 1 : -1) * by || a.n - b.n;
        })
        .map(({ row }) => row);
      const start = query.cursor && /^(0|[1-9]\d{0,8})$/.test(query.cursor) ? Number(query.cursor) : 0;
      const page = sorted.slice(start, start + query.limit);
      return {
        items: page.map((r) => itemOf(r, used(r))),
        nextCursor: start + query.limit < sorted.length ? String(start + query.limit) : null,
        total: sorted.length,
        sorted: { sort, dir },
        changeCursor: cursor,
      };
    },

    async get(id) {
      const row = await mediaRow(env, id);
      if (!row) return null;
      const usedBy = (await usesByKey(env)).get(id) ?? [];
      const twins = (await allMedia(env))
        .filter((r) => r.sha256 === row.sha256 && r.key !== id)
        .slice(0, 50)
        .map((r) => ({ id: r.key, filename: r.filename }));
      return { ...itemOf(row, usedBy.length), usedBy, twins };
    },

    async upload(input) {
      const prepared = await prepareUpload(env.IMAGES, input, { resize: RESIZE });
      const { bytes, contentType, width, height, sha256, embedded: found, resizedFrom, original, placeholder, color } = prepared;

      const key = await freshKey(prepared.filename, contentType, prepared.uploadSha256);
      await env.MEDIA.put(key, bytes, { httpMetadata: { contentType } });
      const at = new Date().toISOString();
      const embedded = (["credit", "license", "caption", "takenAt"] as const).filter((field) => found[field]);
      await insertMedia(env, {
        key,
        filename: prepared.filename.slice(0, 300),
        contentType,
        bytes: bytes.byteLength,
        width,
        height,
        sha256,
        placeholder,
        color,
        alt: input.alt,
        caption: found.caption ?? "",
        credit: found.credit ?? "",
        license: found.license ?? "",
        takenAt: found.takenAt ?? null,
        sourceUrl: input.sourceUrl ?? null,
        uploadedAt: at,
      });
      const reason = input.sourceUrl ? "import" : "upload";
      if (resizedFrom && original) {
        // The original in the file's history, as the revision the shrink replaced.
        const originalSha = await sha256Hex(original);
        const copyKey = await keepCopy(key, originalSha, original, contentType);
        await addRevision(env, { mediaKey: key, at, bytes: original.byteLength, width: resizedFrom.width, height: resizedFrom.height, reason, sha256: originalSha, copyKey });
        await addRevision(env, { mediaKey: key, at, bytes: bytes.byteLength, width, height, reason: "resize", sha256 });
      } else {
        await addRevision(env, { mediaKey: key, at, bytes: bytes.byteLength, width, height, reason, sha256 });
      }

      const row = await mediaRow(env, key);
      if (!row) throw new Error(`${key} was stored, but its row cannot be read`);
      return { ...itemOf(row, 0), ...(embedded.length > 0 ? { embedded: [...embedded] } : {}), ...(resizedFrom ? { resizedFrom } : {}) };
    },

    async delete(id) {
      if (!(await mediaRow(env, id))) throw new NotFoundError("No such media.");
      const uses = (await usesByKey(env)).get(id) ?? [];
      if (uses.length > 0) throw new MediaInUseError(uses);
      // One statement claims the row only if no section names it now; the objects go after, so a failure leaves
      // only bytes nothing lists.
      if (!(await claimForDelete(env, id))) throw new RefusedError(`${id} was put to use or removed while this delete was being checked. Try again.`);
      const history = await env.MEDIA.list({ prefix: `history/${id}/` });
      await env.MEDIA.delete([id, ...history.objects.map((o) => o.key)]);
    },

    setAlt: (id, input) => write(id, input.expectedVersion, { alt: input.alt }),

    // The contract's spelling is the site's, so the set is stored as sent.
    setTags: (id, input) => write(id, input.expectedVersion, { tags: JSON.stringify(input.tags) }),

    // A trashed file keeps its object and address, so a section that uses it is unchanged.
    trash: (id, input) => moveTrash(id, input.expectedVersion, new Date().toISOString()),
    restore: (id, input) => moveTrash(id, input.expectedVersion, null),

    // The object's customMetadata `focus` is what site-runtime ./image crops around; the row keeps the same point for
    // the page's object-position. Claimed first, then the object, then the row.
    async setFocus(id, input) {
      const claimed = await claim(id, input.expectedVersion);
      await writeFocus(bucket, id, input.focus);
      await followBytes(env, id, { focus: input.focus });
      return { version: versionOf(claimed.rev) };
    },

    setCaption: (id, input) => write(id, input.expectedVersion, { caption: input.caption }),

    // Every address carries a hash of the bytes (libraryPhoto's `v`), so no cached size of the old picture is served.
    async replace(id, input) {
      const { bytes, width, height, placeholder, color } = await prepare(input.bytes, input.contentType, input.filename);
      const row = await claim(id, input.expectedVersion);
      const after = await swapBytes(row, { bytes, width, height, reason: "replace" }, { focus: null, filename: input.filename.slice(0, 300), placeholder, color });
      return { item: await itemWithUse(after), sizesNeedPurge: false };
    },

    async findByHash(sha256) {
      const row = await mediaByHash(env, sha256);
      return row ? itemWithUse(row) : null;
    },

    setCredit: (id, input) =>
      write(id, input.expectedVersion, { credit: input.credit, license: input.license, sourceUrl: input.sourceUrl, licenseExpires: input.licenseExpires }),

    // In place, always: the page sizes a picture by its row, not its address, so a quarter turn keeps the id
    // (`asNewFile` is never sent, since this site does not say replaceKeepsSize).
    async transform(id, input) {
      const row = await mediaRow(env, id);
      if (!row) throw new NotFoundError("No such media.");
      const object = await env.MEDIA.get(id);
      if (!object) throw new NotFoundError("No such media.");
      if (!REENCODED.has(row.contentType)) throw new RefusedError(`A ${row.contentType} picture is not edited here: a GIF may be animated, and an edit would keep one frame.`);
      const edited = await editImage(env.IMAGES, object.body, { ...TRANSFORMS[input.op], quality: TRANSFORM_QUALITY, format: row.contentType as Encoded });
      const bytes = new Uint8Array(await edited.arrayBuffer());
      const [width, height] = turnsSize(input.op) ? [row.height, row.width] : [row.width, row.height];
      // The focal point moves with the picture rather than being cleared.
      const focus = transformFocus(row.focus, input.op);
      const claimed = await claim(id, input.expectedVersion);
      const after = await swapBytes(claimed, { bytes, width, height, reason: "transform" }, { focus, ...(await placeholderAndColor(env.IMAGES, bytes)) });
      // replaceObject dropped the old point with the old bytes; the moved one goes back on the object.
      if (focus) await writeFocus(bucket, id, focus);
      return { item: await itemWithUse(after), sizesNeedPurge: false };
    },

    async history(id) {
      const row = await mediaRow(env, id);
      if (!row) return null;
      const revisions = await revisionsOf(env, id);
      return revisions.map((r, n) => ({
        rev: String(r.id),
        at: r.at,
        bytes: r.bytes,
        width: r.width,
        height: r.height,
        reason: r.reason as RevisionReason,
        current: n === 0,
      }));
    },

    // The package has checked that `to` is an earlier revision; its bytes come back from the copy it kept, as a new
    // revision, so a revert is itself undone by another.
    async revert(id, input) {
      if (!(await mediaRow(env, id))) throw new NotFoundError("No such media.");
      const target = (await revisionsOf(env, id)).find((r) => String(r.id) === input.to);
      const kept = target?.copyKey ? await env.MEDIA.get(target.copyKey) : null;
      if (!target || !kept) throw new NotFoundError("This file has no such earlier version, or its copy is gone.");
      const bytes = new Uint8Array(await kept.arrayBuffer());
      const row = await claim(id, input.expectedVersion);
      const after = await swapBytes(row, { bytes, width: target.width, height: target.height, reason: "revert" }, { focus: null, ...(await placeholderAndColor(env.IMAGES, bytes)) });
      return { item: await itemWithUse(after), sizesNeedPurge: false };
    },

    // From the change log the triggers on `media` write: every insert, update and delete of a row.
    async changes({ since, limit }) {
      const head = await changeCursor(env);
      if (!/^(0|[1-9]\d{0,15})$/.test(since) || Number(since) > head) throw new RefusedError("That change cursor is not this site's; reload the library.");
      const changed = await changedSince(env, Number(since), head, limit);
      const more = changed.length > limit;
      const taken = changed.slice(0, limit);
      const rows = new Map((await mediaRows(env, taken.map((c) => c.key))).map((row) => [row.key, row]));
      const uses = await usesByKey(env);
      return {
        items: taken.flatMap((c) => {
          const row = rows.get(c.key);
          return row ? [itemOf(row, uses.get(row.key)?.length ?? 0)] : [];
        }),
        removed: taken.filter((c) => !rows.has(c.key)).map((c) => c.key),
        cursor: String(more ? taken[taken.length - 1]!.seq : head),
        more,
      };
    },

    // In place, the old bytes kept in the history; a picture already within the size answers as it is.
    async shrink(id, input) {
      const row = await mediaRow(env, id);
      if (!row) throw new NotFoundError("No such media.");
      if (row.rev !== revOf(input.expectedVersion)) throw new VersionConflictError(versionOf(row.rev), "The file changed since it was loaded.");
      if (Math.max(row.width ?? 0, row.height ?? 0) <= RESIZE.maxEdge) return { resized: false, item: await itemWithUse(row) };
      const object = await env.MEDIA.get(id);
      if (!object) throw new NotFoundError("No such media.");
      // A GIF is left as it is (prepareUpload shrinks no GIF: it may be animated).
      const { bytes, width, height, resizedFrom, placeholder, color } = await prepare(new Uint8Array(await object.arrayBuffer()), row.contentType, row.filename ?? id, true);
      if (!resizedFrom) return { resized: false, item: await itemWithUse(row) };
      const claimed = await claim(id, input.expectedVersion);
      const after = await swapBytes(claimed, { bytes, width, height, reason: "resize" }, { placeholder, color });
      return { resized: true, item: await itemWithUse(after) };
    },

    // Never applied: Carrel shows them, and a person accepts each as an alt or tags write.
    async suggest(id) {
      const row = await mediaRow(env, id);
      if (!row) return null;
      const object = await env.MEDIA.get(id);
      if (!object) return null;
      try {
        return await suggestFor(env, object.body);
      } catch (error) {
        throw new RefusedError(`No suggestion was made: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
  };
}
