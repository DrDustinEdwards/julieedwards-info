import { analyticsNote, profile, resourceLinks } from "@/content/site";
import ArrowLink from "./ArrowLink";

export default function Footer() {
  return (
    <footer>
      <div className="wrap footer-inner">
        <div className="footer-note">
          &copy; {new Date().getFullYear()} {profile.name}
          <br />
          {analyticsNote}
        </div>
        <div className="footer-links">
          {resourceLinks.map((l) => (
            <ArrowLink key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
              {l.label}
            </ArrowLink>
          ))}
        </div>
      </div>
    </footer>
  );
}
