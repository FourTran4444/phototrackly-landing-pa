'use client';
import Image from 'next/image';
import { useState } from 'react';
import { IMAGES } from '@/lib/images';

export const MEDIA = {
  interior: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?fit=crop&w=1800&q=85',
  exterior: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?fit=crop&w=1800&q=85',
  photographer: IMAGES.photographer,
  editor: IMAGES.coordinator,
  twilight: IMAGES.villa,
} as const;
export function Media({ name, alt, sizes, priority = false, className = '' }: { name: keyof typeof MEDIA; alt: string; sizes: string; priority?: boolean; className?: string }) {
  const [failed, setFailed] = useState(false);
  return <Image src={failed ? '/photo-placeholder.svg' : MEDIA[name]} alt={failed ? `${alt} (illustrative photograph unavailable)` : alt} fill sizes={sizes} preload={priority} className={className} onError={() => setFailed(true)} unoptimized={failed} />;
}
