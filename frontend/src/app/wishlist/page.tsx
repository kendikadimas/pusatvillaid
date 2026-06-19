'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axiosClient from '@/lib/axios';
import { Villa } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import BottomNav from '@/components/BottomNav';
import VillaCard from '@/components/VillaCard';
import MobilePropertyCard from '@/components/MobilePropertyCard';
import { Heart, ArrowLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function WishlistPage() {
    const [wishlistIds, setWishlistIds] = useState<number[]>([]);
    const [villas, setVillas] = useState<Villa[]>([]);
    const [loading, setLoading] = useState(true);

    // Load wishlist from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('pusatvilla_wishlist');
            if (saved) {
                try {
                    const ids = JSON.parse(saved);
                    setWishlistIds(ids);
                } catch (e) {
                    console.error('Failed to parse wishlist:', e);
                    setWishlistIds([]);
                }
            } else {
                setWishlistIds([]);
            }
        }
    }, []);

    // Fetch villa data for each wishlist ID
    useEffect(() => {
        const fetchVillas = async () => {
            if (wishlistIds.length === 0) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Fetch all villas and filter client-side for simplicity
                const response = await axiosClient.get('/villas', {
                    params: { per_page: 100 }
                });
                const allVillas = response.data.data || [];
                const favoritedVillas = allVillas.filter((v: Villa) => wishlistIds.includes(v.id));
                setVillas(favoritedVillas);
            } catch (err) {
                console.error('Failed to fetch wishlist villas:', err);
                toast.error('Gagal memuat daftar favorit.');
            } finally {
                setLoading(false);
            }
        };

        fetchVillas();
    }, [wishlistIds]);

    const handleRemoveFromWishlist = (id: number) => {
        const updated = wishlistIds.filter(item => item !== id);
        setWishlistIds(updated);
        setVillas(prev => prev.filter(v => v.id !== id));
        localStorage.setItem('pusatvilla_wishlist', JSON.stringify(updated));
        toast.success('Dihapus dari favorit.');
    };

    return (
        <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 font-sans min-h-screen">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white border-b border-slate-200/60">
                <div className="flex items-center justify-between px-4 sm:px-8 lg:px-24 h-16">
                    <div className="flex items-center space-x-3">
                        <Link
                            href="/"
                            className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900">Favorit</h1>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                        {wishlistIds.length} villa disimpan
                    </span>
                </div>
            </div>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 lg:px-24 py-12 w-full">
                {loading ? (
                    <div className="flex justify-center py-24">
                        <LoadingSpinner fullPage={false} message="Memuat daftar favorit..." />
                    </div>
                ) : villas.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                            <Heart className="w-10 h-10 text-slate-300" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Belum ada favorit</h2>
                        <p className="text-sm text-slate-500 max-w-sm mb-8 leading-relaxed">
                            Ketuk ikon hati pada villa yang Anda sukai untuk menyimpannya di sini.
                        </p>
                        <Link
                            href="/villas"
                            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all active:scale-95"
                        >
                            <span>Jelajahi Villa</span>
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Desktop grid */}
                        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                            {villas.map((villa) => (
                                <VillaCard
                                    key={villa.id}
                                    villa={villa}
                                    wishlist={wishlistIds}
                                    toggleWishlist={(id, e) => handleRemoveFromWishlist(id)}
                                    searchParams={{}}
                                    variant="catalog"
                                />
                            ))}
                        </div>

                        {/* Mobile cards */}
                        <div className="sm:hidden space-y-6">
                            {villas.map((villa) => (
                                <div key={villa.id} className="relative">
                                    <MobilePropertyCard villa={villa} />
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleRemoveFromWishlist(villa.id);
                                        }}
                                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center active:scale-90 transition-transform"
                                    >
                                        <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Footer info */}
                        <div className="mt-12 pt-8 border-t border-slate-200 text-center">
                            <p className="text-xs text-slate-400">
                                Data favorit disimpan secara lokal di perangkat Anda.
                            </p>
                        </div>
                    </>
                )}
            </main>

            {/* Mobile Bottom Navigation */}
            <BottomNav />
        </div>
    );
}
