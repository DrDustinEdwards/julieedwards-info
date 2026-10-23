// Nightly D1 backup into the BACKUPS bucket, by d1-dump's runCheckedBackup: dump without the marker,
// check, mark complete, prune. `sections` must dump exactly its live row count, and an empty one fails.
// A dump that fails a check keeps its objects without the marker, so the run fails and /health's backup
// age keeps growing toward its 26 hour warning.
import { runCheckedBackup } from "@dustinedwards/d1-dump";

export async function runBackup(env: Env): Promise<void> {
  await runCheckedBackup(env.DB, env.BACKUPS, { required: ["section_revisions"], counted: ["sections"] });
}
