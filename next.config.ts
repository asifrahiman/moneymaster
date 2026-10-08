import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Transactions moved to the home page; keep old links and bookmarks working
  // (the query string, e.g. ?range=all&kind=expense, is passed through).
  async redirects() {
    return [{ source: "/transactions", destination: "/", permanent: false }];
  },
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
