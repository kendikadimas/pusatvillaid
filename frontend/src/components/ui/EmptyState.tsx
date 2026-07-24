import React from 'react';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export default function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
    return (
        <div className={`bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs w-full max-w-md mx-auto ${className}`}>
            {icon && (
                <div className="mb-4 flex justify-center text-slate-300">
                    {icon}
                </div>
            )}
            <p className="text-slate-900 text-lg font-bold mb-2">{title}</p>
            {description && (
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-6">{description}</p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="text-xs font-bold text-green-500 border border-slate-200 rounded-xl px-5 py-3 hover:bg-green-50/50 active:scale-[0.98] transition-all cursor-pointer"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
