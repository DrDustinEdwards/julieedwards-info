// Nightly D1 backup into the BACKUPS bucket, by d1-dump's runCheckedBackup: dump without the marker,
// check, mark complete, prune. `sections` must dump exactly its live row count, and an empty one fails.
// A dump that fails a check keeps its objects without the marker, so the run fails and /health's backup
// age keeps growing toward its 26 hour warning. The media library's files (uploads/ and history/ in MEDIA)
// are copied beside the dumps under files/media/ by d1-dump's backupFiles, each run going on where the last stopped.
import { backupFiles, runCheckedBackup } from "@dustinedwards/d1-dump";

export const MEDIA_BACKUP = { name: "media" };

export async function runBackup(env: Env): Promise<void> {
  await runCheckedBackup(env.DB, env.BACKUPS, { required: ["section_revisions"], counted: ["sections"] });
}

export async function runMediaBackup(env: Env): Promise<void> {
  await backupFiles(env.MEDIA, env.BACKUPS, MEDIA_BACKUP);
}
