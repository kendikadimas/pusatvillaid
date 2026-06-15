'use client';

import React, { useState } from 'react';
import AuthLayout from '@/components/auth-layout';
import GoogleLoginButton from '@/components/google-login-button';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        setStatus(null);

        try {
            await login({
                email,
                password,
                remember: remember ? 'on' : '',
            });
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
            title="Welcome back"
            description="Enter your credentials to access your account"
        >
            <div className="mb-6 space-y-3">
                <GoogleLoginButton />
            </div>

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wide">
                    <span className="bg-white px-3 text-[#787774]">
                        Or sign in with email
                    </span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid gap-5">
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
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            placeholder="email@example.com"
                            className="h-10 rounded-lg border-slate-200 bg-white transition-all duration-200 placeholder:text-[#787774] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-1.5">
                        <div className="flex items-center">
                            <Label
                                htmlFor="password"
                                className="text-sm font-medium text-[#111111] dark:text-slate-200"
                            >
                                Password
                            </Label>
                            <TextLink
                                href="/forgot-password"
                                className="ml-auto text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                tabIndex={5}
                            >
                                Forgot your password?
                            </TextLink>
                        </div>
                        <PasswordInput
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            placeholder="Password"
                            inputClassName="h-10 rounded-lg border-slate-200 bg-white transition-all duration-200 placeholder:text-[#787774] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={remember}
                            onCheckedChange={(checked) => setRemember(!!checked)}
                            tabIndex={3}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <Label
                            htmlFor="remember"
                            className="cursor-pointer text-sm text-[#787774] dark:text-slate-400"
                        >
                            Remember me
                        </Label>
                    </div>

                    <Button
                        type="submit"
                        className="mt-2 h-11 w-full cursor-pointer rounded-lg bg-blue-600 text-base font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60"
                        tabIndex={4}
                        disabled={processing}
                    >
                        {processing && <Spinner className="mr-2" />}
                        {processing ? 'Signing in...' : 'Log in'}
                    </Button>
                </div>

                <div className="mt-2 text-center text-sm text-[#787774] dark:text-slate-400">
                    Don't have an account?{' '}
                    <TextLink
                        href="/register"
                        tabIndex={5}
                        className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        Sign up
                    </TextLink>
                </div>
            </form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-blue-700">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
