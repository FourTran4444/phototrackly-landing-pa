import type { Metadata } from 'next';
import { DeliveryPortal } from '@/components/workspace/delivery';
export const metadata: Metadata = { title: 'Local delivery preview', robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DeliveryPortal id={id} />;
}
