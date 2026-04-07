/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        const apiUrl = process.env.API_URL || 'http://api:4000';
        return [
            { source: '/graphql', destination: `${apiUrl}/graphql` },
            { source: '/upload', destination: `${apiUrl}/upload` },
            { source: '/uploads/:path*', destination: `${apiUrl}/uploads/:path*` },
            { source: '/import', destination: `${apiUrl}/import` },
            { source: '/import/:path*', destination: `${apiUrl}/import/:path*` },
            { source: '/export', destination: `${apiUrl}/export` },
            { source: '/export/:path*', destination: `${apiUrl}/export/:path*` },
            { source: '/auth/:path*', destination: `${apiUrl}/auth/:path*` },
            { source: '/generate-image', destination: `${apiUrl}/generate-image` },
            { source: '/generate-image/:path*', destination: `${apiUrl}/generate-image/:path*` },
        ];
    },
};

export default nextConfig;
