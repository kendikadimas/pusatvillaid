import { Suspense } from 'react';
import VillaDetailPageClient from './VillaDetailPageClient';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export async function generateStaticParams() {
  // Local dev: cukup return minimal slug biar cepet
  if (process.env.NODE_ENV === 'development') {
    return [{ slug: 'placeholder' }];
  }

  // Production build: fetch semua slug real dari API
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://www.pusatvillaid.com/api/v1';
  try {
    const res = await fetch(`${apiUrl}/villas?per_page=50`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    const villas = data.villas || data.data || [];
    if (villas.length > 0) return villas.map((v: any) => ({ slug: v.slug }));
  } catch {}
  return [{ slug: 'placeholder' }];
}

export default function VillaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <VillaDetailPageClient params={params} />
    </Suspense>
  );
}
