'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Destination } from '@/types';

interface GroupedLocation {
    query: string;
    city: string;
    villas: any[];
}

interface DestinationGridProps {
    destinations: Destination[];
    groupedByLocation: GroupedLocation[];
}

export default function DestinationGrid({ destinations, groupedByLocation }: DestinationGridProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left'
                ? scrollLeft - clientWidth * 0.75
                : scrollLeft + clientWidth * 0.75;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    return (
        <section data-reveal className="max-w-8xl mx-auto px-4 sm:px-8 lg:px-24 py-8 lg:py-16 w-full reveal">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-3 lg:mb-6 gap-4">
                <div className="text-left">
                    {/* <span className="inline-block text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Pilih Wilayah</span> */}
                    <h2 className="text-xl sm:text-3xl lg:text-[2rem] font-black text-[#111111] tracking-[-0.02em] leading-[1.2]">
                       Destinasi Populer
                    </h2>
                </div>
                {/* Carousel Controls */}
                {/* <div className="flex-end items-center space-x-2 shrink-0">
                    <button
                        onClick={() => scroll('left')}
                        className="p-2.5 rounded-full border border-[#EAEAEA] hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 active:scale-95 transition-all cursor-pointer shadow-xs"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="p-2.5 rounded-full border border-[#EAEAEA] hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 active:scale-95 transition-all cursor-pointer shadow-xs"
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div> */}
            </div>

            <div
                ref={scrollRef}
                className="flex overflow-x-auto gap-4 scroll-smooth scrollbar-none pb-4 snap-x snap-mandatory"
            >
                {destinations.map((dest, idx) => {
                    const group = groupedByLocation.find(g => g.query === dest.query);
                    const count = group?.villas.length ?? 0;
                    return (
                        <Link
                            key={dest.id || idx}
                            href={`/villas?location=${dest.query}`}
                            className="flex-none w-[70%] sm:w-[40%] md:w-[30%] lg:w-[22%] xl:w-[15.5%] group relative aspect-[4/3] rounded-[12px] overflow-hidden bg-[#F7F6F3] cursor-pointer border border-[#EAEAEA] snap-start"
                        >
                            <img
                                src={dest.image}
                                alt={dest.name}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                            />
                            {/* <div className="absolute top-3 left-3 z-10">
                                <span className="bg-[#111111]/60 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-wider">
                                    Wilayah
                                </span>
                            </div> */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/80 via-[#111111]/20 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-4 text-left z-10">
                                <h3 className="text-white font-bold text-sm leading-tight group-hover:text-blue-300 transition-colors">{dest.name}</h3>
                                {/* <p className="text-[11px] text-white/80 mt-1 font-medium">
                                    {count > 0 ? `${count} Villa Terdaftar` : (dest.count_fallback || 'Lihat Villa')}
                                </p> */}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
