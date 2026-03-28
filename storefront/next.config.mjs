/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        const apiUrl = process.env.API_URL || 'http://api:4000';
        return [
            { source: '/graphql', destination: `${apiUrl}/graphql` },
            { source: '/uploads/:path*', destination: `${apiUrl}/uploads/:path*` },
        ];
    },
};

export default nextConfig;
