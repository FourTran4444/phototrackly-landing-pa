'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Avatar, Brand, Dialog, Icon, Tag } from '@/components/ui';
import { TEAM, VIEWS, type View } from '@/lib/model';
import { resetJobs, useJobs } from './store';

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname(); const view = pathname.split('/')[2] as View;
  const [menu, setMenu] = useState(false); const [modal, setModal] = useState<'about' | 'reset' | null>(null);
  const { jobs, persistent } = useJobs();
  return <div className="app-shell">
    <header className="app-header"><div className="app-brand"><Brand /><button className="icon-button workspace-menu" type="button" aria-label="Toggle workspace navigation" aria-expanded={menu} aria-controls="workspace-sidebar" onClick={() => setMenu(!menu)}><Icon name="menu" /></button></div><div className="app-breadcrumb"><span>Workspace</span><Icon name="chevron" /><strong>{VIEWS[view] || 'Overview'}</strong></div><div className="app-header-right"><Tag tone="orange">INTERACTIVE PREVIEW</Tag><Link href="/" className="back-to-site">Back to website <Icon name="arrowUp" /></Link><Avatar name="Alex Morgan" /></div></header>
    <div className="app-layout">
      {menu && <button className="sidebar-scrim" aria-label="Close workspace navigation" type="button" onClick={() => setMenu(false)} />}
      <aside className={`app-sidebar ${menu ? 'mobile-open' : ''}`} id="workspace-sidebar"><div className="studio-switcher"><span className="studio-avatar">N<span>.</span></span><span><strong>Northlight Studio</strong><small>Example workspace</small></span></div><span className="sidebar-label mono">WORKSPACE</span><nav aria-label="Workspace navigation">{Object.entries(VIEWS).map(([key, name], i) => <Link key={key} href={`/workspace/${key}`} aria-current={key === view ? 'page' : undefined} onClick={() => setMenu(false)}><Icon name={['board', 'calendar', 'eye', 'send'][i]} /><span>{name}</span>{key === 'review' && <span className="nav-count">{jobs.filter(j => j.stage === 4 && !j.approved).length}</span>}</Link>)}</nav>
      <div className="sidebar-team"><span className="sidebar-label mono">YOUR SAMPLE TEAM</span>{TEAM.map(name => <div key={name}><Avatar name={name} small /><span>{name}</span><span className="dot" /></div>)}</div>
      <div className="sidebar-bottom"><div className="sidebar-callout"><Icon name="spark" /><strong>More room for good work.</strong><p>Help shape the workspace your team needs.</p><Link href="/#early-access">Join early access <Icon name="arrow" /></Link></div><button className="sidebar-reset" type="button" onClick={() => { setMenu(false); setModal('reset'); }}><Icon name="repeat" />Reset sample workspace</button><span className="sidebar-version mono">PRODUCT CONCEPT · V.02</span></div></aside>
      <main className="workspace-main" id="main"><div className="demo-notice"><Icon name="info" /><span>{persistent ? 'Sample jobs. Real interactions. Your changes stay in this browser.' : 'Browser storage is unavailable. Changes will last for this session only.'}</span><button type="button" onClick={() => setModal('about')}>About the preview <Icon name="arrowUp" /></button></div>{children}<div className="workspace-footnote"><span><Icon name="lock" />Local preview · No live customer data, uploads, or notifications</span><span>Sample shoot date: September 15, 2026</span></div></main>
    </div>
    {modal === 'about' && <Dialog title="A preview, not a live studio" onClose={() => setModal(null)}><div className="prose"><p>Explore a connected property-media workflow with fictional jobs. Create and move jobs, assign photographers, record human review, and follow the final handoff.</p><p>Changes stay on this browser and origin. File controls save metadata only. Nothing is uploaded or emailed, and delivery previews are not shareable customer galleries.</p><p>PhotoTrackly is in development. This preview does not create an account or provide production access. Please do not enter confidential information.</p><Link className="button" href="/#early-access">Help shape PhotoTrackly <Icon name="arrow" /></Link></div></Dialog>}
    {modal === 'reset' && <Dialog title="Start with a fresh sample workspace?" onClose={() => setModal(null)}><div className="prose"><p>This removes your local job changes and restores the fictional sample jobs in this browser. It does not affect another user or any live service.</p><div className="button-row"><button className="button button-outline" type="button" onClick={() => setModal(null)}>Keep my changes</button><button className="button button-accent" type="button" onClick={() => { resetJobs(); setModal(null); }}>Reset sample data</button></div></div></Dialog>}
  </div>;
}
