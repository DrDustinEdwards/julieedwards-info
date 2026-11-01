import { isRouteErrorResponse, Links, Meta, Outlet, useLocation, useRouteError, useRouteLoaderData } from "react-router";
import { ErrorPage, errorTitle } from "capsomer/react/error-page";
import { defineHead } from "@drdustinedwards/site-helpers/head";
import { iconLinks } from "@drdustinedwards/site-helpers/icons";
import { jsonLd } from "@drdustinedwards/site-helpers/schema";
import type { Route } from "./+types/root";
import { Footer, Header } from "./components/Chrome";
import { getEnv } from "./lib/context.server";
import { loadContent } from "./lib/content.server";
import { SITE_URL } from "./lib/site";
import { structuredData } from "./lib/structured-data";
import { THEME_SCRIPT } from "./lib/theme";
import { ThemeColor } from "capsomer/react/theme-switch";
import "./app.css";

export async function loader({ context }: Route.LoaderArgs) {
  return loadContent(getEnv(context));
}

export const meta: Route.MetaFunction = ({ loaderData: data, error, location }) => {
  if (!data) return [{ title: "Error" }];
  const { profile, site } = data.content;
  // The error path writes its own title and no home canonical or JSON-LD: a 404 is not the home page.
  if (error) {
    const notFound = isRouteErrorResponse(error) && error.status === 404;
    return [{ title: notFound ? `${site.notFound.title.replace(/\.$/, "")} | ${profile.name}` : errorTitle(error, profile.name) }];
  }
  // The home page's head is below; another page (the accessibility statement) writes its own.
  if (location.pathname !== "/") return [];
  return [
    // The one page, so its WebPage has no trail.
    // The profile's search fields, where set: the <title> (the share card keeps the name and office), card, canonical, noindex.
    ...defineHead({
      origin: SITE_URL,
      siteName: profile.name,
      image: { url: "/opengraph-image.png", width: 1200, height: 630, alt: `${profile.name}, ${profile.office}` },
      locale: "en_US",
    })({
      path: "/",
      title: profile.searchTitle || `${profile.name} | ${profile.office}`,
      socialTitle: `${profile.name} | ${profile.office}`,
      fullTitle: true,
      description: profile.description,
      image: data.shareImage,
      canonical: profile.canonical || undefined,
      noindex: profile.noindex,
      breadcrumbs: false,
    }),
    ...structuredData(profile).map(jsonLd),
  ];
};

export const links: Route.LinksFunction = () => iconLinks();

const THEME_COLOR = { light: "#ffffff", dark: "#15532E" };

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData<typeof loader>("root");
  const content = data?.content;
  // The header's links are anchors on the home page; on another page they point back to it.
  const base = useLocation().pathname === "/" ? "" : "/";
  return (
    <html lang="en" data-family="forest" data-cap-site="julieedwards">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* The theme is chosen in the browser (THEME_SCRIPT), so the server writes both. */}
        <ThemeColor ground={THEME_COLOR} />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {content ? (
          <>
            <Header name={content.profile.name} links={content.site.nav} base={base} />
            <main id="main">{children}</main>
            <Footer name={content.profile.name} site={content.site} />
            <script src="/site.js" defer />
          </>
        ) : (
          <main id="main">{children}</main>
        )}
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  const data = useRouteLoaderData<typeof loader>("root");
  const notFound = data?.content.site.notFound;
  // A 404 says the site's own D1 copy (CLAUDE.md hard rule 2); the Layout already holds the page's main.
  const words = isRouteErrorResponse(error) && error.status === 404 && notFound ? { title: notFound.title, text: notFound.body, homeLabel: notFound.cta } : {};
  return <ErrorPage error={error} home="/" as="div" dev={import.meta.env.DEV} {...words} />;
}
