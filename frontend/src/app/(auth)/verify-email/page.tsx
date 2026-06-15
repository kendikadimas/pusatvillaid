'use client';

import React, { useState } from 'react';
import AuthLayout from '@/components/auth-layout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/context/AuthContext';

export default function VerifyEmailPage() {
    const { resendEmailVerification, logout } = useAuth();
    const [processing, setProcessing] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const handleResend = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setStatus(null);

        try {
            await resendEmailVerification();
            setStatus('verification-link-sent');
        } catch (err: any) {
            setStatus('failed');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AuthLayout
            title="Check your inbox"
            description="We sent you a verification link. Please check your email to continue."
        >
            {status === 'verification-link-sent' && (
                <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    A new verification link has been sent to your email.
                </div>
            )}

            {status === 'failed' && (
                <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    Failed to resend verification link. Please try again.
                </div>
            )}

            <form onSubmit={handleResend} className="flex flex-col items-center gap-6">
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/30">
                        <svg
                            className="h-8 w-8 text-blue-600 dark:text-blue-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                            />
                        </svg>
                    </div>
                    <p className="text-sm text-[#787774] dark:text-slate-400">
                        Click the link in the email we sent you to verify your
                        account.
                    </p>
                </div>

                <Button
                    disabled={processing}
                    className="h-11 w-full cursor-pointer rounded-lg bg-blue-600 text-base font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60"
                >
                    {processing && <Spinner className="mr-2" />}
                    {processing ? 'Sending...' : 'Resend verification email'}
                </Button>

                <button
                    type="button"
                    onClick={logout}
                    className="text-sm font-medium text-[#787774] underline decoration-slate-300 underline-offset-4 transition-colors duration-200 hover:text-blue-600 hover:decoration-blue-300 dark:text-slate-400 dark:hover:text-blue-400"
                >
                    Log out
                </button>
            </form>
        </AuthLayout>
    );
}
