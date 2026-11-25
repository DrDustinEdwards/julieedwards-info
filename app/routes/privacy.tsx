import { useRouteLoaderData } from "react-router";
import { rootLoaderData } from "@drdustinedwards/site-helpers/head";
import { publicPageHeaders } from "@dustinedwards/site-runtime/edge-cache";
import type { Route } from "./+types/privacy";
import type { loader as rootLoader } from "~/root";
import { pageHead, PRIVACY_PATH, PRIVACY_REVIEWED } from "~/lib/site";

// What the site stores or sends, as the code does it. Not her copy, so it is not in D1.

export const headers = () => publicPageHeaders();

export const meta: Route.MetaFunction = ({ matches }) => {
  const root = rootLoaderData<Awaited<ReturnType<typeof rootLoader>>>(matches);
  if (!root) return [{ title: "Privacy" }];
  const { profile } = root.content;
  return pageHead(profile)({
    path: PRIVACY_PATH,
    title: `Privacy | ${profile.name}`,
    fullTitle: true,
    description: "What this site stores and sends.",
    breadcrumbs: false,
  });
};

export default function Privacy() {
  const data = useRouteLoaderData<typeof rootLoader>("root");
  if (!data) return null;
  return (
    <section className="cap-page accessibility-page">
      <h1>Privacy</h1>
      <div className="accessibility-statement">
        <p>This site has no accounts, forms, cookies or ads.</p>
        <ul>
          <li>
            Cloudflare serves the site and counts page views with Cloudflare Web Analytics, which
            sets no cookie and does not follow visitors from site to site.
          </li>
          <li>
            The light and dark button saves your choice in your browser's local storage. It never
            leaves your device.
          </li>
          <li>
            A page that does not exist is counted by its address, the site it came from and the day.
            The search part of the address is not kept.
          </li>
          <li>
            If you email {data.content.profile.email}, your message goes to that mailbox through
            your own email provider. The site does not store it.
          </li>
        </ul>
        <p>Last reviewed {PRIVACY_REVIEWED}.</p>
      </div>
    </section>
  );
}
