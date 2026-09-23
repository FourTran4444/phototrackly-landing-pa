'use client';
import Image from 'next/image';
import { useState } from 'react';

export const MEDIA = {
  interior: '/images/reference/interior.webp',
  interior2: '/images/reference/interior-2.webp',
  photographer: '/images/reference/on-site.webp',
  editor: '/images/reference/in-studio.webp',
  exterior: '/images/reference/exterior.webp',
  twilight: '/images/reference/exterior.webp',
} as const;

export function Media({ name, alt, sizes, priority = false, className = '' }: { name: keyof typeof MEDIA; alt: string; sizes: string; priority?: boolean; className?: string }) {
  const [failed, setFailed] = useState(false);
  // Portrait panels crop a landscape original: budget for its covered height, not only the panel width.
  const fittedSizes = priority ? '(max-width: 900px) 100vw, 70vw' : name === 'interior2' ? '(max-width: 900px) 100vw, 80vw' : sizes;
  return <Image src={failed ? '/photo-placeholder.svg' : MEDIA[name]} alt={failed ? `${alt} (illustrative photograph unavailable)` : alt} fill sizes={fittedSizes} quality={85} preload={priority} className={className} onError={() => setFailed(true)} unoptimized={failed} />;
}
