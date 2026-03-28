/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  basePath: '/HireAI',
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com', 'storage.googleapis.com'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig
