/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com"],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Better caching
  generateEtags: true,

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
          // Performance headers
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // API routes caching
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, s-maxage=300",
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

    // Performance optimizations for production
    if (!dev) {
      // Enable tree shaking
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
            },
            common: {
              name: "common",
              minChunks: 2,
              chunks: "all",
              enforce: true,
            },
          },
        },
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

    return config;
  },

  serverExternalPackages: ["@remotion/bundler", "@remotion/renderer"],

  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },

  // Bundle analyzer (only in development)
  ...(process.env.ANALYZE === "true" && {
    webpack: (config) => {
      const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: "static",
          openAnalyzer: false,
        })
      );
      return config;
    },
  }),
};

export default nextConfig;

// Trigger rebuild timestamp: 2025-12-25
