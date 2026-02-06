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
  // Fix: Set turbopack root
  turbopack: {
    // root: __dirname, // これが制限を強めすぎていた可能性があるので削除またはパスを調整
  },
  // Fix: Allow cross-origin requests from localhost in development
  allowedDevOrigins: ['http://127.0.0.1:1337', 'http://localhost:1337'],

  // Experimental: Optimize package imports for faster compilation
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
      'recharts',
    ],
  },
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
