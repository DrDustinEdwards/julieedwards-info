// The seed is the only copy of the site's text, so it must read back exactly as written, and a source
// Carrel sends that does not fit a section must be refused rather than reach the page.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseSection, renderSection, SECTION_IDS, SourceError, type SectionId } from "../app/lib/source.ts";

const seed = readFileSync(new URL("../drizzle/0001_seed.sql", import.meta.url), "utf8");
const sources = new Map(
  [...seed.matchAll(/VALUES \('([a-z]+)', '((?:[^']|'')*)'\);/g)].map((m) => [m[1], m[2].replace(/''/g, "'")]),
);

test("every section is seeded and reads back to the same text", () => {
  assert.deepEqual([...sources.keys()], SECTION_IDS);
  for (const [id, source] of sources) {
    assert.equal(renderSection(id as SectionId, parseSection(id as SectionId, source)), source, id);
  }
  assert.equal(parseSection("experience", sources.get("experience")!).items.length, 4);
  assert.equal(parseSection("about", sources.get("about")!).paragraphs.length, 3);
});

test("a source that does not fit its section is refused", () => {
  const bad = [
    ["about", 'heading: "About Me"\n---\nText'], // no front matter opening
    ["about", '---\nheading: 3\n---\nText'], // wrong type
    ["about", '---\nheading: "x"\ntitle: "y"\n---\nText'], // unknown field
    ["priorities", '---\nheading: "x"\n---\nLoose text\n\n## A\n\nBody'], // text before the first item
    ["contact", '---\nheading: "x"\nboardHeading: "y"\nboardLinks: [{"label":"a"}]\n---\n'], // a link with no href
  ] as const;
  for (const [id, source] of bad) assert.throws(() => parseSection(id, source), SourceError, source);
});
