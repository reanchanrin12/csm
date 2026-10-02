import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../"),
  transpilePackages: ["@csm/contracts"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async rewrites() {
    const backendApi = process.env.INTERNAL_API_URL || "http://localhost:4000/api";
    const backendHost = backendApi.replace(/\/api\/?$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${backendApi}/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendHost}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
