'use client';

import React from 'react';
import { Check, ShieldCheck, Shield } from 'lucide-react';
import { getHostAboutIcon } from '@/lib/villaIcons';

interface CoHost {
    name: string;
    avatar: string;
}

interface HostProfileSectionProps {
    hostName: string;
    hostAvatar: string;
    hostYears: number;
    hostIsVerified: boolean;
    hostAboutList: string[];
    coHosts: CoHost[];
    hostJoinedLabel: string;
    reviewsCount: number;
    avgRating: number;
}

export default function HostProfileSection({
    hostName, hostAvatar, hostYears, hostIsVerified,
    hostAboutList, coHosts, hostJoinedLabel, reviewsCount, avgRating
}: HostProfileSectionProps) {
    const coHostFallbackAvatar = 'https://ui-avatars.com/api/?name=CoHost&background=e2e8f0&color=475569&size=120';

    return (
        <div className="border-t border-b border-slate-200/80 py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl md:text-[22px] font-semibold text-slate-900 tracking-tight">
                        Dipandu oleh {hostName}
                    </h2>
                    <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-semibold mt-1">
                        {hostIsVerified && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
                        <span>{hostJoinedLabel}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 items-start">
                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                        <img src={hostAvatar} alt={hostName} className="w-28 h-28 rounded-full object-cover shadow-sm border border-slate-100" />
                        {hostIsVerified && (
                            <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                                <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                        )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{hostName}</h3>
                    {hostIsVerified && (
                        <div className="text-[11px] text-blue-500 font-bold mt-1">Superhost</div>
                    )}
                </div>

                <div className="flex flex-col space-y-6">
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                            <span className="block text-2xl font-bold text-slate-900">{reviewsCount}</span>
                            <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Ulasan</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                            <span className="block text-2xl font-bold text-slate-900">
                                {avgRating > 0 ? avgRating.toFixed(1).replace('.', ',') : '—'}
                            </span>
                            <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Peringkat</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                            <span className="block text-2xl font-bold text-slate-900">{hostYears}</span>
                            <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Tahun</span>
                        </div>
                    </div>

                    {hostAboutList.length > 0 && (
                        <div className="space-y-3">
                            {hostAboutList.map((about, idx) => {
                                const IconComponent = getHostAboutIcon(about, idx);
                                return (
                                    <div key={idx} className="flex items-center space-x-3 text-slate-700 text-sm font-medium">
                                        <IconComponent className="w-5 h-5 text-slate-500 shrink-0" strokeWidth={1.5} />
                                        <span>{about}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}



                    <div className="pt-2 space-y-3">
                        <button className="bg-slate-900 hover:bg-black text-white text-sm font-bold py-3 px-6 rounded-xl transition-colors active:scale-95 duration-150">
                            Kirimkan pesan kepada tuan rumah
                        </button>
                        <div className="flex items-start space-x-2.5 max-w-xl">
                            <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-slate-500 leading-normal">
                                Untuk melindungi pembayaran Anda, jangan pernah mentransfer uang atau berkomunikasi di luar situs web atau aplikasi PusatVilla.id.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
