'use client';

import React from 'react';
import { Share2, Heart } from 'lucide-react';

interface VillaPageSkeletonProps {
    villa: { name: string; location: string; slug: string };
    isSaved: boolean;
    activeSection: string;
    onShare: () => void;
    onToggleWishlist: (e: React.MouseEvent) => void;
    onScrollToSection: (id: string) => void;
    children: React.ReactNode;
}

export default function VillaPageSkeleton({
    villa, isSaved, activeSection,
    onShare, onToggleWishlist, onScrollToSection, children
}: VillaPageSkeletonProps) {
    return (
        <div className="flex-1 flex flex-col bg-white text-slate-900 font-sans antialiased pt-5">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0 w-full flex-1 pb-24 lg:pb-16" id="foto-section">
                {/* Title + Share + Save */}
                <div className="mb-3">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <h1 className="font-serif text-2xl md:text-[32px] md:leading-[36px] font-semibold text-slate-900 tracking-tight leading-snug">
                            <span>{villa.name}</span>
                        </h1>
                        <div className="flex items-center space-x-5 flex-shrink-0 text-[14px] font-bold text-slate-800">
                            <button onClick={onShare} className="flex items-center space-x-2 hover:bg-slate-100 py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer">
                                <Share2 className="w-4 h-4 text-slate-800" strokeWidth={2} />
                                <span className="underline">Bagikan</span>
                            </button>
                            <button onClick={onToggleWishlist} className="flex items-center space-x-2 hover:bg-slate-100 py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer">
                                <Heart className={`w-4 h-4 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-slate-800'}`} strokeWidth={2} />
                                <span className="underline">{isSaved ? 'Disimpan' : 'Simpan'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {children}
            </main>
        </div>
    );
}
