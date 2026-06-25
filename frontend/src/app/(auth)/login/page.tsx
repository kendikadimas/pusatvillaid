'use client';

import React, { useState } from 'react';
import AuthLayout from '@/components/auth-layout';
import InputError from '@/components/input-error';
import GoogleLoginButton from '@/components/google-login-button';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, LogIn } from 'lucide-react';

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
            // First try user login; if the account is admin, retry with admin endpoint
            console.log('[LoginPage] Attempting user login for:', email);
            await login({ email, password, remember: remember ? 'on' : '' });
            console.log('[LoginPage] User login succeeded');
        } catch (err: any) {
            const message: string = err.response?.data?.message || '';
            const isAdminAccount = err.response?.status === 403 &&
                message.includes('administrator');

            console.log('[LoginPage] First login attempt failed:', {
                status: err.response?.status,
                message,
                isAdminAccount,
            });

            if (isAdminAccount) {
                // Retry as admin login
                console.log('[LoginPage] Detected admin account, retrying with admin endpoint...');
                try {
                    await login({ email, password, remember: remember ? 'on' : '' }, true);
                    console.log('[LoginPage] Admin login retry succeeded');
                    return;
                } catch (adminErr: any) {
                    console.error('[LoginPage] Admin login retry failed:', adminErr.response?.status, adminErr.response?.data);
                    if (adminErr.response?.data?.errors) {
                        const apiErrors: Record<string, string> = {};
                        Object.keys(adminErr.response.data.errors).forEach((key) => {
                            apiErrors[key] = adminErr.response.data.errors[key][0];
                        });
                        setErrors(apiErrors);
                    } else if (adminErr.response?.data?.message) {
                        setErrors({ email: adminErr.response.data.message });
                    } else {
                        setErrors({ email: 'Terjadi kesalahan sistem. Silakan coba lagi.' });
                    }
                }
            } else if (err.response?.data?.errors) {
                const apiErrors: Record<string, string> = {};
                Object.keys(err.response.data.errors).forEach((key) => {
                    apiErrors[key] = err.response.data.errors[key][0];
                });
                setErrors(apiErrors);
            } else if (message) {
                setErrors({ email: message });
            } else {
                setErrors({ email: 'Terjadi kesalahan sistem. Silakan coba lagi.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AuthLayout
            title="Masuk ke Akun Anda"
            description="Silakan masukkan email dan password Anda untuk masuk"
        >
            <GoogleLoginButton />

            <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wide">
                    <span className="bg-white px-3 text-slate-400">Atau masuk dengan email</span>
                </div>
                </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5">
                    {/* Email Input */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Alamat Email
                        </Label>
                        <div className="relative flex items-center">
                            <Mail className="absolute left-3.5 w-4.5 h-4.5 text-slate-400" />
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="email"
                                placeholder="nama@email.com"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
                            />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Password
                            </Label>
                            <TextLink
                                href="/forgot-password"
                                className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
                                tabIndex={5}
                            >
                                Lupa password?
                            </TextLink>
                        </div>
                        <div className="relative flex items-center">
                            <Lock className="absolute left-3.5 w-4.5 h-4.5 text-slate-400 z-10" />
                            <PasswordInput
                                id="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                placeholder="Masukkan password"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-10 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
                                inputClassName="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-transparent p-0 h-auto text-sm font-semibold text-slate-800 placeholder-slate-400"
                            />
                        </div>
                        <InputError message={errors.password} />
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center space-x-2.5 py-1">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={remember}
                            onCheckedChange={(checked) => setRemember(!!checked)}
                            tabIndex={3}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <Label htmlFor="remember" className="text-xs text-slate-605 font-bold cursor-pointer select-none">
                            Ingat saya di perangkat ini
                        </Label>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                        tabIndex={4}
                        disabled={processing}
                    >
                        {processing ? (
                            <Spinner className="w-4 h-4 text-white" />
                        ) : (
                            <>
                                <LogIn className="w-4 h-4" />
                                <span>Masuk</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Footer link */}
                <div className="text-center text-xs text-slate-500 font-semibold pt-2">
                    Belum punya akun?{' '}
                    <TextLink href="/register" className="text-blue-500 hover:underline font-bold" tabIndex={5}>
                        Daftar sekarang
                    </TextLink>
                </div>
            </form>

            {status && (
                <div className="mt-4 text-center text-xs font-bold text-green-600">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
