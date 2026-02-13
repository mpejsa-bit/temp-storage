/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ['sql.js', 'jsforce'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('sql.js', 'jsforce');
    }
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
