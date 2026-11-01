import { useRouteLoaderData } from "react-router";
import { accessibilityStatement, ACCESSIBILITY_PATH } from "@drdustinedwards/site-helpers/accessibility";
import { defineHead } from "@drdustinedwards/site-helpers/head";
import { publicPageHeaders } from "@dustinedwards/site-runtime/edge-cache";
import type { Route } from "./+types/accessibility";
import type { loader as rootLoader } from "~/root";
import { SITE_URL } from "~/lib/site";

// The statement is the network's shared text (Prelum); only the name, the contact and the date are this site's. It is
// not her campaign copy, so it is not in D1 (CLAUDE.md hard rule 2 is about what she says).
const REVIEWED = "2026-11-01";

export const headers = () => publicPageHeaders();

function statementFor(profile: { name: string; email: string }) {
  return accessibilityStatement({
    siteName: `${profile.name}'s campaign site`,
    contact: { href: `mailto:${profile.email}`, label: profile.email },
    date: REVIEWED,
  });
}

export const meta: Route.MetaFunction = ({ matches }) => {
  const root = matches.find((m) => m?.id === "root")?.loaderData as Awaited<ReturnType<typeof rootLoader>> | undefined;
  if (!root) return [{ title: "Accessibility statement" }];
  const { profile } = root.content;
  const statement = statementFor(profile);
  return defineHead({
    origin: SITE_URL,
    siteName: profile.name,
    image: { url: "/opengraph-image.png", width: 1200, height: 630, alt: `${profile.name}, ${profile.office}` },
    locale: "en_US",
  })({
    path: ACCESSIBILITY_PATH,
    title: `${statement.title} | ${profile.name}`,
    fullTitle: true,
    description: statement.description,
    breadcrumbs: false,
  });
};

export default function Accessibility() {
  const data = useRouteLoaderData<typeof rootLoader>("root");
  if (!data) return null;
  const statement = statementFor(data.content.profile);
  return (
    <section className="wrap" style={{ paddingBlock: "var(--space-8)" }}>
      <h1>{statement.title}</h1>
      <div className="accessibility-statement" dangerouslySetInnerHTML={{ __html: statement.html }} />
    </section>
  );
}
