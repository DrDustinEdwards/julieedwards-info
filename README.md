# julieedwards.info

Campaign site for Julie Edwards, candidate for Bluff Dale ISD School Board.
React Router 8 on a Cloudflare Worker, with the page's copy in D1 (Drizzle) and a nightly D1 dump into R2.

## Run locally
    cp wrangler.jsonc.example wrangler.jsonc
    cp .dev.vars.example .dev.vars
    npm install
    npm run db:migrate   # creates the local D1 and seeds the copy
    npm run dev          # http://localhost:5173

## Edit content
The copy is six sections in D1 (`app/lib/source.ts` lists them and their fields). Carrel edits them
through the site API at `/api/carrel/v1`: a save is a draft nobody sees, a publish puts it on the page.
`drizzle/0001_seed.sql` is the copy the site started with. A new image host also goes in the policy's
`img` sources in `workers/security-headers.ts`.

## How it runs
- `workers/app.ts`: Carrel's API, the CSP report sink, then React Router; every response gets the
  site-runtime security headers. The nightly cron runs the d1-dump backup (`/health` reports its age).
- The page ships no React to the browser: `/site.js` (`app/site.ts`, bundled by
  `vite.config.ts`) runs Capsomer's site header and theme button and the scroll reveal, and the pre-paint theme script is trusted by hash.
