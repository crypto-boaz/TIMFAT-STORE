import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig = (phase: string): NextConfig => {
  return {
    reactStrictMode: true,
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
    output: "standalone",
    poweredByHeader: false,
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            { key: "X-Frame-Options", value: "DENY" },
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "Referrer-Policy", value: "same-origin" },
            { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
          ]
        }
      ];
    }
  };
};

export default nextConfig;
