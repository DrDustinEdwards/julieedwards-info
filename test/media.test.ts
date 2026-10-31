// The media library through Carrel's real route (site-api's handler, through localClient and the conformance
// suite), over the site's own migrations in SQLite and an R2 bucket and an Images binding held in memory. What
// must hold: the contract as Carrel's health check reads it, a file a section names is drawn and cannot be deleted,
// and a stale write is refused while a replaced file's old bytes can be put back.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { DatabaseSync } from "node:sqlite";

// The app's `~/` alias and its extensionless imports, as Vite resolves them.
const app = new URL("../app/", import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    const target = specifier.startsWith("~/") ? new URL(specifier.slice(2), app).href : specifier.startsWith(".") && context.parentURL?.startsWith(app.href) ? new URL(specifier, context.parentURL).href : null;
    if (target && !/\.[cm]?[jt]sx?$/.test(target)) {
      for (const ext of [".ts", ".mjs", ".js"]) if (existsSync(new URL(target + ext))) return next(target + ext, context);
    }
    return next(target ?? specifier, context);
  },
});

const { SiteApiError, localClient } = await import("@dustinedwards/site-api/client");
const { runConformance } = await import("@dustinedwards/site-api/conformance");
const { createSiteApi } = await import("@dustinedwards/site-api");
const { memoryAdapter } = await import("@dustinedwards/site-api/testing");
// The site's modules are typed by the Worker's project (tsconfig.cloudflare.json); here they are loaded by address.
const site = (path: string) => import(new URL(`../app/${path}`, import.meta.url).href);
const { carrelMediaAdapter } = await site("lib/carrel/media-adapter.server.ts");
const { libraryPhotos, loadContent } = await site("lib/content.server.ts");
const { serveMedia } = await site("lib/media/serve.server.ts");

/** D1's binding over node:sqlite, as much of it as Drizzle calls. */
function fakeD1(db: DatabaseSync) {
  const statement = (sql: string, params: unknown[] = []) => {
    const run = () => db.prepare(sql) as ReturnType<DatabaseSync["prepare"]>;
    const args = params as never[];
    return {
      bind: (...next: unknown[]) => statement(sql, next),
      all: async () => ({ results: run().all(...args), success: true, meta: {} }),
      raw: async () => {
        const s = run();
        s.setReturnArrays(true);
        return s.all(...args);
      },
      first: async (column?: string) => {
        const row = run().get(...args) as Record<string, unknown> | undefined;
        return column ? (row?.[column] ?? null) : (row ?? null);
      },
      run: async () => {
        const info = run().run(...args);
        return { results: [], success: true, meta: { changes: info.changes, last_row_id: Number(info.lastInsertRowid) } };
      },
    };
  };
  return {
    prepare: (sql: string) => statement(sql),
    batch: async (statements: Array<ReturnType<typeof statement>>) => {
      db.exec("BEGIN");
      try {
        const results = [];
        for (const s of statements) results.push(await s.all());
        db.exec("COMMIT");
        return results;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

type Stored = { bytes: Uint8Array; etag: string; httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> };

/** An R2 bucket in memory: get, head, conditional put, delete and a prefix list. */
function fakeR2() {
  const objects = new Map<string, Stored>();
  let etags = 0;
  const view = (key: string, o: Stored) => ({
    key,
    size: o.bytes.byteLength,
    etag: o.etag,
    httpEtag: `"${o.etag}"`,
    httpMetadata: o.httpMetadata,
    customMetadata: o.customMetadata ?? {},
    get body() {
      return new Response(o.bytes.slice()).body!;
    },
    arrayBuffer: async () => o.bytes.slice().buffer,
    writeHttpMetadata(headers: Headers) {
      if (o.httpMetadata?.contentType) headers.set("content-type", o.httpMetadata.contentType);
    },
  });
  return {
    objects,
    head: async (key: string) => (objects.has(key) ? view(key, objects.get(key)!) : null),
    get: async (key: string) => (objects.has(key) ? view(key, objects.get(key)!) : null),
    async put(key: string, value: ConstructorParameters<typeof Response>[0], options: { httpMetadata?: Stored["httpMetadata"]; customMetadata?: Record<string, string>; onlyIf?: { etagMatches?: string } } = {}) {
      if (options.onlyIf?.etagMatches && objects.get(key)?.etag !== options.onlyIf.etagMatches) return null;
      const stored = { bytes: new Uint8Array(await new Response(value).arrayBuffer()), etag: `e${++etags}`, httpMetadata: options.httpMetadata, customMetadata: options.customMetadata };
      objects.set(key, stored);
      return view(key, stored);
    },
    async delete(keys: string | string[]) {
      for (const key of [keys].flat()) objects.delete(key);
    },
    list: async ({ prefix = "" }: { prefix?: string }) => ({ objects: [...objects.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key })), truncated: false }),
  };
}

/** A PNG of a given size: the signature and an IHDR chunk are all the package and the fake binding read. */
function png(width: number, height: number, salt = 0): Uint8Array {
  const bytes = new Uint8Array(45);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  bytes.set([8, 6, 0, 0, 0, salt], 24);
  bytes.set([0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44], 33);
  return bytes;
}

/** The Images binding: measures a PNG from its header, and hands back the bytes it was given for any edit. */
const fakeImages = {
  async info(stream: ReadableStream) {
    const b = new Uint8Array(await new Response(stream).arrayBuffer());
    if (b[1] !== 0x50) throw new Error("not an image");
    const view = new DataView(b.buffer);
    return { format: "image/png", fileSize: b.byteLength, width: view.getUint32(16), height: view.getUint32(20) };
  },
  input: (stream: ReadableStream) => ({
    transform: () => ({ output: async ({ format }: { format: string }) => ({ response: () => new Response(stream, { headers: { "content-type": format } }) }) }),
  }),
};

function sample() {
  const db = new DatabaseSync(":memory:");
  for (const file of ["0000_sections.sql", "0001_seed.sql", "0002_media.sql", "0004_media_placeholder.sql"]) db.exec(readFileSync(new URL(`../drizzle/${file}`, import.meta.url), "utf8"));
  const MEDIA = fakeR2();
  const env = { DB: fakeD1(db), MEDIA, IMAGES: fakeImages };
  // Carrel's content routes from the reference adapter; the media group is the site's own.
  const memory = memoryAdapter();
  const adapter = { ...memory, site: { id: "sample", name: "Sample", origin: "https://sample.example.com" }, media: carrelMediaAdapter(env) };
  /** Puts a source line into the profile's published text, as a Carrel publish would. */
  const publishProfile = (from: string, to: string) => db.prepare("UPDATE sections SET published = replace(published, ?, ?) WHERE id = 'profile'").run(from, to);
  return { env, adapter, client: localClient(adapter), publishProfile, bucket: MEDIA };
}

/** The status a refused call answered, and the places it named as using the file. */
const refusal = async (promise: Promise<unknown>) => {
  try {
    await promise;
    return { status: 200, usedBy: [] as string[] };
  } catch (error) {
    if (error instanceof SiteApiError) return { status: error.status, usedBy: (error.body?.usedBy ?? []).map((u) => u.id) };
    throw error;
  }
};

test("the media group passes Carrel's conformance suite, a real upload included", async () => {
  const { adapter } = sample();
  const key = "sample-conformance-key-at-least-32-characters";
  const api = createSiteApi({ adapter, key, limiter: { limit: async () => ({ success: true }) } });
  const report = await runConformance({
    baseUrl: adapter.site.origin,
    key,
    fetch: (async (input: Parameters<typeof fetch>[0], init?: RequestInit) => api.handle(new Request(input, init))) as typeof fetch,
    probeMediaUpload: true,
  });
  assert.deepEqual(report.checks.filter((c) => !c.ok), []);
  const meta = await localClient(adapter).meta();
  for (const capability of ["mediaAlt", "mediaTags", "mediaTrash", "mediaFocus", "mediaCaption", "mediaReplace", "mediaDuplicates", "mediaUsage", "mediaFilters", "mediaImport", "mediaCredit", "mediaTransform", "mediaHistory", "mediaChanges", "mediaResizePass", "mediaEmbedded", "mediaSuggestions"]) {
    assert.equal((meta.capabilities as Record<string, unknown>)[capability], true, capability);
  }
});

test("a file the profile names is drawn at its sizes, counted as used, and refused a delete", async () => {
  const { env, client, publishProfile, bucket } = sample();
  const uploaded = await client.media.upload({ bytes: png(3000, 2000), contentType: "image/png", filename: "Julie at the board.png", changeId: "c1" });
  assert.match(uploaded.id, /^uploads\/\d{4}\/\d{2}\/julie-at-the-board-[0-9a-f]{8}\.png$/);
  assert.equal(uploaded.width, 3000);
  // Bytes it already holds are that file, not a second one.
  assert.equal((await client.media.upload({ bytes: png(3000, 2000), contentType: "image/png", filename: "again.png", changeId: "c2" })).id, uploaded.id);

  // Nothing on the page changes until a section names the file.
  assert.deepEqual((await loadContent(env)).photos, {});
  publishProfile("https://content.julieedwards.info/julie-edwards-bluff-dale-profile.jpg", uploaded.url);
  const { content, photos } = await loadContent(env);
  assert.equal(photos.about?.alt, content.profile.name);
  assert.match(photos.about?.srcset ?? "", /\?v=[0-9a-f]{12}&w=640 640w, .*&w=2560 2560w$/);
  assert.match((await libraryPhotos(env, content, "https://julieedwards.info")).about?.src ?? "", /^https:\/\/julieedwards\.info\/media\/uploads\//);

  const detail = await client.media.get(uploaded.id);
  assert.equal(detail.usedCount, 1);
  assert.deepEqual(detail.usedBy.map((u) => u.id), ["profile"]);
  assert.equal((await client.media.list({ lens: "unattached" })).total, 0);
  assert.deepEqual(await refusal(client.media.delete(uploaded.id, "c3")), { status: 422, usedBy: ["profile"] });

  const served = await serveMedia(new Request(`https://julieedwards.info${uploaded.url}`), env);
  assert.equal(served.status, 200);
  assert.deepEqual(new Uint8Array(await served.arrayBuffer()), png(3000, 2000));
  // The history's copies are never served.
  await bucket.put(`history/${uploaded.id}/x`, png(1, 1));
  assert.equal((await serveMedia(new Request(`https://julieedwards.info/media/history/${uploaded.id}/x`), env)).status, 404);
});

test("a stale write is refused, and a replaced file's old bytes come back by revert", async () => {
  const { env, client } = sample();
  const first = await client.media.upload({ bytes: png(800, 600), contentType: "image/png", filename: "photo.png", changeId: "c1" });
  const { changeCursor } = await client.media.list();
  const alt = await client.media.setAlt(first.id, { alt: "Julie Edwards", expectedVersion: first.version!, changeId: "c2" });
  assert.equal((await refusal(client.media.setAlt(first.id, { alt: "Lost", expectedVersion: first.version!, changeId: "c3" }))).status, 409);

  const replaced = await client.media.replace(first.id, { bytes: png(600, 800, 1), contentType: "image/png", filename: "photo.png", expectedVersion: alt.version, changeId: "c4" });
  assert.deepEqual([replaced.width, replaced.height, replaced.alt], [600, 800, "Julie Edwards"]);
  const { revisions } = await client.media.history(first.id);
  assert.deepEqual(revisions.map((r) => [r.reason, r.current]), [["replace", true], ["upload", false]]);

  const reverted = await client.media.revert(first.id, { to: revisions[1]!.rev, expectedVersion: replaced.version!, changeId: "c5" });
  assert.deepEqual([reverted.width, reverted.height], [800, 600]);
  const served = await serveMedia(new Request(`https://julieedwards.info${first.url}`), env);
  assert.deepEqual(new Uint8Array(await served.arrayBuffer()), png(800, 600));

  // A screen polling from before the edits sees the file once, as it is now.
  const changes = await client.media.changes(changeCursor!);
  assert.deepEqual(changes.items.map((i) => [i.id, i.version]), [[first.id, reverted.version]]);
});
