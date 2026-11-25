# CLAUDE.md - julieedwards.info

Campaign site for Julie Edwards, candidate for Bluff Dale ISD School Board: one page on a Worker, its copy in D1, edited through Carrel.

## Rules every repo shares

- **Tests.** Reproduce a reported failure before fixing it: red before, green after.
- **UI copy.** No eyebrows, restating subtitles, intros or hints a label already gives (Dustin, 2026-11-18).
- **Shared code.** Check devkit's [SHARED.md](https://github.com/DrDustinEdwards/devkit/blob/shared-list/SHARED.md) before writing anything another repo might have; change it in place.
- **Secrets.** Never commit or print a key or token. AI provider keys stay on the server.
- **Production.** Never deploy, tag, release or run production DDL from a session; a merge deploys. Back up and restore D1 only with d1-dump.

## Rules for this repo

- **Facts.** This is a real candidate's site. Keep content faithful to what she provides; never invent positions, claims or quotes.
- **Sections.** The page is a fixed set of sections. Carrel never unpublishes, renames, trashes or deletes one; removing a section is a change to `app/lib/source.ts` and the seed.

## Commands

- `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`.
