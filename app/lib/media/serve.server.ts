// /media/<key>: a library file, the original or one size for `?w=` (site-runtime ./image, from the page's one
// defineImages in images.ts). Only uploads/ is served; the earlier bytes under history/ never are.
import { originalKey } from "@dustinedwards/site-runtime/image";
import { images, UPLOAD_PREFIX } from "./images";

const KEY = /^uploads\/[A-Za-z0-9][A-Za-z0-9._-]*(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/;

/**
 * The page's addresses carry a hash of the bytes (`v`, libraryPhoto), so one with it is cached for good. Without it
 * (an address a person copied), a day, so a replaced file shows through within one.
 */
const IMMUTABLE = "public, max-age=31536000, immutable";
const PLAIN = "public, max-age=86400";

export async function serveMedia(request: Request, env: Env, cache?: Cache): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
  const url = new URL(request.url);
  // A size URL is suffixed (photo.jpg.webp?w=640); the stored key is the original's.
  const key = originalKey(url.pathname.slice("/media/".length), request);
  if (!key.startsWith(UPLOAD_PREFIX) || !KEY.test(key)) return new Response("Not found", { status: 404 });
  const read = () => env.MEDIA.get(key);
  return images.respond(request, {
    object: await read(),
    images: env.IMAGES,
    cache,
    cacheControl: url.searchParams.has("v") ? IMMUTABLE : PLAIN,
    reread: read,
  });
}
