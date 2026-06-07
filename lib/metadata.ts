import type { Metadata } from "next";

const SITE = {
  name: "Julie Edwards",
  url: "https://julieedwards.info",
  description:
    "Julie Edwards, Bluff Dale ISD School Board Trustee. A parent committed to academic excellence, integrity, and student success.",
};

export function buildMetadata(overrides: Partial<Metadata> = {}): Metadata {
  const title = "Julie Edwards | Bluff Dale ISD School Board Trustee";
  return {
    metadataBase: new URL(SITE.url),
    title: { default: title, template: `%s | ${SITE.name}` },
    description: SITE.description,
    openGraph: { title, description: SITE.description, url: SITE.url, siteName: SITE.name, type: "website" },
    ...overrides,
  };
}
