import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navigation from '@/components/prelaunch/navigation';
import LeadForm from '@/components/prelaunch/lead-form';
import AnalyticsConsent, { CookieSettingsButton } from '@/components/prelaunch/analytics-consent';
import { Wordmark } from '@/components/prelaunch/primitives';
import { getResource, resourceSlugs, resources } from '@/lib/resources';
import '@/components/marketing/prelaunch.css';
import '@/components/marketing/seo-page.css';

export const dynamicParams = false;
export function generateStaticParams() { return resourceSlugs.map(slug => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const item = getResource(slug);
  if (!item) return {};
  return { title: item.title, description: item.description, alternates: { canonical: `/resources/${slug}` }, openGraph: { title: item.title, description: item.description, url: `/resources/${slug}` } };
}
export default async function ResourceDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const item = getResource(slug); if (!item) notFound();
  return <div className="pl reference-site"><Navigation /><main id="main" className="seo-main">
    <div className="seo-wrap seo-breadcrumb"><Link href="/">PhotoTrackly</Link><span aria-hidden="true">/</span><Link href="/resources">Resources</Link><span aria-hidden="true">/</span><span>{item.title}</span></div>
    <article className="seo-wrap resource-article"><header><p className="rf-eyebrow">PRACTICAL STUDIO GUIDE · {item.updated}</p><h1>{item.title}</h1><p className="seo-intro">{item.intro}</p><p className="resource-note">An operational template for property media teams. Adapt it to your services, client agreements and local requirements.</p></header>
      <figure className="resource-image"><Image src="/images/reference/on-site.webp" alt="Photographer working at a property shoot" fill sizes="(max-width: 900px) 100vw, 800px" /><figcaption>Illustrative property media imagery</figcaption></figure>
      {item.sections.map(section => <section key={section.heading}><h2>{section.heading}</h2><p>{section.body}</p><ul>{section.items.map(text => <li key={text}>{text}</li>)}</ul></section>)}
      <aside className="resource-takeaway"><h2>One question to check</h2><p>{item.takeaway}</p></aside>
    </article>
    <section className="seo-wrap seo-related"><div><p className="rf-eyebrow">KEEP EXPLORING</p><h2>More practical resources</h2></div><div>{resources.filter(other => other.slug !== slug).map(other => <Link key={other.slug} href={`/resources/${other.slug}`}>{other.title}<span aria-hidden="true">↗</span></Link>)}<Link href="/real-estate-photography-workflow-software">Explore the planned PhotoTrackly workflow<span aria-hidden="true">↗</span></Link></div></section>
    <section className="seo-signup" id="early-access"><div className="seo-wrap seo-signup-grid"><div><p className="rf-eyebrow">JOIN EARLY ACCESS</p><h2>Help shape a connected workflow.</h2><p>PhotoTrackly is in development for real estate photography and property media teams. Registering interest does not create an account or guarantee immediate access.</p></div><LeadForm variant="footer" /></div></section>
  </main><footer><div className="seo-wrap rf-foot-inner"><Wordmark /><p>Property media work, connected.</p><div className="rf-footer-links"><Link href="/privacy">Privacy</Link><CookieSettingsButton /><Link href="/">Home</Link></div></div></footer><AnalyticsConsent /></div>;
}
