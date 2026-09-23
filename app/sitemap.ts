import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';
export default function sitemap(): MetadataRoute.Sitemap { if (process.env.VERCEL_ENV === 'preview') return []; return [{ url: siteUrl(), changeFrequency: 'monthly', priority: 1 }, { url: `${siteUrl()}/privacy`, changeFrequency: 'yearly', priority: 0.2 }]; }
