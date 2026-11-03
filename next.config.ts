import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";
import { projectOrigin } from "./src/lib/env";

// Images uploaded through the admin are served from Supabase Storage's public bucket.
const supabaseUrl = projectOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
const storagePattern = supabaseUrl ? [new URL("/storage/v1/object/public/**", supabaseUrl)] : [];

// Opening the dev server from a phone: on the same Wi-Fi (this computer's LAN address) or through a
// forwarded port / tunnel. Development only; production keeps Next's same-origin defaults.
const isDev = process.env.NODE_ENV === "development";
const lanHosts = Object.values(networkInterfaces())
  .flat()
  .filter((i) => i && i.family === "IPv4" && !i.internal)
  .map((i) => i!.address);
const tunnelHosts = [
  "**.devtunnels.ms", // VS Code / Cursor "Ports" panel
  "*.ngrok-free.app",
  "*.ngrok.app",
  "*.trycloudflare.com",
  "*.loca.lt",
  // Anything else: ALLOWED_DEV_HOSTS=my-tunnel.example.com,other.host in .env.local
  ...(process.env.ALLOWED_DEV_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean),
];

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: storagePattern,
    formats: ["image/avif", "image/webp"],
  },
  // Lets the phone load the dev server's scripts (blocked for non-localhost origins by default).
  allowedDevOrigins: isDev ? [...lanHosts, ...tunnelHosts] : [],
  experimental: {
    serverActions: {
      // Admin uploads go through Server Actions; files are capped at 10 MB there, plus form overhead.
      bodySizeLimit: "11mb",
      // Through a tunnel the page's origin differs from the host Next sees, which Next treats as
      // CSRF. Trust the tunnel domains, in development only.
      allowedOrigins: isDev ? tunnelHosts : [],
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
