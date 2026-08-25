import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000', pathname: '/nmo-images/**' },
      { protocol: 'http', hostname: 'localhost', port: '5000', pathname: '/uploads/**' },
      { protocol: 'https', hostname: '*.s3.amazonaws.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.s3.*.amazonaws.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.digitaloceanspaces.com', pathname: '/**' },
    ],
  },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
