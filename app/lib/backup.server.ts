// Nightly D1 backup into BACKUPS (d1-dump's runCheckedBackup): `sections` must dump exactly its live row count; a failed check keeps the dump unmarked so /health's backup age warns.
// Library files (uploads/ and history/ in MEDIA) are copied under files/media/ by backupFiles. Never in a dump: preview_links.
// Not backed up: BACKUPS itself.
import { createSiteBackup } from "@dustinedwards/d1-dump";

export const backup = createSiteBackup<Env>({
  dump: {
    required: ["section_revisions"],
    counted: ["sections"],
    exclude: ["preview_links"],
    credentials: true,
  },
  // A media pass stops itself at three minutes and goes on the next night, inside its job's four-minute
  // timeout (cron.server.ts).
  files: [{ name: "media", source: (env) => env.MEDIA, timeBudgetMs: 180_000 }],
});
