import { llmsDocument } from "@drdustinedwards/site-helpers/llms";
import type { Route } from "./+types/llms";
import { getEnv } from "~/lib/context.server";
import { loadContent } from "~/lib/content.server";
import { SITE_URL } from "~/lib/site";

export async function loader({ context }: Route.LoaderArgs) {
  const { content } = await loadContent(getEnv(context));
  const { profile, about, contact } = content;
  const body = llmsDocument({
    title: profile.name,
    summary: profile.summary,
    intro: [
      about.paragraphs[about.paragraphs.length - 1],
      "## Family\n- Her husband is Dr. Dustin Edwards, Professor and Department Head of Biological Sciences at Tarleton State University (https://dustinedwards.info).",
    ],
    sections: [
      { heading: "Site", links: [{ title: "Home", url: SITE_URL, description: "Bio, priorities, experience, and contact." }] },
      {
        heading: profile.district.name,
        links: [
          { title: profile.district.name, url: profile.district.url, description: "Official district website." },
          ...contact.boardLinks.map((l) => ({ title: l.label, url: l.href })),
        ],
      },
      { heading: contact.heading, links: [{ title: `Email: ${profile.email}`, url: `mailto:${profile.email}` }] },
    ],
  });
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
