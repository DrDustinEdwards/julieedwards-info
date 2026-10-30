// /ai.txt from Prelum's aiTxt (served whole by aiTxtResponse), the family AI usage policy: answer engines may cite and
// link, training rights are reserved (as the TDMRep header in workers/security-headers.ts says) and licensed on request.
import { aiTxtResponse } from "@drdustinedwards/site-helpers/robots";
import type { Route } from "./+types/ai-txt";
import { getEnv } from "~/lib/context.server";
import { loadContent } from "~/lib/content.server";
import { SITE_URL } from "~/lib/site";

export async function loader({ request, context }: Route.LoaderArgs) {
  const { content } = await loadContent(getEnv(context));
  return aiTxtResponse({ origin: SITE_URL, request, name: content.profile.name, contact: content.profile.email });
}
