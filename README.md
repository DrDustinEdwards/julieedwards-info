# julieedwards.info

Campaign site for Julie Edwards, candidate for Bluff Dale ISD School Board.
Next.js (App Router) + TypeScript, static, deployed on Vercel (auto-deploys on push to main).

## Run locally
    npm install
    npm run dev        # http://localhost:3000

## Edit content
Everything is in content/site.ts: the platform pillars, About paragraphs,
experience sections, contact email, Facebook link, and the `images` object
(R2 URLs; an empty one shows a green placeholder). A new image host also goes
in next.config.mjs (`remotePatterns` and the CSP `img-src`).
