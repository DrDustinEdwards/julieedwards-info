import "./globals.css";
import type { Viewport } from "next";
import { Montserrat, Open_Sans, Cookie } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { buildMetadata } from "@/lib/metadata";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-montserrat",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-open-sans",
});

const cookie = Cookie({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-cookie",
});

export const metadata = buildMetadata();

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#15532E" },
  ],
};

const modeScript = `(function(){try{var m=localStorage.getItem('mode');if(!m){m=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-mode',m);}catch(e){document.documentElement.setAttribute('data-mode','light');}})();`;

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Julie Edwards",
  jobTitle: "School Board Trustee",
  url: "https://julieedwards.info",
  image: "https://content.julieedwards.info/julie-edwards-bluff-dale-profile.jpg",
  worksFor: {
    "@type": "EducationalOrganization",
    name: "Bluff Dale ISD",
    url: "https://www.bdisd.net",
  },
  homeLocation: {
    "@type": "Place",
    name: "Bluff Dale, Texas",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Julie Edwards",
  url: "https://julieedwards.info",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${montserrat.variable} ${openSans.variable} ${cookie.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: modeScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
        <ScrollReveal />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
