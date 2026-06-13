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
        <form onSubmit={handleSubmit} className="grid gap-6">
            {status && (
                <div className="text-center text-sm font-medium text-green-600 dark:text-green-400">
                    {status}
                </div>
            )}
            
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full"
                    readOnly={!!initialEmail}
                />
                <InputError message={errors.email} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="mt-1 block w-full"
                    autoFocus
                    placeholder="Password"
                />
                <InputError message={errors.password} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="password_confirmation">
                    Confirm password
                </Label>
                <PasswordInput
                    id="password_confirmation"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    autoComplete="new-password"
                    className="mt-1 block w-full"
                    placeholder="Confirm password"
                />
                <InputError message={errors.password_confirmation} />
            </div>

            <Button
                type="submit"
                className="mt-4 w-full cursor-pointer"
                disabled={processing}
            >
                {processing && <Spinner />}
                Reset password
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
