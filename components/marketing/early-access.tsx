'use client';
import { useState, type FormEvent } from 'react';
import { Icon, Tag } from '@/components/ui';
import { validateRegistration, type Registration } from '@/lib/model';

const DRAFT_KEY = 'phototrackly.early-access.draft.v1';
const empty: Registration = { email: '', company: '', role: '', market: '', website: '' };
export default function EarlyAccess({ enabled }: { enabled: boolean }) {
  const [form, setForm] = useState(empty); const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false); const [error, setError] = useState('');
  const change = (key: keyof Registration, value: string) => { setForm(current => ({ ...current, [key]: value })); setError(''); };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    let payload: Registration;
    try { payload = validateRegistration(form); } catch (e) { setError(e instanceof Error ? e.message : 'Check your details.'); return; }
    setBusy(true);
    try {
      if (enabled) {
        const response = await fetch('/api/early-access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(15000) });
        const result = await response.json() as { ok?: boolean; error?: string };
        if (!response.ok || result.ok !== true) throw new Error(result.error || 'Registration could not be confirmed. Please try again.');
      } else {
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify(payload)); }
        catch { throw new Error('Browser storage is unavailable. Your draft was not saved and no registration was submitted.'); }
      }
      setSuccess(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  }
  function loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) { setError('There is no saved draft in this browser yet.'); return; }
      setForm(validateRegistration(JSON.parse(raw))); setError('');
    } catch { setError('A saved draft could not be loaded. Please enter your details again.'); }
  }
  if (success) return <div className="form-success" role="status"><span className="success-icon"><Icon name="checkCircle" /></span><Tag tone={enabled ? 'stage-5' : 'neutral'}>{enabled ? 'INTEREST REGISTERED' : 'LOCAL DRAFT ONLY'}</Tag><h3>{enabled ? 'Thanks for being part of what’s next.' : 'Your interest draft is saved.'}</h3><p>{enabled ? 'Your registration was accepted by the configured collection service. It does not create an account or guarantee immediate access.' : 'Saved on this device, not sent to PhotoTrackly. This preview has not registered you for early access.'}</p><p className="micro">{form.company} · {form.email}</p><button type="button" className="button button-outline" onClick={() => setSuccess(false)}>Edit your details <Icon name="arrow" /></button></div>;
  return <form onSubmit={submit} method="post" action="/api/early-access" className="early-form"><div className="form-title"><h3>Join early access</h3><Tag>{enabled ? 'IN DEVELOPMENT' : 'PREVIEW'}</Tag></div><fieldset disabled={busy}>
    <label htmlFor="work-email">Work email <span>*</span></label><input id="work-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@yourstudio.com" value={form.email} onChange={e => change('email', e.target.value)} />
    <label htmlFor="company-name">Studio / company name <span>*</span></label><input id="company-name" name="company" autoComplete="organization" required maxLength={120} placeholder="Your property media studio" value={form.company} onChange={e => change('company', e.target.value)} />
    <details className="optional-fields"><summary>Tell us a little more <span>(optional) <Icon name="plus" /></span></summary><div className="form-grid"><div><label htmlFor="early-role">Your role</label><select id="early-role" name="role" value={form.role} onChange={e => change('role', e.target.value)}><option value="">Select your role</option>{['Studio owner', 'Operations coordinator', 'Photographer', 'Editor / reviewer', 'Other'].map(x => <option key={x}>{x}</option>)}</select></div><div><label htmlFor="early-market">Primary market</label><select id="early-market" name="market" value={form.market} onChange={e => change('market', e.target.value)}><option value="">Select your market</option>{['United States', 'Australia', 'Other'].map(x => <option key={x}>{x}</option>)}</select></div></div></details>
    <div className="honeypot" aria-hidden="true"><label htmlFor="website">Leave this field empty</label><input id="website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={e => change('website', e.target.value)} /></div>
    <div className="preview-form-note"><Icon name="info" /><span>{enabled ? 'Your details are submitted to our configured collection service for PhotoTrackly early-access interest and launch follow-up.' : 'Preview mode: saves a draft on this device only. No registration is submitted.'}</span></div>
  </fieldset>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-full" type="submit" disabled={busy}>{busy ? 'Submitting…' : enabled ? 'Join early access' : 'Save early-access draft'}<Icon name="arrow" /></button><span className="form-footnote">No payment. No required meeting. No account created.</span>{!enabled && <button type="button" className="text-link load-draft" onClick={loadDraft}>Load a saved draft <Icon name="repeat" /></button>}</form>;
}
