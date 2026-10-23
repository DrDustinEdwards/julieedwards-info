// The page's schema.org JSON-LD, as the Next.js layout wrote it. The details of her husband are
// structured data about him, not her copy, so they live here rather than in D1.
import type { Content } from "./source";

export function structuredData(profile: Content["profile"], siteUrl: string) {
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: "School Board Trustee",
    url: siteUrl,
    image: profile.images.about,
    worksFor: { "@type": "EducationalOrganization", name: profile.district.name, url: profile.district.url },
    homeLocation: { "@type": "Place", name: "Bluff Dale, Texas" },
    sameAs: [profile.facebook],
    spouse: {
      "@type": "Person",
      name: "Dustin Edwards",
      honorificPrefix: "Dr.",
      jobTitle: "Professor and Department Head of Biological Sciences",
      url: "https://dustinedwards.info",
      worksFor: { "@type": "CollegeOrUniversity", name: "Tarleton State University", url: "https://www.tarleton.edu" },
      sameAs: [
        "https://faculty.tarleton.edu/dcedwards/",
        "https://orcid.org/0000-0001-6409-8041",
        "https://scholar.google.com/citations?user=lfzCCXwAAAAJ&hl=en",
        "https://seaphages.org/faculty/318/",
        "https://pubmed.ncbi.nlm.nih.gov/?term=Edwards+D&cauthor_id=40724203",
      ],
    },
  };
  const website = { "@context": "https://schema.org", "@type": "WebSite", name: profile.name, url: siteUrl };
  // "<" escaped so no value can close the script element.
  return [person, website].map((o) => JSON.stringify(o).replace(/</g, "\\u003c"));
}
