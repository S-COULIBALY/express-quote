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
    ]
  },
  optimizeFonts: true,
  experimental: {
    optimizeCss: true
  },
  webpack: (config) => {
    return config
  }
}

module.exports = nextConfig 