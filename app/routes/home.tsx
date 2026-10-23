import { useRouteLoaderData } from "react-router";
import { HomeSections } from "~/components/Sections";
import type { loader } from "~/root";

export default function Home() {
  const data = useRouteLoaderData<typeof loader>("root");
  return data ? <HomeSections content={data.content} /> : null;
}
