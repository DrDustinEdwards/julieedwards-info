-- A time on a section's draft, set from Carrel (site-api's schedule): the per-minute cron publishes the draft at
-- `publish_at` (workers/app.ts, app/lib/carrel/sections.server.ts). `schedule_change_id` is the change that set it, which
-- the publish is recorded under; `scheduled_at` is when it was set. All three NULL while nothing is scheduled. Times
-- are UTC ISO text, so the due scan is a text comparison.
--
-- ADDITIVE: three nullable columns. No existing row is touched.
ALTER TABLE sections ADD COLUMN publish_at TEXT;
ALTER TABLE sections ADD COLUMN schedule_change_id TEXT;
ALTER TABLE sections ADD COLUMN scheduled_at TEXT;
