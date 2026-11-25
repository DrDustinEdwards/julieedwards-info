# CLAUDE.md - julieedwards.info

## What this is

Campaign site for Julie Edwards, candidate for Bluff Dale ISD School Board: one page, React Router 8 on a Cloudflare Worker, its copy in D1 and edited through Carrel (site-api). Part of the personal-sites family; brand color is forest green (Bluff Dale), `--brand-ui #15532E`. Its look is Capsomer's `forest` family and site header (`app/app.css`).

## Rules every repo shares

- **Tests.** Keep the minimal set: a few browser tests for flows that must never break, one integration test per real behavior, unit tests only for tricky logic, shared code tested once where it lives. Remove a test that pins design, repeats coverage or never caught a mistake, unless it guards a harm that cannot be undone.
- **UI copy.** Let the layout explain: no eyebrows, restating subtitles, "this page lets you" intros, hints a label already gives or empty-state essays. Labels, accessible names, errors, one-way warnings and legal text stay (Dustin, 2026-11-18; capsid/conventions.md).
- **Shared code.** Before writing anything another site might have, check https://github.com/DrDustinEdwards/devkit/blob/shared-list/SHARED.md. Change shared code in place and delete what the change replaces in the same PR.
- **Browser support.** devkit's docs/browser-support.md: Baseline Widely available freely, Newly available with a small fallback, Limited only feature-detected, no polyfills.
- **Secrets.** Never commit or print a key, token, `.dev.vars` or `.env`.
- **Reproduce first.** Reproduce a reported failure before fixing it; report red before and green after.
- **Deploys.** A merge to the default branch deploys; never deploy from a session.
- **D1.** Never hand-run production DDL; CI applies additive migrations and refuses the rest. Back up and restore with d1-dump, never `wrangler d1 export` (it fails on FTS5 tables).
- **Site copy and AI.** Copy describes only what the current build does. An AI provider key stays on the server, never in a client.

## Commands

- `npm run dev`, `npm run typecheck`, `npm run lint` (devkit's shared Oxlint config), `npm run format:check` (Oxfmt; `npm run format` writes), `npm test`, `npm run build`. Copy `wrangler.jsonc.example` to `wrangler.jsonc` first; it is gitignored (public repo, it holds the D1 id).
- `npm run db:migrate` (local) and `db:migrate:prod` (remote): hand-written SQL in `drizzle/`, kept in step with `app/db/schema.ts`.
- A merge to main deploys (CI's `deploy` job, while the repo variable `CF_DEPLOY` is `true`).

## Rules for this repo

1. This is a real candidate's site. Keep content factual and faithful to what she provides. Do not invent positions, claims, or quotes.
2. All copy lives in D1, one source per section (`app/lib/source.ts`), seeded by `drizzle/0001_seed.sql` and edited through Carrel. No copy in components or metadata code.
3. The page is a fixed set of sections, each always live. Carrel edits, schedules and publishes them; it never unpublishes, renames, trashes or deletes one (unpublish is refused, the rest answer 501), the rule the network's other fixed content follows (the CV and the agent document on dustinedwards.info). A saved draft reads as published with `hasDraft`. Taking a section off the page is a change to `app/lib/source.ts` and the seed, not a Carrel action.
