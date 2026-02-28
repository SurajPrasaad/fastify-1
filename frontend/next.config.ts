import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "placeholder-media.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  allowedDevOrigins: ["*.trycloudflare.com"],
};


export default nextConfig;
