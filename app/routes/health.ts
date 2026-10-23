// /health: site-runtime's healthResponse, 200 when D1 answers and 503 when it does not, with the age of
// the newest complete nightly dump (a warning inside `backup`, never a 503). No keys, table names or counts.
import { backupHealth } from "@dustinedwards/d1-dump";
import { healthResponse } from "@dustinedwards/site-runtime/health";
import type { Route } from "./+types/health";
import { getEnv } from "~/lib/context.server";

export function loader({ context }: Route.LoaderArgs) {
  const env = getEnv(context);
  return healthResponse({ ping: () => env.DB.prepare("select 1").first(), backup: () => backupHealth(env.BACKUPS) });
}
