import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/prelaunch/navigation';
import LeadForm from '@/components/prelaunch/lead-form';
import AnalyticsConsent, { CookieSettingsButton } from '@/components/prelaunch/analytics-consent';
import { Wordmark } from '@/components/prelaunch/primitives';
import type { MarketingPage } from '@/lib/marketing-pages';
import './prelaunch.css';
import './seo-page.css';

export default function SeoPage({ page }: { page: MarketingPage }) {
  return <div className="pl reference-site"><Navigation /><main id="main" className="seo-main">
    <div className="seo-wrap seo-breadcrumb"><Link href="/">PhotoTrackly</Link><span aria-hidden="true">/</span><span>{page.title}</span></div>
    <section className="seo-wrap seo-hero"><div><p className="rf-eyebrow">{page.eyebrow}</p><h1>{page.heading}</h1><p className="seo-intro">{page.introduction}</p><a className="rf-button" href="#early-access" data-track="cta_click" data-location={page.slug}>Join early access <span aria-hidden="true">↗</span></a><p className="seo-status">In development · No payment or mandatory meeting</p></div><figure><Image src={page.image} alt={page.imageAlt} fill sizes="(max-width: 900px) 100vw, 45vw" /><figcaption>Illustrative property media imagery</figcaption></figure></section>
    <section className="seo-wrap seo-context"><p className="rf-eyebrow">THE COORDINATION PROBLEM</p><h2>When work is scattered, status gets harder to see.</h2><p>{page.problem}</p></section>
    <section className="seo-band"><div className="seo-wrap"><p className="rf-eyebrow">A JOB IN PRACTICE</p><h2>One property. One connected story.</h2><p>{page.example}</p><ol className="seo-steps">{page.steps.map((step, index) => <li key={step.title}><span>{String(index + 1).padStart(2, '0')}</span><h3>{step.title}</h3><p>{step.detail}</p></li>)}</ol></div></section>
    <section className="seo-wrap seo-related"><div><p className="rf-eyebrow">EXPLORE THE WORKFLOW</p><h2>See how the pieces fit together.</h2></div><div>{[
      ['real-estate-photography-business-software', 'Business software'],
      ['real-estate-photography-workflow-software', 'Shoot-to-delivery workflow'],
      ['real-estate-photography-scheduling-software', 'Shoot scheduling'],
      ['real-estate-media-production-management', 'Production management'],
    ].filter(([slug]) => slug !== page.slug).map(([slug, label]) => <Link key={slug} href={`/${slug}`}>{label}<span aria-hidden="true">↗</span></Link>)}</div></section>
    <section className="seo-wrap seo-questions"><p className="rf-eyebrow">CLEAR ANSWERS</p><h2>Before you join early access</h2>{page.questions.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
    <section className="seo-signup" id="early-access"><div className="seo-wrap seo-signup-grid"><div><p className="rf-eyebrow">JOIN EARLY ACCESS</p><h2>Help shape PhotoTrackly.</h2><p>We’re inviting real estate photography and property media teams in the United States and Australia to share where their current workflow gets stuck. Registering interest does not create an account or guarantee immediate access.</p></div><LeadForm variant="footer" /></div></section>
  </main><footer><div className="seo-wrap rf-foot-inner"><Wordmark /><p>Property media work, connected.</p><div className="rf-footer-links"><Link href="/privacy">Privacy</Link><CookieSettingsButton /><Link href="/">Home</Link></div></div></footer><AnalyticsConsent /></div>;
}
