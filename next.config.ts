import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma 在 Workers 上要走包导出里的 workerd 条件，不能被打进 server bundle。
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  experimental: {
    authInterrupts: true,
    serverActions: {
      bodySizeLimit: "52mb",
    },
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
