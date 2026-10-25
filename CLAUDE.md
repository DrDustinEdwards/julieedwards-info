# CLAUDE.md - julieedwards.info

Current state is `julieedwards/core.md` in Capsid. This file holds only what is true of this repo. Before writing anything another site might have, read what the family shares: https://github.com/DrDustinEdwards/devkit/blob/shared-list/SHARED.md (CI's family check fails on a copy).

## What this is

Campaign site for Julie Edwards, candidate for Bluff Dale ISD School Board: one page, React Router 8 on a Cloudflare Worker, its copy in D1 and edited through Carrel (site-api). Part of the personal-sites family; brand color is forest green (Bluff Dale), `--brand-ui #15532E`. Its look is Capsomer's `forest` family and site header (`app/app.css`).

- Tests: keep the minimal set (a few browser tests for flows that must never break, one integration test per real behavior, unit tests only for tricky logic, shared code tested once where it lives), and remove any test that pins design, repeats coverage or has never caught a real mistake, unless it guards a harm that cannot be undone.

## Commands

- `npm run dev`, `npm run typecheck`, `npm test`, `npm run build`. Copy `wrangler.jsonc.example` to `wrangler.jsonc` first; it is gitignored (public repo, it holds the D1 id).
- `npm run db:migrate` (local) and `db:migrate:prod` (remote): hand-written SQL in `drizzle/`, kept in step with `app/db/schema.ts`.
- A merge to main deploys (CI's `deploy` job, while the repo variable `CF_DEPLOY` is `true`).

## Hard rules

1. This is a real candidate's site. Keep content factual and faithful to what she provides. Do not invent positions, claims, or quotes.
2. All copy lives in D1, one source per section (`app/lib/source.ts`), seeded by `drizzle/0001_seed.sql` and edited through Carrel. No copy in components or metadata code.
