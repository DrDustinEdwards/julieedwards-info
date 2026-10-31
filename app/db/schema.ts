// Kept in step with the hand-written migrations in drizzle/ (0000_sections.sql, 0002_media.sql,
// 0004_media_placeholder.sql). 0003_ops.sql holds site-runtime's own tables, which only it reads and writes.
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

// The media library (0002_media.sql, 0004_media_placeholder.sql): one row per uploaded file, its byte history, and the change log the
// triggers on `media` write.
export const media = sqliteTable("media", {
  key: text("key").primaryKey(),
  filename: text("filename"),
  contentType: text("content_type").notNull(),
  bytes: integer("bytes").notNull(),
  width: integer("width"),
  height: integer("height"),
  sha256: text("sha256").notNull(),
  alt: text("alt").notNull().default(""),
  caption: text("caption").notNull().default(""),
  tags: text("tags").notNull().default("[]"),
  focus: text("focus"),
  credit: text("credit").notNull().default(""),
  license: text("license").notNull().default(""),
  sourceUrl: text("source_url"),
  licenseExpires: text("license_expires"),
  takenAt: text("taken_at"),
  uploadedAt: text("uploaded_at").notNull(),
  trashedAt: text("trashed_at"),
  rev: integer("rev").notNull().default(0),
  placeholder: text("placeholder"),
  color: text("color"),
});

export const mediaRevisions = sqliteTable("media_revisions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mediaKey: text("media_key").notNull(),
  at: text("at").notNull(),
  bytes: integer("bytes").notNull(),
  width: integer("width"),
  height: integer("height"),
  reason: text("reason").notNull(),
  sha256: text("sha256").notNull(),
  copyKey: text("copy_key"),
});

export const mediaChanges = sqliteTable("media_changes", {
  seq: integer("seq").primaryKey({ autoIncrement: true }),
  mediaKey: text("media_key").notNull(),
});

export type MediaRow = typeof media.$inferSelect;
export type MediaRevisionRow = typeof mediaRevisions.$inferSelect;
