import { isRouteErrorResponse, Links, Meta, Outlet, useRouteError, useRouteLoaderData } from "react-router";
import { headTags } from "@drdustinedwards/site-helpers/head";
import { jsonLd } from "@drdustinedwards/site-helpers/schema";
import type { Route } from "./+types/root";
import { Footer, Header } from "./components/Chrome";
import { getEnv } from "./lib/context.server";
import { loadContent } from "./lib/content.server";
import { SITE_URL } from "./lib/site";
import { structuredData } from "./lib/structured-data";
import { THEME_SCRIPT } from "./lib/theme";
import "./app.css";

export async function loader({ context }: Route.LoaderArgs) {
  return loadContent(getEnv(context));
}

export const meta: Route.MetaFunction = ({ loaderData: data }) => {
  if (!data) return [{ title: "Error" }];
  const { profile } = data.content;
  return [
    ...headTags({
      origin: SITE_URL,
      path: "/",
      title: `${profile.name} | ${profile.office}`,
      description: profile.description,
      image: { url: "/opengraph-image.png", width: 1200, height: 630, alt: `${profile.name}, ${profile.office}` },
      siteName: profile.name,
      locale: "en_US",
    }),
    ...structuredData(profile).map(jsonLd),
  ];
};

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/icon.png", sizes: "512x512", type: "image/png" },
  { rel: "icon", href: "/icon.svg", sizes: "any", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/apple-icon.png", sizes: "180x180", type: "image/png" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData<typeof loader>("root");
  const content = data?.content;
  return (
    <html lang="en" data-family="forest" data-cap-site="julieedwards">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#15532E" media="(prefers-color-scheme: dark)" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {content ? (
          <>
            <Header name={content.profile.name} links={content.site.nav} />
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
  if (isRouteErrorResponse(error) && error.status === 404 && notFound) {
    return (
      <section className="not-found">
        <meta name="robots" content="noindex" />
        <div className="wrap not-found-inner">
          <p className="cap-label not-found-code">404</p>
          <h1>{notFound.title}</h1>
          <p className="not-found-body">{notFound.body}</p>
          <a href="/" className="cap-btn" data-variant="primary" data-size="lg">
            {notFound.cta}
          </a>
        </div>
      </section>
    );
  }
  return (
    <section className="not-found">
      <meta name="robots" content="noindex" />
      <div className="wrap not-found-inner">
        <h1>Something went wrong.</h1>
      </div>
    </section>
  );
}
