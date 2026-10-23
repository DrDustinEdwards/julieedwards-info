-- One row per section of the page (app/lib/source.ts). `published` is what the site shows; `draft` is a
-- Carrel save waiting for its publish, or NULL. Every write keeps the row as it was in section_revisions.
CREATE TABLE sections (
  id TEXT PRIMARY KEY NOT NULL,
  published TEXT NOT NULL,
  draft TEXT,
  published_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE section_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id TEXT NOT NULL REFERENCES sections(id),
  published TEXT NOT NULL,
  draft TEXT,
  change_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX section_revisions_section ON section_revisions (section_id, id);
