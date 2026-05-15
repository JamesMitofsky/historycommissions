import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["56ff-76-100-174-94.ngrok-free.app"],
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
