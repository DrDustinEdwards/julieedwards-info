// The site's copy, one section per row in D1 (`sections`), and the text Carrel edits for each one.
//
// A section's source is a front matter block of JSON values, then a body:
//
//   ---
//   heading: "Priorities"
//   ---
//   ## Education
//
//   Support continued academic excellence.
//
// The body is plain paragraphs separated by blank lines ("paragraphs"), or "## Title" items each
// followed by their text ("items"), or nothing. The page renders every value as text, never as HTML.

export type Link = { label: string; href: string };
export type Item = { title: string; body: string };

export type Content = {
  profile: {
    name: string;
    office: string;
    description: string;
    summary: string;
    email: string;
    facebook: string;
    address: { name: string; line1: string; line2: string; mapsUrl: string };
    district: { name: string; url: string };
    images: { about: string; portrait: string; flyer: string };
  };
  priorities: { heading: string; items: Item[] };
  about: { heading: string; paragraphs: string[] };
  experience: { heading: string; items: Item[] };
  contact: { heading: string; boardHeading: string; boardLinks: Link[] };
  site: { nav: Link[]; resourceLinks: Link[]; analyticsNote: string; notFound: { title: string; body: string; cta: string } };
};

export type SectionId = keyof Content;

type Shape = "string" | "links" | readonly string[];
type Section = { title: string; anchor: string; fields: Record<string, Shape>; body: "none" | "paragraphs" | "items" };

/** Every section, in page order. Carrel edits these and creates no others. */
export const SECTIONS: Record<SectionId, Section> = {
  profile: {
    title: "Profile and contact details",
    anchor: "/#top",
    fields: {
      name: "string",
      office: "string",
      description: "string",
      summary: "string",
      email: "string",
      facebook: "string",
      address: ["name", "line1", "line2", "mapsUrl"],
      district: ["name", "url"],
      images: ["about", "portrait", "flyer"],
    },
    body: "none",
  },
  priorities: { title: "Priorities", anchor: "/#why", fields: { heading: "string" }, body: "items" },
  about: { title: "About Me", anchor: "/#about", fields: { heading: "string" }, body: "paragraphs" },
  experience: { title: "What I bring to the board", anchor: "/#experience", fields: { heading: "string" }, body: "items" },
  contact: { title: "Contact and School Board links", anchor: "/#contact", fields: { heading: "string", boardHeading: "string", boardLinks: "links" }, body: "none" },
  site: {
    title: "Navigation, footer and 404 page",
    anchor: "/",
    fields: { nav: "links", resourceLinks: "links", analyticsNote: "string", notFound: ["title", "body", "cta"] },
    body: "none",
  },
};

export const SECTION_IDS = Object.keys(SECTIONS) as SectionId[];

export function isSectionId(id: string): id is SectionId {
  return Object.hasOwn(SECTIONS, id);
}

export class SourceError extends Error {}

function check(key: string, shape: Shape, value: unknown): void {
  const isString = (v: unknown) => typeof v === "string";
  if (shape === "string") {
    if (!isString(value)) throw new SourceError(`"${key}" must be text.`);
  } else if (shape === "links") {
    const ok =
      Array.isArray(value) &&
      value.every((l) => l && typeof l === "object" && isString(l.label) && isString(l.href) && Object.keys(l).length === 2);
    if (!ok) throw new SourceError(`"${key}" must be a list of { "label": ..., "href": ... }.`);
  } else {
    const ok =
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      shape.every((k) => isString((value as Record<string, unknown>)[k])) &&
      Object.keys(value).length === shape.length;
    if (!ok) throw new SourceError(`"${key}" must have exactly ${shape.map((k) => `"${k}"`).join(", ")}, each text.`);
  }
}

const paragraphsOf = (body: string) =>
  body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

function itemsOf(body: string): Item[] {
  const items: Item[] = [];
  for (const block of body.split(/^## /m).slice(1)) {
    const newline = block.indexOf("\n");
    const title = (newline === -1 ? block : block.slice(0, newline)).trim();
    const text = paragraphsOf(newline === -1 ? "" : block.slice(newline + 1));
    if (!title || text.length !== 1) throw new SourceError(`Each "## Title" needs one paragraph of text after it (see "${title || "untitled"}").`);
    items.push({ title, body: text[0] });
  }
  if (body.split(/^## /m)[0].trim()) throw new SourceError('Text before the first "## Title" has nowhere to go.');
  return items;
}

/** Reads one section's source. Throws SourceError, in words for the writer, when it does not fit. */
export function parseSection<K extends SectionId>(id: K, source: string): Content[K] {
  const section = SECTIONS[id];
  const normalized = source.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) throw new SourceError("The source must start with a --- front matter block.");
  const close = normalized.indexOf("\n---", 3);
  if (close === -1) throw new SourceError("The front matter block has no closing ---.");
  const out: Record<string, unknown> = {};
  for (const line of normalized.slice(4, close).split("\n")) {
    if (!line.trim()) continue;
    const colon = line.indexOf(":");
    const key = colon === -1 ? line.trim() : line.slice(0, colon).trim();
    if (!Object.hasOwn(section.fields, key)) throw new SourceError(`"${key}" is not a field of this section.`);
    try {
      out[key] = JSON.parse(line.slice(colon + 1));
    } catch {
      throw new SourceError(`"${key}" is not valid JSON.`);
    }
  }
  for (const [key, shape] of Object.entries(section.fields)) {
    if (!(key in out)) throw new SourceError(`"${key}" is missing.`);
    check(key, shape, out[key]);
  }
  const body = normalized.slice(close + 4).replace(/^\n/, "");
  if (section.body === "paragraphs") out.paragraphs = paragraphsOf(body);
  else if (section.body === "items") out.items = itemsOf(body);
  else if (body.trim()) throw new SourceError("This section has no body; everything goes in the front matter.");
  return out as Content[K];
}

/** Writes one section's source, the inverse of parseSection. */
export function renderSection<K extends SectionId>(id: K, value: Content[K]): string {
  const section = SECTIONS[id];
  const record = value as Record<string, unknown>;
  const lines = Object.keys(section.fields).map((k) => `${k}: ${JSON.stringify(record[k])}`);
  let body = "";
  if (section.body === "paragraphs") body = (record.paragraphs as string[]).join("\n\n");
  if (section.body === "items") body = (record.items as Item[]).map((i) => `## ${i.title}\n\n${i.body}`).join("\n\n");
  return `---\n${lines.join("\n")}\n---\n${body ? `${body}\n` : ""}`;
}
