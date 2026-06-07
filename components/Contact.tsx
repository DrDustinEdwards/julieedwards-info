import { profile, images } from "@/content/site";

export default function Contact() {
  const portraitStyle = images.portrait
    ? ({ ["--portrait-img" as string]: `url(${images.portrait})` } as React.CSSProperties)
    : undefined;
  return (
    <section className="contact" id="contact">
      <div className="wrap">
        <div className="contact-grid">
          <div className="contact-info reveal">
            <div className="eyebrow">Contact</div>
            <h2>Get in touch.</h2>
            <a className="email" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            <div className="contact-socials">
              <a href={profile.facebook} target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.5V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" />
                </svg>
                Facebook
              </a>
            </div>
          </div>
          <div className="portrait reveal" style={portraitStyle}>
            {!images.portrait && <span className="ph">Photo</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
