export const ANALYTICS_CONSENT_KEY = 'phototrackly.analytics-consent.v1';
type EventName = 'cta_click' | 'form_start' | 'form_submit' | 'form_error' | 'generate_lead' | 'sample_stage_view' | 'board_filter' | 'faq_open';
declare global { interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; } }
export function track(event: EventName, params: { location?: string; stage?: string; category?: string; question?: string } = {}) {
  try {
    if (localStorage.getItem(ANALYTICS_CONSENT_KEY) !== 'accepted') return;
    // Never pass form values, email, company, names, URLs, or free text to analytics.
    window.gtag?.('event', event, params);
  } catch { /* Analytics must never block registration or page controls. */ }
}
export function openCookieSettings() { window.dispatchEvent(new Event('phototrackly:cookie-settings')); }
