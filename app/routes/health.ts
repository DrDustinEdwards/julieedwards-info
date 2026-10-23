// /health: 200 when the Worker is up and D1 answers, 503 when it does not, with the age of the newest
// complete nightly dump (a warning inside `backup`, never a 503). No keys, table names or counts.
import { backupHealth } from "@dustinedwards/d1-dump";
import type { Route } from "./+types/health";
import { getEnv } from "~/lib/context.server";

export async function loader({ context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = await env.DB.prepare("select 1")
    .first()
    .then(() => true)
    .catch(() => false);
  const backup = await backupHealth(env.BACKUPS);
  return new Response(JSON.stringify({ ok: db, db: db ? "up" : "down", backup, time: new Date().toISOString() }), {
    status: db ? 200 : 503,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
