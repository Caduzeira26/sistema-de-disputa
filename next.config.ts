import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Team/tournament logos are uploaded through Server Actions; the default 1MB
      // made registrations with a normal-sized logo fail. Vercel caps bodies at 4.5MB.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
