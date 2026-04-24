/** @type {import('next').NextConfig} */
const BASE_URL = process.env.BASE_URL || "http://localhost:8005";

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BASE_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
