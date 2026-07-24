'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Villa } from '@/types';
import VillaCard from '@/components/VillaCard';
import CategoryFilter from '@/components/CategoryFilter';

interface GroupedLocation {
    query: string;
    city: string;
    name: string;
    villas: Villa[];
}

interface VillaSectionProps {
    loading: boolean;
    groupedByLocation: GroupedLocation[];
    unmatchedVillas: Villa[];
    wishlist: number[];
    toggleWishlist: (id: number, e: React.MouseEvent) => void;
    searchParams: { checkIn: string; checkOut: string };
    selectedCategory: string;
    setSelectedCategory: (cat: string) => void;
}

export default function VillaSection({
    loading,
    groupedByLocation,
    unmatchedVillas,
    wishlist,
    toggleWishlist,
    searchParams,
    selectedCategory,
    setSelectedCategory,
}: VillaSectionProps) {
    return (
        <>
            {loading ? (
                <section className="max-w-8xl mx-auto px-8 sm:px-14 lg:px-24 py-8 w-full reveal">
                    <div className="mb-8">
                        <div className="h-7 bg-slate-100 rounded-lg w-64 animate-pulse mb-2" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-x-4 gap-y-12">
                        {[...Array(7)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="aspect-[20/19] w-full bg-slate-100 rounded-[12px]" />
                                <div className="pt-3 space-y-2">
                                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ) : (
                <div className="max-w-8xl mx-auto px-8 sm:px-14 lg:px-24 py-2 w-full space-y-8">
                    {/* <div className="border-b border-[#EAEAEA] pb-10 text-left"> */}
                        {/* <span className="inline-block text-[10px] font-bold text-green-500 uppercase tracking-widest mb-2">Unit Properti Tersedia</span> */}
                        {/* <h2 className="text-2xl sm:text-3xl lg:text-[2rem] font-black text-[#111111] tracking-[-0.02em] leading-[1.2]">
                            Jelajahi Pilihan Unit Villa Terbaik
                        </h2>
                        <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
                            Pilih dan sewa unit villa mandiri secara langsung. Setiap properti dilengkapi detail harga per malam, foto asli, dan fasilitas lengkap.
                        </p> */}
                    {/* </div> */}
                    {(groupedByLocation || []).map((group, gi) => (
                        <section key={group.query} data-reveal className="reveal reveal-delay-1">
                            <div className="flex items-end justify-between mb-5">
                                <div>
                                    <h2 className="text-xl sm:text-2xl lg:text-[1.75rem] font-bold text-[#111111] tracking-[-0.02em] leading-[1.2]">
                                        Rekomendasi Unit Villa di {group.city}
                                    </h2>
                                    {/* <p className="text-sm text-[#787774] mt-1">{group.villas.length} villa tersedia</p> */}
                                </div>
                                <Link
                                    href={`/villas?location=${group.query}`}
                                    className="hidden sm:inline-flex items-center text-sm font-medium text-[#111111] hover:text-[#16a34a] transition-colors border-b border-[#16a34a]/0 hover:border-[#16a34a] pb-0.5"
                                >
                                    Lihat semua <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-x-4 gap-y-12">
                                {group.villas.slice(0, 7).map((villa) => (
                                    <VillaCard
                                        key={villa.id}
                                        villa={villa}
                                        wishlist={wishlist}
                                        toggleWishlist={toggleWishlist}
                                        searchParams={searchParams}
                                    />
                                ))}
                            </div>
                            <div className="mt-6 sm:hidden">
                                <Link
                                    href={`/villas?location=${group.query}`}
                                    className="inline-flex items-center text-sm font-medium text-[#16a34a] border-b border-[#16a34a] pb-0.5"
                                >
                                    Lihat semua unit villa di {group.query} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                </Link>
                            </div>
                        </section>
                    ))}

                    {unmatchedVillas.length > 0 && (
                        <section data-reveal className="reveal reveal-delay-2">
                            <div className="mb-8">
                                {/* <span className="inline-block text-[11px] font-medium text-[#787774] mb-2">Jelajahi</span> */}
                                <h2 className="text-xl sm:text-2xl lg:text-[1.75rem] font-bold text-[#111111] tracking-[-0.02em] leading-[1.2]">
                                    Villa Lainnya
                                </h2>
                                {/* <p className="text-sm text-[#787774] mt-1">{unmatchedVillas.length} villa tersedia</p> */}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-x-4 gap-y-12">
                                {unmatchedVillas.slice(0, 7).map((villa) => (
                                    <VillaCard
                                        key={villa.id}
                                        villa={villa}
                                        wishlist={wishlist}
                                        toggleWishlist={toggleWishlist}
                                        searchParams={searchParams}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </>
    );
}
