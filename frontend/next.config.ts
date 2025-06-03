// frontend/next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: "/pulse",
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: "http://localhost:3300/api/:path*", // Directly point to backend
            },
        ];
    },
    publicRuntimeConfig: {
        apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    },
};

module.exports = nextConfig;
