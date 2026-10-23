import { isRouteErrorResponse, Links, Meta, Outlet, useRouteError, useRouteLoaderData } from "react-router";
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
  const title = `${profile.name} | ${profile.office}`;
  const alt = `${profile.name}, ${profile.office}`;
  const image = `${SITE_URL}/opengraph-image.png`;
  return [
    { title },
    { name: "description", content: profile.description },
    { tagName: "link", rel: "canonical", href: SITE_URL },
    { property: "og:title", content: title },
    { property: "og:description", content: profile.description },
    { property: "og:url", content: SITE_URL },
    { property: "og:site_name", content: profile.name },
    { property: "og:locale", content: "en_US" },
    { property: "og:image", content: image },
    { property: "og:image:type", content: "image/png" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: alt },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: profile.description },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: alt },
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
            {structuredData(content.profile, SITE_URL).map((json, i) => (
              <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
            ))}
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
