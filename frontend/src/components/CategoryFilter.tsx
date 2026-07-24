import React from 'react';
import { LayoutGrid, Waves, Mountain, Crown, Heart, Home as HomeIcon } from 'lucide-react';
import { Villa } from '@/types';

export const categories = [
    { id: 'all', name: 'Semua Villa', icon: LayoutGrid },
    { id: 'pool', name: 'Kolam Pribadi', icon: Waves, filter: (v: Villa) => v.amenities?.some(a => (typeof a === 'string' ? a : a.name).toLowerCase().includes('kolam')) },
    { id: 'mountain', name: 'Pegunungan', icon: Mountain, filter: (v: Villa) => v.location?.includes('Bogor') || v.description?.includes('gunung') || v.location?.includes('Puncak') },
    { id: 'luxury', name: 'Mewah', icon: Crown, filter: (v: Villa) => v.amenities?.some(a => {
        const name = (typeof a === 'string' ? a : a.name).toLowerCase();
        return name.includes('butler') || name.includes('pelayan') || name.includes('jacuzzi') || name.includes('spa');
    }) || v.price_per_night > 3000000 },
    { id: 'couple', name: 'Pasangan', icon: Heart, filter: (v: Villa) => v.max_guests <= 4 },
    { id: 'family', name: 'Keluarga', icon: HomeIcon, filter: (v: Villa) => v.bedrooms >= 3 },
];

interface CategoryFilterProps {
    selectedCategory: string;
    setSelectedCategory: (id: string) => void;
    className?: string;
}

export default function CategoryFilter({ selectedCategory, setSelectedCategory, className = '' }: CategoryFilterProps) {
    return (
        <div className={`flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none justify-start lg:justify-center ${className}`}>
            {categories.map((cat) => {
                const IconComponent = cat.icon;
                return (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-medium border transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] whitespace-nowrap cursor-pointer active:scale-[0.98] rounded-[8px] ${
                            selectedCategory === cat.id
                                ? 'bg-[#2563EB] border-[#2563EB] text-white'
                                : 'bg-white border-[#EAEAEA] text-[#787774] hover:border-[#2563EB] hover:text-[#2563EB]'
                        }`}
                    >
                        <IconComponent className="w-3.5 h-3.5" />
                        <span>{cat.name}</span>
                    </button>
                );
            })}
        </div>
    );
}
