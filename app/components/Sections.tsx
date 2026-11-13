// The home page's sections, in order. Every word comes from D1 (app/lib/source.ts).
import { Icon, iconFileCheck, iconGraduation, iconIdea, markFacebook } from "capsomer/react/icons";
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
    <header className="hero" id="top">
      <div className="cap-page hero-inner">
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

// The priorities' pictures, in order: education, integrity, student success.
const icons = [iconGraduation, iconFileCheck, iconIdea];

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
              <div>
                <Icon d={icons[i % icons.length]} className="ic" />
              </div>
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
          <div className="cap-stack" data-gap="5">
            <h2>{section.heading}</h2>
            <a className="contact-link" href={`mailto:${profile.email}`}>
              {profile.email}
              <Arrow />
            </a>
            <a className="contact-link" href={profile.facebook}>
              <Icon {...markFacebook} />
              Facebook
              <Arrow />
            </a>
            <a className="contact-link contact-address" href={profile.address.mapsUrl}>
              <span>{profile.address.name}</span>
              <span>{profile.address.line1}</span>
              <span>{profile.address.line2}</span>
            </a>
          </div>

          <div className="contact-divider" aria-hidden="true" />

          <div className="cap-stack" data-gap="5">
            <h2>{section.boardHeading}</h2>
            <div className="contact-board">
              {section.boardLinks.map((l) => (
                <a key={l.href} className="contact-link" href={l.href}>
                  {l.label}
                  <Arrow />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
