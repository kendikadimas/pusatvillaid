'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/context/AuthContext';
import axiosClient from '@/lib/axios';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshUser } = useAuth();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const code = searchParams.get('code');
        const errorMsg = searchParams.get('error');

        if (errorMsg) {
            setError(decodeURIComponent(errorMsg));
            return;
        }

        if (code) {
            // Exchange the one-time authorization code for a token
            axiosClient.post('/auth/exchange-code', { code })
                .then((response) => {
                    const { token } = response.data;
                    if (token) {
                        localStorage.setItem('user_token', token);
                        return refreshUser();
                    } else {
                        throw new Error('No token received');
                    }
                })
                .then(() => router.replace('/profile'))
                .catch((err) => {
                    console.error('Token exchange failed:', err);
                    setError('Gagal menyelesaikan autentikasi. Silakan coba lagi.');
                });
        } else {
            setError('Kode otorisasi tidak ditemukan. Silakan coba lagi.');
        }
    }, []);

    return (
        <div className="text-center">
            {error ? (
                <div className="space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                        <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-[#111111]">Authentication Failed</h2>
                    <p className="text-sm text-[#787774]">{error}</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="mt-4 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        Back to login
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <Spinner className="mx-auto size-8" />
                    <p className="text-sm text-[#787774]">Completing authentication...</p>
                </div>
            )}
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <div className="flex min-h-dvh items-center justify-center bg-white">
            <Suspense fallback={
                <div className="space-y-4">
                    <Spinner className="mx-auto size-8" />
                    <p className="text-sm text-[#787774]">Loading...</p>
                </div>
            }>
                <CallbackContent />
            </Suspense>
        </div>
    );
}
