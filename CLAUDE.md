# CLAUDE.md - julieedwards.info

Portfolio-wide rules live in Capsid, not here. Read `capsid/conventions.md` first, then `julieedwards/core.md`. This file holds only what is true of this repo.

## What this is

Campaign site for Julie Edwards, candidate for Bluff Dale ISD School Board. Static site: no database, no email for now. Part of the personal-sites family; brand color is forest green (Bluff Dale), `--brand-ui #15532E`.

Legacy stack exception: Next.js App Router on Vercel, auto-deploy on push to main. Not being migrated to the house RR8/Cloudflare stack. See `capsid/decisions.md`.

## Session ritual

Start: read `capsid/conventions.md`, then `julieedwards/core.md`.
End: write a `session-YYYY-MM-DD.md` episodic (type `episodic`, under ~2KB) to the julieedwards namespace.

## Commands

- `npm run dev`
- `npm run build`
- `npx tsc --noEmit` before every push

## Hard rules

1. This is a real candidate's site. Keep content factual and faithful to what she provides. Do not invent positions, claims, or quotes.
2. All copy lives in `content/site.ts`. Metadata via `lib/metadata.ts`. No hardcoded strings in metadata.
3. Fonts, per app/layout.tsx and globals.css: Montserrat (display, UI, labels), Open Sans (body), Cookie (script accents only, e.g. the .btn flourish). Note: an earlier version of this file claimed Fraunces / Source Serif 4 / DM Sans / DM Mono; the code has never used those here. If a serif redesign is intended, that is a decision to record first, not a rule to restore.

## Images

Hosted on Cloudflare R2. Until URLs are added to the `images` object in `content/site.ts`, sections render green placeholder blocks. To use next/image optimization later, add the R2 host to `next.config.mjs` remotePatterns.
