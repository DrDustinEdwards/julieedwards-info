-- site-api 0.21.0's table (SITE_API_STORE_SQL_V0_21 from @dustinedwards/site-api/store, as written), read and written
-- only through its d1SiteApiStore, never through Drizzle: the media file each upload's duplicates key became, so a
-- picture the adapter shrank or converted is still found when it is sent again. Additive, empty.
CREATE TABLE IF NOT EXISTS media_uploads (
  sha256 TEXT PRIMARY KEY,
  media_id TEXT NOT NULL,
  at TEXT NOT NULL
);
