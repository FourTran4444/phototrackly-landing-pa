'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main id="main" className="not-found"><span className="eyebrow">LET’S GET BACK ON TRACK</span><h1>Something didn’t load.</h1><p>Your local sample jobs have not been intentionally removed. Try loading the page again.</p><div className="button-row"><button className="button" onClick={reset}>Try again</button><Link className="button button-outline" href="/">Back to the website</Link></div></main>;
}
