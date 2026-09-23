import type { NextConfig } from 'next';
import { IMAGES } from './lib/images';

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      new URL('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?fit=crop&w=1800&q=85'),
      new URL('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?fit=crop&w=1800&q=85'),
      ...Object.values(IMAGES).map(value => new URL(value)),
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    ] }];
  },
};
export default config;
