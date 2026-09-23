'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Glyph } from './primitives';
export default function Preferences() {
  const [token, setToken] = useState(''); const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false); const [done, setDone] = useState(false); const [error, setError] = useState('');
  // eslint-disable-next-line react-hooks/set-state-in-effect -- Read the private URL fragment only after hydration.
  useEffect(() => { const value = location.hash.slice(1); if (/^[a-f0-9]{64}$/.test(value)) setToken(value); setReady(true); }, []);
  async function remove() {
    if (pending) return; setPending(true); setError('');
    try {
      const response = await fetch('/api/early-access/withdraw', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }), signal: AbortSignal.timeout(15000) });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error(result.error || 'Removal could not be confirmed. Please try again.');
      setDone(true); history.replaceState(null, '', location.pathname);
    } catch (e) { setError(e instanceof Error ? e.message : 'Please keep your private link and try again.'); } finally { setPending(false); }
  }
  if (done) return <div role="status"><h2>Your registration is removed.</h2><p>The record associated with this link has been removed from the active early-access list, or was already removed.</p><Link href="/" className="pl-button">Back to PhotoTrackly<Glyph name="arrow" /></Link></div>;
  return <><p>This private link lets you remove the registration associated with it. Opening the page does not change anything.</p>{!ready ? <p>Checking your private link…</p> : token ? <><p>Removing the registration withdraws your consent to be contacted about early access for this record. This cannot be undone, but you can register again later.</p><button className="pl-button" type="button" disabled={pending} onClick={remove}>{pending ? 'Removing…' : 'Remove my registration'}<Glyph name="arrow" /></button></> : <p>Open the complete private removal link from the confirmation you saved after registering.</p>}{error && <p role="alert" className="pl-feedback">{error}</p>}</>;
}
