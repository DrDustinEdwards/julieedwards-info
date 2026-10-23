// The only place a Drizzle client is made: drizzle(env.DB) over the native D1 binding.
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb(env: Env) {
  return drizzle(env.DB, { schema });
}
