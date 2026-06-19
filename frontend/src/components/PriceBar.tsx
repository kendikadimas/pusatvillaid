'use client';

import React from 'react';
import { Tag } from 'lucide-react';

export default function PriceBar() {
    return (
        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Tag className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-medium text-slate-700">Harga sudah mencakup semua biaya</span>
        </div>
    );
}
