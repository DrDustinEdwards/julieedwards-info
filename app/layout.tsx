import "./globals.css";
import Nav from "@/components/Nav";
import ScrollReveal from "@/components/ScrollReveal";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata();

const modeScript = `(function(){try{var m=localStorage.getItem('mode');if(!m){m=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-mode',m);}catch(e){document.documentElement.setAttribute('data-mode','light');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600&family=Open+Sans:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Cookie&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: modeScript }} />
      </head>
      <body>
        <Nav />
        {children}
        <ScrollReveal />
      </body>
    </html>
  );
}
