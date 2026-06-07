# julieedwards.info

Campaign site for Julie Edwards, candidate for Bluff Dale ISD School Board.
Next.js (App Router) + TypeScript, deployed on Vercel. Static site, forest-green theme.

## Run locally
    npm install
    npm run dev        # http://localhost:3000

## Edit content
Everything is in content/site.ts: the platform pillars, About paragraphs,
experience sections, contact email, Facebook link, and the images object.

## Images (Cloudflare R2)
Paste your R2 URLs into the `images` object in content/site.ts:
  hero     - classroom photo (hero background)
  about    - the bobcat photo
  portrait - candidate photo (contact section)
  flyer    - campaign flyer PDF (Download Flyer button)
Until then, those areas show green placeholders. To use next/image optimization,
add your R2 hostname to next.config.mjs remotePatterns.

## Deploy
1. Push to github.com/DrDustinEdwards/julieedwards-info
2. Import to Vercel (auto-detects Next.js, auto-deploys on push)
3. Point julieedwards.info at it via your DNS (Cloudflare) when ready, or use the
   .vercel.app URL while building.

## Notes
- Static: no database, no email, no contact form.
- If an admin area is ever wanted, this site joins the shared personal Supabase
  project as the `julie` tenant (NEXT_PUBLIC_SITE_KEY).
