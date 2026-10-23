/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mind-map cloud sync uses secure Next.js route handlers on Vercel.
  // Do not set `output: 'export'`: static export cannot run /api/mindmaps.
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
