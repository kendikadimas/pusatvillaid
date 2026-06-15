import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center space-x-2 mt-8 border-t border-slate-200 pt-6">
            <button
                onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer"
            >
                Sebelumnya
            </button>
            {[...Array(totalPages)].map((_, i) => (
                <button
                    key={i}
                    onClick={() => onPageChange(i + 1)}
                    className={`w-9 h-9 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        currentPage === i + 1
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    {i + 1}
                </button>
            ))}
            <button
                onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer"
            >
                Selanjutnya
            </button>
        </div>
    );
}
