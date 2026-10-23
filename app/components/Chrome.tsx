// The nav and footer every page shares. Server-rendered markup only: public/site.js wires the menu,
// the theme toggle and the scrolled border.
import type { AnchorHTMLAttributes, ReactNode } from "react";
import type { Content } from "~/lib/source";
import { AppleMark } from "./AppleMark";

const chevron = <path d="M9 6l6 6-6 6" />;

export function ArrowLink({ children, className, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
  return (
    <a className={["arrow-link", className].filter(Boolean).join(" ")} {...rest}>
      {children}
      <svg
        className="arrow-chev"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        {chevron}
      </svg>
    </a>
  );
}

export function Nav({ name, links }: { name: string; links: Content["site"]["nav"] }) {
  const icon = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", "aria-hidden": true, focusable: false } as const;
  return (
    <nav aria-label="Primary">
      <div className="nav-inner">
        <a href="#top" className="wordmark">
          <AppleMark className="wordmark-logo" label={name} />
          {name}
        </a>
        <div className="nav-controls">
          <div className="nav-links">
            {links.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>
          <button className="theme-toggle" type="button" aria-label="Toggle dark mode">
            <svg className="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            <svg className="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          </button>
          <button
            type="button"
            className="nav-menu-btn"
            aria-label="Open menu"
            aria-expanded="false"
            aria-controls="mobile-menu"
          >
            <svg className="icon-open" {...icon}>
              <path d="M3 7h18M3 12h18M3 17h18" />
            </svg>
            <svg className="icon-close" {...icon}>
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>
      </div>
      <div id="mobile-menu" className="mobile-menu" data-open="false" aria-hidden="true">
        {links.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

export function Footer({ name, site }: { name: string; site: Content["site"] }) {
  return (
    <footer>
      <div className="wrap footer-inner">
        <div className="footer-note">
          &copy; {new Date().getFullYear()} {name}
          <br />
          {site.analyticsNote}
        </div>
        <div className="footer-links">
          {site.resourceLinks.map((l) => (
            <ArrowLink key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
              {l.label}
            </ArrowLink>
          ))}
        </div>
      </div>
    </footer>
  );
}
