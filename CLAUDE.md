# CLAUDE.md - julieedwards.info
## Read this at the start of every session.

## PROJECT
Campaign site for Julie Edwards, candidate for Bluff Dale ISD School Board.
Next.js App Router + TypeScript. Repo: github.com/DrDustinEdwards/julieedwards-info
Deploy: Vercel, auto on push to main. Static site (no database, no email for now).
Part of the personal-sites family; brand color is forest green (Bluff Dale).

## STRUCTURE
  content/site.ts   - all editable copy and the images object (paste R2 URLs here)
  components/        - section + chrome components
  app/globals.css    - design tokens and styling (--brand-ui #15532E)
  lib/               - dormant supabase client, metadata builder

## IMAGES
Hosted on Cloudflare R2. Until URLs are added to content/site.ts `images`,
sections render green placeholder blocks. To use next/image optimization later,
add the R2 host to next.config.mjs remotePatterns.

## COMMANDS
  npm run dev
  npm run build
  npx tsc --noEmit   (run before every push)

## ABSOLUTE RULES
1. No em dashes. Not one.
2. No cheesy copy: no explore, discover, dive into, journey, compelling, must-read.
3. No emoji in UI. Inline SVG only, no icon libraries.
4. Theming via data-mode (light/dark), localStorage key 'mode'. Never data-theme.
5. Design tokens only. Text sizing in rem. Keep :focus-visible rings.
6. All copy lives in content/site.ts. Metadata via lib/metadata.ts.
7. Fonts: Fraunces (display), Source Serif 4 (body), DM Sans (UI), DM Mono (labels).
8. This is a real candidate's site: keep content factual and faithful to what she
   provides. Do not invent positions, claims, or quotes.

## GIT WORKFLOW
Small focused commits, message says what it does. Run tsc --noEmit before pushing.
