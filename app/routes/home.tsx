import { useRouteLoaderData } from "react-router";
import { HomeSections } from "~/components/Sections";
import { publicPageHeaders } from "@dustinedwards/site-runtime/edge-cache";
import type { loader } from "~/root";

// Stored at the edge until Carrel's next write purges it (workers/app.ts, site-runtime ./edge-cache).
export const headers = () => publicPageHeaders();

export default function Home() {
  const data = useRouteLoaderData<typeof loader>("root");
  return data ? <HomeSections content={data.content} photos={data.photos} /> : null;
}
