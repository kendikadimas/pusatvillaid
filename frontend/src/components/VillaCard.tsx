import React from 'react';
import Link from 'next/link';
import { Star, Heart } from 'lucide-react';
import { Villa } from '@/types';
import { getMainPhoto } from '@/lib/villaUtils';

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
    const mainPhoto = getMainPhoto(villa);
    const isWished = wishlist.includes(villa.id);

    const checkInParam = searchParams.checkIn;
    const checkOutParam = searchParams.checkOut;
    const detailUrl = `/villas/${villa.slug}${
        checkInParam && checkOutParam 
            ? `?checkIn=${checkInParam}&checkOut=${checkOutParam}` 
            : ''
    }`;

    const ratingVal = villa.reviews_avg_rating 
        ? parseFloat(villa.reviews_avg_rating.toString()) 
        : 4.5 + (villa.id % 5) * 0.1;
    const ratingText = ratingVal.toFixed(1).replace('.', ',');
    const reviewCount = villa.reviews_count || 0;

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
                    <div className="relative aspect-[20/19] w-full overflow-hidden rounded-[12px] bg-[#F7F6F3] border border-[#EAEAEA]">
                        <img 
                            src={mainPhoto} 
                            alt={villa.name} 
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                        />
                        
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

                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
                        </div>
                    </div>

                    <div className="pt-3 flex-1 flex flex-col justify-between space-y-1 bg-transparent">
                        <div>
                            <div className="flex items-center justify-between text-[15px] text-slate-700 font-bold leading-tight">
                                <span className="truncate group-hover:text-blue-500 transition-colors">
                                    {villa.name}
                                </span>
                            </div>
                            
                            <div className="text-[14px] text-slate-600 font-normal pt-1.5">
                                <span className="font-medium">
                                    Rp {Number(villa.price_per_night).toLocaleString('id-ID')}
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
    const priceText = `Rp ${Number(villa.price_per_night).toLocaleString('id-ID')}`;
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
            className="group cursor-pointer flex flex-col w-full bg-transparent hover:no-underline"
        >
            <div className="relative aspect-[20/19] w-full overflow-hidden rounded-[12px] bg-[#F7F6F3] border border-[#EAEAEA]">
                <img
                    src={mainPhoto}
                    alt={villa.name}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                />
                
                <button
                    type="button"
                    onClick={(e) => toggleWishlist(villa.id, e)}
                    className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-transparent text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                    <Heart
                        className={`w-5 h-5 stroke-white stroke-[2.5px] transition-colors ${
                            isWished ? 'fill-red-500 text-red-500' : 'fill-black/20 text-white/90'
                        }`}
                    />
                </button>
            </div>

            <div className="pt-3 flex flex-col space-y-0.5 bg-transparent text-left">
                <h3 className="text-[15px] font-semibold text-slate-700 leading-tight tracking-tight line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {villa.name}
                </h3>
                <div className="text-[14px] text-slate-700 font-normal pt-0.5">
                    <span className="font-medium">
                        {priceText}
                    </span>
                    <span className="text-slate-500"> {priceLabel}</span>
                </div>
            </div>
        </Link>
    );
}
