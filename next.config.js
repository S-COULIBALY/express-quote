/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com'
      },
      {
        protocol: 'https',
        hostname: 'maps.gstatic.com'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      }
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@heroicons/react', '@headlessui/react'],
    serverComponentsExternalPackages: ['react-dom/server'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  compress: true,
  async redirects() {
    return [
      // Ajoutez des redirections si nécessaire
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate'
          }
        ]
      },
      {
        source: '/(.*).(jpg|jpeg|png|svg|webp|avif|css|js)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000
      }
    }
    // Exclure react-dom/server du bundle client
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'react-dom/server': false,
      }
    }
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    }
    return config
  },
  reactStrictMode: false, // Désactivé pour éviter les double renders en dev
  poweredByHeader: false,
}

module.exports = nextConfig 