import type { Metadata } from "next";

const SITE_URL = "https://julieedwards.info";
const SITE_NAME = "Julie Edwards";
const TITLE = "Julie Edwards | Bluff Dale ISD School Board Trustee";
const DESCRIPTION =
  "Julie Edwards is a trustee on the Bluff Dale ISD School Board, focused on academic excellence, fiscal integrity, and student success in Bluff Dale, Texas.";

export function buildMetadata(overrides: Partial<Metadata> = {}): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: TITLE, template: `%s | ${SITE_NAME}` },
    description: DESCRIPTION,
    alternates: { canonical: "/" },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: SITE_URL,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
    },
    ...overrides,
  };
}
