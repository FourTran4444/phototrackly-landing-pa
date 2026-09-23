'use client';
import { useEffect, useRef, useState } from 'react';
import { Glyph, Wordmark } from './primitives';
const links = [['/#how', 'How it works'], ['/#features', 'What we’re building'], ['/#faq', 'FAQ']];
export default function Navigation() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape' && open) { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open]);
  return <><header className="rf-site-header"><Wordmark /><nav aria-label="Main navigation">{links.map(([href, label]) => <a href={href} key={href}>{label}</a>)}<a className="rf-button rf-small" href="#early-access" data-track="cta_click" data-location="header">Join early access<span aria-hidden="true">↗</span></a><button ref={trigger} type="button" className="rf-menu" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="pl-mobile-nav" onClick={() => setOpen(!open)}><Glyph name={open ? 'close' : 'menu'} /></button></nav></header><nav id="pl-mobile-nav" className="rf-mobile-nav" aria-label="Mobile navigation" hidden={!open}>{links.map(([href,label]) => <a href={href} key={href} onClick={() => setOpen(false)}>{label}<span aria-hidden="true">↗</span></a>)}</nav></>;
}
