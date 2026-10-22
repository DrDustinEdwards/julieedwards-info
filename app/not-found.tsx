import Link from "next/link";
import { notFound } from "@/content/site";

export default function NotFound() {
  return (
    <section className="not-found">
      <div className="wrap not-found-inner">
        <p className="not-found-code">404</p>
        <h1>{notFound.title}</h1>
        <p className="not-found-body">
          {notFound.body}
        </p>
        <Link href="/" className="not-found-cta">{notFound.cta}</Link>
      </div>
    </section>
  );
}
