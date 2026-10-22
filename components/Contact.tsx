import { profile, boardLinks, headings } from "@/content/site";
import ArrowLink from "./ArrowLink";

const fbIcon = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.5V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" />
  </svg>
);

export default function Contact() {
  return (
    <section className="contact" id="contact">
      <div className="wrap">
        <div className="contact-grid">
          <h2 style={{ gridColumn: 1, gridRow: 1 }}>{headings.contact}</h2>
          <ArrowLink
            className="contact-link"
            style={{ gridColumn: 1, gridRow: 2 }}
            href={`mailto:${profile.email}`}
          >
            {profile.email}
          </ArrowLink>
          <ArrowLink
            className="contact-link"
            style={{ gridColumn: 1, gridRow: 3 }}
            href={profile.facebook}
            target="_blank"
            rel="noopener noreferrer"
          >
            {fbIcon}
            Facebook
          </ArrowLink>
          <a
            className="contact-link contact-address"
            style={{ gridColumn: 1, gridRow: 4 }}
            href={profile.address.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{profile.address.name}</span>
            <span>{profile.address.line1}</span>
            <span>{profile.address.line2}</span>
          </a>

          <div className="contact-divider" aria-hidden="true" />

          <h2 style={{ gridColumn: "3 / span 2", gridRow: 1 }}>{headings.board}</h2>
          {boardLinks.map((l, i) => (
            <ArrowLink
              key={l.href}
              className="contact-link"
              style={{ gridColumn: 3 + (i % 2), gridRow: 2 + Math.floor(i / 2) }}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {l.label}
            </ArrowLink>
          ))}
        </div>
      </div>
    </section>
  );
}
