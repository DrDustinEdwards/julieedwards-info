# Cloudflare best-practices and vendor-first audit: julieedwards-info

Job: job_cb9acc4e20eb. Audited 2026-10-09 against the code in this repo.

## Verdict

This is a purely static site. Next.js 16 App Router on Vercel, no Worker code, no `wrangler.*`, no Cloudflare binding, no form, no mailer, no auth, no API route that reads a request. Per the job's own rule for static sites, only items 1, 6, 8, 9 and 10 apply. Items 2 to 5 and 7 are not applicable (nothing to check). No code change is recommended in this PR; the decisions are listed below.

Not verified: the Capsid reference files (`capsid/research/vendor-replacements.md`, `cloudflare-best-practices.md`) were not read, because the job allowed the Capsid connector for reading the job text only. Vendor links below are the ones named in the job; their content was not re-fetched in this session, so "vendor recommendation" is as stated in the job.

## Per item

### 1. compatibility_date, nodejs_compat, observability, structured logs
- Code: none. No `wrangler.toml`/`wrangler.jsonc`; the site deploys to Vercel (`CLAUDE.md`: "Legacy stack exception ... Not being migrated").
- Vendor: [Workers Best Practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/).
- Verified: not applicable. Bundle change: none. Risk: none. Recommendation: nothing to do while the site stays on Vercel. If it ever moves, start from a current compatibility_date, observability with logs and traces and an explicit head_sampling_rate.

### 6. Contact forms, Turnstile, email
- Code: `components/Contact.tsx` renders a `mailto:` link, a Facebook link and a map link. No form, no endpoint, no mail sent. `CLAUDE.md` says "no email for now".
- Vendor: [Turnstile](https://developers.cloudflare.com/turnstile/), [Email Routing](https://developers.cloudflare.com/email-routing/).
- Verified: yes, by reading the component and grepping for `fetch(`, `form`, `turnstile`. Bundle: none. Risk: none. Recommendation: nothing now. If a contact form is ever added, use Turnstile plus Email Routing / Cloudflare email sending, not a hand-built check or mailer.

### 8. Markdown, feeds, sitemaps, charts
- Code: `app/sitemap.ts` and `app/robots.ts` use Next's built-in `MetadataRoute` (framework-provided, not hand-written XML). `app/llms.txt/route.ts` builds a short text template from `content/site.ts`. No markdown rendering, no feed, no chart.
- Vendor/library: Prelum and Enarratio are for markdown/feeds; none is needed.
- Verified: yes. Bundle: none. Risk: none. Recommendation: no change. Minor nit, not worth a PR: `sitemap.ts` sets `lastModified: new Date()`, so the date changes on every build and tells crawlers nothing. Fixing it needs a real last-edited date, which is content only Julie or Dustin can supply (see DECIDE 2).

### 9. Rate limiting
- Code: none. No dynamic endpoint exists to rate limit.
- Vendor: [Workers Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/), WAF rate limiting rules.
- Verified: yes. Recommendation: nothing now. Any future endpoint should use the binding or a WAF rule, not KV counters.

### 10. Static Assets vs Pages; shared packages
- Code: hosted on Vercel, not Cloudflare Pages, so there is no Pages-to-Workers-Static-Assets migration to do. No local copies of Capsomer, security-headers, rate-limit or site-helpers exist as files, but `next.config.mjs` hand-writes the security headers and a Report-Only CSP, which is what the shared `security-headers` package covers.
- Verified: yes for the headers block; I did not read the shared package, so whether it is usable from `next.config.mjs` is unverified. Bundle: none (build-time config). Risk: low-medium, because the headers include a CSP tuned to Vercel analytics hosts (`va.vercel-scripts.com`, `vitals.vercel-insights.com`) and the R2 image hosts. Recommendation: DECIDE 3.

## Other findings (outside the checklist, for the same pass)
- `lib/supabase.ts` is dormant: nothing imports it (grep confirmed), yet `@supabase/supabase-js` is a production dependency. It adds install weight and audit surface but no client bundle weight (tree-shaken, never imported). The file's comment says it is deliberately kept for a possible admin area.
- CSP is still `Report-Only` per the comment in `next.config.mjs`; there is no report endpoint configured, so no report stream exists to become "clean". Enforcing it is a Vercel-side decision as well.
- `package.json` has `"lint": "next lint"` but no ESLint config or dependency, and there is no CI workflow in the repo (no `.github/`). The job's item 4 (no-floating-promises) has no Worker code to apply to.

## DECIDE points

1. **Remove the dormant Supabase dependency?** Plain explanation: the site carries a database library and a helper file that nothing uses. Recommendation: leave it for now. `CLAUDE.md` and the file comment record it as a deliberate placeholder for a future admin area, and removing it is a product decision, not a cleanup I should make unasked. If Dustin wants it gone, delete `lib/supabase.ts`, `.env.local.example` entries and the dependency in one small PR.
2. **Give the sitemap a real `lastModified`?** Plain explanation: today it says "modified now" on every deploy. Recommendation: set it from a date constant in `content/site.ts` that is bumped when copy changes. Low value; optional.
3. **Replace the hand-written security headers with the shared `security-headers` package?** Recommendation: not worth it on Vercel. It only pays off if the site moves to a Worker, which `capsid/decisions.md` says it will not.
4. **Add CI (typecheck + build) and fix `lint`?** Recommendation: yes, a small separate job. `npx tsc --noEmit` is currently only a manual ritual from `CLAUDE.md`, and `next lint` is configured without ESLint.

## Steps for Dustin
None required. No Cloudflare resource, secret, setting or deploy was touched or needed.
