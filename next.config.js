/**
 * Next.js configuration to disable bundling of Node built‑in modules that are not
 * available in the client bundle. This resolves build errors caused by the MongoDB
 * driver importing client‑side‑encryption modules (net, child_process, fs/promises,
 * tls, etc.) when a server‑only module is accidentally included in a client component.
 */
module.exports = {
  outputFileTracingRoot: process.cwd(),
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Provide fallbacks for Node core modules that should be excluded from the client bundle.
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        net: false,
        child_process: false,
        fs: false,
        "fs/promises": false,
        tls: false,
        crypto: false,
        path: false,
      };
    }
    return config;
  },
  // Optionally, you can add other Next.js settings here.
};
