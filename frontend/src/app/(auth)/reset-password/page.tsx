'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AuthLayout from '@/components/auth-layout';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/context/AuthContext';

function ResetPasswordForm() {
    const { resetPassword } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const token = searchParams.get('token') || '';
    const initialEmail = searchParams.get('email') || '';

    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        setStatus(null);

        try {
            const response = await resetPassword({
                token,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });
            setStatus(response.status || 'Password reset successful!');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {status && (
                <div className="rounded-lg bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {status}
                </div>
            )}

            <div className="grid gap-1.5">
                <Label
                    htmlFor="email"
                    className="text-sm font-medium text-[#111111] dark:text-slate-200"
                >
                    Email
                </Label>
                <Input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 rounded-lg border-slate-200 bg-white transition-all duration-200 placeholder:text-[#787774] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500"
                    readOnly={!!initialEmail}
                />
                <InputError message={errors.email} />
            </div>

            <div className="grid gap-1.5">
                <Label
                    htmlFor="password"
                    className="text-sm font-medium text-[#111111] dark:text-slate-200"
                >
                    New password
                </Label>
                <PasswordInput
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    autoFocus
                    placeholder="Create a new password"
                    inputClassName="h-10 rounded-lg border-slate-200 bg-white transition-all duration-200 placeholder:text-[#787774] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500"
                />
                <InputError message={errors.password} />
            </div>

            <div className="grid gap-1.5">
                <Label
                    htmlFor="password_confirmation"
                    className="text-sm font-medium text-[#111111] dark:text-slate-200"
                >
                    Confirm new password
                </Label>
                <PasswordInput
                    id="password_confirmation"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Repeat your new password"
                    inputClassName="h-10 rounded-lg border-slate-200 bg-white transition-all duration-200 placeholder:text-[#787774] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500"
                />
                <InputError message={errors.password_confirmation} />
            </div>

            <Button
                type="submit"
                className="mt-2 h-11 w-full cursor-pointer rounded-lg bg-blue-600 text-base font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60"
                disabled={processing}
            >
                {processing && <Spinner className="mr-2" />}
                {processing ? 'Resetting...' : 'Reset password'}
            </Button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <AuthLayout
            title="Reset password"
            description="Please enter your new password below"
        >
            <Suspense fallback={<div className="flex justify-center py-4"><Spinner /></div>}>
                <ResetPasswordForm />
            </Suspense>
        </AuthLayout>
    );
}
