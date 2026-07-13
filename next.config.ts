import type { NextConfig } from "next";

const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS
  ? process.env.ALLOWED_DEV_ORIGINS.split(",").map((s) => s.trim())
  : [];

const nextConfig: NextConfig = {
  // Hide the on-screen dev indicator (bottom-left route/status menu) — it
  // collides with the cone-fit tuner panel. Compile/runtime errors still surface.
  devIndicators: false,
  ...(allowedDevOrigins.length > 0 && { allowedDevOrigins }),
};

export default nextConfig;
