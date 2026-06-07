import { profile } from "@/content/site";

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-note">
          Political advertising paid for by the {profile.name} campaign. &copy; {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
}
