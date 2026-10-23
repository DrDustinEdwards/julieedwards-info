// Nightly D1 backup into the BACKUPS bucket, by d1-dump's runCheckedBackup: dump without the marker,
// check, mark complete, prune. A dump that fails a check keeps its objects without the marker, so the
// run fails and /health's backup age keeps growing toward its 26 hour warning.
import { runCheckedBackup } from "@dustinedwards/d1-dump";

export async function runBackup(env: Env): Promise<void> {
  const live = await env.DB.prepare("SELECT COUNT(*) AS n FROM sections").first<{ n: number }>();
  await runCheckedBackup(env.DB, env.BACKUPS, {
    required: ["sections", "section_revisions"],
    check: (dump) => {
      const dumped = dump.tables.find((t) => t.name === "sections")?.rows ?? 0;
      if (!live?.n) return ["sections is empty in D1"];
      return dumped === live.n ? [] : [`sections dumped ${dumped} rows but has ${live.n}`];
    },
  });
}
