import { Suspense } from 'react';
import VillaDetailPageClient from './VillaDetailPageClient';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export async function generateStaticParams() {
  // Local dev: cukup return minimal slug biar cepet
  if (process.env.NODE_ENV === 'development') {
    return [{ slug: 'placeholder' }];
  }

  // Production build: fetch semua slug real dari API + selalu include 'placeholder'
  // 'placeholder' dipakai sebagai fallback untuk villa baru yang belum di-build
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.pusatvillaid.com/api/v1';
  try {
    const res = await fetch(`${apiUrl}/villas?per_page=200`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    const villas = data.villas || data.data || [];
    const slugs = villas.map((v: any) => ({ slug: v.slug }));
    // Always include placeholder for new villas not yet in static build
    const hasPlaceholder = slugs.some((s: any) => s.slug === 'placeholder');
    if (!hasPlaceholder) slugs.push({ slug: 'placeholder' });
    return slugs;
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
