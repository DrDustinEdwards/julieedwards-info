// The scheduled jobs, keyed by the cron that fires them (wrangler.jsonc triggers.crons). workers/app.ts runs the list
// for the cron it receives through site-runtime's runJobs, and /health's cronCheck reads every list (names and
// intervals only), so a job whose trigger never fires warns as "never ran".
//
// Every minute: the sections Carrel scheduled go live (handler.server.ts), with 50 seconds, so a hung run never runs
// into the next minute's. Nightly: the D1 dump, the media files (a pass stops itself at three minutes and goes on the
// next night) and the 404 prune, ten minutes in all, inside a scheduled invocation's 15.
import type { CronJob } from "@dustinedwards/site-runtime/cron";
import { pruneNotFound } from "@dustinedwards/site-runtime/not-found";
import { runBackup, runMediaBackup } from "~/lib/backup.server";
import { sha256Hex } from "@dustinedwards/site-api";
import { eq } from "drizzle-orm";
import { getDb } from "~/db/index.server";
import { media } from "~/db/schema";
import { runCarrelSchedules } from "~/lib/carrel/handler.server";
import { carrelMediaAdapter } from "~/lib/carrel/media-adapter.server";

const SCHEDULES_CRON = "* * * * *";
const NIGHTLY_CRON = "37 3 * * *";

const MINUTE = 60_000;
const DAY = 1440;

export function cronJobs(env: Env, scheduledTime: Date): Record<string, CronJob[]> {
  return {
    [SCHEDULES_CRON]: [
      { name: "carrel-schedules", everyMinutes: 1, timeoutMs: 50_000, run: () => runCarrelSchedules(env, scheduledTime) },
      { name: "import-about-photo", everyMinutes: 1, timeoutMs: 50_000, run: () => importAboutPhoto(env) },
    ],
    [NIGHTLY_CRON]: [
      { name: "backup", everyMinutes: DAY, timeoutMs: 5 * MINUTE, run: () => runBackup(env) },
      { name: "media-backup", everyMinutes: DAY, timeoutMs: 4 * MINUTE, run: () => runMediaBackup(env) },
      { name: "prune-404", everyMinutes: DAY, timeoutMs: MINUTE, run: () => pruneNotFound(env.DB, { days: 90 }) },
    ],
  };
}

/**
 * One-time (Dustin, 1 Nov 2026): the About photo still loads as the 2 MB original from content.julieedwards.info, and
 * the media library holds no copy. This imports it once through the library's own upload path (the import a person
 * makes in Carrel), so it gets its sizes, placeholder and history. The profile then names the library file, through
 * Carrel, and this job is removed.
 */
const ABOUT_PHOTO = "https://content.julieedwards.info/julie-edwards-bluff-dale-profile.jpg";

async function importAboutPhoto(env: Env): Promise<void> {
  const [done] = await getDb(env).select({ key: media.key }).from(media).where(eq(media.sourceUrl, ABOUT_PHOTO)).limit(1);
  if (done) return;
  const response = await fetch(ABOUT_PHOTO);
  if (!response.ok) throw new Error(`${ABOUT_PHOTO} answered ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const sha256 = await sha256Hex(bytes);
  await carrelMediaAdapter(env).upload({
    bytes,
    contentType: "image/jpeg",
    filename: "julie-edwards-bluff-dale-profile.jpg",
    alt: "",
    changeId: "import-about-photo",
    sha256,
    resize: true,
    sourceUrl: ABOUT_PHOTO,
  });
}

/** Every job of every cron, for /health's cronCheck (it reads names and intervals; `run` is never called). */
export function allCronJobs(env: Env): CronJob[] {
  return Object.values(cronJobs(env, new Date())).flat();
}
