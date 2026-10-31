// What the tests that load the site's own modules share: the app's `~/` alias and extensionless imports as Vite
// resolves them, and D1 over node:sqlite with every migration in drizzle/ applied.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { DatabaseSync } from "node:sqlite";

const app = new URL("../app/", import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    const target = specifier.startsWith("~/") ? new URL(specifier.slice(2), app).href : specifier.startsWith(".") && context.parentURL?.startsWith(app.href) ? new URL(specifier, context.parentURL).href : null;
    if (target && !/\.[cm]?[jt]sx?$/.test(target)) {
      for (const ext of [".ts", ".mjs", ".js"]) if (existsSync(new URL(target + ext))) return next(target + ext, context);
    }
    return next(target ?? specifier, context);
  },
});

/** One of the site's modules, typed by the Worker's project (tsconfig.cloudflare.json), so loaded here by address. */
export const site = (path: string) => import(new URL(`../app/${path}`, import.meta.url).href);

/** D1's binding over node:sqlite, as much of it as Drizzle and the packages call. */
export function fakeD1(db: DatabaseSync) {
  const statement = (sql: string, params: unknown[] = []) => {
    const run = () => db.prepare(sql) as ReturnType<DatabaseSync["prepare"]>;
    const args = params as never[];
    return {
      bind: (...next: unknown[]) => statement(sql, next),
      all: async <T = Record<string, unknown>>() => ({ results: run().all(...args) as T[], success: true, meta: {} }),
      raw: async () => {
        const s = run();
        s.setReturnArrays(true);
        return s.all(...args);
      },
      first: async <T = Record<string, unknown>>(column?: string): Promise<T | null> => {
        const row = run().get(...args) as Record<string, unknown> | undefined;
        return (column ? (row?.[column] ?? null) : (row ?? null)) as T | null;
      },
      run: async () => {
        const info = run().run(...args);
        return { results: [], success: true, meta: { changes: info.changes, last_row_id: Number(info.lastInsertRowid) } };
      },
    };
  };
  return {
    prepare: (sql: string) => statement(sql),
    batch: async (statements: Array<ReturnType<typeof statement>>) => {
      db.exec("BEGIN");
      try {
        const results = [];
        for (const s of statements) results.push(await s.all());
        db.exec("COMMIT");
        return results;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

/** A database with every migration applied in order, the seed included, as the deploy applies them. */
export function migratedDb(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  const dir = new URL("../drizzle/", import.meta.url);
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) db.exec(readFileSync(new URL(file, dir), "utf8"));
  return db;
}
