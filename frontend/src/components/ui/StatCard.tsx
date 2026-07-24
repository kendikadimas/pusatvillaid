import React from 'react';
import Link from 'next/link';

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    iconBgColor?: string;
    iconTextColor?: string;
    href?: string;
}

export default function StatCard({ icon, label, value, iconBgColor = 'bg-blue-50', iconTextColor = 'text-blue-600', href }: StatCardProps) {
    const CardContent = href ? Link : 'div';
    const cardProps = href ? { href } : {};

    return (
        <CardContent
            {...cardProps as any}
            className="group cursor-pointer bg-white border border-[#dddddd] rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04)] p-5 block"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[11px] font-semibold text-[#6a6a6a] uppercase tracking-wider">{label}</p>
                    <p className="text-xl sm:text-2xl font-black text-[#0d0d0d] mt-1.5 tracking-tight">{value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${iconBgColor} flex items-center justify-center ${iconTextColor}`}>
                    {icon}
                </div>
            </div>
        </CardContent>
    );
}
