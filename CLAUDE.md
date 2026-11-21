# CLAUDE.md - julieedwards.info

Current state is `julieedwards/core.md` in Capsid. This file holds only what is true of this repo.

## What this is

Campaign site for Julie Edwards, candidate for Bluff Dale ISD School Board: one page, React Router 8 on a Cloudflare Worker, its copy in D1 and edited through Carrel (site-api). Part of the personal-sites family; brand color is forest green (Bluff Dale), `--brand-ui #15532E`. Its look is Capsomer's `forest` family and site header (`app/app.css`).

## Rules every repo shares

- **Tests.** Keep the minimal set (a few browser tests for flows that must never break, one integration test per real behavior, unit tests only for tricky logic, shared code tested once where it lives), and remove any test that pins design, repeats coverage or has never caught a real mistake, unless it guards a harm that cannot be undone.
- **UI copy.** Let the layout explain. No eyebrows, restating subtitles, "this page lets you" intros, descriptions under obvious buttons, hints a label already gives, repeated captions or empty-state essays; labels, accessible names, errors, one-way warnings and legal text stay (Dustin, 2026-11-18; Capsid capsid/conventions.md).
- **Shared code.** Before writing anything another site might have, read https://github.com/DrDustinEdwards/devkit/blob/shared-list/SHARED.md (CI's shared-code check fails on a copy). Change shared code in place and delete what a change replaces in the same PR.
- **Browser support.** devkit's docs/browser-support.md (Baseline Widely available freely; Newly available with a small fallback; Limited only feature-detected; no polyfills).
- **Secrets.** Never commit or print a key, token, `.dev.vars` or `.env`.
- **Reproduce first.** A report that something is broken names a cause; reproduce the failure before fixing it, and report red before and green after.
- **Deploys.** A merge to the default branch deploys (CI's deploy job); never deploy from a session.
- **D1.** Migrations are additive: CI applies the ones that only add and refuses a drop, rename or row delete for a hand run; never hand-run production DDL. `wrangler d1 export` fails on FTS5 tables, so back up and restore with d1-dump (its README); never export an `*_fts` table. Checking backups, backing up now and running a scheduled job now are Capsid Admin's, for every site (`/api/operator`, site-runtime `./operator`).
- **Site copy and AI.** Copy describes only what the current build does. An AI provider key stays on the server, never in a client.

## Commands

- `npm run dev`, `npm run typecheck`, `npm run lint` (devkit's shared Oxlint config), `npm run format:check` (Oxfmt; `npm run format` writes), `npm test`, `npm run build`. Copy `wrangler.jsonc.example` to `wrangler.jsonc` first; it is gitignored (public repo, it holds the D1 id).
- `npm run db:migrate` (local) and `db:migrate:prod` (remote): hand-written SQL in `drizzle/`, kept in step with `app/db/schema.ts`.
- A merge to main deploys (CI's `deploy` job, while the repo variable `CF_DEPLOY` is `true`).

## Rules for this repo

1. This is a real candidate's site. Keep content factual and faithful to what she provides. Do not invent positions, claims, or quotes.
2. All copy lives in D1, one source per section (`app/lib/source.ts`), seeded by `drizzle/0001_seed.sql` and edited through Carrel. No copy in components or metadata code.
3. The page is a fixed set of sections, each always live. Carrel edits, schedules and publishes them; it never unpublishes, renames, trashes or deletes one (unpublish is refused, the rest answer 501), the rule the network's other fixed content follows (the CV and the agent document on dustinedwards.info). A saved draft reads as published with `hasDraft`. Taking a section off the page is a change to `app/lib/source.ts` and the seed, not a Carrel action.
