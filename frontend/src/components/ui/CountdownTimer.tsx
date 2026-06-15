'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
    totalSeconds: number;
    onExpired: () => void;
    warningThreshold?: number;
    className?: string;
}

export default function CountdownTimer({ totalSeconds, onExpired, warningThreshold = 300, className = '' }: CountdownTimerProps) {
    const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [expired, setExpired] = useState(false);

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    setExpired(true);
                    onExpired();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const formatTimer = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isWarning = secondsLeft <= warningThreshold;

    return (
        <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border transition-colors ${
            isWarning ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'
        } ${className}`}>
            <Clock className="w-4.5 h-4.5 flex-shrink-0" />
            <p className="text-sm font-medium">
                Selesaikan pembayaran dalam{' '}
                <span className="font-black tabular-nums">{formatTimer(secondsLeft)}</span>
                <span className="hidden sm:inline"> — tanggal Anda di-hold sementara</span>
            </p>
        </div>
    );
}
