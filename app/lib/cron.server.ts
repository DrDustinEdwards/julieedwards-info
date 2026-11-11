// The scheduled jobs, keyed by the cron that fires them (wrangler.jsonc triggers.crons). workers/app.ts runs the list
// for the cron it receives through site-runtime's runJobs, and /health's cronCheck reads every list (names and
// intervals only), so a job whose trigger never fires warns as "never ran".
//
// Every minute: the sections Carrel scheduled go live (handler.server.ts), with 50 seconds, so a hung run never runs
// into the next minute's. Nightly: the D1 dump, the media files (a pass stops itself at three minutes and goes on the
// next night) and the 404 prune, ten minutes in all, inside a scheduled invocation's 15.
import { backupJob, carrelSchedulesJob, type CronJob } from "@dustinedwards/site-runtime/cron";
import { pruneNotFoundJob } from "@dustinedwards/site-runtime/not-found";
import { runBackup, runMediaBackup } from "~/lib/backup.server";
import { runCarrelSchedules } from "~/lib/carrel/handler.server";

const SCHEDULES_CRON = "* * * * *";
const NIGHTLY_CRON = "37 3 * * *";

const MINUTE = 60_000;

export function cronJobs(env: Env, scheduledTime: Date): Record<string, CronJob[]> {
  return {
    [SCHEDULES_CRON]: [carrelSchedulesJob(() => runCarrelSchedules(env, scheduledTime))],
    [NIGHTLY_CRON]: [
      backupJob(() => runBackup(env)),
      backupJob(() => runMediaBackup(env), { name: "media-backup", timeoutMs: 4 * MINUTE }),
      pruneNotFoundJob(env.DB),
    ],
  };
}

/** Every job of every cron, for /health's cronCheck (it reads names and intervals; `run` is never called). */
export function allCronJobs(env: Env): CronJob[] {
  return Object.values(cronJobs(env, new Date())).flat();
}
