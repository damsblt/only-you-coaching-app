import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  images: {
    // Activer les formats modernes pour de meilleures performances
    formats: ['image/avif', 'image/webp'],
    // Tailles d'appareils pour le responsive
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Qualités d'image disponibles (requis pour Next.js 16)
    qualities: [75, 85, 100],
    // Cache long pour les images optimisées
    minimumCacheTTL: 31536000, // 1 an
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'only-you-coaching.s3.eu-north-1.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  // Rewrites pour permettre l'accès via /admin/* (contourne le middleware)
  async rewrites() {
    return [
      {
        source: '/admin/:path*',
        destination: '/:path*',
      },
    ]
  },
};

export default nextConfig;
