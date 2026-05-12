/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'en.numista.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'numista.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
