import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['fumadocs-ui'],
  // CSS配置
  experimental: {
    cssChunking: 'strict',
  },
  // 禁用CSS Modules的纯选择器校验
  webpack: (config, { dev, isServer }) => {
    // 找到CSS loader配置并修其选项
    config.module.rules.forEach((rule) => {
      if (rule.oneOf) {
        rule.oneOf.forEach((loader) => {
          if (loader.use && Array.isArray(loader.use)) {
            loader.use.forEach((use) => {
              if (use.loader && use.loader.includes('css-loader')) {
                if (use.options && use.options.modules) {
                  // 禁用纯选择器模式
                  use.options.modules.mode = 'local';
                  use.options.modules.pure = false;
                }
              }
            });
          }
        });
      }
    });

    return config;
  },
  async rewrites() {
    const apiUrl = 'http://localhost:5085/'

    // 如果NEXT_PUBLIC_API_URL环境变量有值则使用
    if (process.env?.NEXT_PUBLIC_API_URL) {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
        },
      ];
    }

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`
      },
    ];
  },
};

export default withMDX(nextConfig);