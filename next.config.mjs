/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    domains: [
      "lh3.googleusercontent.com",
      "aigurulab.tech",
      "api.deepgram.com",
      "storage.googleapis.com",
      "firebasestorage.googleapis.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        "node:async_hooks": false,
        "node:events": false,
        "node:util": false,
        "node:buffer": false,
        "node:stream": false,
        "node:path": false,
        "node:fs": false,
        "node:os": false,
        "node:url": false,
        "node:querystring": false,
        "node:crypto": false,
        "node:zlib": false,
        "node:http": false,
        "node:https": false,
        "node:net": false,
        "node:tls": false,
        "node:assert": false,
      };
    }

    // Handle Remotion bundler
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        "@remotion/bundler": "commonjs @remotion/bundler",
        "@remotion/renderer": "commonjs @remotion/renderer",
      });
    }

    // Better chunk handling to prevent ChunkLoadError
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,
            // Create a vendor chunk for node_modules
            vendor: {
              name: "vendor",
              chunks: "all",
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
            },
            // Create a common chunk for shared code
            common: {
              name: "common",
              minChunks: 2,
              chunks: "all",
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
        runtimeChunk: {
          name: "runtime",
        },
      };
    }

    // Better error handling for development
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ["**/node_modules", "**/.next"],
      };
    }

    return config;
  },

  serverExternalPackages: ["@remotion/bundler", "@remotion/renderer"],

  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
    // Better chunk loading
    webpackBuildWorker: true,
  },

  // Error handling
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },

  // Better error handling for development
  ...(process.env.NODE_ENV === "development" && {
    typescript: {
      ignoreBuildErrors: false,
    },
    eslint: {
      ignoreDuringBuilds: false,
    },
  }),
};

export default nextConfig;
