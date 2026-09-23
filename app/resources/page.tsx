import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/prelaunch/navigation';
import LeadForm from '@/components/prelaunch/lead-form';
import AnalyticsConsent, { CookieSettingsButton } from '@/components/prelaunch/analytics-consent';
import { Wordmark } from '@/components/prelaunch/primitives';
import { resources } from '@/lib/resources';
import '@/components/marketing/prelaunch.css';
import '@/components/marketing/seo-page.css';

export const metadata: Metadata = { title: 'Resources for Property Media Teams', description: 'Practical property media job checklists and templates for shoot planning, photographer handoffs, editing review and delivery.', alternates: { canonical: '/resources' } };
export default function ResourcesPage() {
  return <div className="pl reference-site"><Navigation /><main id="main" className="seo-main"><div className="seo-wrap seo-breadcrumb"><Link href="/">PhotoTrackly</Link><span aria-hidden="true">/</span><span>Resources</span></div>
    <section className="seo-wrap resource-hub"><p className="rf-eyebrow">RESOURCES FOR PROPERTY MEDIA TEAMS</p><h1>Practical tools for the work around a shoot.</h1><p className="seo-intro">Checklists and templates for coordinating real estate photography and property media jobs. Use them with your existing tools today; adapt them to how your team works.</p><div className="resource-grid">{resources.map((item, index) => <article key={item.slug}><span>0{index + 1} / GUIDE</span><h2><Link href={`/resources/${item.slug}`}>{item.title}</Link></h2><p>{item.description}</p><Link href={`/resources/${item.slug}`}>Read guide <span aria-hidden="true">↗</span></Link></article>)}</div></section>
    <section className="seo-signup" id="early-access"><div className="seo-wrap seo-signup-grid"><div><p className="rf-eyebrow">JOIN EARLY ACCESS</p><h2>A future home for the whole job.</h2><p>We’re building PhotoTrackly for growing property media teams in the US and Australia. Join early access to tell us which handoff is hardest to manage. No payment or mandatory meeting.</p></div><LeadForm variant="footer" /></div></section>
  </main><footer><div className="seo-wrap rf-foot-inner"><Wordmark /><p>Property media work, connected.</p><div className="rf-footer-links"><Link href="/privacy">Privacy</Link><CookieSettingsButton /><Link href="/">Home</Link></div></div></footer><AnalyticsConsent /></div>;
}
