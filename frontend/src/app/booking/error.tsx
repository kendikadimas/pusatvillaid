'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

export default function BookingError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        // Log ke console untuk debugging — terlihat di browser devtools
        console.error('[BookingError]', error?.message, error?.digest, error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white px-6 text-center">
            <div className="max-w-sm w-full space-y-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-xl font-bold text-slate-900">
                        Terjadi Kesalahan
                    </h1>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Halaman booking tidak dapat dimuat. Jika Anda sudah mengklik
                        <strong> Konfirmasi dan Bayar</strong>, booking Anda mungkin sudah berhasil dibuat.
                        Silakan cek status booking Anda.
                    </p>
                    {error?.digest && (
                        <p className="text-xs text-slate-400 font-mono bg-slate-50 px-3 py-1.5 rounded-lg inline-block">
                            Kode: {error.digest}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={reset}
                        className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-bold py-3 rounded-xl text-sm transition-all"
                    >
                        Coba Lagi
                    </button>
                    <button
                        onClick={() => router.push('/booking/status')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-3 rounded-xl text-sm transition-all"
                    >
                        Cek Status Booking
                    </button>
                    <button
                        onClick={() => router.back()}
                        className="w-full bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 font-bold py-3 rounded-xl text-sm transition-all"
                    >
                        Kembali
                    </button>
                    <a
                        href="/"
                        className="w-full text-center text-sm text-slate-400 hover:text-slate-600 py-2 transition-colors"
                    >
                        Ke Halaman Utama
                    </a>
                </div>
            </div>
        </div>
    );
}
