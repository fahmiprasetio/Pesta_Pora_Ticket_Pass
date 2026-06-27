import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a minimal standalone server bundle (.next/standalone/server.js)
  // so the Docker image stays small.
  output: "standalone",
};

export default nextConfig;
