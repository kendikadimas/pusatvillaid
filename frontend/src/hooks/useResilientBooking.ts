import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axiosClient from '@/lib/axios';
import type { Booking } from '@/types';

type Status = 'idle' | 'loading' | 'error' | 'success';

interface Anchor {
    code?: string;
    email?: string;
}

const ANCHOR_KEY = 'pusatvilla-active-booking';
const cacheKey = (code: string) => `pusatvilla-booking-cache-${code}`;

function readAnchorFromStorage(): Anchor {
    try {
        const raw = localStorage.getItem(ANCHOR_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return { code: parsed.code, email: parsed.email };
        }
    } catch {
    }
    return {};
}

function readCache(code?: string): Booking | null {
    if (!code) return null;
    try {
        const raw = localStorage.getItem(cacheKey(code));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function writeCache(code: string, booking: Booking) {
    try {
        localStorage.setItem(cacheKey(code), JSON.stringify(booking));
    } catch {
    }
}

/**
 * Hook resilient untuk fetch data booking di halaman payment/status/success.
 * - Hydrate instan dari cache (kalau ada) supaya UI tidak blank saat reload.
 * - Fetch ke server di background dengan retry + exponential backoff.
 * - Auto-retry saat tab kembali visible (misal user balik dari kamera/galeri).
 * - TIDAK PERNAH redirect/reset otomatis saat error — itu tanggung jawab caller.
 */
export function useResilientBooking(codeFromUrl?: string, emailFromUrl?: string) {
    const [booking, setBooking] = useState<Booking | null>(null);
    const [status, setStatus] = useState<Status>('idle');
    const [isFromCache, setIsFromCache] = useState(false);
    const generationRef = useRef(0);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const anchor = useMemo<Anchor>(() => {
        if (codeFromUrl && emailFromUrl) return { code: codeFromUrl, email: emailFromUrl };
        const fromStorage = readAnchorFromStorage();
        return {
            code: codeFromUrl || fromStorage.code,
            email: emailFromUrl || fromStorage.email,
        };
    }, [codeFromUrl, emailFromUrl]);

    // Hydrate instan dari cache di mount
    useEffect(() => {
        if (!anchor.code) return;
        const cached = readCache(anchor.code);
        if (cached) {
            setBooking(cached);
            setIsFromCache(true);
        }
    }, [anchor.code]);

    const fetchBooking = useCallback(async (maxRetries = 3) => {
        if (!anchor.code || !anchor.email) {
            // Jangan langsung set error — email mungkin masih loading dari authContext
            // atau sedang di-resolve dari localStorage. Set idle supaya caller tahu
            // fetch belum bisa jalan, tapi tidak menampilkan error screen.
            setStatus('idle');
            return;
        }

        const gen = ++generationRef.current;
        setStatus('loading');

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const res = await axiosClient.get(`/bookings/${anchor.code}`, {
                    params: { email: anchor.email },
                    timeout: 10000,
                });

                if (!mountedRef.current) return;
                if (gen !== generationRef.current) return;

                setBooking(res.data);
                setIsFromCache(false);
                writeCache(anchor.code, res.data);
                setStatus('success');
                return;
            } catch (err) {
                if (!mountedRef.current) return;
                if (gen !== generationRef.current) return;

                const isLastAttempt = attempt === maxRetries - 1;
                if (isLastAttempt) {
                    setStatus('error');
                } else {
                    const backoffMs = 1000 * Math.pow(2, attempt);
                    await new Promise((r) => setTimeout(r, backoffMs));
                }
            }
        }
    }, [anchor.code, anchor.email]);

    const refetch = useCallback(() => {
        fetchBooking();
    }, [fetchBooking]);

    useEffect(() => {
        fetchBooking();
    }, [fetchBooking]);

    // Auto-retry saat tab kembali aktif
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible' && status === 'error') {
                fetchBooking();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [status, fetchBooking]);

    return { booking, status, isFromCache, anchor, refetch };
}
