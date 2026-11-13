// The home page's sections, in order. Every word comes from D1 (app/lib/source.ts).
import { Hero as HeroSection } from "capsomer/react/hero";
import { Icon, markFacebook } from "capsomer/react/icons";
import { ButtonLink } from "capsomer/react/link";
import { Picture } from "capsomer/react/picture";
import { pictureProps } from "@dustinedwards/site-runtime/image";
import { type LibraryPhoto, type Photos } from "~/lib/media/images";
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
      <About
        section={about}
        photo={profile.images.about}
        library={photos.about}
        name={profile.name}
      />
      <Experience section={experience} />
      <Contact section={contact} profile={profile} />
    </>
  );
}

export function Hero({ profile, cta }: { profile: Content["profile"]; cta: string }) {
  return (
    <HeroSection
      id="top"
      className="hero"
      title={profile.name}
      lead={profile.office}
      actions={
        <ButtonLink className="hero-cta" size="lg" href="#contact">
          {cta}
          <Arrow />
        </ButtonLink>
      }
      backdrop={<AppleMark className="hero-mark" />}
    />
  );
}

const icons = [
  // Education
  <svg
    key="e"
    className="ic"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    aria-hidden="true"
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5" />
  </svg>,
  // Integrity
  <svg
    key="i"
    className="ic"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="m9 15 2 2 4-4" />
  </svg>,
  // Student Success
  <svg
    key="s"
    className="ic"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    aria-hidden="true"
  >
    <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
  </svg>,
];

// The campaign flyer button (profile.images.flyer) is hidden while she serves; restore it for a re-election
// from the Next.js site's components/WhyRunning.tsx in git history.
export function Priorities({ section }: { section: Content["priorities"] }) {
  return (
    <section className="why" id="why">
      <div className="cap-page">
        <div className="sec-head cap-reveal">
          <h2>{section.heading}</h2>
        </div>
        <div className="cap-grid" data-gap="6">
          {section.items.map((p, i) => (
            <article className="cap-card cap-reveal" key={p.title}>
              <div>{icons[i % icons.length]}</div>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </article>
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
  const picture = pictureProps(photo, { alt: photo.alt, focus: photo.focus });
  return <Picture picture={picture} />;
}

export function About({
  section,
  photo,
  library,
  name,
}: {
  section: Content["about"];
  photo: string;
  library?: LibraryPhoto;
  name: string;
}) {
  return (
    <section className="about" id="about">
      <div className="about-grid">
        <div className={`about-img cap-reveal${photo ? "" : " placeholder"}`}>
          {library ? (
            <LibraryPicture photo={library} />
          ) : photo ? (
            <img src={photo} alt={name} loading="lazy" decoding="async" />
          ) : (
            <span className="ph">Photo</span>
          )}
        </div>
        <div className="about-panel cap-reveal">
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
      <div className="cap-page">
        <div className="sec-head cap-reveal">
          <h2>{section.heading}</h2>
        </div>
        <div className="exp-list">
          {section.items.map((e) => (
            <div className="exp-item cap-reveal" key={e.title}>
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

export function Contact({
  section,
  profile,
}: {
  section: Content["contact"];
  profile: Content["profile"];
}) {
  return (
    <section className="contact" id="contact">
      <div className="cap-page">
        <div className="contact-grid">
          <h2 style={{ gridColumn: 1, gridRow: 1 }}>{section.heading}</h2>
          <a
            className="contact-link"
            style={{ gridColumn: 1, gridRow: 2 }}
            href={`mailto:${profile.email}`}
          >
            {profile.email}
            <Arrow />
          </a>
          <a className="contact-link" style={{ gridColumn: 1, gridRow: 3 }} href={profile.facebook}>
            <Icon {...markFacebook} />
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
