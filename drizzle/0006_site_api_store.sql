-- site-api's own tables (SITE_API_STORE_SQL from @dustinedwards/site-api/store, as written), read and written only
-- through its d1SiteApiStore, never through Drizzle (app/db/schema.ts): `site_api_writes` keeps each Carrel write's
-- answer under its change id for 7 days, so a retry answers the same and runs nothing; `hook_retries` holds the publish
-- hooks that failed, for the cron to run again; `preview_links` keeps only the SHA-256 of each preview link's token;
-- `webmention_targets` is the pages the page last sent webmentions to.
--
-- ADDITIVE: four new tables and three indexes. No existing row is touched.
CREATE TABLE IF NOT EXISTS site_api_writes (
  change_id TEXT PRIMARY KEY,
  route TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status INTEGER,
  response TEXT,
  state TEXT NOT NULL,
  at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS site_api_writes_at ON site_api_writes (at);
CREATE TABLE IF NOT EXISTS hook_retries (
  id TEXT PRIMARY KEY,
  hook TEXT NOT NULL,
  event TEXT NOT NULL,
  attempts INTEGER NOT NULL,
  next_at TEXT NOT NULL,
  last_error TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS hook_retries_due ON hook_retries (next_at);
CREATE TABLE IF NOT EXISTS preview_links (
  token_hash TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  change_id TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS preview_links_content ON preview_links (content_id, expires_at);
CREATE TABLE IF NOT EXISTS webmention_targets (
  source TEXT PRIMARY KEY,
  targets TEXT NOT NULL,
  sent_at TEXT NOT NULL
);
