// Kept in step with the hand-written migrations in drizzle/ (0000_sections.sql).
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sections = sqliteTable("sections", {
  id: text("id").primaryKey(),
  published: text("published").notNull(),
  draft: text("draft"),
  publishedAt: text("published_at").notNull(),
  updatedAt: text("updated_at").notNull(),
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
