import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Read version from root package.json (single source of truth)
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootPackageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf8')
);
const appVersion = `v${rootPackageJson.version}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
  // In development, we use rewrites to proxy to the backend
  ...(process.env.NODE_ENV !== 'production' ? {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://127.0.0.1:1337/api/:path*',
        },
        {
          source: '/v1/:path*',
          destination: 'http://127.0.0.1:1337/v1/:path*',
        },
      ];
    },
  } : {}),
}

export default nextConfig
