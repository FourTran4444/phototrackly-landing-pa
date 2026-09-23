'use client';
import { useEffect, useRef, useState } from 'react';
import { Glyph, JoinLink, Wordmark } from './primitives';

const links = [['#how-it-works', 'How it works'], ['#workspace', 'The workspace'], ['#sample-job', 'Sample job'], ['#questions', 'FAQs']];
export default function Navigation() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    function close(event: KeyboardEvent) { if (event.key === 'Escape' && open) { setOpen(false); trigger.current?.focus(); } }
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open]);
  return <header className="pl-header"><div className="pl-wrap pl-nav"><Wordmark /><nav className="pl-desktop-nav" aria-label="Main navigation">{links.map(([href, label]) => <a href={href} key={href}>{label}</a>)}</nav><div className="pl-nav-actions"><JoinLink source="header" /><button ref={trigger} type="button" className="pl-menu" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="pl-mobile-nav" onClick={() => setOpen(!open)}><Glyph name={open ? 'close' : 'menu'} /></button></div></div><nav className="pl-mobile-nav" id="pl-mobile-nav" aria-label="Mobile navigation" hidden={!open}>{links.map(([href, label]) => <a href={href} key={href} onClick={() => setOpen(false)}>{label}<Glyph name="diagonal" /></a>)}</nav></header>;
}
