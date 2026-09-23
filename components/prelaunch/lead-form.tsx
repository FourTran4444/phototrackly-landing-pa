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
  // Use a full document navigation for the private link: no homepage analytics survives on that page.
  if (receipt) return <div className="pl-form-success" ref={success} tabIndex={-1} role="status"><span className="pl-success-mark"><Glyph name="check" /></span><span className="pl-overline">INTEREST REGISTERED</span><h3>You’re on the list.</h3><p>Thank you for helping shape PhotoTrackly. We’ll contact you about early access as the product develops.</p><p className="pl-small">This is not an account or a guarantee of immediate access. There’s no payment or mandatory sales call.</p><button type="button" className="pl-button" onClick={saveConfirmation}>Save your confirmation<Glyph name="down" /></button><p className="pl-small">Keep your confirmation: it includes your private <a href={`/early-access/preferences#${receipt.withdrawalToken}`}>registration-removal link</a>.</p><span className="pl-reference">Reference {receipt.reference}</span></div>;
  // The reference's compact form layout, with the existing Google receiver and receipts.
  const submitButton = <button className="rf-button pl-submit" type="submit">{pending ? 'Saving your registration…' : 'Join early access'}{pending ? <span className="pl-spinner" aria-hidden="true" /> : <span aria-hidden="true">↗</span>}</button>;
  const input = (name: 'name' | 'email' | 'company', label: string, placeholder: string, required = false) => <label className="pl-field" htmlFor={id(name)}><span className={!full ? 'rf-sr-only' : ''}>{label}{full && (required ? ' *' : <small> Optional</small>)}</span><input id={id(name)} name={name} type={name === 'email' ? 'email' : 'text'} autoComplete={name === 'company' ? 'organization' : name} placeholder={placeholder} required={required} maxLength={name === 'email' ? 254 : name === 'company' ? 160 : 100} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? id(`${name}-error`) : undefined} />{fieldError(name)}</label>;
  const select = (name: 'role' | 'country' | 'volume', label: string, placeholder: string, options: readonly string[]) => <label className="pl-field" htmlFor={id(name)}><span>{label}<small> Optional</small></span><select id={id(name)} name={name} defaultValue="" aria-invalid={!!errors[name]} aria-describedby={errors[name] ? id(`${name}-error`) : undefined}><option value="">{placeholder}</option>{options.map(x => <option key={x}>{x}</option>)}</select>{fieldError(name)}</label>;
  return <form ref={form} method="post" action="/api/early-access" onSubmit={submit} onFocusCapture={start} className={`pl-form pl-form-${variant} ${full ? 'rf-lead-form' : 'rf-quick-form'}`} aria-label={full ? 'Early-access registration' : 'Quick early-access registration'} aria-busy={pending}>
    {full ? <><h3>Register your interest</h3><p>Work email and company are all we need to start.</p></> : <p className="rf-quick-title">Get on the early access list</p>}
    <noscript><p className="pl-feedback">Please enable JavaScript and reload this page to register and receive your private confirmation link.</p></noscript>
    <fieldset disabled={pending}><legend className="rf-sr-only">Your team and contact details</legend><div className={full ? 'rf-form-row' : 'rf-quick-fields'}>
      {input('email', 'Work email', full ? 'you@studio.com' : 'Work email', true)}
      {input('company', 'Company', full ? 'Your media company' : 'Company name', true)}
      {!full && submitButton}
    </div>
    {full && <><div className="rf-form-row">{input('name', 'Your name', 'Your name')}{select('role', 'Your role', 'Select a role', ROLES)}</div>
      <details className="rf-team-details"><summary>Country & monthly jobs <small>Optional</small></summary><div className="rf-form-row">{select('country','Country','Where is your team based?',COUNTRIES)}{select('volume','Approx. property jobs / month','Select a range',VOLUMES)}</div></details>
      <label className="pl-field" htmlFor={id('challenge')}><span>What slows your team down today? <small>Optional</small></span><textarea id={id('challenge')} name="challenge" placeholder="Scheduling, assignments, files, review, delivery…" rows={3} maxLength={2000} aria-invalid={!!errors.challenge} aria-describedby={errors.challenge ? id('challenge-error') : undefined} />{fieldError('challenge')}</label></>}
    <div className="rf-trap" aria-hidden="true"><label htmlFor={id('website')}>Leave this field empty<input id={id('website')} name="website" autoComplete="off" tabIndex={-1} /></label></div>
    <label className={full ? 'rf-consent' : 'rf-quick-consent'} htmlFor={id('consent')}><input id={id('consent')} name="consent" type="checkbox" required aria-invalid={!!errors.consent} aria-describedby={errors.consent ? id('consent-error') : undefined} /><span>I agree to be contacted about PhotoTrackly and early access. I can ask to stop receiving messages at any time. <Link href="/privacy">Privacy notice</Link>.</span></label>{fieldError('consent')}
    {full && submitButton}</fieldset>
    <div id={id('feedback')} tabIndex={-1} className={message ? 'pl-feedback' : ''} role="alert">{message}</div>
    <p className={full ? 'rf-form-note' : 'rf-sr-only'}>Registration does not create an account or guarantee immediate access. Free to register; no payment or mandatory sales call.</p>
  </form>;
}
