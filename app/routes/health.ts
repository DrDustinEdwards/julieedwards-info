// /health: site-runtime's healthResponse, 503 only when D1 does not answer, because the page's copy is in D1 and no
// page renders without it: that is the one fail-level check (`ping`). Warnings, never a 503, since the page still
// serves: the newest complete nightly dump or media files pass older than 26 hours (both under `backup`), the MEDIA
// bucket, the Images binding or Workers AI not answering, and a job that failed, stopped or never ran (`cron_runs`,
// read against the Worker's own job lists). `sha` is the deployed commit, which CI's deploy passes as DEPLOY_SHA
// (devkit's worker-deploy.yml; a manual deploy has none). No keys, table names or counts.
//
// Not probed: BACKUPS (the backup check reads it, so a dead bucket shows as a stale backup), and the two rate limit
// bindings (CARREL_RATE_LIMIT, CSP_REPORT_RATE_LIMIT), which have no read that does not spend a request's count.
import {
  durableObjectCheck,
  imagesCheck,
  r2Check,
  siteHealthResponse,
} from "@dustinedwards/site-runtime/health";
import type { Route } from "./+types/health";
import { backup } from "~/lib/backup.server";
import { getEnv } from "@dustinedwards/site-runtime/context";
import { allCronJobs } from "~/lib/cron.server";

export function loader({ context }: Route.LoaderArgs) {
  const env = getEnv(context);
  return siteHealthResponse(env, {
    backup: () => backup.status(env),
    jobs: allCronJobs(env),
    checks: [
      { ...r2Check("media", env.MEDIA), level: "warn" },
      imagesCheck("images", env.IMAGES),
      durableObjectCheck("rate_limiter", env.RATE_LIMITER),
    ],
  });
}
