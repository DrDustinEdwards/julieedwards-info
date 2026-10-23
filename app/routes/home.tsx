import { useRouteLoaderData } from "react-router";
import { About, Contact, Experience, Hero, Priorities } from "~/components/Sections";
import type { loader } from "~/root";

export default function Home() {
  const data = useRouteLoaderData<typeof loader>("root");
  if (!data) return null;
  const { profile, priorities, about, experience, contact } = data.content;
  return (
    <>
      <Hero profile={profile} cta={contact.heading} />
      <Priorities section={priorities} />
      <About section={about} photo={profile.images.about} name={profile.name} />
      <Experience section={experience} />
      <Contact section={contact} profile={profile} />
    </>
  );
}
