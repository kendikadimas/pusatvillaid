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
        <div className="min-h-screen flex items-center justify-center text-[#222222] px-4 relative overflow-hidden bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30">
            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-7 sm:p-9 space-y-6">
                    <div className="text-center space-y-3">
                        <div className="w-14 h-14 bg-blue-600 rounded-[14px] flex items-center justify-center mx-auto shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)]">
                            <Lock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-blue-600">
                                PusatVilla.id
                            </h1>
                            <p className="text-[10px] font-bold text-[#6a6a6a] tracking-[0.2em] uppercase mt-1.5">
                                Portal admin
                            </p>
                        </div>
                        <p className="text-xs text-[#6a6a6a] leading-relaxed max-w-xs mx-auto">
                            Masuk untuk mengelola booking, ketersediaan, dan katalog villa.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50/80 border border-red-100 rounded-2xl p-3.5 text-xs text-red-600 font-semibold">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-[11px] font-semibold text-[#6a6a6a] block mb-1.5">Alamat email</label>
                            <input 
                                type="email" 
                                required
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white border border-[#dddddd] rounded-[8px] px-3.5 py-2.5 text-sm text-[#222222] placeholder-[#6a6a6a] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all font-semibold"
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-[#6a6a6a] block mb-1.5">Password</label>
                            <input 
                                type="password" 
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white border border-[#dddddd] rounded-[8px] px-3.5 py-2.5 text-sm text-[#222222] placeholder-[#6a6a6a] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all font-semibold"
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 text-white font-bold py-3 rounded-[8px] transition-all flex items-center justify-center space-x-2 text-sm mt-6 cursor-pointer"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Sedang masuk...</span>
                                </>
                            ) : (
                                <span>Masuk ke dashboard</span>
                            )}
                        </button>
                    </form>

                    <p className="text-[10px] text-[#6a6a6a] text-center font-medium">
                        &copy; {new Date().getFullYear()} PusatVilla.id &mdash; Panel administrasi
                    </p>
                </div>
            </div>
        </div>
    );
}
