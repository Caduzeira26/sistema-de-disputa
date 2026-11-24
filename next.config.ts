import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Team/tournament logos are uploaded through Server Actions; the default 1MB
      // made registrations with a normal-sized logo fail. Vercel caps bodies at 4.5MB.
      bodySizeLimit: "4mb",
    },
  },
  async redirects() {
    // The app now lives at disputa.digitamoney.com.br. Anyone still using the old
    // vercel.app address (printed QR posters, bookmarks) is sent to the same page there.
    // The Asaas webhook is left alone so payment notifications are never bounced.
    return [
      {
        source: "/:path((?!api/asaas/webhook$).*)",
        has: [{ type: "host", value: "sistema-de-disputa.vercel.app" }],
        destination: "https://disputa.digitamoney.com.br/:path",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
