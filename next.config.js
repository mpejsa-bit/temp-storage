/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["sql.js"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("sql.js");
    }
    return config;
  },
};

module.exports = nextConfig;
