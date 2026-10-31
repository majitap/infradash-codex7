import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Static export for GitHub Pages (https://majitap.github.io/infradash-codex7/)
  output: "export",
  basePath: "/infradash-codex7",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // cacheComponents / partialPrefetching (PPR) are not supported with output: "export"
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
