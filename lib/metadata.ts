import type { Metadata } from "next";

const SITE = {
  name: "Julie Edwards",
  url: "https://julieedwards.info",
  description:
    "Julie Edwards for Bluff Dale ISD School Board. A parent committed to academic excellence, integrity, and student success.",
};

export function buildMetadata(overrides: Partial<Metadata> = {}): Metadata {
  const title = "Julie Edwards for Bluff Dale ISD School Board";
  return {
    metadataBase: new URL(SITE.url),
    title: { default: title, template: `%s | ${SITE.name}` },
    description: SITE.description,
    openGraph: { title, description: SITE.description, url: SITE.url, siteName: SITE.name, type: "website" },
    ...overrides,
  };
}
