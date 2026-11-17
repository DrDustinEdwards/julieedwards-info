---
name: verify
description: Use before committing or opening a pull request that changes what julieedwards.info shows or does (app/, app/app.css, workers/, drizzle/). Boots the site in Vite on workerd with a local D1, drives the page in Chromium with Playwright, runs the node tests that cover the area, and reports the evidence. Carrel's writes and the live edge are proved by the tests and the post-merge check, not here.
---

# Verify a julieedwards.info change

Tests prove what someone thought to test. This skill proves the change itself: run
the real site, use the changed page as a voter would, and look at the result. Do it
before every commit that touches `app/`, `workers/` or `drizzle/`, and before the
pull request. This is a real candidate's site: never invent copy to see a layout
(CLAUDE.md, hard rule 1); the copy you see locally is the seed in `drizzle/0001_seed.sql`.

## 1. Boot the site on a local D1

From the repo root, on the repo's Node (`.nvmrc`; in a cloud session prepend a Node
26 to PATH, for example `~/.cache/capsid-node/node-v26.13.1-linux-x64/bin`):

```sh
npm ci
[ -f wrangler.jsonc ] || cp wrangler.jsonc.example wrangler.jsonc
[ -f .dev.vars ] || cp .dev.vars.example .dev.vars
npm run db:migrate
```

`wrangler.jsonc` and `.dev.vars` are gitignored (never commit them; the D1 id
placeholder in the copy is fine locally). `db:migrate` applies `drizzle/` to the
local D1 under `.wrangler/state`, and `0001_seed.sql` is the page's copy, so there
is nothing else to seed. Local dev needs no Cloudflare sign-in
(`remoteBindings: false`).

Check the port is free, then start Vite (workerd, local D1 and R2). `npm run dev`
runs `npm run headers` first. Other sessions share the machine and Vite's default is
5173, so use `--strictPort` and pick a port nobody answers on:

```sh
curl -s -o /dev/null -m 2 http://localhost:5317/ && echo "5317 is busy: pick another" || echo "5317 free"
nohup npm run dev -- --port 5317 --strictPort > <scratchpad>/dev.log 2>&1 &
```

Wait until `curl -s -o /dev/null -w '%{http_code}' http://localhost:5317/` prints
200 (the first request compiles), then confirm it is this app, not another
session's server on a port you guessed:

```sh
curl -s http://localhost:5317/ | grep -o '<title>[^<]*'
curl -s http://localhost:5317/health | head -c 80
```

The title is `Julie Edwards | Bluff Dale ISD School Board Trustee` and `/health`
answers `"db":"up"` (its `warn` about missing backups is normal locally). Any
other title means the port belongs to someone else: stop, pick another port.

What local shows: the page and its sections, `/accessibility`, `/sitemap.xml`,
`/llms.txt`, `/health`, the 404 page, the headers and CSP the Worker sends, the
theme button, and the schema from every migration. What it cannot show: Carrel's
edits, previews and scheduled publishes (they need Carrel's key and are proved by
`test/`), the nightly backup, the media library's R2 files and Images resizing, the
page's edge cache (the `cache` setting only applies when deployed), Workers AI (the
media suggestions are refused locally), and the profile photo, which loads from
`content.julieedwards.info` and fails in a sandbox with no outside network.

## 2. Drive the changed flow

The repo has no browser driver, so use the container's preinstalled Playwright. In a
cloud session `require('playwright')` works from any directory in a `.cjs` script
and `chromium.launch()` needs no options. Write the script in the session's
scratchpad, never in the repo. Name each step the way a person would say it, act
through roles and labels, and assert what the person should see afterward. Collect
console errors and page errors, and keep a screenshot of the end state.

```js
// <scratchpad>/drive.cjs: cd <scratchpad> && node drive.cjs http://localhost:5317/
const { chromium } = require("playwright");
(async () => {
  const base = process.argv[2];
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  const log = [];
  async function step(name, fn) {
    try {
      await fn();
      log.push(`ok   ${name}`);
    } catch (e) {
      log.push(`FAIL ${name}: ${e.message.split("\n")[0]}`);
      await page.screenshot({ path: "fail.png", fullPage: true });
      throw e;
    }
  }
  try {
    await step("open the home page", async () => {
      const r = await page.goto(base);
      if (!r.ok()) throw new Error(`status ${r.status()}`);
      await page.getByRole("heading", { name: "Julie Edwards", level: 1 }).waitFor();
    });
    await step("jump to About Me from the header", async () => {
      await page
        .getByRole("navigation", { name: "Site" })
        .getByRole("link", { name: "About" })
        .first()
        .click();
      await page.getByRole("heading", { name: "About Me", level: 2 }).waitFor();
      if (!page.url().endsWith("#about")) throw new Error(`url ${page.url()}`);
    });
    await step("go to Accessibility from the footer", async () => {
      await page
        .getByRole("navigation", { name: "Footer" })
        .getByRole("link", { name: "Accessibility" })
        .click();
      await page.getByRole("heading", { level: 1 }).waitFor();
      if (!page.url().endsWith("/accessibility")) throw new Error(`url ${page.url()}`);
    });
    await step("reload and see it hold", async () => {
      await page.reload();
      await page.getByRole("heading", { level: 1 }).waitFor();
    });
    // ...the changed flow: click, fill, then assert the visible result.
    await page.screenshot({ path: "after.png", fullPage: true });
  } finally {
    console.log(log.join("\n"));
    console.log("console errors:", errors.length ? errors : "none");
    await browser.close();
  }
})();
```

The page is one page of sections (Priorities, About Me, What I bring to the board,
Contact, School Board), so the changed flow is usually a section's look, the
header's anchors and mobile sheet, the theme button, or a second route. Drive the
whole flow, not just the page load: follow the link, use the control, see the
result, reload and see it hold. If the change is responsive or themed, repeat the
end state at 390 px wide and in dark mode (`page.setViewportSize`,
`page.emulateMedia({ colorScheme: "dark" })`). The page ships no React to the
browser; `/site.js` (`app/site.ts`) wires the header and theme, so a script-off pass
(`browser.newContext({ javaScriptEnabled: false })`) should still show all the copy.

Known dev-only console noise, which production does not show: `Cannot set
properties of null (setting 'hidden')` and `Cannot read properties of null (reading
'replaceChildren')` from the devkit toolbar (`/@devkit/toolbar.js`), an aborted
`/@devkit/axe.js`, and, in a sandbox, `Failed to load resource:
net::ERR_TUNNEL_CONNECTION_FAILED` for the profile photo on
`content.julieedwards.info`. Anything else in the list is a finding.

Stop the dev server you started (other sessions run servers on this machine, so
never `pkill` by name). `npm run dev` leaves `react-router dev` running when its
own process is killed, so stop it by the port you chose, which only your server
holds because of `--strictPort`, and remove what you created (`rm -f .dev.vars
wrangler.jsonc` if you made them; `git status` should show nothing new):

```sh
kill $(pgrep -f "react-router dev --port 5317 --strictPort")
```

## 3. Run the tests that cover the area

`npm test` runs `test/*.test.ts` with `node --test` over the site's own migrations
in node:sqlite, takes a few seconds, and needs no server. Run all of it, or one file:

```sh
node --test test/source.test.ts
```

| Area changed                                                 | File                     |
| ------------------------------------------------------------ | ------------------------ |
| The copy, its seed, a section's fields (`app/lib/source.ts`) | `test/source.test.ts`    |
| Carrel's media library, `/media`, used-by and deletes        | `test/media.test.ts`     |
| Scheduled publishes and the per-minute cron                  | `test/schedules.test.ts` |
| Layout, CSS, components, the header, headers and CSP, routes | this skill's drive       |

CI's `ci` job (`.github/workflows/ci.yml`) also runs, in this order, `npm run
typecheck`, `npm run lint`, `npm run format:check`, `npm test`, `npm run
check:console` (raw `console.*` in server code may not rise above `.console.json`),
`npm run check:migrations` (a migration in `drizzle/` is never edited, and a new
one only adds, unless it says `-- contract: <reason>`), `npm run build` and
`npm audit`. Run the ones your change can trip before the pull request. A new
migration also goes in `app/db/schema.ts`, and `npm run bloat` checks for copies.

## Rules

- A failed step is a finding about the change. Fix the code, then run the same
  script again. Never add a sleep, a retry or a looser selector to make it pass.
- If a step fails sometimes, find out why before going on; a flaky check teaches
  the next thread to re-run instead of fix.
- Never edit an existing test to make it agree with new behavior unless the change
  is meant to alter that behavior, and say so in the pull request.
- Leave nothing behind: stop the server you started by its port, and keep the
  scripts and screenshots in the scratchpad. Nothing from this skill is committed.

## The report

Put this in the reply and the pull request body:

- First line: verified, partly verified (and what was not), or failed.
- Each step's ok or FAIL line, verbatim, and the console errors line.
- The end-state screenshot, attached (Dustin cannot open a scratchpad path).
- The test run's summary lines (`tests`, `pass`, `fail`).
- Anything local cannot show (Carrel's edits and previews, backups, media files,
  the edge cache, Workers AI), named as not verified. The live check runs after the
  merge: CI's `deploy` job (`.github/workflows/ci.yml`, while `CF_DEPLOY` is `true`)
  waits for https://julieedwards.info/health to report the commit, checks the home
  page answers 200 and rolls back if it does not. Look at that `/health` and the
  home page after it.
