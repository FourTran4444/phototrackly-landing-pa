import type { Metadata } from 'next';
import Landing from '@/components/marketing/landing';
import { registrationConfigured } from '@/lib/site';

export const metadata: Metadata = { alternates: { canonical: '/' } };
export default function HomePage() { return <Landing registrationEnabled={registrationConfigured()} />; }
