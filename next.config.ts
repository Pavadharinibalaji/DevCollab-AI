import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  // Provide empty fallbacks for Node core modules and optional MongoDB deps that cause client‑side build errors.
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      net: false,
      fs: false,
      child_process: false,
      tls: false,
      dns: false,
      "timers/promises": false,
      timers: false,
      async_hooks: false,
      // optional MongoDB encryption and auth modules
      kerberos: false,
      "@mongodb-js/zstd": false,
      "@aws-sdk/credential-providers": false,
      "gcp-metadata": false,
      snappy: false,
      socks: false,
      "mongodb-client-encryption": false,
    };
    return config;
  },
};

export default nextConfig;
