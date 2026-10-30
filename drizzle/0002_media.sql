-- The media library Carrel edits (site-api's media group, app/lib/carrel/media-adapter.server.ts). One row per
-- uploaded file; its bytes are the object in the MEDIA bucket under the same key, served at /media/<key>. Nothing
-- here holds page copy: a section uses a file only by naming its address in its own source (app/lib/source.ts).
--
-- ADDITIVE: three new tables, two indexes and three triggers. No existing row is touched.

-- `rev` is the file's version: every write to its metadata or bytes bumps it in the same statement that checks it,
-- so a stale write is refused rather than lost (an ISO time could repeat within a write). Times are ISO 8601 UTC.
CREATE TABLE media (
  key TEXT PRIMARY KEY NOT NULL,
  filename TEXT,
  content_type TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  -- The SHA-256 of the current bytes, lower case hex: duplicates are found by it.
  sha256 TEXT NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  -- A JSON array of tags in the contract's spelling.
  tags TEXT NOT NULL DEFAULT '[]',
  -- "XxY", each 0 to 1 (site-runtime ./image), or NULL.
  focus TEXT,
  credit TEXT NOT NULL DEFAULT '',
  license TEXT NOT NULL DEFAULT '',
  source_url TEXT,
  -- YYYY-MM-DD, or NULL for a license with no end.
  license_expires TEXT,
  -- When the picture was taken, as its embedded metadata says.
  taken_at TEXT,
  uploaded_at TEXT NOT NULL,
  trashed_at TEXT,
  rev INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX media_sha256 ON media (sha256);

-- Every set of bytes a file has had, newest last. The newest row is the current bytes (the MEDIA object itself);
-- each earlier one names the copy kept in MEDIA under history/ (`copy_key`), which /media never serves.
CREATE TABLE media_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_key TEXT NOT NULL,
  at TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  -- upload | import | replace | transform | resize | revert
  reason TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  copy_key TEXT
);

CREATE INDEX media_revisions_key ON media_revisions (media_key, id);

-- Every insert, update and delete of a media row, in order: what a library screen polls (`changedSince`).
-- Triggers, so no write path can forget to log itself.
CREATE TABLE media_changes (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  media_key TEXT NOT NULL
);

CREATE TRIGGER media_changes_insert AFTER INSERT ON media BEGIN
  INSERT INTO media_changes (media_key) VALUES (NEW.key);
END;
CREATE TRIGGER media_changes_update AFTER UPDATE ON media BEGIN
  INSERT INTO media_changes (media_key) VALUES (NEW.key);
END;
CREATE TRIGGER media_changes_delete AFTER DELETE ON media BEGIN
  INSERT INTO media_changes (media_key) VALUES (OLD.key);
END;
