import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SeoPage from '@/components/marketing/seo-page';
import { getMarketingPage, marketingPageSlugs } from '@/lib/marketing-pages';

export const dynamicParams = false;
export function generateStaticParams() { return marketingPageSlugs.map(slug => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getMarketingPage(slug);
  if (!page) return {};
  return { title: page.title, description: page.description, alternates: { canonical: `/${slug}` }, openGraph: { title: page.title, description: page.description, url: `/${slug}` } };
}
export default async function MarketingPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getMarketingPage(slug);
  if (!page) notFound();
  return <SeoPage page={page} />;
}
