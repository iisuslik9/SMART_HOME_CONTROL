/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: 'loose'
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fullySpecified = false
    }
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto'
    })
    return config
  }
}

module.exports = nextConfig
