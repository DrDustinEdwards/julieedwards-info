// /site.webmanifest from Prelum's webManifest, named from the profile in D1, pointing at the icons in public/.
import { webManifest } from "@drdustinedwards/site-helpers/icons";
import type { Route } from "./+types/manifest";
import { getEnv } from "~/lib/context.server";
import { loadContent } from "~/lib/content.server";

export async function loader({ context }: Route.LoaderArgs) {
  const { profile } = (await loadContent(getEnv(context))).content;
  const manifest = webManifest({ name: profile.name, description: profile.description, themeColor: "#15532E", backgroundColor: "#15532E", lang: "en" });
  return new Response(JSON.stringify(manifest), { headers: { "Content-Type": "application/manifest+json; charset=utf-8" } });
}
