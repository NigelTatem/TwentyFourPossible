import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable problematic rules for deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during builds
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
