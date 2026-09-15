import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { siteUrl } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: 'PhotoTrackly — Every shoot. One workspace.', template: '%s | PhotoTrackly' },
  description: 'We’re building a connected shoot-to-delivery workspace for real-estate photography and property-media teams. Explore the product concept and join early access.',
  openGraph: { type: 'website', siteName: 'PhotoTrackly', title: 'Every shoot. One workspace.', description: 'Less chasing. More breathing room. A connected workspace for real-estate media teams — in development.' },
  twitter: { card: 'summary_large_image', title: 'PhotoTrackly — Every shoot. One workspace.' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f8f9ff' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  </head><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
