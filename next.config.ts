import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.district.in",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "assets-in.bmscdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/home",
        destination: "/",
      },
      {
        source: "/now-showing",
        destination: "/",
      },
      {
        source: "/coming-soon",
        destination: "/",
      },
      {
        source: "/features",
        destination: "/",
      },
      {
        source: "/about",
        destination: "/",
      },
      {
        source: "/gallery",
        destination: "/",
      },
      {
        source: "/contact",
        destination: "/",
      },
    ];
  },
};

export default nextConfig;
