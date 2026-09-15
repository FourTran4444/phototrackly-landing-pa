'use client';
/* eslint-disable @next/next/no-img-element -- User-supplied hotlinks need a client-side fallback, without an image proxy. */
import Link from 'next/link';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { IMAGES } from '@/lib/images';
import { initials, jobStatus, TEAM, type Job } from '@/lib/model';

const paths: Record<string, string> = {
  arrow: 'M4 12h16m-6-6 6 6-6 6', arrowUp: 'M7 17 17 7M7 7h10v10', chevron: 'm9 5 7 7-7 7', down: 'm6 9 6 6 6-6',
  camera: 'M3 7h5l2-3h4l2 3h5v14H3Zm13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  aperture: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM8 4l5 8m7-5H10m10 10-5-9m-1 13-5-9m-5 5h10M4 7l5 9',
  grid: 'M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm11 0h7v7h-7Z',
  board: 'M3 4h18v16H3ZM9 4v16m6-16v16M5 7h2m4 0h2m4 0h2', list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2',
  check: 'm5 12 4 4L19 6', checkCircle: 'M21 11v1a9 9 0 1 1-5.3-8.2M9 11l3 3L22 4',
  calendar: 'M8 2v4m8-4v4M3 10h18M3 4h18v17H3Zm4 10h2m4 0h2m2 0h1m-10 4h2m4 0h2',
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.9M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm5-3.9a4 4 0 0 1 0 7.8',
  user: 'M20 21v-2a7 7 0 0 0-14 0v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  folder: 'M3 7V4h6l2 3h10v13H3Z', file: 'M14 2H4v20h16V8Zm0 0v6h6M8 13h8m-8 4h5',
  upload: 'M12 16V3m-5 5 5-5 5 5M3 16v5h18v-5', download: 'M12 3v13m-5-5 5 5 5-5M3 16v5h18v-5',
  send: 'm22 2-7 20-4-9L2 9Zm0 0L11 13', brush: 'm14 3 7 7-9 9-7-7Zm-9 9c-4 0-2 6-4 7 4 1 7 0 7-4',
  eye: 'M2 12s3-8 10-8 10 8 10 8-3 8-10 8S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  layers: 'm12 3 10 6-10 6L2 9Zm-10 12 10 6 10-6M2 12l10 6 10-6', plus: 'M12 5v14M5 12h14', minus: 'M5 12h14', close: 'm6 6 12 12M6 18 18 6',
  search: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-2 5 6 6', filter: 'M4 7h16M7 12h10m-7 5h4',
  lock: 'M5 10h14v12H5Zm3 0V6a4 4 0 0 1 8 0v4M12 15v3',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4',
  link: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2m3 6a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3a17 17 0 0 1 0 18 17 17 0 0 1 0-18Z',
  message: 'M21 3H3v15h5l4 4 4-4h5ZM7 8h10M7 12h6', repeat: 'm17 2 4 4-4 4M3 11V6h18M7 22l-4-4 4-4m14-1v5H3',
  phone: 'M6 2h12v20H6Zm5 17h2', menu: 'M3 6h18M3 12h18M3 18h18',
  info: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 11v6m0-10h.01', expand: 'M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5',
};
export function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.grid} /></svg>;
}
export function Brand({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`brand ${light ? 'brand-light' : ''}`} aria-label="PhotoTrackly home"><span className="brand-mark"><Icon name="camera" /></span><span>Photo<span className="brand-accent">Trackly</span><span className="brand-period">.</span></span></Link>;
}
export function Photo({ source = 'villa', alt, className = '', priority = false }: { source?: keyof typeof IMAGES; alt: string; className?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  return <img src={failed ? '/photo-placeholder.svg' : IMAGES[source]} alt={failed ? `${alt}. The illustrative source image is currently unavailable.` : alt} className={className} width="1200" height="800" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" onError={() => { if (!failed) setFailed(true); }} />;
}
export function Eyebrow({ children, icon = 'aperture', orange = false }: { children: ReactNode; icon?: string; orange?: boolean }) {
  return <div className={`eyebrow ${orange ? 'orange' : ''}`}><Icon name={icon} />{children}</div>;
}
export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) { return <span className={`pill ${tone}`}><span className="dot" />{children}</span>; }
export function Status({ job }: { job: Job }) { return <Tag tone={`stage-${job.stage}`}>{jobStatus(job)}</Tag>; }
export function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  const index = Math.max(0, (TEAM as readonly string[]).indexOf(name));
  return <span className={`avatar av-${index} ${small ? 'small' : ''}`} title={name || 'Unassigned'}>{initials(name)}</span>;
}
export function Empty({ title, children, icon = 'folder' }: { title: string; children?: ReactNode; icon?: string }) {
  return <div className="empty-state"><Icon name={icon} /><h3>{title}</h3>{children && <p>{children}</p>}</div>;
}
export function Tabs({ labels, index, onChange, prefix, label, className = '' }: { labels: string[]; index: number; onChange: (index: number) => void; prefix: string; label: string; className?: string }) {
  return <div className={`tabs ${className}`} role="tablist" aria-label={label}>{labels.map((text, i) => <button key={text} type="button" role="tab" id={`${prefix}-tab-${i}`} aria-controls={`${prefix}-panel`} aria-selected={index === i} tabIndex={index === i ? 0 : -1} onClick={() => onChange(i)} onKeyDown={event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? labels.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + labels.length) % labels.length;
    onChange(target);
    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[target]?.focus({ preventScroll: true });
  }}>{text}</button>)}</div>;
}
export function Dialog({ title, children, onClose, wide = false, drawer = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean; drawer?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null); const titleId = useId();
  useEffect(() => {
    const dialog = ref.current; const oldOverflow = document.body.style.overflow;
    dialog?.showModal(); document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = oldOverflow; };
  }, []);
  return <dialog ref={ref} className={`modal ${wide ? 'modal-wide' : ''} ${drawer ? 'job-drawer' : ''}`} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal-inner"><div className="modal-heading"><div><span className="mono orange">PHOTOTRACKLY / PREVIEW</span><h2 id={titleId}>{title}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button></div>{children}</div>
  </dialog>;
}
export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return <div className="toast-region" role="status" aria-live="polite"><div className="toast"><Icon name="info" /><span>{message}</span><button className="icon-button" type="button" aria-label="Dismiss notification" onClick={onClose}><Icon name="close" /></button></div></div>;
}
