import Hero from "@/components/Hero";
import SlantDivider from "@/components/SlantDivider";
import WhyRunning from "@/components/WhyRunning";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Hero />
      <SlantDivider topBg="--section-brand" bottomBg="--bg-sunken" />
      <WhyRunning />
      <About />
      <Experience />
      <Contact />
      <Footer />
    </>
  );
}
