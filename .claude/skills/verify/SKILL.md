---
name: verify
description: Use before committing or opening a pull request that changes what julieedwards.info shows or does (app/, app/app.css, workers/, drizzle/). Boots the site in Vite on workerd with a local D1, drives the page in Chromium with Playwright, runs the node tests that cover the area, and reports the evidence. Carrel's writes and the live edge are proved by the tests and the post-merge check, not here.
---

# Verify a julieedwards.info change

Do it before every commit that touches `app/`, `workers/` or `drizzle/`, and before the
pull request. The copy you see locally is the seed in `drizzle/0001_seed.sql`; never
invent copy to see a layout.

## 1. Boot the site on a local D1

From the repo root, on the repo's Node (`.nvmrc`; in a cloud session put a Node 26
on PATH, the one the SessionStart hook installs under `~/.cache/capsid-node/`):

```sh
npm ci
[ -f wrangler.jsonc ] || cp wrangler.jsonc.example wrangler.jsonc
[ -f .dev.vars ] || cp .dev.vars.example .dev.vars
npm run db:migrate
```

`db:migrate` applies `drizzle/` to the local D1 under `.wrangler/state`, and
`0001_seed.sql` is the page's copy, so there is nothing else to seed. Local dev needs no
Cloudflare sign-in.

Check the port is free, then start Vite (`npm run dev` runs `npm run headers` first).
Other sessions share the machine, so use `--strictPort` on a port nobody answers on:

```sh
curl -s -o /dev/null -m 2 http://localhost:5317/ && echo "5317 is busy: pick another" || echo "5317 free"
nohup npm run dev -- --port 5317 --strictPort > <scratchpad>/dev.log 2>&1 &
```

Wait until `curl -s -o /dev/null -w '%{http_code}' http://localhost:5317/` prints 200
(the first request compiles), then confirm it is this app:

```sh
curl -s http://localhost:5317/ | grep -o '<title>[^<]*'
curl -s http://localhost:5317/health | head -c 80
```

The title is `Julie Edwards | Bluff Dale ISD School Board Trustee` and `/health`
answers `"db":"up"` (its `warn` about backups is normal). Any other title means the port
is someone else's: pick another.

Local cannot show Carrel's edits, previews and scheduled publishes (`test/` proves
them), the backup, the media library's R2 files and Images resizing, the edge cache,
Workers AI, or the profile photo (it loads from `content.julieedwards.info`, which a
sandbox cannot reach).

## 2. Drive the changed flow

The repo has no browser driver; use the container's Playwright. In a cloud session
`require('playwright')` works from any directory in a `.cjs` script and
`chromium.launch()` needs no options. Write the script in the session's scratchpad.
Name each step as a person would say it, act through roles and labels, assert what the
person should see, collect console and page errors, and keep a screenshot of the end
state.

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

The page is one page of sections, so the changed flow is usually a section's look, the
header's anchors and mobile sheet, the theme button, or a second route. Drive the whole
flow (act, see the result, reload and see it hold); repeat the end state at 390 px and
in dark mode (`page.setViewportSize`, `page.emulateMedia({ colorScheme: "dark" })`)
when the change is responsive or themed. `/site.js` (`app/site.ts`) wires the header
and theme, so a script-off pass (`browser.newContext({ javaScriptEnabled: false })`)
should still show all the copy.

Known dev-only console noise, which production does not show: `Cannot set
properties of null (setting 'hidden')` and `Cannot read properties of null (reading
'replaceChildren')` from the devkit toolbar (`/@devkit/toolbar.js`), an aborted
`/@devkit/axe.js`, and, in a sandbox, `Failed to load resource:
net::ERR_TUNNEL_CONNECTION_FAILED` for the profile photo on
`content.julieedwards.info`. Anything else in the list is a finding.

Stop the dev server by PID, never `pkill` by name. `npm run dev` leaves
`react-router dev` running when its own process is killed, so find it by the port
(only your server holds it, thanks to `--strictPort`), and remove `.dev.vars` and
`wrangler.jsonc` if you made them:

```sh
kill $(pgrep -f "react-router dev --port 5317 --strictPort")
```

## 3. Run the tests that cover the area

`npm test` runs `test/*.test.ts` with `node --test` over the site's own migrations in
node:sqlite; it takes seconds and needs no server. Run it all, or one file
(`node --test test/source.test.ts`):

| Area changed                                                 | File                     |
| ------------------------------------------------------------ | ------------------------ |
| The copy, its seed, a section's fields (`app/lib/source.ts`) | `test/source.test.ts`    |
| Carrel's media library, `/media`, used-by and deletes        | `test/media.test.ts`     |
| Scheduled publishes and the per-minute cron                  | `test/schedules.test.ts` |
| Layout, CSS, components, the header, headers and CSP, routes | this skill's drive       |

Before the pull request also run `npm run typecheck`, `npm run lint`,
`npm run format:check` and, as the change calls for, `npm run check:console`,
`npm run check:migrations` (a migration is never edited; a new one only adds, unless it
says `-- contract: <reason>`) and `npm run bloat`. A new migration also goes in
`app/db/schema.ts`.

## Rules

A failed step is a finding about the change: fix the code and rerun the same script;
never add a sleep, retry or looser selector. Stop the server by PID, never `pkill` by
name.

## The report

Put this in the reply and the pull request body:

- First line: verified, partly verified (and what was not), or failed.
- Each step's ok or FAIL line verbatim, the console errors line, the test summary lines
  (`tests`, `pass`, `fail`), and the end-state screenshot attached.
- Not verified: what local cannot show (above). The live check after a merge is CI's
  `deploy` job (`.github/workflows/ci.yml`, while `CF_DEPLOY` is `true`): it waits for
  https://julieedwards.info/health to report the commit, checks the home page and rolls
  back on a failure.
