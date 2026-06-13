'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            setError('Silakan lengkapi email dan password Anda.');
            return;
        }

        setSubmitting(true);
        setError('');
        
        try {
            await login({ email, password });
            toast.success('Login berhasil!');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || 'Email atau password salah.');
            toast.error('Gagal masuk. Periksa kembali kredensial Anda.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 px-4 relative overflow-hidden">
            {/* Background design accents */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(244,63,94,0.06),rgba(255,255,255,0))]" />

            <div className="relative z-10 w-full max-w-md bg-white border border-slate-250/70 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mx-auto border border-rose-100">
                        <Lock className="w-5 h-5 text-rose-500" />
                    </div>
                    <h1 className="text-2xl font-serif font-black tracking-tight bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
                        PusatVilla.id
                    </h1>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                        Admin Portal
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                        Masuk untuk mengelola booking, ketersediaan, dan katalog villa.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 text-xs text-red-650 font-semibold">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Alamat Email</label>
                        <input 
                            type="email" 
                            required
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-850 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all font-semibold"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Password</label>
                        <input 
                            type="password" 
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-850 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all font-semibold"
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 hover:opacity-95 active:scale-95 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm mt-6 cursor-pointer"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Sedang masuk...</span>
                            </>
                        ) : (
                            <span>Masuk ke Dashboard</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
