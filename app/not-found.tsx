import Link from "next/link";

export default function NotFound() {
  return (
    <section className="not-found">
      <div className="wrap not-found-inner">
        <p className="not-found-code">404</p>
        <h1>Page not found.</h1>
        <p className="not-found-body">
          That link did not go anywhere on this site. Head back to the home page.
        </p>
        <Link href="/" className="not-found-cta">Back to home</Link>
      </div>
    </section>
  );
}
