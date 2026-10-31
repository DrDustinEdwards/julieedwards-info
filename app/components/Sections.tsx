// The home page's sections, in order. Every word comes from D1 (app/lib/source.ts).
import { pictureProps } from "@dustinedwards/site-runtime/image";
import { objectPosition, type LibraryPhoto, type Photos } from "~/lib/media/images";
import type { Content } from "~/lib/source";
import { AppleMark } from "./AppleMark";
import { Arrow } from "./Chrome";

/** The whole home page, as the route and Carrel's preview both draw it. */
export function HomeSections({ content, photos }: { content: Content; photos: Photos }) {
  const { profile, priorities, about, experience, contact } = content;
  return (
    <>
      <Hero profile={profile} cta={contact.heading} />
      <Priorities section={priorities} />
      <About section={about} photo={profile.images.about} library={photos.about} name={profile.name} />
      <Experience section={experience} />
      <Contact section={contact} profile={profile} />
    </>
  );
}

export function Hero({ profile, cta }: { profile: Content["profile"]; cta: string }) {
  return (
    <header className="hero" id="top">
      <div className="hero-inner">
        <h1>{profile.name}</h1>
        <div className="office">{profile.office}</div>
        <a className="cap-btn hero-cta" data-size="lg" href="#contact">
          {cta}
          <Arrow />
        </a>
      </div>
      <AppleMark className="hero-mark" />
    </header>
  );
}

const icons = [
  // Education
  <svg key="e" className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5" />
  </svg>,
  // Integrity
  <svg key="i" className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="m9 15 2 2 4-4" />
  </svg>,
  // Student Success
  <svg key="s" className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
  </svg>,
];

// The campaign flyer button (profile.images.flyer) is hidden while she serves; restore it for a re-election
// from the Next.js site's components/WhyRunning.tsx in git history.
export function Priorities({ section }: { section: Content["priorities"] }) {
  return (
    <section className="why" id="why">
      <div className="wrap">
        <div className="sec-head reveal">
          <h2>{section.heading}</h2>
        </div>
        <div className="pillars">
          {section.items.map((p, i) => (
            <div className="pillar reveal" key={p.title}>
              {icons[i % icons.length]}
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * A media library picture: AVIF and WebP at the sizes its use offers, cropped by its box around its focal point. It is
 * below the hero, so it loads lazily and is never the page's priority image.
 */
function LibraryPicture({ photo }: { photo: LibraryPhoto }) {
  const { sources, img } = pictureProps(photo, { alt: photo.alt });
  return (
    <picture>
      {sources.map((s) => (
        <source key={`${s.type}${s.media ?? ""}`} {...s} />
      ))}
      <img {...img} style={photo.focus ? { objectPosition: objectPosition(photo.focus) } : undefined} />
    </picture>
  );
}

export function About({ section, photo, library, name }: { section: Content["about"]; photo: string; library?: LibraryPhoto; name: string }) {
  return (
    <section className="about" id="about">
      <div className="about-grid">
        <div className={`about-img reveal${photo ? "" : " placeholder"}`}>
          {library ? <LibraryPicture photo={library} /> : photo ? <img src={photo} alt={name} loading="lazy" decoding="async" /> : <span className="ph">Photo</span>}
        </div>
        <div className="about-panel reveal">
          <h2>
            {section.heading}
            <span className="rule" />
          </h2>
          {section.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Experience({ section }: { section: Content["experience"] }) {
  return (
    <section id="experience">
      <div className="wrap">
        <div className="sec-head reveal">
          <h2>{section.heading}</h2>
        </div>
        <div className="exp-list">
          {section.items.map((e) => (
            <div className="exp-item reveal" key={e.title}>
              <h3>
                {e.title}
                <span className="rule" />
              </h3>
              <p>{e.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const fbIcon = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.5V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" />
  </svg>
);

export function Contact({ section, profile }: { section: Content["contact"]; profile: Content["profile"] }) {
  return (
    <section className="contact" id="contact">
      <div className="wrap">
        <div className="contact-grid">
          <h2 style={{ gridColumn: 1, gridRow: 1 }}>{section.heading}</h2>
          <a className="contact-link" style={{ gridColumn: 1, gridRow: 2 }} href={`mailto:${profile.email}`}>
            {profile.email}
            <Arrow />
          </a>
          <a
            className="contact-link"
            style={{ gridColumn: 1, gridRow: 3 }}
            href={profile.facebook}
          >
            {fbIcon}
            Facebook
            <Arrow />
          </a>
          <a
            className="contact-link contact-address"
            style={{ gridColumn: 1, gridRow: 4 }}
            href={profile.address.mapsUrl}
          >
            <span>{profile.address.name}</span>
            <span>{profile.address.line1}</span>
            <span>{profile.address.line2}</span>
          </a>

          <div className="contact-divider" aria-hidden="true" />

          <h2 style={{ gridColumn: "3 / span 2", gridRow: 1 }}>{section.boardHeading}</h2>
          {section.boardLinks.map((l, i) => (
            <a
              key={l.href}
              className="contact-link"
              style={{ gridColumn: 3 + (i % 2), gridRow: 2 + Math.floor(i / 2) }}
              href={l.href}
            >
              {l.label}
              <Arrow />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
