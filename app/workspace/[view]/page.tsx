import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Workspace from '@/components/workspace/workspace';
import { VIEWS, type View } from '@/lib/model';

type Props = { params: Promise<{ view: string }> };
function isView(view: string): view is View { return Object.hasOwn(VIEWS, view); }
export function generateStaticParams() { return Object.keys(VIEWS).map(view => ({ view })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { view } = await params;
  return { title: isView(view) ? `${VIEWS[view]} — preview` : 'Not found' };
}
export default async function WorkspacePage({ params }: Props) {
  const { view } = await params;
  if (!isView(view)) notFound();
  return <Workspace key={view} view={view} />;
}
