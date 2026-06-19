'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import { getPhotoUrl } from '@/lib/villaUtils';
import { Villa } from '@/types';

interface ContinueSearchCardProps {
    location: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    previewVilla?: Villa | null;
    onClick: () => void;
}

export default function ContinueSearchCard({
    location,
    checkIn,
    checkOut,
    guests,
    previewVilla,
    onClick,
}: ContinueSearchCardProps) {
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${date.getDate()} ${months[date.getMonth()]}`;
    };

    const datesLabel = checkIn && checkOut
        ? `${formatDate(checkIn)} – ${formatDate(checkOut)}`
        : '';

    const guestsLabel = guests > 0 ? `${guests} tamu` : '';

    const details = [datesLabel, guestsLabel].filter(Boolean).join(' · ');

    const previewImage = previewVilla?.photos?.[0]
        ? getPhotoUrl(previewVilla.photos[0])
        : 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=400&q=80';

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-4 w-full bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
        >
            {/* Text content */}
            <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">
                    Lanjutkan mencari penginapan di {location}
                </p>
                {details && (
                    <p className="text-xs text-slate-400 mt-1 truncate">{details}</p>
                )}
            </div>

            {/* Preview image */}
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                />
            </div>
        </button>
    );
}
