// The site's side of Carrel's contract (@dustinedwards/site-api), over the `sections` table.
//
// SCOPE. The page is a fixed set of sections (app/lib/source.ts SECTIONS); a content id is a section id.
// Carrel edits and publishes them and cannot add, schedule, take down or delete one.
//
// DRAFTS. A save lands in `draft` and changes nothing a reader sees; publish moves it to `published`.
// A section with a draft waiting reads as "draft", so Carrel offers the publish. Every write first copies
// the row as it was into section_revisions with Carrel's changeId, which is also the revision list.
//
// VERSIONS. A hash of the published and draft sources together, so any change to the section moves it
// and a change to another section never does.
import { renderToStaticMarkup } from "react-dom/server";
import { desc, eq } from "drizzle-orm";
import {
  NotFoundError,
  RefusedError,
  VersionConflictError,
  type ContentSummary,
  type SiteAdapter,
  type WriteResult,
} from "@dustinedwards/site-api";
import { getDb } from "~/db/index.server";
import { sectionRevisions, sections, type SectionRow } from "~/db/schema";
import { About, Contact, Experience, Hero, Priorities } from "~/components/Sections";
import { loadContent } from "~/lib/content.server";
import { escapeHtml } from "@dustinedwards/site-runtime/html";
import { isSectionId, parseSection, SECTION_IDS, SECTIONS, SourceError, type Content, type SectionId } from "~/lib/source";

type Snapshot = Pick<SectionRow, "published" | "draft">;

async function versionOf(s: Snapshot): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([s.published, s.draft])));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

const statusOf = (row: SectionRow): ContentSummary["status"] => (row.draft === null ? "published" : "draft");

async function summaryOf(row: SectionRow): Promise<ContentSummary> {
  const section = SECTIONS[row.id as SectionId];
  return {
    id: row.id,
    kind: "section",
    title: section.title,
    status: statusOf(row),
    path: section.anchor,
    publishAt: null,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    version: await versionOf(row),
  };
}

/** Parses a source for one section, as a refusal in the writer's words when it does not fit. */
function parsed(id: SectionId, source: string) {
  try {
    return parseSection(id, source);
  } catch (err) {
    if (err instanceof SourceError) throw new RefusedError(err.message);
    throw err;
  }
}

export function createCarrelAdapter(
  env: Env,
  options: { origin: string; stylesheets: string[] },
  log: (entry: Record<string, unknown>) => void = console.log,
): SiteAdapter {
  const db = getDb(env);

  async function find(id: string): Promise<SectionRow | null> {
    if (!isSectionId(id)) return null;
    const rows = await db.select().from(sections).where(eq(sections.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async function write(
    event: string,
    id: string,
    changeId: string,
    expectedVersion: string | null,
    next: (row: SectionRow) => Snapshot & { publishedAt?: string },
  ): Promise<WriteResult> {
    const row = await find(id);
    if (!row) {
      if (expectedVersion === null) throw new RefusedError("This page has a fixed set of sections; Carrel cannot add one.");
      throw new VersionConflictError(null);
    }
    if ((await versionOf(row)) !== expectedVersion) throw new VersionConflictError(await versionOf(row));
    const fields = next(row);
    const now = new Date().toISOString();
    await db.batch([
      db.insert(sectionRevisions).values({ sectionId: id, published: row.published, draft: row.draft, changeId, createdAt: now }),
      db.update(sections).set({ ...fields, updatedAt: now }).where(eq(sections.id, id)),
    ]);
    const after = { ...row, ...fields };
    const version = await versionOf(after);
    log({ event: `carrel.${event}`, id, version, changeId });
    return { id, version, status: statusOf(after as SectionRow), changeId };
  }

  return {
    site: { id: "julieedwards", name: "Julie Edwards", origin: options.origin },

    content: {
      async list({ status, q }) {
        const rows = await db.select().from(sections);
        const order = new Map(SECTION_IDS.map((id, i) => [id, i]));
        const items = await Promise.all(
          rows
            .filter((r) => isSectionId(r.id))
            .sort((a, b) => (order.get(a.id as SectionId) ?? 0) - (order.get(b.id as SectionId) ?? 0))
            .map(summaryOf),
        );
        const needle = q?.toLowerCase();
        const matching = items.filter(
          (i) => (!status || i.status === status) && (!needle || i.title.toLowerCase().includes(needle) || i.id.includes(needle)),
        );
        return { items: matching, nextCursor: null, total: matching.length };
      },

      async get(id) {
        const row = await find(id);
        if (!row) return null;
        return { ...(await summaryOf(row)), format: "markdown" as const, source: row.draft ?? row.published, version: await versionOf(row) };
      },

      saveDraft: (id, input) =>
        write("save", id, input.changeId, input.expectedVersion, (row) => {
          parsed(id as SectionId, input.source);
          return { published: row.published, draft: input.source === row.published ? null : input.source };
        }),

      publish: (id, input) =>
        write("publish", id, input.changeId, input.expectedVersion, (row) => {
          const source = input.source ?? row.draft ?? row.published;
          parsed(id as SectionId, source);
          return { published: source, draft: null, publishedAt: new Date().toISOString() };
        }),

      async schedule(id) {
        if (!(await find(id))) throw new NotFoundError();
        throw new RefusedError("This site does not schedule; publish the section when it should go live.");
      },

      async unpublish(id) {
        if (!(await find(id))) throw new NotFoundError();
        throw new RefusedError("A section of this page cannot be taken down; edit it and publish instead.");
      },

      async revisions(id) {
        if (!(await find(id))) return null;
        const rows = await db
          .select()
          .from(sectionRevisions)
          .where(eq(sectionRevisions.sectionId, id))
          .orderBy(desc(sectionRevisions.id))
          .limit(50);
        return Promise.all(
          rows.map(async (r) => ({
            version: await versionOf(r),
            at: r.createdAt,
            author: "julieedwards",
            message: `Kept before change ${r.changeId}`,
          })),
        );
      },

      async revisionSource(id, version) {
        const row = await find(id);
        if (!row) return null;
        const candidates: Snapshot[] = [row, ...(await db.select().from(sectionRevisions).where(eq(sectionRevisions.sectionId, id)))];
        for (const c of candidates) if ((await versionOf(c)) === version) return c.draft ?? c.published;
        return null;
      },
    },

    // The home page as it would read with this source in place of its section's published one, from the
    // site's own components and stylesheet. Without an id, the first section the source fits is used.
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
        if (!target) throw new RefusedError("The source does not fit any section of this page.");
        const { content } = await loadContent(env);
        const page: Content = { ...content, [target]: parsed(target, source) };
        const body = renderToStaticMarkup(
          <main>
            <Hero profile={page.profile} cta={page.contact.heading} />
            <Priorities section={page.priorities} />
            <About section={page.about} photo={page.profile.images.about} name={page.profile.name} />
            <Experience section={page.experience} />
            <Contact section={page.contact} profile={page.profile} />
          </main>,
        );
        const css = options.stylesheets.map((href) => `<link rel="stylesheet" href="${escapeHtml(new URL(href, options.origin).href)}">`).join("");
        // .reveal sections start hidden until /site.js shows them; a preview runs no script, so it shows them.
        return `<!doctype html><html lang="en" data-theme="light" data-family="forest" data-cap-site="julieedwards"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(SECTIONS[target].title)}</title>${css}<style>.reveal{opacity:1;transform:none}</style></head><body>${body}</body></html>`;
      },
    },
  };
}
