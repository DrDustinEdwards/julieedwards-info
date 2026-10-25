// /ai.txt from Prelum's aiTxt, the family AI usage policy: answer engines may cite and link, training rights are
// reserved (as the TDMRep header in workers/security-headers.ts says) and licensed on request.
import { aiTxt } from "@drdustinedwards/site-helpers/robots";
import type { Route } from "./+types/ai-txt";
import { getEnv } from "~/lib/context.server";
import { loadContent } from "~/lib/content.server";
import { SITE_URL } from "~/lib/site";

export async function loader({ context }: Route.LoaderArgs) {
  const { content } = await loadContent(getEnv(context));
  const body = aiTxt({ origin: SITE_URL, name: content.profile.name, contact: content.profile.email });
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
