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
            title="Email verification"
            description="Please verify your email address by clicking on the link we just emailed to you."
        >
            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-green-600 dark:text-green-400">
                    A new verification link has been sent to the email address
                    you provided during registration.
                </div>
            )}

            {status === 'failed' && (
                <div className="mb-4 text-center text-sm font-medium text-red-600 dark:text-red-400">
                    Failed to resend verification link. Please try again.
                </div>
            )}

            <form onSubmit={handleResend} className="space-y-6 text-center flex flex-col items-center">
                <Button disabled={processing} variant="secondary" className="cursor-pointer">
                    {processing && <Spinner />}
                    Resend verification email
                </Button>

                <button
                    type="button"
                    onClick={logout}
                    className="mx-auto block text-sm text-foreground underline decoration-neutral-300 underline-offset-4 hover:decoration-current cursor-pointer"
                >
                    Log out
                </button>
            </form>
        </AuthLayout>
    );
}
