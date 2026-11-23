// The site's side of Carrel's contract (@dustinedwards/site-api) for the page's copy, over the `sections` table: the
// content group and its schedules. adapter.server.tsx adds the preview and the media library.
//
// SCOPE. The page is a fixed set of sections (app/lib/source.ts SECTIONS); a content id is a section id.
// Carrel edits, schedules and publishes them and cannot add, take down, rename, trash or delete one: the adapter has
// no rename, trash or delete, so the package answers those routes 501 and meta.capabilities leaves them out.
//
// DRAFTS. A section is always live. A save lands in `draft` and changes nothing a reader sees; publish moves it to
// `published`. A section with a draft waiting reads as published with `hasDraft` (site-api's contentHasDraft), so
// Carrel offers the publish and a list of drafts still finds it. Every write first copies the row as it was into
// section_revisions with Carrel's changeId, which is also the revision list; `updated_by` and `author` carry the
// actor of each change.
//
// SCHEDULES. A section's draft can carry a time (publish_at, with the change id that set it), and then reads as
// published with a `scheduledUpdate`. The per-minute cron (workers/app.ts) runs the package's runSchedules, which
// publishes it at that time through `schedules.apply`, recording publish_at as its publishedAt and the schedule's
// change id on the revision, and fires the hooks a Carrel publish fires. A save keeps the time with the new text; a
// publish, or a save back to the live text, drops it; a cancel drops it and leaves the text a draft. A section is
// never a draft with no page, so the package sends every schedule to `schedules.update`, which lands the same way:
// the scheduled source becomes the section's draft.
//
// UNPUBLISH AND DELETE. A section of this page is never taken down, renamed, trashed or deleted: unpublish is
// refused and the other routes answer 501, as for the other fixed content on the network (the CV and the agent
// document on dustinedwards.info). Edit it and publish instead. CLAUDE.md, rule 3.
//
// VERSIONS. A hash of the published and draft sources together, and the schedule's time and change id while one
// waits, so any change to the section moves it and a change to another section never does. A section with nothing
// scheduled keeps the version it had before schedules existed.
import { and, asc, desc, eq, isNotNull, lte, sql } from "drizzle-orm";
import {
  contentVersion,
  NotFoundError,
  RefusedError,
  VersionConflictError,
  type ContentAdapter,
  type ContentSummary,
  type SchedulesAdapter,
  type WriteResult,
} from "@dustinedwards/site-api";
import { SEARCH_FIELDS } from "@dustinedwards/site-api/frontmatter";
import { utc } from "@dustinedwards/site-api/schedules";
import { getDb } from "~/db/index.server";
import { sectionRevisions, sections, type SectionRow } from "~/db/schema";
import { isSectionId, parseSection, SECTIONS, SourceError, type SectionId } from "~/lib/source";

type Snapshot = Pick<SectionRow, "published" | "draft"> &
  Partial<Pick<SectionRow, "publishAt" | "scheduleChangeId">>;
type Fields = Partial<Omit<SectionRow, "id" | "updatedAt" | "updatedBy">>;

const KIND = "section";
/** The author of a change that named no one: the site itself. */
const OWNER = "julieedwards";

/** What a publish or a cancel leaves of a schedule. */
const UNSCHEDULED = { publishAt: null, scheduleChangeId: null, scheduledAt: null } satisfies Fields;

const versionOf = (s: Snapshot): Promise<string> =>
  contentVersion(
    s.publishAt ? [s.published, s.draft, s.publishAt, s.scheduleChangeId] : [s.published, s.draft],
  );

/** A section is always live; a draft or a schedule waiting is `hasDraft` and `scheduledUpdate`. */
const STATUS = "published" as const;

const scheduledUpdate = (row: Snapshot) =>
  row.publishAt ? { publishAt: row.publishAt, changeId: row.scheduleChangeId! } : null;

async function summaryOf(row: SectionRow): Promise<ContentSummary> {
  const section = SECTIONS[row.id as SectionId];
  return {
    id: row.id,
    kind: KIND,
    title: section.title,
    status: STATUS,
    path: section.anchor,
    publishAt: null,
    publishedAt: row.publishedAt,
    hasDraft: row.draft !== null,
    scheduledUpdate: scheduledUpdate(row),
    updatedAt: row.updatedAt,
    version: await versionOf(row),
  };
}

/** Parses a source for one section, as a refusal in the writer's words when it does not fit. */
export function parsed(id: SectionId, source: string) {
  try {
    return parseSection(id, source);
  } catch (err) {
    if (err instanceof SourceError) throw new RefusedError(err.message);
    throw err;
  }
}

/** The list's orderings: the dates newest first and titles A to Z unless `dir` says otherwise. */
const ORDER = {
  updated: (r: SectionRow) => r.updatedAt,
  published: (r: SectionRow) => r.publishedAt,
  title: (r: SectionRow) => SECTIONS[r.id as SectionId].title,
};

export function carrelSections(
  env: Env,
  log: (entry: Record<string, unknown>) => void = console.log,
): { content: ContentAdapter; schedules: SchedulesAdapter } {
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
    next: (row: SectionRow) => Fields,
    actor?: { name: string },
  ): Promise<WriteResult> {
    const row = await find(id);
    if (!row) {
      if (expectedVersion === null)
        throw new RefusedError("This page has a fixed set of sections; Carrel cannot add one.");
      throw new VersionConflictError(null);
    }
    if ((await versionOf(row)) !== expectedVersion)
      throw new VersionConflictError(await versionOf(row));
    const fields = next(row);
    const now = new Date().toISOString();
    // Both statements hold only while the row is the one read above, so a write that landed in between (the
    // cron's publish and an editor's save) is refused, not overwritten.
    const unchanged = and(eq(sections.id, id), eq(sections.updatedAt, row.updatedAt));
    const [, updated] = await db.batch([
      db.insert(sectionRevisions)
        .select(sql`SELECT NULL, id, published, draft, ${changeId}, ${now}, updated_by
        FROM sections WHERE id = ${id} AND updated_at = ${row.updatedAt}`),
      db
        .update(sections)
        .set({ ...fields, updatedAt: now, updatedBy: actor?.name ?? null })
        .where(unchanged)
        .returning({ id: sections.id }),
    ]);
    if (updated.length === 0)
      throw new VersionConflictError(await versionOf((await find(id)) ?? row));
    const after = { ...row, ...fields };
    const version = await versionOf(after);
    log({ event: `carrel.${event}`, id, version, changeId });
    return { id, version, status: STATUS, changeId, scheduledUpdate: scheduledUpdate(after) };
  }

  // The section's draft, or the source sent, goes live at publishAt. Scheduling the live text again is nothing to do.
  const schedule = (
    id: string,
    input: {
      source?: string;
      publishAt: string;
      expectedVersion: string;
      changeId: string;
      actor?: { name: string };
    },
  ) =>
    write(
      "schedule",
      id,
      input.changeId,
      input.expectedVersion,
      (row) => {
        const source = input.source ?? row.draft;
        if (source === null || source === row.published)
          throw new RefusedError("Nothing differs from the live section; save the change first.");
        parsed(id as SectionId, source);
        return {
          draft: source,
          publishAt: utc(input.publishAt),
          scheduleChangeId: input.changeId,
          scheduledAt: new Date().toISOString(),
        };
      },
      input.actor,
    );

  const content: ContentAdapter = {
    // kind is always "section"; published compares publishedAt. A section has no tags and no authors.
    filters: ["kind", "published"],
    publishedAtSettable: true,
    hasDraft: true,
    // Kept in the profile section (~/lib/source, Search), whose description is the page's.
    searchFields: SEARCH_FIELDS,

    async list(query) {
      const needle = query.q?.toLowerCase();
      const rows = (await db.select().from(sections)).filter(
        (r) =>
          isSectionId(r.id) &&
          (!query.status ||
            query.status === STATUS ||
            (query.status === "draft" && r.draft !== null)) &&
          (!query.kind || query.kind === KIND) &&
          (!query.publishedAfter || r.publishedAt >= utc(query.publishedAfter)) &&
          (!query.publishedBefore || r.publishedAt <= utc(query.publishedBefore)) &&
          (!needle ||
            [SECTIONS[r.id as SectionId].title, r.draft ?? r.published].some((t) =>
              t.toLowerCase().includes(needle),
            )),
      );
      const sort = query.sort ?? "updated";
      const dir = query.dir ?? (sort === "title" ? "asc" : "desc");
      const key = ORDER[sort];
      rows.sort((a, b) => key(a).localeCompare(key(b)) * (dir === "asc" ? 1 : -1));
      const start = Number(query.cursor) || 0;
      const items = await Promise.all(rows.slice(start, start + query.limit).map(summaryOf));
      const nextCursor = start + query.limit < rows.length ? String(start + query.limit) : null;
      return { items, nextCursor, total: rows.length, sorted: { sort, dir } };
    },

    async get(id) {
      const row = await find(id);
      if (!row) return null;
      return {
        ...(await summaryOf(row)),
        format: "markdown" as const,
        source: row.draft ?? row.published,
        version: await versionOf(row),
      };
    },

    saveDraft: (id, input) =>
      write(
        "save",
        id,
        input.changeId,
        input.expectedVersion,
        (row) => {
          parsed(id as SectionId, input.source);
          return input.source === row.published
            ? { draft: null, ...UNSCHEDULED }
            : { draft: input.source };
        },
        input.actor,
      ),

    publish: (id, input) =>
      write(
        "publish",
        id,
        input.changeId,
        input.expectedVersion,
        (row) => {
          const source = input.source ?? row.draft ?? row.published;
          parsed(id as SectionId, source);
          return {
            published: source,
            draft: null,
            ...UNSCHEDULED,
            publishedAt: utc(input.publishedAt ?? new Date()),
          };
        },
        input.actor,
      ),

    // A section is always live, so the package sends a schedule to schedules.update below.
    schedule,

    async unpublish(id) {
      if (!(await find(id))) throw new NotFoundError();
      throw new RefusedError(
        "A section of this page cannot be taken down; edit it and publish instead.",
      );
    },

    async revisions(id) {
      const row = await find(id);
      if (!row) return null;
      const rows = await db
        .select()
        .from(sectionRevisions)
        .where(eq(sectionRevisions.sectionId, id))
        .orderBy(desc(sectionRevisions.id));
      // The section as it stands is the newest revision: the kept rows are the states before each change, so
      // without it the live version (and who published it) would not show in Carrel's history until the next edit.
      const currentVersion = await versionOf(row);
      const kept = await Promise.all(
        rows.map(async (r) => ({
          version: await versionOf(r),
          at: r.createdAt,
          author: r.author ?? OWNER,
          message: `Kept before change ${r.changeId}`,
        })),
      );
      return [
        {
          version: currentVersion,
          at: row.updatedAt,
          author: row.updatedBy ?? OWNER,
          message: "The section as it stands now",
        },
        ...kept.filter((k) => k.version !== currentVersion),
      ];
    },

    async revisionSource(id, version) {
      const row = await find(id);
      if (!row) return null;
      const candidates: Snapshot[] = [
        row,
        ...(await db.select().from(sectionRevisions).where(eq(sectionRevisions.sectionId, id))),
      ];
      for (const c of candidates)
        if ((await versionOf(c)) === version) return c.draft ?? c.published;
      return null;
    },
  };

  const schedules: SchedulesAdapter = {
    async get(id) {
      const row = await find(id);
      if (!row?.publishAt || row.draft === null) return null;
      return {
        id,
        source: row.draft,
        publishAt: row.publishAt,
        changeId: row.scheduleChangeId!,
        scheduledAt: row.scheduledAt!,
      };
    },

    update: schedule,

    async cancel(id, input) {
      if (!(await find(id))) throw new NotFoundError();
      return write(
        "unschedule",
        id,
        input.changeId,
        input.expectedVersion,
        (row) => {
          if (!row.publishAt) throw new RefusedError("Nothing is scheduled for this section.");
          return UNSCHEDULED;
        },
        input.actor,
      );
    },

    async due({ now, limit }) {
      const rows = await db
        .select()
        .from(sections)
        .where(and(isNotNull(sections.publishAt), lte(sections.publishAt, utc(now))))
        .orderBy(asc(sections.publishAt), asc(sections.id))
        .limit(limit);
      return rows.map((r) => ({
        id: r.id,
        kind: "publish" as const,
        publishAt: r.publishAt!,
        changeId: r.scheduleChangeId!,
      }));
    },

    // Only the schedule that was listed, once its time has come: a cancel, a reschedule or a publish in between wins.
    async apply(id, due) {
      const row = await find(id);
      if (
        due.kind !== "publish" ||
        !row ||
        row.draft === null ||
        row.publishAt !== due.publishAt ||
        row.scheduleChangeId !== due.changeId
      )
        return null;
      if (Date.parse(due.publishAt) > due.now.getTime()) return null;
      const source = row.draft;
      return write("schedule.publish", id, due.changeId, await versionOf(row), () => ({
        published: source,
        draft: null,
        ...UNSCHEDULED,
        publishedAt: due.publishAt,
      }));
    },
  };

  return { content, schedules };
}
