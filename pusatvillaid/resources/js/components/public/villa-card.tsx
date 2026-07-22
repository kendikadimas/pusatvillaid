import { Link } from '@inertiajs/react';
import { Star, Heart, ChevronLeft, ChevronRight, ImageOff, Users, BedDouble } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { formatPrice } from '@/lib/format';
import { getPhotoUrl } from '@/lib/villaUtils';
import type { Villa } from '@/types';

export interface VillaCardProps {
    villa: Villa;
    wishlist?: number[];
    toggleWishlist?: (id: number, e: React.MouseEvent) => void;
    searchParams?: { checkIn?: string; checkOut?: string };
    variant?: 'home' | 'catalog';
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onClick?: () => void;
    isSelected?: boolean;
}

const MAX_SLIDER_PHOTOS = 3;

export default function VillaCard({
    villa,
    wishlist = [],
    toggleWishlist,
    searchParams = {},
    variant: _variant = 'home',
    onMouseEnter,
    onMouseLeave,
    onClick,
    isSelected = false,
}: VillaCardProps) {
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [imgError, setImgError] = useState(false);
    const touchStartX = useRef<number | null>(null);

    const isWished = wishlist.includes(villa.id);

    const detailUrl = `/villas/${villa.slug}${
        searchParams.checkIn && searchParams.checkOut
            ? `?checkIn=${searchParams.checkIn}&checkOut=${searchParams.checkOut}`
            : ''
    }`;

    const ratingVal = villa.reviews_avg_rating && villa.reviews_count && villa.reviews_count > 0
        ? parseFloat(villa.reviews_avg_rating.toString())
        : null;
    const ratingText = ratingVal !== null ? ratingVal.toFixed(1).replace('.', ',') : null;
    const reviewCount = villa.reviews_count ?? 0;

    const allPhotos =
        villa.photos && villa.photos.length > 0
            ? villa.photos
            : ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80'];
    const photos = allPhotos.slice(0, MAX_SLIDER_PHOTOS);

    const handlePrev = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setImgError(false);
        setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    };

    const handleNext = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setImgError(false);
        setCurrentPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    };

    const priceText = formatPrice(villa.price_per_night);
    const priceLabel = '/ malam';

    return (
        <Link
            href={detailUrl}
            className={`group cursor-pointer flex flex-col w-full bg-transparent hover:no-underline ${
                isSelected ? 'ring-2 ring-[#00A86B] rounded-xl' : ''
            }`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
        >
            {/* Photo Slider */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
                {imgError ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200">
                        <ImageOff className="w-8 h-8 text-slate-400" />
                    </div>
                ) : (
                    <img
                        src={getPhotoUrl(photos[currentPhotoIndex])}
                        alt={villa.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={() => setImgError(true)}
                        onTouchStart={(e) => {
                            touchStartX.current = e.touches[0].clientX;
                        }}
                        onTouchEnd={(e) => {
                            if (touchStartX.current === null) {
return;
}

                            const delta = e.changedTouches[0].clientX - touchStartX.current;

                            if (Math.abs(delta) > 40) {
                                if (delta < 0) {
handleNext(e as unknown as React.MouseEvent);
} else {
handlePrev(e as unknown as React.MouseEvent);
}
                            }

                            touchStartX.current = null;
                        }}
                    />
                )}

                {/* Heart — top right */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist?.(villa.id, e);
                    }}
                    className="absolute top-2.5 right-2.5 p-0 bg-transparent border-0 cursor-pointer"
                    aria-label={isWished ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
                >
                    <Heart
                        className={`w-5 h-5 drop-shadow-md transition-colors ${
                            isWished
                                ? 'fill-rose-500 stroke-rose-500'
                                : 'fill-black/20 stroke-white'
                        }`}
                        strokeWidth={2}
                    />
                </button>

                {/* Nav arrows */}
                {photos.length > 1 && (
                    <>
                        <button
                            onClick={handlePrev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-white/80 hover:bg-white rounded-full shadow opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        >
                            <ChevronLeft className="w-3.5 h-3.5 text-slate-700" />
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-white/80 hover:bg-white rounded-full shadow opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        >
                            <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
                        </button>
                    </>
                )}

                {/* Dot indicators */}
                {photos.length > 1 && (
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
                        {photos.map((_, i) => (
                            <span
                                key={i}
                                className={`block rounded-full transition-all ${
                                    i === currentPhotoIndex
                                        ? 'w-2 h-2 bg-white'
                                        : 'w-1.5 h-1.5 bg-white/50'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="pt-3 flex flex-col space-y-0.5">
                {/* Name + rating inline */}
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[14px] sm:text-[15px] font-semibold text-slate-800 leading-tight tracking-tight line-clamp-1 flex-1">
                        {villa.name}
                    </h3>
                    <div className="flex items-center gap-0.5 shrink-0">
                        {ratingText !== null ? (
                            <>
                                <Star className="w-3.5 h-3.5 fill-slate-800 stroke-slate-800" />
                                <span className="text-[13px] font-semibold text-slate-800">{ratingText}</span>
                            </>
                        ) : (
                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">Baru</span>
                        )}
                    </div>
                </div>

                {/* Location */}
                <p className="text-sm text-slate-500 truncate">{villa.location}</p>

                {/* Capacity */}
                <p className="text-xs text-slate-500 pt-0.5">
                    {[
                        villa.bedrooms != null && villa.bedrooms > 0 ? `${villa.bedrooms} kamar` : null,
                        villa.beds != null && villa.beds > 0 ? `${villa.beds} kasur` : null,
                        `${villa.max_guests} tamu`,
                    ]
                        .filter(Boolean)
                        .join(' · ')}
                </p>

                {/* Price */}
                <div className="text-[13px] sm:text-[14px] text-slate-800 font-normal pt-1">
                    <span className="font-semibold">{priceText}</span>
                    <span className="text-slate-500"> {priceLabel}</span>
                </div>
            </div>
        </Link>
    );
}
