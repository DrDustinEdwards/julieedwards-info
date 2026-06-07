import { profile } from "@/content/site";

const resourceLinks = [
  { label: "Bluff Dale ISD", href: "https://www.bdisd.net/" },
  { label: "Erath County Elections", href: "https://www.co.erath.tx.us/186/Current-Elections" },
  { label: "Texas Association of School Boards", href: "https://www.tasb.org/home.aspx" },
];

export default function Footer() {
  return (
    <footer>
      <div className="wrap footer-inner">
        <div className="footer-note">
          &copy; {new Date().getFullYear()} {profile.name}
        </div>
        <div className="footer-links">
          {resourceLinks.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
