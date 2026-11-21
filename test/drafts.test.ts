// A section is always live, so a saved draft is a pending change on a live section: it reads as published with
// hasDraft (site-api's contentHasDraft), lists under both statuses, and the history names who made each change.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fakeD1, migratedDb, site } from "./site.ts";

const { createSiteClient } = await import("@dustinedwards/site-api/client");
const { createSiteApi } = await import("@dustinedwards/site-api");
const { d1SiteApiStore } = await import("@dustinedwards/site-api/store");
const { carrelSections } = await site("lib/carrel/sections.server.ts");

test("a live section with a saved draft reads as published with a draft, and its history names the actor", async () => {
  const env = { DB: fakeD1(migratedDb()) };
  const origin = "https://sample.example.com";
  const key = "sample-draft-key-at-least-32-characters";
  const api = createSiteApi({
    adapter: {
      site: { id: "sample", name: "Sample", origin },
      preview: { render: async () => "" },
      ...carrelSections(env, () => {}),
    },
    key,
    limiter: { limit: async () => ({ success: true }) },
    store: d1SiteApiStore(env.DB),
    log: () => {},
  });
  const client = createSiteClient({
    baseUrl: origin,
    key,
    fetch: (async (input: Parameters<typeof fetch>[0], init?: RequestInit) =>
      api.handle(new Request(input, init))) as typeof fetch,
  });

  const live = await client.get("about");
  assert.deepEqual([live.status, live.hasDraft ?? false], ["published", false]);

  const source = '---\nheading: "About Me"\n---\nA sample paragraph.\n';
  await client.saveDraft("about", {
    source,
    expectedVersion: live.version,
    changeId: "c1",
    actor: { name: "Julie" },
  });
  const doc = await client.get("about");
  assert.deepEqual([doc.status, doc.hasDraft, doc.source], ["published", true, source]);
  for (const status of ["published", "draft"] as const) {
    const { items } = await client.list({ status });
    assert.ok(
      items.some((i) => i.id === "about" && i.hasDraft === true),
      status,
    );
  }

  const published = await client.publish("about", {
    expectedVersion: doc.version,
    changeId: "c2",
    actor: { name: "Dustin" },
  });
  assert.equal(published.status, "published");
  assert.equal((await client.get("about")).hasDraft, false);

  const { items } = await client.revisions("about");
  assert.deepEqual(
    items.slice(0, 2).map((r) => r.author),
    ["Dustin", "Julie"],
  );
});
