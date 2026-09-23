/* eslint-disable @next/next/no-page-custom-font -- App Router root layout: this stylesheet is global across all routes, with system-font fallbacks. */
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { siteUrl } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  ...(process.env.VERCEL_ENV === 'preview' ? { robots: { index: false, follow: false } } : {}),
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
  ...(process.env.BING_SITE_VERIFICATION ? { other: { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } } : {}),
  title: { default: 'PhotoTrackly — One tool for the whole property media job.', template: '%s | PhotoTrackly' },
  description: 'One planned workspace for property media orders, scheduling, assignments, files, editing, review, and delivery. Built for US and Australian teams. Join free early access.',
  openGraph: { type: 'website', siteName: 'PhotoTrackly', title: 'One tool for the whole property media job.', description: 'Fewer lost details. Clearer handoffs. One planned workspace for real estate photography and property media teams.' },
  twitter: { card: 'summary_large_image', title: 'PhotoTrackly — One tool for the whole property media job.' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f5f7f4' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  </head><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
