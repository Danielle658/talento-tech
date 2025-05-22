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
      "http://localhost:3000", // Default Next.js dev port
      "http://localhost:9005", // Your current dev port
      "https://9005-firebase-studio-1747837393667.cluster-duylic2g3fbzerqpzxxbw6helm.cloudworkstations.dev" // Origin from the log
    ],
  },
};

export default nextConfig;
