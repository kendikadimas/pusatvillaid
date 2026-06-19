'use client';

import React from 'react';
import { Map } from 'lucide-react';

interface MobileFloatingMapButtonProps {
    onClick: () => void;
    label?: string;
}

export default function MobileFloatingMapButton({ onClick, label = 'Peta' }: MobileFloatingMapButtonProps) {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 lg:hidden flex items-center gap-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-sm px-6 py-3 rounded-full shadow-xl transition-all"
        >
            <Map className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );
}
