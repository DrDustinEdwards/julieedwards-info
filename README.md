# julieedwards.info

Campaign site for Julie Edwards, candidate for Bluff Dale ISD School Board.
React Router 8 on a Cloudflare Worker, with the page's copy in D1 (Drizzle) and a nightly D1 dump into R2.

## Run locally
    cp wrangler.jsonc.example wrangler.jsonc
    cp .dev.vars.example .dev.vars
    npm install
    npm run db:migrate   # creates the local D1 and seeds the copy
    npm run dev          # http://localhost:5173

Local dev runs without a Cloudflare sign-in (`remoteBindings: false` in `vite.config.ts`), so the one remote
binding, Workers AI, is absent there: a media suggestion is refused locally and works when deployed.

## Edit content
The copy is six sections in D1 (`app/lib/source.ts` lists them and their fields). Carrel edits them
through the site API at `/api/carrel/v1`: a save is a draft nobody sees, a publish puts it on the page.
`drizzle/0001_seed.sql` is the copy the site started with. A new image host also goes in the policy's
`img` sources in `workers/security-headers.ts`.

Pictures come from the media library Carrel's media page manages (`app/lib/carrel/media-adapter.server.ts`):
the files in the `MEDIA` bucket under `uploads/`, their alt text, tags, credit and history in D1
(`drizzle/0002_media.sql`). A section uses a file by naming its address, `/media/uploads/...`, as the
profile's `images.about` names the About photo; the page then draws it at responsive sizes with its own alt
text and focal point (`app/lib/media/images.ts`). Any other address is drawn as written. "Used by" and every
delete read the sections' published text and waiting drafts, so a file a section names cannot be deleted.

## How it runs
- `workers/app.ts`: Carrel's API, the CSP report sink, `/media/*` (the library's files and their sizes,
  through the Images binding, `app/lib/media/serve.server.ts`), then React Router; every response gets the
  site-runtime security headers, and `www` answers with a 301 to the apex. The build writes the same set into
  the static files' `public/_headers` (`scripts/headers-file.ts`), since those never reach the Worker. 404s are
  counted per path and referring host (site-runtime `./not-found`). The nightly cron runs the d1-dump backup, the
  media files backup and the 404 prune through site-runtime `runJobs`; `/health` reports the backups' age, the
  MEDIA bucket and the jobs. `.github/workflows/restore-drill.yml` restores the newest dump weekly.
- The page ships no React to the browser: `/site.js` (`app/site.ts`, bundled by
  `vite.config.ts`) runs Capsomer's site header and theme button and the scroll reveal, and the pre-paint theme script is trusted by hash.
