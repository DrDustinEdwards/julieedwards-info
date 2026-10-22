import { profile, about, boardLinks, district, llmsSummary, siteUrl } from "@/content/site";

export const dynamic = "force-static";

export async function GET() {
  const summary = about.paragraphs[2];

  const body = `# ${profile.name}

> ${llmsSummary}

${summary}

## Family
- Her husband is Dr. Dustin Edwards, Professor and Department Head of Biological Sciences at Tarleton State University (https://dustinedwards.info).

## Site
- [Home](${siteUrl}): Bio, priorities, experience, and contact.

## Bluff Dale ISD
- [${district.name}](${district.url}): Official district website.
${boardLinks.map((l) => `- [${l.label}](${l.href})`).join("\n")}

## Contact
- Email: ${profile.email}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
