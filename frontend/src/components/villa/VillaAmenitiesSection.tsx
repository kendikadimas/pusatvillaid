'use client';

import React from 'react';
import { X, Check } from 'lucide-react';
import { getIconComponentByKey } from '@/lib/villaIcons';

interface VillaAmenitiesSectionProps {
    amenities: Array<{ name: string; icon: string }> | string[] | null;
}

export default function VillaAmenitiesSection({ amenities }: VillaAmenitiesSectionProps) {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    
    const items = amenities || [];
    const displayAmenities = items.slice(0, 10);

    return (
        <>
            <div id="fasilitas-section" className="pb-6 border-b border-slate-200/80">
                <div className="space-y-5">
                    <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Fasilitas yang ditawarkan</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {displayAmenities.map((amenity, idx) => {
                            const name = typeof amenity === 'string' ? amenity : amenity.name;
                            const icon = typeof amenity === 'string' ? 'Check' : amenity.icon;
                            const IconComponent = getIconComponentByKey(icon);
                            return (
                                <div key={idx} className="flex items-center space-x-3 text-[15px] text-slate-800 font-normal">
                                    <IconComponent className="w-5 h-5 text-slate-700 shrink-0" strokeWidth={1.5} />
                                    <span>{name}</span>
                                </div>
                            );
                        })}
                    </div>
                    {items.length > 8 && (
                        <button onClick={() => setIsModalOpen(true)} className="border border-slate-900 hover:bg-slate-50 text-slate-900 text-[15px] font-bold px-5 py-3 rounded-xl transition-all cursor-pointer inline-block mt-4">
                            Tampilkan ke-{items.length} fasilitas
                        </button>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-55 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-8 animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 animate-scaleIn">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900">Fasilitas yang ditawarkan</h3>
                            <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors text-slate-700 cursor-pointer active:scale-90">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-2">
                            {items.map((amenity, idx) => {
                                const name = typeof amenity === 'string' ? amenity : amenity.name;
                                const icon = typeof amenity === 'string' ? 'Check' : amenity.icon;
                                const IconComponent = getIconComponentByKey(icon);
                                return (
                                    <div key={idx} className="flex items-center space-x-3.5 text-[15px] text-slate-800 font-normal border-b border-slate-100 pb-3">
                                        <IconComponent className="w-5 h-5 text-slate-700 shrink-0" strokeWidth={1.5} />
                                        <span>{name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

