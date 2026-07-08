import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        net: false,
        fs: false,
        "fs/promises": false,
        child_process: false,
        tls: false,
        dns: false,
        crypto: false,
        path: false,
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
    }
    return config;
  },
};

export default nextConfig;
