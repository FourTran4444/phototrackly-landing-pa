import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';
import { marketingPageSlugs } from '@/lib/marketing-pages';
export default function sitemap(): MetadataRoute.Sitemap { return [{ url: siteUrl(), changeFrequency: 'monthly', priority: 1 }, { url: `${siteUrl()}/privacy`, changeFrequency: 'yearly', priority: 0.2 }, ...marketingPageSlugs.map(slug => ({ url: `${siteUrl()}/${slug}`, changeFrequency: 'monthly' as const, priority: 0.8 }))]; }
