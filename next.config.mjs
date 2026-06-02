/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lint se ne pokreće pri buildu (da stil-pravila ne ruše deploy); TypeScript provjere ostaju.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
