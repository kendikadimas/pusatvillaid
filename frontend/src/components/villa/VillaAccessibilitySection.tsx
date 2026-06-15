import React from 'react';

interface FeatureCard {
    image: string;
    title: string;
    subtext: string;
}

interface VillaAccessibilitySectionProps {
    features: FeatureCard[];
}

export default function VillaAccessibilitySection({ features }: VillaAccessibilitySectionProps) {
    return (
        <div className="pb-6 border-b border-slate-200/80">
            <div className="space-y-5">
                <div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Fitur aksesibilitas</h3>
                    <p className="text-[13px] text-slate-500 mt-0.5 font-normal">Info ini diberikan oleh Tuan Rumah dan sudah ditinjau oleh PusatVilla.id</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {features.map((ac, idx) => (
                        <div key={idx} className="border border-slate-200 rounded-2xl p-4 flex flex-col space-y-3 bg-white">
                            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100">
                                <img src={ac.image} alt={ac.title} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h4 className="text-[14px] font-bold text-slate-900">{ac.title}</h4>
                                <p className="text-[12px] text-slate-500 mt-0.5 font-normal">{ac.subtext}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
