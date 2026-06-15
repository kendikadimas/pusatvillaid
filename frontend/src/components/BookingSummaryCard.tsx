import React from 'react';
import { MapPin, Star, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Villa } from '@/types';
import { getMainPhoto } from '@/lib/villaUtils';

interface BookingSummaryCardProps {
    villa: Villa;
    checkIn?: string;
    checkOut?: string;
    mainPhoto?: string;
    compact?: boolean;
}

export default function BookingSummaryCard({ 
    villa, 
    checkIn, 
    checkOut, 
    mainPhoto,
    compact = false 
}: BookingSummaryCardProps) {
    const photo = mainPhoto || getMainPhoto(villa);

    const locationEnd = villa.location.split(',').pop()?.trim() || villa.location;

    if (compact) {
        return (
            <div className="flex space-x-3 bg-slate-50 rounded-xl p-3 border border-slate-200 text-left">
                <div className="w-16 aspect-video rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    <img src={photo} alt={villa.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-xs">
                    <h4 className="font-bold text-slate-900 line-clamp-1">{villa.name}</h4>
                    <div className="flex items-center text-slate-500 text-[10px] mt-0.5">
                        <MapPin className="w-3.5 h-3.5 mr-0.5 text-slate-400" />
                        <span>{villa.location}</span>
                    </div>
                    {checkIn && checkOut && (
                        <div className="flex items-center text-slate-500 text-[10px] mt-0.5">
                            <Calendar className="w-3.5 h-3.5 mr-0.5 text-slate-400" />
                            <span>
                                {format(parseISO(checkIn), 'dd MMM', { locale: localeID })} - {format(parseISO(checkOut), 'dd MMM yyyy', { locale: localeID })}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex space-x-4 border-b border-slate-100 pb-5">
            <div className="w-24 aspect-[4/3] rounded-2xl overflow-hidden bg-slate-105 flex-shrink-0">
                <img src={photo} alt={villa.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col justify-between py-0.5">
                <div>
                    <h4 className="font-serif font-bold text-slate-955 text-sm line-clamp-2">{villa.name}</h4>
                    <div className="flex items-center text-slate-400 text-[9px] font-bold mt-1.5 uppercase tracking-wider">
                        <MapPin className="w-3.5 h-3.5 mr-0.5 text-slate-350" />
                        <span>{locationEnd}</span>
                    </div>
                </div>
                <div className="flex items-center text-slate-700 text-[10px] font-bold mt-1.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-1" />
                    <span>5.0</span>
                    <span className="text-slate-455 font-semibold ml-1.5">(Terfavorit)</span>
                </div>
            </div>
        </div>
    );
}
