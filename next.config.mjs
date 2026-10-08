/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export is used for the production build (`next build` -> ./out, deployed on Vercel).
  // In `next dev` it is switched off, so adding or replacing content files never breaks the dev server.
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
