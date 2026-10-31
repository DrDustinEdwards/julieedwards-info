// Library pictures on the page: where a file is served, how a section's address names one, and the sizes the page
// offers (site-runtime ./image). One `defineImages`, so the page never asks /media for a size the route refuses.
import { defineImages, type ImageAttributes } from "@dustinedwards/site-runtime/image";
import { SITE_URL } from "~/lib/site";

/** Every upload's key starts here; the earlier bytes a file's history keeps are under history/, never served. */
export const UPLOAD_PREFIX = "uploads/";

/** A library address inside text: the key is the first group. One rule for the page and for "used by". */
export const LIBRARY_ADDRESS = /\/media\/(uploads\/[^?#\s"'\\<>]+)/;

/** Where a file is served. */
export const mediaUrl = (key: string) => `/media/${key}`;

/**
 * The library key an address in a section's source names, or null when it is not a library file. A section may
 * name a file by its path (/media/uploads/...) or by its full address on this site; a query or fragment is ignored.
 */
export function libraryKeyOf(address: string): string | null {
  const path = address.startsWith(SITE_URL) ? address.slice(SITE_URL.length) : address;
  const match = path.startsWith("/media/") ? LIBRARY_ADDRESS.exec(path) : null;
  return match ? match[1] : null;
}

/**
 * The ways the page shows a library picture. `about` is the photo beside About Me: it fills half the screen
 * from 820px (app.css) and all of it below, cropped to its box around the file's focal point. Its `sizes` is the
 * file's own (libraryPhoto).
 */
export const images = defineImages({
  uses: {
    about: { layout: "full-width" },
  },
});

export type ImageUse = "about";

/** A library picture as the page draws it. */
export type LibraryPhoto = ImageAttributes & { alt: string; focus: string | null };

/** The library pictures the page draws, by where they go. Absent: that place shows what its address names, as before. */
export type Photos = { about?: LibraryPhoto };

/**
 * The page's attributes for one stored file. The address carries a short hash of the bytes (`v`), so a size cached
 * forever is never stale after a replace, a turn or a revert; `origin` makes every address absolute, for Carrel's
 * preview, which is shown on Carrel's own origin. From 820px the box is about as tall as it is wide, so a wider
 * picture fills it by its height and `sizes` asks for that much more width, or it would be drawn soft.
 */
export function libraryPhoto(
  file: { key: string; width: number | null; height: number | null; sha256: string; focus: string | null; alt: string },
  use: ImageUse,
  origin = "",
): LibraryPhoto {
  const src = `${origin}${mediaUrl(file.key)}?v=${file.sha256.slice(0, 12)}`;
  const wide = file.width && file.height ? Math.max(1, file.width / file.height) : 1;
  const attributes = images.attributes({ src, width: file.width, height: file.height, focus: file.focus }, use);
  return { ...attributes, sizes: `(width < 820px) 100vw, ${Math.round(47 * wide)}vw`, alt: file.alt, focus: file.focus };
}

/** CSS object-position for a focal point, so a picture cropped by its box keeps its subject. */
export function objectPosition(focus: string | null): string | undefined {
  const point = focus && /^([\d.]+)x([\d.]+)$/.exec(focus);
  return point ? `${Number(point[1]) * 100}% ${Number(point[2]) * 100}%` : undefined;
}
