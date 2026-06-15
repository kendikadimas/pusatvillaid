import React from 'react';

interface FormFieldProps {
    label: string;
    error?: string;
    required?: boolean;
    hint?: string;
    children: React.ReactNode;
    className?: string;
}

export default function FormField({ label, error, required, hint, children, className = '' }: FormFieldProps) {
    return (
        <div className={className}>
            <label className="text-[11px] font-bold text-slate-500 block mb-1.5 uppercase">
                {label}{required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {children}
            {hint && !error && <p className="text-[10px] text-slate-400 mt-1 font-medium">{hint}</p>}
            {error && <p className="text-[10px] text-red-500 mt-1 font-bold">{error}</p>}
        </div>
    );
}
