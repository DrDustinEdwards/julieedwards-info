import { profile } from "@/content/site";

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        {/* Political advertising paid for by the {profile.name} campaign. &copy; {new Date().getFullYear()} */}
        <div className="footer-note">
          &copy; {new Date().getFullYear()} {profile.name}
        </div>
      </div>
    </footer>
  );
}
