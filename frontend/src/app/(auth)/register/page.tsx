'use client';

import React, { useState, Suspense } from 'react';
import AuthLayout from '@/components/auth-layout';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Lock, UserPlus } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function RegisterContent() {
    const { register } = useAuth();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect');
    const loginUrl = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login';

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            await register({
                name,
                email,
                password,
                password_confirmation: passwordConfirmation,
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
                setErrors({ email: 'Terjadi kesalahan sistem. Silakan coba lagi.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AuthLayout
            title="Daftar Akun Baru"
            description="Silakan isi data Anda di bawah ini untuk mendaftar"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                    {/* Name Input */}
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Nama Lengkap
                        </Label>
                        <div className="relative flex items-center">
                            <User className="absolute left-3.5 w-4.5 h-4.5 text-slate-400" />
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="name"
                                name="name"
                                placeholder="Nama Lengkap Anda"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
                            />
                        </div>
                        <InputError message={errors.name} />
                    </div>

                    {/* Email Input */}
                    <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Alamat Email
                        </Label>
                        <div className="relative flex items-center">
                            <Mail className="absolute left-3.5 w-4.5 h-4.5 text-slate-400" />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                tabIndex={2}
                                autoComplete="email"
                                name="email"
                                placeholder="nama@email.com"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
                            />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Password
                        </Label>
                        <div className="relative flex items-center">
                            <Lock className="absolute left-3.5 w-4.5 h-4.5 text-slate-400 z-10" />
                            <PasswordInput
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                tabIndex={3}
                                autoComplete="new-password"
                                name="password"
                                placeholder="Minimal 8 karakter"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-10 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
                                inputClassName="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-transparent p-0 h-auto text-sm font-semibold text-slate-800 placeholder-slate-400"
                            />
                        </div>
                        <InputError message={errors.password} />
                    </div>

                    {/* Confirm Password Input */}
                    <div className="space-y-1.5">
                        <Label htmlFor="password_confirmation" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Konfirmasi Password
                        </Label>
                        <div className="relative flex items-center">
                            <Lock className="absolute left-3.5 w-4.5 h-4.5 text-slate-400 z-10" />
                            <PasswordInput
                                id="password_confirmation"
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                required
                                tabIndex={4}
                                autoComplete="new-password"
                                name="password_confirmation"
                                placeholder="Ulangi password Anda"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-10 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
                                inputClassName="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-transparent p-0 h-auto text-sm font-semibold text-slate-800 placeholder-slate-400"
                            />
                        </div>
                        <InputError message={errors.password_confirmation} />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 text-xs uppercase tracking-wider disabled:opacity-50 mt-2 cursor-pointer"
                        tabIndex={5}
                        disabled={processing}
                    >
                        {processing ? (
                            <Spinner className="w-4 h-4 text-white" />
                        ) : (
                            <>
                                <UserPlus className="w-4 h-4" />
                                <span>Daftar</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Footer link */}
                <div className="text-center text-xs text-slate-500 font-semibold pt-2">
                    Sudah memiliki akun?{' '}
                    <TextLink href={loginUrl} className="text-blue-500 hover:underline font-bold" tabIndex={6}>
                        Masuk sekarang
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <AuthLayout title="Daftar Akun Baru" description="Memuat halaman pendaftaran...">
                <div className="flex justify-center py-10">
                    <Spinner className="w-8 h-8 text-blue-600" />
                </div>
            </AuthLayout>
        }>
            <RegisterContent />
        </Suspense>
    );
}
