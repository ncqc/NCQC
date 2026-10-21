import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Core performance & security options */
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  /* Security Headers */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  /* URL Rewrites for Submissions Hub (Supports all URL variations) */
  async rewrites() {
    return [
      {
        source: '/Submissions%20Hub',
        destination: '/submissions-hub',
      },
      {
        source: '/Submissions Hub',
        destination: '/submissions-hub',
      },
      {
        source: '/Submissions-Hub',
        destination: '/submissions-hub',
      },
      {
        source: '/submissions-hub',
        destination: '/submissions-hub',
      },
      {
        source: '/submissions%20hub',
        destination: '/submissions-hub',
      },
      {
        source: '/Submissionshub',
        destination: '/submissions-hub',
      },
      {
        source: '/submissionshub',
        destination: '/submissions-hub',
      },
    ];
  },
};

export default nextConfig;
