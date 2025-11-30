/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  optimizeFonts: true,
  // Optimiser le préchargement des polices
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig

