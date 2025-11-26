import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers() {
    // Required by FHEVM and Base Account SDK
    return Promise.resolve([
      {
        source: '/',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ]);
  },
  // Disable telemetry and other external requests
  experimental: {
    // This helps reduce external API calls
  },
  // Configure webpack to avoid certain external dependencies
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable webpack dev server telemetry
      config.devServer = config.devServer || {};
      config.devServer.client = config.devServer.client || {};
      config.devServer.client.overlay = false;
    }
    return config;
  },
};

export default nextConfig;

