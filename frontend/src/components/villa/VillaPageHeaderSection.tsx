'use client';

import React from 'react';
import { Star, Users, Bed, Bath } from 'lucide-react';
import type { Villa } from '@/types';

interface VillaPageHeaderSectionProps {
    villa: Villa;
    avgRating: number;
    reviewsCount: number;
    onScrollToReviews: () => void;
}

export default function VillaPageHeaderSection({
    villa, avgRating, reviewsCount, onScrollToReviews
}: VillaPageHeaderSectionProps) {
    const meta: Array<{ icon: React.ElementType; label: string; show: boolean }> = [
        { icon: Users, label: `Tamu maks ${villa.max_guests}`, show: villa.max_guests > 0 },
        { icon: Bed, label: `${villa.bedrooms} kamar tidur`, show: villa.bedrooms > 0 },
        { icon: Bed, label: `${villa.beds} tempat tidur`, show: (villa.beds ?? 0) > 0 },
        { icon: Bath, label: `${villa.bathrooms} kamar mandi`, show: villa.bathrooms > 0 },
    ].filter(m => m.show);

    return (
        <div className="space-y-4 mt-6 mb-4">
            <div className="flex items-center flex-wrap gap-1.5">
                <h1 className="text-2xl md:text-[32px] font-semibold text-slate-900 tracking-tight leading-tight">
                    {villa.name}
                </h1>
            </div>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[14px] font-semibold text-slate-800">
                {avgRating > 0 && (
                    <>
                        <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 fill-slate-900 text-slate-900" />
                            <span>{avgRating.toFixed(1).replace('.', ',')}</span>
                        </div>
                        {reviewsCount > 0 && (
                            <>
                                <span className="text-slate-300">·</span>
                                <button onClick={onScrollToReviews} className="underline hover:text-green-500 transition-colors">
                                    {reviewsCount} ulasan
                                </button>
                            </>
                        )}
                    </>
                )}
                {meta.length > 0 && (
                    <>
                        {avgRating > 0 && <span className="text-slate-300">·</span>}
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                            {meta.map((m, idx) => {
                                const Icon = m.icon;
                                return (
                                    <React.Fragment key={idx}>
                                        <span className="flex items-center space-x-1.5 text-slate-700">
                                            <Icon className="w-4 h-4" strokeWidth={1.5} />
                                            <span>{m.label}</span>
                                        </span>
                                        {idx < meta.length - 1 && <span className="text-slate-300">·</span>}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
