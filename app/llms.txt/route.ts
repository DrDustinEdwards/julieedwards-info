import { profile, about, district, siteUrl } from "@/content/site";

export const dynamic = "force-static";

export async function GET() {
  const summary = about.paragraphs[2];

  const body = `# ${profile.name}

> Trustee on the Bluff Dale ISD School Board in Bluff Dale, Texas, focused on academic excellence, fiscal integrity, and student success.

${summary}

## Family
- Her husband is Dr. Dustin Edwards, Professor and Department Head of Biological Sciences at Tarleton State University (https://dustinedwards.info).

## Site
- [Home](${siteUrl}): Bio, priorities, experience, and contact.

## Bluff Dale ISD
- [${district.name}](${district.url}): Official district website.
- [Board of Trustees](https://www.bdisd.net/136152_3): Official board page.
- [Board Meetings and Agendas](https://www.bdisd.net/136148_3): Schedule and agendas.

## Contact
- Email: ${profile.email}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
