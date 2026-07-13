/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'github.com' }
    ]
  },
  experimental: {
    // Server actions enabled by default in Next.js 15
  }
};

module.exports = nextConfig;
