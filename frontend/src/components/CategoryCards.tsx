'use client';

import React from 'react';
import { Home, Compass, Bell } from 'lucide-react';

interface CategoryCardsProps {
    activeCategory: string;
    onCategoryChange: (category: string) => void;
}

const categories = [
    {
        id: 'homes',
        label: 'Homes',
        icon: Home,
        isNew: false,
    },
    {
        id: 'experiences',
        label: 'Experiences',
        icon: Compass,
        isNew: true,
    },
    {
        id: 'services',
        label: 'Services',
        icon: Bell,
        isNew: true,
    },
];

export default function CategoryCards({ activeCategory, onCategoryChange }: CategoryCardsProps) {
    return (
        <div className="flex items-center gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;

                return (
                    <button
                        key={cat.id}
                        onClick={() => onCategoryChange(cat.id)}
                        className={`relative flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border transition-all flex-shrink-0 min-w-[100px] ${
                            isActive
                                ? 'border-slate-900 bg-white shadow-sm'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                    >
                        {/* NEW badge */}
                        {cat.isNew && (
                            <span className="absolute top-2 right-2 bg-blue-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                                BARU
                            </span>
                        )}

                        {/* 3D-style icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isActive ? 'bg-slate-100' : 'bg-slate-50'
                        }`}>
                            <Icon className={`w-6 h-6 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} strokeWidth={1.5} />
                        </div>

                        {/* Label */}
                        <span className={`text-xs font-medium ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                            {cat.label}
                        </span>

                        {/* Active indicator */}
                        {isActive && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-slate-900 rounded-full" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
