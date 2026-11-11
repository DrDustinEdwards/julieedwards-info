// The header and footer every page shares. Server-rendered markup only: the header is Capsomer's
// SiteHeader without hydration, and app/site.ts wires its sheet and theme button.
import { SiteHeader } from "capsomer/react/site-header";
import { useState } from "react";
import type { Content } from "~/lib/source";
import { THEME_KEY } from "~/lib/theme";
import { AppleMark } from "./AppleMark";

/** Capsomer's trailing arrow: the julieedwards site setting hides it until the pointer or focus arrives. */
export const Arrow = () => (
  <svg
    className="cap-arrow"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export function Header({
  name,
  links: nav,
  base = "",
}: {
  name: string;
  links: Content["site"]["nav"];
  base?: string;
}) {
  // `base` is "/" off the home page, so the section anchors and the wordmark lead back to it.
  const sections = nav.map((l) => ({
    id: l.href,
    label: l.label,
    href: l.href.startsWith("#") ? base + l.href : l.href,
  }));
  // The page sends no React to the browser (hydrate={false}); /site.js wires the header (app/site.ts).
  return (
    <SiteHeader
      hydrate={false}
      logo={{
        href: `${base}#top`,
        label: name,
        className: "je-wordmark",
        mark: <AppleMark className="je-wordmark-mark" />,
      }}
      links="right"
      translucent
      sections={sections}
      navLabel="Site"
      themePrefKey={THEME_KEY}
      sheetTitle={name}
      sheetLinksLabel={null}
      sheetIcons="auto"
      skipTo="#main"
    />
  );
}

export function Footer({ name, site }: { name: string; site: Content["site"] }) {
  // Read once, in a lazy initializer, so the render itself stays pure (react/purity).
  const [year] = useState(() => new Date().getFullYear());
  return (
    <footer className="je-footer">
      <div className="wrap footer-inner">
        <p className="footer-note">
          &copy; {year} {name}
          {site.analyticsNote && (
            <>
              <br />
              {site.analyticsNote}
            </>
          )}
        </p>
        <div className="footer-links">
          {site.resourceLinks.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
              <Arrow />
            </a>
          ))}
          <a href="/accessibility">Accessibility</a>
        </div>
      </div>
    </footer>
  );
}
