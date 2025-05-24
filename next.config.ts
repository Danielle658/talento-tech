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
  // Removido o bloco experimental para evitar erro de configuração
  // experimental: {
  //   allowedDevOrigins: [
  //     "http://localhost:9006",
  //     "https://9006-firebase-studio-1747837393667.cluster-duylic2g3fbzerqpzxxbw6helm.cloudworkstations.dev",
  //     "http://9006-firebase-studio-1747837393667.cluster-duylic2g3fbzerqpzxxbw6helm.cloudworkstations.dev",
  //   ],
  // },
};

export default nextConfig;
