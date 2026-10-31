-- Each library file's placeholder (a tiny blurred WebP as a data: URI) and main color (#rrggbb), from site-api's
-- prepareUpload, for Carrel's library. NULL where none was made, as for every file stored before this.
--
-- ADDITIVE: two nullable columns. No existing row is touched.
ALTER TABLE media ADD COLUMN placeholder TEXT;
ALTER TABLE media ADD COLUMN color TEXT;
