import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Silence the workspace-root detection warning from having multiple lockfiles
  outputFileTracingRoot: path.join(__dirname),
  // Prevent webpack from bundling native Node.js packages (.node binaries, Prisma driver adapters)
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-libsql",
    "libsql",
    "@libsql/client",
    "@libsql/win32-x64-msvc",
    "@libsql/darwin-x64",
    "@libsql/linux-x64-gnu",
  ],
  webpack: (config) => {
    config.module.rules.push({
      // Match .md / .txt files AND extensionless text files (LICENSE, NOTICE, CHANGELOG, etc.)
      test: /\.(md|txt)$|(LICENSE|NOTICE|CHANGELOG|AUTHORS|CONTRIBUTORS)$/,
      type: "asset/source",
    });
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self' https://xcelias.com https://*.xcelias.com" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
