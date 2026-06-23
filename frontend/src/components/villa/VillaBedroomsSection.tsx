import React from 'react';
import { getPhotoUrl } from '@/lib/villaUtils';

interface BedroomInfo {
    image: string;
    title: string;
    subtext: string;
}

interface VillaBedroomsSectionProps {
    bedroomsInfo: BedroomInfo[];
    totalBeds?: number | null;
}

export default function VillaBedroomsSection({ bedroomsInfo, totalBeds }: VillaBedroomsSectionProps) {
    return (
        <div className="pb-6 border-b border-slate-200/80">
            <div className="space-y-5">
                <div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Kamar Anda</h3>
                    {totalBeds != null && totalBeds > 0 && (
                        <p className="text-[13px] text-slate-500 font-medium mt-1">
                            {bedroomsInfo.length} kamar · {totalBeds} tempat tidur
                        </p>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {bedroomsInfo.map((br, idx) => (
                        <div key={idx} className="border border-slate-200 rounded-2xl p-4 flex flex-col space-y-3 bg-white">
                            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100">
                                <img src={getPhotoUrl(br.image)} alt={br.title} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h4 className="text-[14px] font-bold text-slate-900">{br.title}</h4>
                                <p className="text-[12px] text-slate-500 mt-0.5 font-normal">{br.subtext}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
