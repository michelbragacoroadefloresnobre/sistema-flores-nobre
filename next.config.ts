import "@/lib/env";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "nobre-coroa-fotos.s3.us-east-1.amazonaws.com",
        protocol: "https",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        hostname: "wowbouquet.com",
        protocol: "https",
      },
    ],
  },
  reactCompiler: false,
};

export default nextConfig;
