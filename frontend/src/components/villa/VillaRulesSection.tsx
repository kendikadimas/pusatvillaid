'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

interface VillaRulesSectionProps {
    rules: string | null;
    safetyList: string[];
    cancellationPolicy: string;
    maxGuests: number;
}

export default function VillaRulesSection({ rules, safetyList, cancellationPolicy, maxGuests }: VillaRulesSectionProps) {
    const rulesList = rules ? rules.split('\n').filter(r => r.trim()) : [];
    const visibleColumns = [
        { show: rulesList.length > 0, key: 'rules' },
        { show: safetyList.length > 0, key: 'safety' },
        { show: !!cancellationPolicy, key: 'cancellation' },
    ].filter(c => c.show).length || 1;

    return (
        <div className="space-y-6 py-8 border-b border-slate-200/80">
            <h3 className="text-xl font-bold text-slate-900">Hal yang perlu diketahui</h3>
            <div className={`grid grid-cols-1 md:grid-cols-${visibleColumns} gap-8 text-[14px]`}>
                {/* Aturan Rumah */}
                {rulesList.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-bold text-slate-900">Aturan rumah</h4>
                        <div className="space-y-2.5 text-slate-600 font-medium leading-relaxed">
                            {rulesList.map((rule, idx) => (
                                <div key={idx} className="flex items-start space-x-2">
                                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                    <span>{rule}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Keamanan */}
                {safetyList.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-bold text-slate-900">Keamanan & properti</h4>
                        <div className="space-y-2.5 text-slate-600 font-medium leading-relaxed">
                            {safetyList.map((safety, idx) => {
                                const isNotReported = safety.toLowerCase().includes('tidak dilaporkan') || safety.toLowerCase().includes('tidak ada');
                                return (
                                    <div key={idx} className="flex items-start space-x-2">
                                        {isNotReported ? <X className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> : <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />}
                                        <span>{safety}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Pembatalan */}
                {cancellationPolicy && (
                    <div className="space-y-3">
                        <h4 className="font-bold text-slate-900">Kebijakan pembatalan</h4>
                        <p className="text-slate-600 font-medium leading-relaxed">{cancellationPolicy}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
