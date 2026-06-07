/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // When images move to Cloudflare R2, add the bucket/custom domain here to use
  // next/image optimization, e.g.:
  // images: { remotePatterns: [{ protocol: "https", hostname: "assets.julieedwards.info" }] },
};
export default nextConfig;
