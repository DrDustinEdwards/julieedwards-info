// /health: site-runtime's healthResponse, 503 only when D1 does not answer. Warnings, never a 503: the newest complete
// nightly dump or media files pass older than 26 hours (both under `backup`), the MEDIA bucket not answering, and a
// nightly job that failed or stopped (`cron_runs`). `sha` is the deployed commit, which CI's deploy passes as DEPLOY_SHA
// (devkit's worker-deploy.yml; a manual deploy has none). No keys, table names or counts.
import { backupHealth, filesHealth } from "@dustinedwards/d1-dump";
import { cronCheck } from "@dustinedwards/site-runtime/cron";
import { healthResponse, r2Check } from "@dustinedwards/site-runtime/health";
import type { Route } from "./+types/health";
import { MEDIA_BACKUP } from "~/lib/backup.server";
import { getEnv } from "~/lib/context.server";

export function loader({ context }: Route.LoaderArgs) {
  const env = getEnv(context);
  return healthResponse({
    ping: () => env.DB.prepare("select 1").first(),
    backup: async () => {
      const [dump, files] = await Promise.all([backupHealth(env.BACKUPS), filesHealth(env.BACKUPS, MEDIA_BACKUP)]);
      return { ...dump, files, warning: dump.warning ?? files.warning };
    },
    sha: (env as { DEPLOY_SHA?: string }).DEPLOY_SHA,
    checks: [{ ...r2Check("media", env.MEDIA), level: "warn" }, cronCheck(env.DB)],
  });
}
