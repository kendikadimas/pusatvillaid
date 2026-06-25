'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Star, Heart, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { Villa } from '@/types';
import { getPhotoUrl } from '@/lib/villaUtils';
import { formatPrice } from '@/lib/format';

export interface VillaCardProps {
    villa: Villa;
    wishlist: number[];
    toggleWishlist: (id: number, e: React.MouseEvent) => void;
    searchParams: {
        checkIn?: string;
        checkOut?: string;
    };
    variant?: 'home' | 'catalog';
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onClick?: () => void;
    isSelected?: boolean;
}

/** Max number of photos to show in card slider */
const MAX_SLIDER_PHOTOS = 3;

export default function VillaCard({ 
    villa, 
    wishlist, 
    toggleWishlist, 
    searchParams,
    variant = 'home',
    onMouseEnter,
    onMouseLeave,
    onClick,
    isSelected = false
}: VillaCardProps) {
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [imgError, setImgError] = useState(false);
    const touchStartX = useRef<number | null>(null);
    const touchDeltaX = useRef(0);

    const isWished = wishlist.includes(villa.id);

    const checkInParam = searchParams.checkIn;
    const checkOutParam = searchParams.checkOut;
    const detailUrl = `/villas/${villa.slug}${checkInParam && checkOutParam
        ? `?checkIn=${checkInParam}&checkOut=${checkOutParam}`
        : ''}`;

    const ratingVal = villa.reviews_avg_rating
        ? parseFloat(villa.reviews_avg_rating.toString())
        : 4.5 + (villa.id % 5) * 0.1;
    const ratingText = ratingVal.toFixed(1).replace('.', ',');
    const reviewCount = villa.reviews_count || 0;

    // Build photo array, capped at MAX_SLIDER_PHOTOS
    const allPhotos = villa.photos && villa.photos.length > 0
        ? villa.photos
        : ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80'];
    const photos = allPhotos.slice(0, MAX_SLIDER_PHOTOS);

    const handlePrevPhoto = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setImgError(false);
        setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    };

    const handleNextPhoto = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setImgError(false);
        setCurrentPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchDeltaX.current = 0;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const threshold = 50;
        if (touchDeltaX.current < -threshold) {
            setCurrentPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
        } else if (touchDeltaX.current > threshold) {
            setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
        }
        touchStartX.current = null;
        touchDeltaX.current = 0;
    };

    const handleImgError = () => {
        setImgError(true);
    };

    const PhotoContainer = ({ children }: { children: React.ReactNode }) => (
        <div
            className="relative aspect-[20/19] w-full overflow-hidden rounded-[12px] bg-[#F7F6F3] border border-[#EAEAEA] touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {imgError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                    <ImageOff className="w-8 h-8 mb-1" />
                    <span className="text-[10px] font-medium">Gambar tidak tersedia</span>
                </div>
            ) : (
                <img
                    src={getPhotoUrl(photos[currentPhotoIndex])}
                    alt={villa.name}
                    onError={handleImgError}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                />
            )}

            {/* Wishlist button */}
            <button
                type="button"
                onClick={(e) => toggleWishlist(villa.id, e)}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-transparent text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
                <Heart
                    className={`w-5 h-5 stroke-white stroke-[2px] transition-colors ${
                        isWished ? 'fill-red-500 text-red-500' : 'fill-black/20 text-white/90'
                    }`}
                />
            </button>

            {/* Arrow navigation — visible on hover */}
            {photos.length > 1 && (
                <>
                    <button
                        onClick={handlePrevPhoto}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white z-10 cursor-pointer"
                        aria-label="Foto sebelumnya"
                    >
                        <ChevronLeft className="w-4 h-4 text-slate-700" />
                    </button>
                    <button
                        onClick={handleNextPhoto}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white z-10 cursor-pointer"
                        aria-label="Foto berikutnya"
                    >
                        <ChevronRight className="w-4 h-4 text-slate-700" />
                    </button>
                </>
            )}

            {/* Dot indicator — max 3 dots */}
            {photos.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
                    {photos.map((_, i) => (
                        <div
                            key={i}
                            className={`rounded-full transition-all duration-200 ${
                                i === currentPhotoIndex
                                    ? 'w-2 h-2 bg-white'
                                    : 'w-1.5 h-1.5 bg-white/50'
                            }`}
                        />
                    ))}
                </div>
            )}

            {children}
        </div>
    );

    if (variant === 'catalog') {
        const subdistrict = villa.location.split(',').pop()?.trim() || villa.location;
        return (
            <div
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onClick={onClick}
                className={`group flex flex-col cursor-pointer transition-all duration-300 relative ${
                    isSelected ? 'scale-[1.01]' : ''
                }`}
            >
                <Link href={detailUrl} className="flex flex-col h-full">
                    <PhotoContainer>
                        <></>
                    </PhotoContainer>

                    <div className="pt-3 flex-1 flex flex-col justify-between space-y-1 bg-transparent">
                        <div>
                            <div className="flex items-center justify-between text-[14px] sm:text-[15px] text-slate-700 font-bold leading-tight">
                                <span className="truncate group-hover:text-blue-500 transition-colors">
                                    {villa.name}
                                </span>
                            </div>

                            <div className="text-[13px] sm:text-[14px] text-slate-600 font-normal pt-1.5">
                                <span className="font-medium">
                                    {formatPrice(villa.price_per_night)}
                                </span>
                                <span className="text-slate-500"> malam</span>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>
        );
    }

    const subdistrict = villa.location.split(',')[0].trim();
    const priceText = formatPrice(villa.price_per_night);
    let priceLabel = '/malam';

    if (checkInParam && checkOutParam) {
        const start = new Date(checkInParam);
        const end = new Date(checkOutParam);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (nights > 0) {
            priceLabel = `/${nights} malam`;
        }
    }

    return (
        <Link
            href={detailUrl}
            target="_blank"
            className="group cursor-pointer flex flex-col w-full bg-transparent hover:no-underline min-h-0"
        >
            <PhotoContainer>
                <></>
            </PhotoContainer>

            <div className="pt-3 flex flex-col space-y-0.5 bg-transparent text-left">
                <h3 className="text-[14px] sm:text-[15px] font-semibold text-slate-700 leading-tight tracking-tight line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {villa.name}
                </h3>
                <div className="text-[13px] sm:text-[14px] text-slate-700 font-normal pt-0.5">
                    <span className="font-medium">
                        {priceText}
                    </span>
                    <span className="text-slate-500"> {priceLabel}</span>
                </div>
            </div>
        </Link>
    );
}
