// The page's schema.org JSON-LD, as the Next.js layout wrote it, built with Prelum's schema helpers. The details of
// her husband are structured data about him, not her copy, so they live here rather than in D1.
import { thing, website } from "@drdustinedwards/site-helpers/schema";
import { SITE_URL } from "./site";
import type { Content } from "./source";

export function structuredData(profile: Content["profile"]) {
  const person = thing("Person", {
    name: profile.name,
    jobTitle: "School Board Trustee",
    url: SITE_URL,
    // A library photo is named by its path; the graph names it in full.
    image: profile.images.about ? new URL(profile.images.about, SITE_URL).href : undefined,
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
  });
  return [person, website({ origin: SITE_URL, name: profile.name })];
}
