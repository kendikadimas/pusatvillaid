'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface VillaDescriptionSectionProps {
    description: string | null;
    maxLength?: number;
}

export default function VillaDescriptionSection({ description, maxLength = 600 }: VillaDescriptionSectionProps) {
    const [isExpanded, setIsExpanded] = React.useState(false);

    if (!description) return null;

    const needsTruncation = description.length > maxLength;
    const displayText = needsTruncation && !isExpanded
        ? description.slice(0, maxLength).trimEnd() + '…'
        : description;

    return (
        <div id="tentang-section" className="space-y-4 pb-6 border-b border-slate-200/80 scroll-mt-32">
            {displayText.split('\n\n').filter(p => p.trim()).map((paragraph, idx) => (
                <p key={idx} className="text-slate-800 leading-relaxed text-[15px] font-normal">
                    {paragraph}
                </p>
            ))}
            {needsTruncation && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 text-[14px] font-bold px-5 py-3 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center space-x-1.5"
                >
                    <span>{isExpanded ? 'Sembunyikan' : 'Tampilkan lebih banyak'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} strokeWidth={2.5} />
                </button>
            )}
        </div>
    );
}
