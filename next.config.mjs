/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "content.julieedwards.info" },
      { protocol: "https", hostname: "blog.julieedwards.info" },
    ],
  },
};
export default nextConfig;
