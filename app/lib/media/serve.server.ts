// /media/<key>: a library file, the original or one size for `?w=` (site-runtime ./image's serve, from the page's one
// defineImages in images.ts). Only uploads/ is served; the earlier bytes under history/ never are.
import { images, UPLOAD_PREFIX } from "./images";

/**
 * The page's addresses carry a hash of the bytes (`v`, libraryPhoto), so one with it is cached for good (serve's
 * default policy). Without it (an address a person copied), a day, so a replaced file shows through within one.
 */
export function serveMedia(request: Request, env: Env, cache?: Cache): Promise<Response> {
  return images.serve(request, {
    read: (key) => env.MEDIA.get(key),
    images: env.IMAGES,
    cache,
    within: UPLOAD_PREFIX,
  });
}
