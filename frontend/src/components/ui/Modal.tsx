'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-xl',
};

export default function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (open) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative bg-white rounded-[14px] border border-[#e4e4e4] shadow-[0_8px_32px_rgba(0,0,0,0.12)] w-full ${sizeClasses[size]} animate-in fade-in zoom-in-95`}>
                <div className="flex items-center justify-between p-6 pb-4 border-b border-[#eeeeee]">
                    <div>
                        <h2 className="text-lg font-bold text-[#0d0d0d]">{title}</h2>
                        {description && <p className="text-[11px] text-[#6a6a6a] mt-0.5">{description}</p>}
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
                {footer && (
                    <div className="flex items-center justify-end gap-2 p-6 pt-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
