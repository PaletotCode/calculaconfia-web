/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    domains: ["i.imgur.com", "placehold.co"],
  },
};

module.exports = nextConfig;
