-- Who made each change, from Carrel's actor (site-api C2): `updated_by` on the section is who made the state it holds,
-- and `author` on a kept revision is who made the state that revision kept. NULL where the change named no one
-- (every row before this migration), which Carrel's history shows as the site's own name.
--
-- ADDITIVE: two nullable columns. No existing row is touched.
ALTER TABLE sections ADD COLUMN updated_by TEXT;
ALTER TABLE section_revisions ADD COLUMN author TEXT;
