'use client';

import React, { useState } from 'react';
import AuthLayout from '@/components/auth-layout';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPasswordPage() {
    const { forgotPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        setStatus(null);

        try {
            const response = await forgotPassword(email);
            setStatus(response.status || 'We have emailed your password reset link!');
            setEmail('');
        } catch (err: any) {
            if (err.response?.data?.errors) {
                const apiErrors: Record<string, string> = {};
                Object.keys(err.response.data.errors).forEach((key) => {
                    apiErrors[key] = err.response.data.errors[key][0];
                });
                setErrors(apiErrors);
            } else if (err.response?.data?.message) {
                setErrors({ email: err.response.data.message });
            } else {
                setErrors({ email: 'An unexpected error occurred. Please try again.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AuthLayout
            title="Forgot password"
            description="No worries — we'll send you a reset link"
        >
            {status && (
                <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {status}
                </div>
            )}

            <div className="flex flex-col gap-5">
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="grid gap-1.5">
                        <Label
                            htmlFor="email"
                            className="text-sm font-medium text-[#111111] dark:text-slate-200"
                        >
                            Email address
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="off"
                            autoFocus
                            placeholder="email@example.com"
                            required
                            className="h-10 rounded-lg border-slate-200 bg-white transition-all duration-200 placeholder:text-[#787774] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <Button
                        type="submit"
                        className="mt-2 h-11 w-full cursor-pointer rounded-lg bg-blue-600 text-base font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60"
                        disabled={processing}
                    >
                        {processing && <Spinner className="mr-2" />}
                        {processing ? 'Sending link...' : 'Send reset link'}
                    </Button>
                </form>

                <div className="mt-2 text-center text-sm text-[#787774] dark:text-slate-400">
                    Or, return to{' '}
                    <TextLink
                        href="/login"
                        className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        log in
                    </TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}
