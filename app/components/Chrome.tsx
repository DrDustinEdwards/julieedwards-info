// The header and footer every page shares. Server-rendered markup only: the header is Capsomer's site
// header written by hand (site-header.md, "Markup"), and app/site.ts wires its sheet and theme button.
import type { Content } from "~/lib/source";
import { THEME_KEY } from "~/lib/theme";
import { AppleMark } from "./AppleMark";

/** Capsomer's trailing arrow: the julieedwards site setting hides it until the pointer or focus arrives. */
export const Arrow = () => (
  <svg className="cap-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export function Header({ name, links: nav, base = "" }: { name: string; links: Content["site"]["nav"]; base?: string }) {
  // `base` is "/" off the home page, so the section anchors and the wordmark lead back to it.
  const links = nav.map((l) => (l.href.startsWith("#") ? { ...l, href: base + l.href } : l));
  return (
    <header className="cap-site-header" data-cap="site-header" data-links="right" data-translucent="">
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
          <svg className="cap-theme-icon" data-show="light" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
          </svg>
          <svg className="cap-theme-icon" data-show="dark" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
          <span className="cap-theme-tip cap-popover" data-variant="tooltip" data-side="bottom" data-offset="6" popover="manual" role="tooltip" aria-hidden="true">
            <span className="cap-theme-tip-text">Switch to dark theme</span>
          </span>
        </button>
        <button type="button" className="cap-site-header-icon cap-site-header-menu" aria-label="Menu" aria-haspopup="dialog" aria-expanded="false" aria-controls="sheet">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>
      <dialog className="cap-dialog cap-site-header-sheet" data-cap="dialog" data-placement="bottom" data-size="md" id="sheet" aria-labelledby="sheet-title">
        <div className="cap-dialog-header">
          <h2 id="sheet-title" className="cap-dialog-title cap-site-header-sheet-title" tabIndex={-1}>
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
        <button type="button" className="cap-btn cap-dialog-close" data-variant="quiet" data-icon-only="" data-cap-part="close" aria-label="Close">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </dialog>
    </header>
  );
}

export function Footer({ name, site }: { name: string; site: Content["site"] }) {
  return (
    <footer className="je-footer">
      <div className="wrap footer-inner">
        <p className="footer-note">
          &copy; {new Date().getFullYear()} {name}
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
