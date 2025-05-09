import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["amitavkrishna.com"],
  basePath: "/pulse",
  async rewrites() {
    return [
      {
        source: "/api/:path*", // Note the path includes your basePath
        destination: "http://localhost:3300/api/:path*", // For development
        // For production, you might want to use:
        // destination: process.env.NODE_ENV === 'production' 
        //   ? 'https://your-backend-domain.com/api/:path*'
        //   : 'http://localhost:3300/api/:path*'
      },
    ];
  },
  // Optional: Add publicRuntimeConfig if you need to access these values in your app
  publicRuntimeConfig: {
    apiBaseUrl: process.env.NODE_ENV === 'production'
      ? 'https://amitavkrishna.com'
      : 'http://localhost:3300'
  }
};

export default nextConfig;
