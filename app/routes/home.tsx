import { useRouteLoaderData } from "react-router";
import { HomeSections } from "~/components/Sections";
import { publicHtmlHeaders } from "~/lib/edge-cache.server";
import type { loader } from "~/root";

// Stored at the edge until Carrel's next write purges it (workers/app.ts, app/lib/edge-cache.server.ts).
export const headers = () => publicHtmlHeaders();

export default function Home() {
  const data = useRouteLoaderData<typeof loader>("root");
  return data ? <HomeSections content={data.content} photos={data.photos} /> : null;
}
