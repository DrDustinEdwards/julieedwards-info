// Carrel's media group: site-api's shared media library (mediaLibrary) over the standard `media` tables
// (drizzle/0002_media.sql, d1MediaStore) and the MEDIA bucket, with this site's rules.
//
// A section uses a file by naming its address (/media/<key>) in its published text or waiting draft (usesByKey); a
// delete also removes the row only while no section names it, in the statement itself (IN_USE). Earlier bytes are
// kept under history/ in MEDIA (the default), which /media never serves (serve.server.ts serves only uploads/). The
// page sizes a picture by its row, read on each request, so a turn keeps the id and nothing is re-rendered.
import {
  pictureLimits,
  PICTURE_RESIZE,
  d1MediaStore,
  datedKey,
  mediaLibrary,
  type MediaAdapter,
} from "@dustinedwards/site-api";
import { mediaUrl, UPLOAD_PREFIX } from "~/lib/media/images";
import { usesByKey } from "~/lib/media/store.server";
import { suggestFor } from "~/lib/media/suggest.server";

/** usesByKey's rule in SQL: a section's published text or draft names the file (each `?` is its key). */
const IN_USE =
  "EXISTS (SELECT 1 FROM sections WHERE instr(published, '/media/' || ?) > 0 OR instr(coalesce(draft, ''), '/media/' || ?) > 0)";

export function carrelMediaAdapter(env: Env): MediaAdapter {
  return mediaLibrary({
    store: d1MediaStore(env.DB, { inUse: IN_USE }),
    bucket: env.MEDIA,
    images: env.IMAGES,
    limits: pictureLimits(),
    url: mediaUrl,
    key: datedKey(UPLOAD_PREFIX),
    resize: PICTURE_RESIZE,
    usage: () => usesByKey(env),
    suggest: (picture) => suggestFor(env, picture),
  });
}
