
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: [
      "http://localhost:9006", 
      "https://9006-firebase-studio-1747837393667.cluster-duylic2g3fbzerqpzxxbw6helm.cloudworkstations.dev", 
      "http://9006-firebase-studio-1747837393667.cluster-duylic2g3fbzerqpzxxbw6helm.cloudworkstations.dev"
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/internal-email/:path*',
        destination: 'http://localhost:5001/api/email/:path*', // Proxy para API de E-mail
      },
    ]
  },
};

export default nextConfig;
