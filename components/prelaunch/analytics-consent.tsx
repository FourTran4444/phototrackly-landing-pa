'use client';
import Link from 'next/link';
import Script from 'next/script';
import { useEffect, useState } from 'react';
import { ANALYTICS_CONSENT_KEY, openCookieSettings, track } from '@/lib/analytics';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-0PSP21DKNJ';
export function CookieSettingsButton() { return <button className="pl-footer-link" type="button" onClick={openCookieSettings}>Cookie settings</button>; }
export default function AnalyticsConsent() {
  const [choice, setChoice] = useState<'accepted' | 'declined' | null>(null);
  const [visible, setVisible] = useState(false);
  /* eslint-disable react-hooks/set-state-in-effect -- Synchronize this component with existing browser preferences after hydration. */
  useEffect(() => {
    try { const saved = localStorage.getItem(ANALYTICS_CONSENT_KEY); if (saved === 'accepted' || saved === 'declined') setChoice(saved); else setVisible(true); } catch { /* No optional tracking when browser storage is blocked. */ }
    const reopen = () => setVisible(true);
    const click = (event: MouseEvent) => {
      const el = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-track]') : null;
      if (el?.dataset.track === 'cta_click') track('cta_click', { location: el.dataset.location });
    };
    document.addEventListener('click', click); window.addEventListener('phototrackly:cookie-settings', reopen);
    return () => { document.removeEventListener('click', click); window.removeEventListener('phototrackly:cookie-settings', reopen); };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  function choose(next: 'accepted' | 'declined') {
    try { localStorage.setItem(ANALYTICS_CONSENT_KEY, next); } catch { setVisible(false); return; }
    if (next === 'declined') {
      window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
      // Remove first-party GA cookies, including host- and parent-domain variants.
      for (const part of document.cookie.split(';')) {
        const key = part.trim().split('=')[0]; if (!key.startsWith('_ga')) continue;
        document.cookie = `${key}=; Max-Age=0; path=/`;
        const labels = location.hostname.split('.');
        for (let i = 0; i < labels.length - 1; i++) document.cookie = `${key}=; Max-Age=0; path=/; domain=.${labels.slice(i).join('.')}`;
      }
    }
    setChoice(next); setVisible(false);
    if (next === 'declined' && window.gtag) location.reload();
  }
  function init() {
    window.dataLayer = window.dataLayer || [];
    // gtag's public queue format uses an arguments object.
    // eslint-disable-next-line prefer-rest-params
    window.gtag = function () { window.dataLayer!.push(arguments); };
    window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: location.origin + location.pathname, page_referrer: document.referrer ? new URL(document.referrer).origin : '' });
    window.gtag('event', 'page_view', { page_location: location.origin + location.pathname, page_title: document.title });
  }
  return <>{choice === 'accepted' && /^G-[A-Z0-9]+$/.test(GA_ID) && <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" onReady={init} />}{visible && <section className="pl-cookie" aria-label="Optional analytics cookies"><div><strong>A little insight, with your permission.</strong><p>May we use optional analytics to understand what’s useful? Your form details are never sent to analytics. <Link href="/privacy">Privacy notice</Link></p></div><div><button type="button" onClick={() => choose('declined')}>No thanks</button><button type="button" onClick={() => choose('accepted')}>Allow analytics</button></div></section>}</>;
}
