import { Suspense } from 'react';
import VillaDetailPageClient from './VillaDetailPageClient';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export async function generateStaticParams() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://www.pusatvillaid.com/api/v1';
  try {
    const res = await fetch(`${apiUrl}/villas?limit=999`, { headers: { Accept: 'application/json' } });
    const data = await res.json();
    const villas = data.villas || data.data || [];
    return villas.length > 0 ? villas.map((v: any) => ({ slug: v.slug })) : [{ slug: 'placeholder' }];
  } catch {
    return [{ slug: 'placeholder' }];
  }
}

export default function VillaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <VillaDetailPageClient params={params} />
    </Suspense>
  );
}
