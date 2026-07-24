'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        // Log error ke console supaya bisa dilihat di browser devtools
        console.error('[GlobalError]', error?.message, error?.digest, error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white px-6 text-center">
            <div className="max-w-sm w-full space-y-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                </div>

                <div className="space-y-2">
                    <h1 className="text-xl font-bold text-slate-900">
                        Terjadi Kesalahan
                    </h1>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Maaf, halaman ini tidak dapat dimuat. Silakan coba lagi atau kembali ke halaman sebelumnya.
                    </p>
                    {error?.digest && (
                        <p className="text-xs text-slate-400 font-mono">
                            Kode error: {error.digest}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={reset}
                        className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-3 rounded-xl text-sm transition-all"
                    >
                        Coba Lagi
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
