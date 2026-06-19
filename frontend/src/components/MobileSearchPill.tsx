'use client';

import React from 'react';
import { SlidersHorizontal, ArrowLeft, Search } from 'lucide-react';

interface MobileSearchPillProps {
    location: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    onEditClick: () => void;
    onBackClick?: () => void;
    showBackButton?: boolean;
}

export default function MobileSearchPill({
    location,
    checkIn,
    checkOut,
    guests,
    onEditClick,
    onBackClick,
    showBackButton = false,
}: MobileSearchPillProps) {
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${date.getDate()} ${months[date.getMonth()]}`;
    };

    const datesLabel = checkIn && checkOut
        ? `${formatDate(checkIn)}-${formatDate(checkOut)}`
        : '';

    const guestsLabel = guests > 0 ? `${guests} tamu` : '';

    const pillText = location
        ? `Penginapan di ${location}`
        : 'Penginapan';

    return (
        <div className="sticky top-0 z-40 bg-white border-b border-slate-100 lg:hidden">
            <div className="flex items-center gap-2 px-3 py-2">
                {/* Back button */}
                {showBackButton && onBackClick && (
                    <button
                        onClick={onBackClick}
                        className="p-2 -ml-1 rounded-full hover:bg-slate-100 transition-colors flex-shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-700" />
                    </button>
                )}

                {/* Search pill */}
                <button
                    onClick={onEditClick}
                    className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-full py-2 pl-4 pr-2 shadow-sm hover:shadow-md transition-all"
                >
                    <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs font-bold text-slate-900 truncate">{pillText}</p>
                        {(datesLabel || guestsLabel) && (
                            <p className="text-[10px] text-slate-400 truncate">
                                {[datesLabel, guestsLabel].filter(Boolean).join(' · ')}
                            </p>
                        )}
                    </div>
                    <div className="p-1.5 bg-slate-100 rounded-full flex-shrink-0">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                </button>
            </div>
        </div>
    );
}
