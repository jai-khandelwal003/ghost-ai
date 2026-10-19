import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Clerk profile images (collaborator avatars).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
