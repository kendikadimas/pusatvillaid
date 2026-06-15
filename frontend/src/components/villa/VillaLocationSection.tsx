'use client';

import React from 'react';
import { MapPin, ArrowRight } from 'lucide-react';

interface VillaLocationSectionProps {
    mapsUrl: string | null | undefined;
    location: string;
    neighborhoodDesc: string | null;
}

export default function VillaLocationSection({ mapsUrl, location, neighborhoodDesc }: VillaLocationSectionProps) {
    const [isExpanded, setIsExpanded] = React.useState(false);

    if (!mapsUrl) return null;

    return (
        <div id="location-section" className="space-y-6 pb-8 border-b border-slate-200/80 scroll-mt-32">
            <h3 className="text-xl font-bold text-slate-900">Lokasi Properti</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                    <h4 className="text-base font-bold text-slate-850 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-500" />
                        <span>{location}</span>
                    </h4>
                    {neighborhoodDesc && (
                        <div className="text-slate-600 text-sm font-medium leading-relaxed">
                            <p className={isExpanded ? '' : 'line-clamp-4'}>{neighborhoodDesc}</p>
                            {neighborhoodDesc.length > 180 && (
                                <button onClick={() => setIsExpanded(!isExpanded)} className="text-slate-900 hover:text-blue-500 font-bold underline mt-2 flex items-center gap-1 cursor-pointer active:scale-95 transition-all text-xs">
                                    <span>{isExpanded ? 'Sembunyikan' : 'Baca selengkapnya'}</span>
                                    <ArrowRight className={`w-3.5 h-3.5 transform transition-transform ${isExpanded ? '-rotate-90' : ''}`} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <div className="aspect-[4/3] sm:aspect-[16/10] md:aspect-square lg:aspect-[4/3] w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                    <iframe src={mapsUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen={false} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
            </div>
        </div>
    );
}
