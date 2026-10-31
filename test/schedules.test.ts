// A section Carrel schedules goes live from the cron at its time and no sooner, through site-api's handler and its
// runSchedules (what workers/app.ts calls every minute), over the site's own migrations in SQLite. The hooks hear it as
// they hear a Carrel publish, so IndexNow, the page purge and the webmentions follow. A section stays live while a draft
// or a schedule waits on it, and the webmentions are told from the page, "/", for each change to what it shows.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fakeD1, migratedDb, site } from "./site.ts";

const { createSiteClient } = await import("@dustinedwards/site-api/client");
const { createSiteApi } = await import("@dustinedwards/site-api");
const { d1SiteApiStore } = await import("@dustinedwards/site-api/store");
const { carrelSections } = await site("lib/carrel/sections.server.ts");
const { pageWebmentions } = await site("lib/carrel/page-webmentions.server.ts");

test("a scheduled section goes live from the cron at its time, and the publish hooks hear it", async () => {
  const db = migratedDb();
  const env = { DB: fakeD1(db) };
  type Heard = { action: string; trigger: string; url: string; status?: string };
  const heard: Heard[] = [];
  const mentioned: Heard[] = [];
  const origin = "https://sample.example.com";
  const key = "sample-schedule-key-at-least-32-characters";
  const adapter = { site: { id: "sample", name: "Sample", origin }, preview: { render: async () => "" }, ...carrelSections(env, () => {}) };
  const api = createSiteApi({
    adapter,
    key,
    limiter: { limit: async () => ({ success: true }) },
    store: d1SiteApiStore(env.DB),
    hooks: [
      { name: "spy", run: (e: Heard) => void heard.push(e) },
      pageWebmentions({ name: "webmention", run: (e: Heard) => void mentioned.push(e) }),
    ],
    log: () => {},
  });
  const client = createSiteClient({ baseUrl: origin, key, fetch: (async (input: Parameters<typeof fetch>[0], init?: RequestInit) => api.handle(new Request(input, init))) as typeof fetch });
  const live = () => db.prepare("SELECT published, published_at FROM sections WHERE id = 'about'").get() as { published: string; published_at: string };
  const before = live().published;

  const source = '---\nheading: "About Me"\n---\nA sample paragraph.\n';
  const saved = await client.saveDraft("about", { source, expectedVersion: (await client.get("about")).version, changeId: "c1" });
  const publishAt = "2030-01-01T15:00:00.000Z";
  assert.equal(saved.status, "published");
  assert.deepEqual((await client.list({ status: "draft" })).items.map((i) => i.id), ["about"]);
  const scheduled = await client.schedule("about", { publishAt, expectedVersion: saved.version, changeId: "c2" });
  assert.deepEqual([scheduled.status, scheduled.scheduledUpdate], ["published", { publishAt, changeId: "c2" }]);
  const doc = await client.get("about");
  assert.deepEqual([doc.status, doc.scheduledUpdate?.publishAt, doc.source], ["published", publishAt, source]);
  assert.deepEqual((await client.list({ status: "scheduled" })).items.map((i) => i.id), ["about"]);

  // Before its time nothing moves; at it, the draft is the page, dated by its schedule, and the hooks hear the update.
  assert.equal((await api.runSchedules({ now: new Date("2030-01-01T14:59:00Z") })).applied.length, 0);
  assert.equal(live().published, before);
  assert.equal((await api.runSchedules({ now: new Date("2030-01-01T15:00:30Z") })).applied.length, 1);
  assert.deepEqual({ ...live() }, { published: source, published_at: publishAt });
  const after = await client.get("about");
  assert.deepEqual([after.status, after.scheduledUpdate], ["published", null]);
  assert.deepEqual(heard.map((e) => [e.action, e.trigger, e.url, e.status]), [
    ["update", "request", `${origin}/#about`, "published"],
    ["update", "schedule", `${origin}/#about`, "published"],
  ]);
  // The draft save left the page as it was, so only the scheduled update is told, from the page the site serves.
  assert.deepEqual(mentioned.map((e) => [e.action, e.url]), [["update", "https://julieedwards.info/"]]);
  // The revision kept before it is recorded under the change that scheduled it, and a second pass finds nothing.
  assert.match((await client.revisions("about")).items[0]!.message ?? "", /c2/);
  assert.equal((await api.runSchedules({ now: new Date("2030-01-01T15:01:00Z") })).applied.length, 0);
});
