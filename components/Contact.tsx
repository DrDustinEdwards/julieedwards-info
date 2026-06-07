import { profile, boardLinks } from "@/content/site";

export default function Contact() {
  return (
    <section className="contact" id="contact">
      <div className="wrap">
        <div className="contact-grid">
          <div className="contact-col reveal">
            <h3>Contact</h3>
            <a className="contact-link" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            <a
              className="contact-link"
              href={profile.facebook}
              target="_blank"
              rel="noreferrer"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.5V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" />
              </svg>
              Facebook
            </a>
            <a
              className="contact-link contact-address"
              href={profile.address.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{profile.address.name}</span>
              <span>{profile.address.line1}</span>
              <span>{profile.address.line2}</span>
            </a>
          </div>
          <div className="contact-col reveal">
            <h3>School Board</h3>
            <ul>
              {boardLinks.map((l) => (
                <li key={l.href}>
                  <a className="contact-link" href={l.href} target="_blank" rel="noopener noreferrer">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
