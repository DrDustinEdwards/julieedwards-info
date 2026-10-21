# CLAUDE.md - julieedwards.info

Current state is `julieedwards/core.md` in Capsid. This file holds only what is true of this repo.

## What this is

Campaign site for Julie Edwards, candidate for Bluff Dale ISD School Board. Static site: no database, no email for now. Part of the personal-sites family; brand color is forest green (Bluff Dale), `--brand-ui #15532E`.

Legacy stack exception: Next.js App Router on Vercel, auto-deploy on push to main. Not being migrated to the house RR8/Cloudflare stack.

- Tests: keep the minimal set (a few browser tests for flows that must never break, one integration test per real behaviour, unit tests only for tricky logic, shared code tested once where it lives), and remove any test that pins design, repeats coverage or has never caught a real mistake, unless it guards a harm that cannot be undone.

## Commands

- `npm run dev`
- `npm run build`

## Hard rules

1. This is a real candidate's site. Keep content factual and faithful to what she provides. Do not invent positions, claims, or quotes.
2. All copy lives in `content/site.ts`. Metadata via `lib/metadata.ts`. No hardcoded strings in metadata.
