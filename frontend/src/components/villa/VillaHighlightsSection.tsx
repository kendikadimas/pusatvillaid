'use client';

import React from 'react';
import { highlightIconMap } from '@/lib/villaIcons';
import { Key } from 'lucide-react';

interface Highlight {
    icon: string;
    title: string;
    description: string;
}

interface VillaHighlightsSectionProps {
    highlights: Highlight[];
}

export default function VillaHighlightsSection({ highlights }: VillaHighlightsSectionProps) {
    return (
        <div className="space-y-6 pb-6 border-b border-slate-200/80">
            {highlights.map((hl, idx) => {
                const IconComponent = highlightIconMap[hl.icon] || Key;
                return (
                    <div key={idx} className="flex items-start space-x-5">
                        <IconComponent className="w-6 h-6 text-slate-800 shrink-0 mt-0.5" strokeWidth={1.5} />
                        <div>
                            <h4 className="text-[15px] font-bold text-slate-900 leading-snug">{hl.title}</h4>
                            <p className="text-[13px] text-slate-500 font-normal leading-normal mt-0.5">{hl.description}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
