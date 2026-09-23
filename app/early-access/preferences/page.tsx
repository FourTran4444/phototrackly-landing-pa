import type { Metadata } from 'next';
import { Wordmark } from '@/components/prelaunch/primitives';
import Preferences from '@/components/prelaunch/preferences';
import '@/components/marketing/prelaunch.css';
export const metadata: Metadata = { title: 'Manage your early-access registration', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default function PreferencesPage() { return <main id="main" className="pl pl-legal"><div className="pl-wrap"><Wordmark /><h1>Your early-access registration.</h1><Preferences /></div></main>; }
