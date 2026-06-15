import React from 'react';

type StatusVariant = 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'paid' | 'unpaid' | 'refunded' | 'expired';

interface StatusBadgeProps {
    variant: StatusVariant;
    label?: string;
    className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
    completed: 'bg-slate-100 text-slate-800 border-slate-200',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    unpaid: 'bg-amber-50 text-amber-700 border-amber-200',
    refunded: 'bg-violet-50 text-violet-700 border-violet-200',
    expired: 'bg-gray-100 text-gray-600 border-gray-200',
};

const variantLabels: Record<StatusVariant, string> = {
    confirmed: 'Dikonfirmasi',
    pending: 'Menunggu',
    cancelled: 'Dibatalkan',
    completed: 'Selesai',
    paid: 'Lunas',
    unpaid: 'Belum Bayar',
    refunded: 'Refund',
    expired: 'Kadaluarsa',
};

export default function StatusBadge({ variant, label, className = '' }: StatusBadgeProps) {
    const style = variantStyles[variant] || variantStyles.pending;
    const text = label || variantLabels[variant] || variant;

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${style} ${className}`}>
            {text}
        </span>
    );
}
