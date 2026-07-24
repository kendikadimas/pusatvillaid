import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
    fullPage?: boolean;
    className?: string;
}

const sizeMap = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

export default function LoadingSpinner({ message, size = 'md', fullPage = true, className = '' }: LoadingSpinnerProps) {
    const content = (
        <div className={`flex flex-col items-center justify-center gap-3 ${fullPage ? 'py-32 min-h-[40vh]' : 'py-8'} ${className}`}>
            <Loader2 className={`${sizeMap[size]} animate-spin text-green-500`} />
            {message && <p className="text-sm text-slate-400 font-medium">{message}</p>}
        </div>
    );

    if (fullPage) {
        return <div className="flex justify-center items-center min-h-screen bg-slate-50">{content}</div>;
    }
    return content;
}
