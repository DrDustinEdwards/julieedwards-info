// The header and footer every page shares. Server-rendered markup only: the header is Capsomer's
// SiteHeader without hydration, and app/site.ts wires its sheet and theme button.
import { Icon } from "capsomer/react/icons";
import { SiteHeader } from "capsomer/react/site-header";
import { copyright } from "capsomer/behavior/family-footer";
import { useState } from "react";
import type { Content } from "~/lib/source";
import { THEME_KEY } from "~/lib/theme";
import { AppleMark } from "./AppleMark";

/** Capsomer's trailing arrow: the julieedwards site setting hides it until the pointer or focus arrives. */
export const Arrow = () => <Icon name="chevron-right" className="cap-arrow" />;

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
  const [line] = useState(() => copyright(name));
  return (
    <footer className="je-footer">
      <div className="cap-page cap-spread footer-inner" data-align="center" data-gap="6">
        <p className="footer-note">
          {line}
          {site.analyticsNote && (
            <>
              <br />
              {site.analyticsNote}
            </>
          )}
        </p>
        <div className="cap-cluster footer-links" data-justify="end" data-gap="6">
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
