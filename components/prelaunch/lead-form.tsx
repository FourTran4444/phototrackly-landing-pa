'use client';
import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';
import { COUNTRIES, ROLES, VOLUMES, type FieldErrors } from '@/lib/lead-schema';
import { track } from '@/lib/analytics';
import { Glyph } from './primitives';

type Receipt = { reference: string; withdrawalToken: string };
export default function LeadForm({ variant }: { variant: 'hero' | 'footer' }) {
  const full = variant === 'footer';
  const form = useRef<HTMLFormElement>(null); const success = useRef<HTMLDivElement>(null);
  const started = useRef(false); const requestId = useRef(''); const fingerprint = useRef('');
  const [pending, setPending] = useState(false); const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState(''); const [receipt, setReceipt] = useState<Receipt | null>(null);
  const id = (name: string) => `${variant}-${name}`;
  function fieldError(name: keyof FieldErrors) { return errors[name] ? <span className="pl-field-error" id={id(`${name}-error`)}>{errors[name]}</span> : null; }
  function start() { if (!started.current) { started.current = true; track('form_start', { location: variant }); } }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return;
    const element = event.currentTarget; const data = new FormData(element);
    const fields = Object.fromEntries(data.entries());
    const currentFingerprint = JSON.stringify(fields);
    // A retry reuses its key; editing any field intentionally starts a new submission.
    if (!requestId.current || fingerprint.current !== currentFingerprint) { requestId.current = crypto.randomUUID(); fingerprint.current = currentFingerprint; }
    setPending(true); setMessage(''); setErrors({}); track('form_submit', { location: variant });
    try {
      const response = await fetch('/api/early-access', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ ...fields, source: variant, requestId: requestId.current, consent: data.get('consent') === 'on' }),
      });
      const body = await response.json();
      if (!response.ok || body.ok !== true || !body.reference || !body.withdrawalToken) {
        setErrors(body.fields || {});
        setMessage(body.error || 'We could not save your registration. Your details are still here; please try again.');
        track('form_error', { location: variant, category: String(response.status) });
        requestAnimationFrame(() => {
          const field = Object.keys(body.fields || {})[0];
          const target = field ? document.getElementById(id(field)) : document.getElementById(id('feedback'));
          target?.focus();
        });
        return;
      }
      setReceipt(body); track('generate_lead', { location: variant });
      requestAnimationFrame(() => success.current?.focus());
    } catch {
      setMessage('We could not confirm your registration. Please check your connection and try again. Retrying will not create a duplicate.');
      track('form_error', { location: variant, category: 'network' });
      requestAnimationFrame(() => document.getElementById(id('feedback'))?.focus());
    } finally { setPending(false); }
  }
  function saveConfirmation() {
    if (!receipt) return;
    const text = `PhotoTrackly early-access registration\nReference: ${receipt.reference}\n\nYour interest is registered. PhotoTrackly is in development; this does not create an account or guarantee immediate access. No payment or mandatory sales call is required. We will contact you about early access.\n\nKeep this private link to remove your registration:\n${location.origin}/early-access/preferences#${receipt.withdrawalToken}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'phototrackly-confirmation.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (receipt) return <div className="pl-form-success" ref={success} tabIndex={-1} role="status"><span className="pl-success-mark"><Glyph name="check" /></span><span className="pl-overline">INTEREST REGISTERED</span><h3>You’re on the list.</h3><p>Thank you for helping shape PhotoTrackly. We’ll contact you about early access as the product develops.</p><p className="pl-small">This is not an account or a guarantee of immediate access. There’s no payment or mandatory sales call.</p><button type="button" className="pl-button" onClick={saveConfirmation}>Save your confirmation<Glyph name="down" /></button><p className="pl-small">Keep your confirmation: it includes your private <Link href={`/early-access/preferences#${receipt.withdrawalToken}`}>registration-removal link</Link>.</p><span className="pl-reference">Reference {receipt.reference}</span></div>;
  return <form ref={form} onSubmit={submit} onFocusCapture={start} className={`pl-form pl-form-${variant}`} aria-label={full ? 'Early-access registration' : 'Quick early-access registration'} aria-busy={pending}>
    {full ? <div className="pl-form-heading"><h3>A better workday starts with your input.</h3><p>Tell us a little about your team. Fields marked * are required.</p></div> : <p className="pl-form-intro">Get on the early-access list.</p>}
    <fieldset disabled={pending}><legend className="pl-sr-only">Your team and contact details</legend><div className="pl-form-grid">
      {full && <label className="pl-field" htmlFor={id('name')}><span>Your name *</span><input id={id('name')} name="name" autoComplete="name" placeholder="Alex Morgan" required maxLength={100} aria-invalid={!!errors.name} aria-describedby={errors.name ? id('name-error') : undefined} />{fieldError('name')}</label>}
      <label className="pl-field" htmlFor={id('email')}><span>Work email *</span><input id={id('email')} name="email" type="email" autoComplete="email" placeholder="you@yourstudio.com" required maxLength={254} aria-invalid={!!errors.email} aria-describedby={errors.email ? id('email-error') : undefined} />{fieldError('email')}</label>
      <label className="pl-field" htmlFor={id('company')}><span>Company *</span><input id={id('company')} name="company" autoComplete="organization" placeholder="Your studio or company" required maxLength={160} aria-invalid={!!errors.company} aria-describedby={errors.company ? id('company-error') : undefined} />{fieldError('company')}</label>
      {full && <><label className="pl-field" htmlFor={id('role')}><span>Your role *</span><select id={id('role')} name="role" required defaultValue="" aria-invalid={!!errors.role} aria-describedby={errors.role ? id('role-error') : undefined}><option value="" disabled>Select your role</option>{ROLES.map(x => <option key={x}>{x}</option>)}</select>{fieldError('role')}</label><label className="pl-field" htmlFor={id('country')}><span>Country *</span><select id={id('country')} name="country" required defaultValue="" autoComplete="country-name" aria-invalid={!!errors.country} aria-describedby={errors.country ? id('country-error') : undefined}><option value="" disabled>Where is your team based?</option>{COUNTRIES.map(x => <option key={x}>{x}</option>)}</select>{fieldError('country')}</label><label className="pl-field" htmlFor={id('volume')}><span>Approx. property jobs / month *</span><select id={id('volume')} name="volume" required defaultValue="" aria-invalid={!!errors.volume} aria-describedby={errors.volume ? id('volume-error') : undefined}><option value="" disabled>Select a range</option>{VOLUMES.map(x => <option key={x}>{x}</option>)}</select>{fieldError('volume')}</label><label className="pl-field pl-field-wide" htmlFor={id('challenge')}><span>Your biggest workflow challenge <small>Optional</small></span><textarea id={id('challenge')} name="challenge" placeholder="Where does a job tend to get stuck? Please don’t include client names, addresses, or other confidential details." rows={3} maxLength={2000} aria-invalid={!!errors.challenge} aria-describedby={errors.challenge ? id('challenge-error') : undefined} />{fieldError('challenge')}</label></>}
    </div>
    <div className="pl-honeypot" aria-hidden="true"><label htmlFor={id('website')}>Leave this field empty<input id={id('website')} name="website" autoComplete="off" tabIndex={-1} /></label></div>
    <label className="pl-consent" htmlFor={id('consent')}><input id={id('consent')} name="consent" type="checkbox" required aria-invalid={!!errors.consent} aria-describedby={errors.consent ? id('consent-error') : undefined} /><span>I agree to be contacted about PhotoTrackly and early access. I can withdraw at any time. <Link href="/privacy">Privacy notice</Link>.</span></label>{fieldError('consent')}
    <button className="pl-button pl-submit" type="submit">{pending ? 'Saving your registration…' : 'Join early access'}{pending ? <span className="pl-spinner" aria-hidden="true" /> : <Glyph name="arrow" />}</button></fieldset>
    <div id={id('feedback')} tabIndex={-1} className={message ? 'pl-feedback' : ''} role="alert">{message}</div>
    <p className="pl-form-note">Free to register. No payment. No mandatory sales call.<br />Registration does not guarantee immediate access.</p>
  </form>;
}
