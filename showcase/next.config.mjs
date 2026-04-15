/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiUrl = process.env.API_URL || 'http://api:4000';
    return [
      { source: '/graphql', destination: `${apiUrl}/graphql` },
      { source: '/uploads/:path*', destination: `${apiUrl}/uploads/:path*` },
      { source: '/upload', destination: `${apiUrl}/upload` },
      { source: '/auth/:path*', destination: `${apiUrl}/auth/:path*` },
      { source: '/showcase/export', destination: `${apiUrl}/showcase/export` },
      { source: '/showcase/import', destination: `${apiUrl}/showcase/import` },
    ];
  },
};

export default nextConfig;
