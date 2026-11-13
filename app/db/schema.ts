// Kept in step with the hand-written migrations in drizzle/ (0000_sections.sql, 0002_media.sql,
// 0004_media_placeholder.sql, 0005_section_schedules.sql). 0003_ops.sql holds site-runtime's own tables and
// 0006_site_api_store.sql site-api's, which only each package reads and writes.
import { media, mediaChanges, mediaRevisions } from "@dustinedwards/site-api/drizzle";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sections = sqliteTable("sections", {
  id: text("id").primaryKey(),
  published: text("published").notNull(),
  draft: text("draft"),
  publishedAt: text("published_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  // A time on the draft, set from Carrel, and the change that set it (0005_section_schedules.sql); NULL while none waits.
  publishAt: text("publish_at"),
  scheduleChangeId: text("schedule_change_id"),
  scheduledAt: text("scheduled_at"),
});

export const sectionRevisions = sqliteTable("section_revisions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sectionId: text("section_id").notNull(),
  published: text("published").notNull(),
  draft: text("draft"),
  changeId: text("change_id").notNull(),
  createdAt: text("created_at").notNull(),
});

export type SectionRow = typeof sections.$inferSelect;

// The media library (0002_media.sql, 0004_media_placeholder.sql) is site-api's own tables: one row per uploaded file, its
// byte history, and the change log the triggers on `media` write.
export { media, mediaChanges, mediaRevisions };

export type MediaRow = typeof media.$inferSelect;
export type MediaRevisionRow = typeof mediaRevisions.$inferSelect;
