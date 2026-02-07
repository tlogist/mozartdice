import type { NextConfig } from "next";

const shouldStaticExport = process.env.NEXT_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(shouldStaticExport ? { output: "export" as const } : {}),
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
