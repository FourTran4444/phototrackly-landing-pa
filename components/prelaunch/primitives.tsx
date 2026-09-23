import Link from 'next/link';
import type { ReactNode } from 'react';

const paths: Record<string, string> = {
  arrow: 'M4 12h16m-6-6 6 6-6 6', diagonal: 'M6 18 18 6M6 6h12v12', down: 'M12 4v16m-6-6 6 6 6-6',
  check: 'm5 12 4 4L19 6', plus: 'M12 5v14M5 12h14', close: 'm6 6 12 12M6 18 18 6', menu: 'M4 8h16M4 16h16',
  camera: 'M3 7h5l2-3h4l2 3h5v13H3Zm13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  order: 'M7 4H4v17h16V4h-3M8 2h8v5H8Zm0 10h8m-8 5h5',
  calendar: 'M8 2v5m8-5v5M3 10h18M3 5h18v16H3Zm4 9h3m3 0h3',
  team: 'M15 21v-2a5 5 0 0 0-10 0v2M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm3 7a5 5 0 0 1 5 5v2M18 3a4 4 0 0 1 0 8',
  folder: 'M3 7V4h6l2 3h10v13H3Z', delivery: 'm22 2-7 20-4-9L2 9Zm0 0L11 13',
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2',
  review: 'M2 12s3-8 10-8 10 8 10 8-3 8-10 8S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  lock: 'M5 10h14v11H5Zm3 0V6a4 4 0 0 1 8 0v4M12 14v3',
};
export function Glyph({ name, className = '' }: { name: string; className?: string }) {
  return <svg className={`pl-icon ${className}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.camera} /></svg>;
}
export function Wordmark() {
  return <Link className="pl-brand" href="/" aria-label="PhotoTrackly home"><span className="pl-brand-symbol"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M5 14 16 5l11 9v13H5V14Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><circle cx="16" cy="18" r="5" stroke="currentColor" strokeWidth="1.7"/><path d="m14 18 1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span><span>Photo<span>Trackly</span></span></Link>;
}
export function Kicker({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <p className={`pl-kicker${light ? ' pl-kicker-light' : ''}`}><span />{children}</p>;
}
export function Concept({ children = 'Illustrative concept' }: { children?: ReactNode }) {
  return <span className="pl-concept"><span />{children}</span>;
}
export function JoinLink({ children = 'Join early access', source, className = '' }: { children?: ReactNode; source: string; className?: string }) {
  return <a href="#early-access" className={`pl-button ${className}`} data-track="cta_click" data-location={source}>{children}<Glyph name="arrow" /></a>;
}
