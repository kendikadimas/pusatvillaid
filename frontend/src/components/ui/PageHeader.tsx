import React from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    backHref?: string;
    className?: string;
}

export default function PageHeader({ title, description, actions, className = '' }: PageHeaderProps) {
    return (
        <div className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 ${className}`}>
            <div>
                <h1 className="font-serif text-2xl md:text-[32px] md:leading-[36px] font-semibold text-slate-900 tracking-tight">
                    {title}
                </h1>
                {description && (
                    <p className="text-[13px] text-slate-400 font-semibold mt-1.5">{description}</p>
                )}
            </div>
            {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
    );
}
