'use client';

import React, { useState } from 'react';
import AuthLayout from '@/components/auth-layout';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/context/AuthContext';
import { Mail } from 'lucide-react';

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
                <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-center text-sm font-semibold text-green-700">
                    {status}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Alamat Email
                    </label>
                    <div className="relative flex items-center">
                        <Mail className="absolute left-3.5 w-4.5 h-4.5 text-slate-400" />
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="off"
                            autoFocus
                            placeholder="nama@email.com"
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 focus:bg-white transition-all"
                        />
                    </div>
                    <InputError message={errors.email} />
                </div>

                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-600 to-green-600 hover:from-green-700 hover:to-green-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                    disabled={processing}
                >
                    {processing && <Spinner className="mr-2 w-4 h-4 text-white" />}
                    <span>{processing ? 'Mengirim...' : 'Kirim Link Reset'}</span>
                </button>

                <div className="text-center text-xs text-slate-500 font-semibold pt-2">
                    Atau kembali ke{' '}
                    <TextLink href="/login" className="text-green-500 hover:underline font-bold">
                        masuk
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
