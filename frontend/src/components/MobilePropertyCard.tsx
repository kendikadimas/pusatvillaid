'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Villa } from '@/types';
import { getPhotoUrl } from '@/lib/villaUtils';
import { useWishlist } from '@/hooks/useWishlist';

interface MobilePropertyCardProps {
    villa: Villa;
    searchParams?: { checkIn?: string; checkOut?: string };
}

export default function MobilePropertyCard({ villa, searchParams }: MobilePropertyCardProps) {
    const { wishlist, toggleWishlist } = useWishlist();
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const isSaved = wishlist.includes(villa.id);

    const photos = villa.photos && villa.photos.length > 0
        ? villa.photos
        : ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80'];

    const handlePrevPhoto = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    };

    const handleNextPhoto = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    };

    const handleToggleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(villa.id, e);
    };

    // Build URL with search params
    const villaUrl = searchParams?.checkIn && searchParams?.checkOut
        ? `/villas/${villa.slug}?checkIn=${searchParams.checkIn}&checkOut=${searchParams.checkOut}`
        : `/villas/${villa.slug}`;

    return (
        <Link href={villaUrl} className="block">
            <div className="space-y-3">
                {/* Photo carousel */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
                    <img
                        src={getPhotoUrl(photos[currentPhotoIndex])}
                        alt={villa.name}
                        className="w-full h-full object-cover"
                    />

                    {/* Superhost badge - removed since not in Villa type */}

                    {/* Wishlist button */}
                    <button
                        onClick={handleToggleWishlist}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors"
                    >
                        <Heart
                            className={`w-5 h-5 transition-colors ${
                                isSaved ? 'fill-rose-500 text-rose-500' : 'fill-none text-white'
                            }`}
                        />
                    </button>

                    {/* Photo navigation arrows */}
                    {photos.length > 1 && (
                        <>
                            <button
                                onClick={handlePrevPhoto}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                            >
                                <ChevronLeft className="w-4 h-4 text-slate-700" />
                            </button>
                            <button
                                onClick={handleNextPhoto}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                            >
                                <ChevronRight className="w-4 h-4 text-slate-700" />
                            </button>
                        </>
                    )}

                    {/* Photo pagination dots */}
                    {photos.length > 1 && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1">
                            {photos.map((_, i) => (
                                <div
                                    key={i}
                                    className={`rounded-full transition-all ${
                                        i === currentPhotoIndex
                                            ? 'w-2 h-2 bg-white'
                                            : 'w-1.5 h-1.5 bg-white/50'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Property info */}
                <div className="space-y-1 px-1">
                    {/* Title and rating */}
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm text-slate-900 truncate flex-1">
                            {villa.name}
                        </h3>
                        {villa.reviews_avg_rating && Number(villa.reviews_avg_rating) > 0 && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <Star className="w-3.5 h-3.5 fill-slate-900 text-slate-900" />
                                <span className="text-xs font-bold text-slate-900">
                                    {Number(villa.reviews_avg_rating).toFixed(2).replace('.', ',')}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {villa.short_desc && (
                        <p className="text-xs text-slate-500 truncate">{villa.short_desc}</p>
                    )}

                    {/* Facilities */}
                    <p className="text-xs text-slate-400">
                        {villa.bedrooms} kamar tidur · {villa.bathrooms} kamar mandi · {villa.max_guests} tamu
                    </p>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 pt-1">
                        {villa.weekend_price && villa.weekend_price < villa.price_per_night && (
                            <span className="text-xs text-slate-400 line-through">
                                Rp {villa.price_per_night.toLocaleString('id-ID')}
                            </span>
                        )}
                        <span className="font-bold text-sm text-slate-900">
                            Rp {(villa.weekend_price || villa.price_per_night).toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-slate-400">untuk 1 malam</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
