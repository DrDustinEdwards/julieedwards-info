// Enforced (Grok audit 2026-10-21, JE-2): report-only had no report endpoint, so nothing was
// ever going to be read. 'unsafe-inline' stays on script-src for Next's inline RSC payload and
// the theme script, and on style-src for inline style props; the policy still limits where
// scripts, images and connections may come from.
const csp = [
  "default-src 'self'",
  "img-src 'self' data: https://content.julieedwards.info https://blog.julieedwards.info",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  "connect-src 'self' https://vitals.vercel-insights.com",
  "font-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "content.julieedwards.info" },
      { protocol: "https", hostname: "blog.julieedwards.info" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};
export default nextConfig;
