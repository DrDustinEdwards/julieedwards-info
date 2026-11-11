// The header and footer every page shares. Server-rendered markup only: the header is Capsomer's site
// header written by hand (site-header.md, "Markup"), and app/site.ts wires its sheet and theme button.
import { Icon } from "capsomer/react/icons";
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
  const links = nav.map((l) => (l.href.startsWith("#") ? { ...l, href: base + l.href } : l));
  return (
    <header
      className="cap-site-header"
      data-cap="site-header"
      data-links="right"
      data-translucent=""
    >
      <a className="cap-site-header-skip" href="#main">
        Skip to content
      </a>
      <a className="cap-site-header-logo je-wordmark" href={`${base}#top`}>
        <AppleMark className="je-wordmark-mark" />
        {name}
      </a>
      <nav className="cap-site-header-sections" aria-label="Site">
        <ul>
          {links.map((l) => (
            <li key={l.href}>
              <a className="cap-site-header-link" href={l.href}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="cap-site-header-tools">
        <button
          type="button"
          className="cap-theme-button cap-site-header-icon cap-site-header-theme"
          data-cap="theme-switch"
          data-variant="button"
          data-cap-pref={THEME_KEY}
          aria-label="Switch to dark theme"
        >
          <span data-show="light">
            <Icon name="moon" className="cap-theme-icon" />
          </span>
          <span data-show="dark">
            <Icon name="sun" className="cap-theme-icon" />
          </span>
          <span
            className="cap-theme-tip cap-popover"
            data-variant="tooltip"
            data-side="bottom"
            data-offset="6"
            popover="manual"
            role="tooltip"
            aria-hidden="true"
          >
            <span className="cap-theme-tip-text">Switch to dark theme</span>
          </span>
        </button>
        <button
          type="button"
          className="cap-site-header-icon cap-site-header-menu"
          aria-label="Menu"
          aria-haspopup="dialog"
          aria-expanded="false"
          aria-controls="sheet"
        >
          <Icon name="menu" />
        </button>
      </div>
      <dialog
        className="cap-dialog cap-site-header-sheet"
        data-cap="dialog"
        data-placement="bottom"
        data-size="md"
        id="sheet"
        aria-labelledby="sheet-title"
      >
        <div className="cap-dialog-header">
          <h2
            id="sheet-title"
            className="cap-dialog-title cap-site-header-sheet-title"
            tabIndex={-1}
          >
            {name}
          </h2>
        </div>
        <div className="cap-dialog-body">
          <nav aria-labelledby="sheet-title">
            <ul className="cap-site-header-sheet-list">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>
                    <span className="cap-site-header-sheet-name">{l.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <button
          type="button"
          className="cap-btn cap-dialog-close"
          data-variant="quiet"
          data-icon-only=""
          data-cap-part="close"
          aria-label="Close"
        >
          <Icon name="close" />
        </button>
      </dialog>
    </header>
  );
}

export function Footer({ name, site }: { name: string; site: Content["site"] }) {
  // Read once, in a lazy initializer, so the render itself stays pure (react/purity).
  const [year] = useState(() => new Date().getFullYear());
  return (
    <footer className="je-footer">
      <div className="cap-page cap-spread footer-inner" data-align="center" data-gap="6">
        <p className="footer-note">
          &copy; {year} {name}
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
