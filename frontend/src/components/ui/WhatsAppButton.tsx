import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
    phone: string;
    label?: string;
    variant?: 'icon' | 'button' | 'link';
    className?: string;
}

function normalizePhone(phone: string): string {
    const cleaned = phone.replace(/[^0-9]/g, '');
    return cleaned.startsWith('0') ? '62' + cleaned.slice(1) : cleaned;
}

export default function WhatsAppButton({ phone, label, variant = 'icon', className = '' }: WhatsAppButtonProps) {
    const normalizedPhone = normalizePhone(phone);
    const href = `https://wa.me/${normalizedPhone}`;

    if (variant === 'icon') {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label || 'Hubungi via WhatsApp'}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors cursor-pointer ${className}`}
            >
                <MessageCircle className="w-4 h-4" />
            </a>
        );
    }

    if (variant === 'link') {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={`text-xs font-bold text-emerald-600 hover:text-emerald-700 underline cursor-pointer ${className}`}>
                {label || 'Hubungi via WhatsApp'}
            </a>
        );
    }

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-full transition-colors cursor-pointer active:scale-95 ${className}`}
        >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{label || 'WhatsApp'}</span>
        </a>
    );
}
