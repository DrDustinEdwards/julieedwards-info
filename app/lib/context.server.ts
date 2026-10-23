// The Cloudflare bindings, carried on React Router's request context (workers/app.ts sets them).
import { createContext, type RouterContextProvider } from "react-router";

export const cloudflareContext = createContext<{ env: Env; ctx: ExecutionContext }>();

export function getEnv(context: Readonly<RouterContextProvider>): Env {
  return context.get(cloudflareContext).env;
}
