'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/auth-layout';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import axiosClient from '@/lib/axios';

export default function ConfirmPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            await axiosClient.post('/user/confirm-password', { password });
            // Redirect back to dashboard or reload
            router.push('/dashboard');
        } catch (err: any) {
            if (err.response?.data?.errors) {
                const apiErrors: Record<string, string> = {};
                Object.keys(err.response.data.errors).forEach((key) => {
                    apiErrors[key] = err.response.data.errors[key][0];
                });
                setErrors(apiErrors);
            } else if (err.response?.data?.message) {
                setErrors({ password: err.response.data.message });
            } else {
                setErrors({ password: 'An unexpected error occurred. Please try again.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AuthLayout
            title="Confirm password"
            description="This is a secure area. Please confirm your password before continuing."
        >
            <div className="flex flex-col gap-5">
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="grid gap-1.5">
                        <Label
                            htmlFor="password"
                            className="text-sm font-medium text-[#111111] dark:text-slate-200"
                        >
                            Password
                        </Label>
                        <PasswordInput
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            autoFocus
                            required
                            inputClassName="h-10 rounded-lg border-slate-200 bg-white transition-all duration-200 placeholder:text-[#787774] focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <Button
                        type="submit"
                        className="mt-2 h-11 w-full cursor-pointer rounded-lg bg-green-600 text-base font-semibold text-white shadow-sm transition-all duration-200 hover:bg-green-700 active:scale-[0.98] disabled:opacity-60"
                        disabled={processing}
                    >
                        {processing && <Spinner className="mr-2" />}
                        {processing ? 'Confirming...' : 'Confirm password'}
                    </Button>
                </form>
            </div>
        </AuthLayout>
    );
}
