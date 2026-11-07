// Nightly D1 backup into the BACKUPS bucket, by d1-dump's runCheckedBackup: dump without the marker,
// check, mark complete, prune. `sections` must dump exactly its live row count, and an empty one fails.
// A dump that fails a check keeps its objects without the marker, so the run fails and /health's backup
// age keeps growing toward its 26 hour warning. The media library's files (uploads/ and history/ in MEDIA)
// are copied beside the dumps under files/media/ by d1-dump's backupFiles, each run going on where the last stopped.
//
// Never in a dump: preview_links (site-api's store), the hash of each Carrel preview link's token. A backup copy is one
// more place it could leak from, and restoring an older copy would bring back a link revoked since; a lost link is made
// again in Carrel. The credential-column check refuses a dump that carries any other column named like a credential.
//
// Not backed up: BACKUPS, which is the backup. The site has no KV namespace; its rate limits (CARREL_RATE_LIMIT,
// CSP_REPORT_RATE_LIMIT) are counters that reset each minute, and the one Durable Object class, RATE_LIMITER, counts the operator API.
import { backupFiles, backupHealth, filesHealth, runCheckedBackup } from "@dustinedwards/d1-dump";

// A media pass stops itself at three minutes and goes on the next night, inside its job's four-minute timeout
// (cron.server.ts).
export const MEDIA_BACKUP = { name: "media", timeBudgetMs: 180_000 };

export async function runBackup(env: Env): Promise<void> {
  await runCheckedBackup(env.DB, env.BACKUPS, {
    required: ["section_revisions"],
    counted: ["sections"],
    exclude: ["preview_links"],
    credentials: true,
  });
}

export async function runMediaBackup(env: Env): Promise<void> {
  await backupFiles(env.MEDIA, env.BACKUPS, MEDIA_BACKUP);
}

/** The newest complete dump and the media files pass, for /health's backup check and the operator API: it warns when either is stale. Never throws. */
export async function backupStatus(env: Env) {
  const [dump, files] = await Promise.all([
    backupHealth(env.BACKUPS),
    filesHealth(env.BACKUPS, MEDIA_BACKUP),
  ]);
  return { ...dump, files, warning: dump.warning ?? files.warning };
}
