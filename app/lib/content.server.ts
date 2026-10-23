// The page's copy, read from D1: every section's published source, parsed. A section that will not
// parse is a server error, never a page with a hole in it (Carrel's saves are parsed before they land).
import { getDb } from "~/db/index.server";
import { sections } from "~/db/schema";
import { parseSection, SECTION_IDS, type Content } from "./source";

export async function loadContent(env: Env): Promise<{ content: Content; updatedAt: string }> {
  const rows = await getDb(env).select().from(sections);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const content = {} as Record<string, unknown>;
  for (const id of SECTION_IDS) {
    const row = byId.get(id);
    if (!row) throw new Error(`Section "${id}" is missing from D1; apply the migrations.`);
    content[id] = parseSection(id, row.published);
  }
  const updatedAt = rows.reduce((max, r) => (r.publishedAt > max ? r.publishedAt : max), "");
  return { content: content as Content, updatedAt };
}
