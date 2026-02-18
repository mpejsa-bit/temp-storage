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
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
