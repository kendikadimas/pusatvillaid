'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
    XCircle, 
    ArrowLeft, 
    Home, 
    Phone,
    Loader2
} from 'lucide-react';

function BookingFailedContent() {
    const searchParams = useSearchParams();
    const code = searchParams.get('code');

    return (
        <div className="flex-1 flex flex-col bg-slate-50 text-slate-800">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-150/80 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-2xl font-serif font-black tracking-tight bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
                            PusatVilla.id
                        </span>
                    </Link>
                </div>
            </header>

            <main className="max-w-md mx-auto px-4 py-16 w-full flex-1 flex flex-col justify-center">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
                    
                    {/* Failed Icon */}
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto border border-red-100">
                        <XCircle className="w-8 h-8 text-red-600" />
                    </div>

                    <div>
                        <h1 className="font-serif text-2xl font-medium text-[#0d0d0d] tracking-tight">Pembayaran Gagal</h1>
                        <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                            Transaksi pembayaran untuk pesanan Anda gagal dilakukan, dibatalkan, atau telah kadaluarsa karena melebihi batas waktu 24 jam.
                        </p>
                    </div>

                    {code && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-medium">KODE BOOKING:</span>
                            <span className="font-bold text-slate-900">{code}</span>
                        </div>
                    )}

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 text-left space-y-2 leading-relaxed">
                        <h4 className="font-serif text-sm font-bold text-slate-800">Apa yang bisa Anda lakukan?</h4>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>Jika Anda tidak sengaja menutup widget checkout, Anda bisa mengecek status booking untuk mengulangi pembayaran.</li>
                            <li>Jika dana Anda telah terpotong namun booking gagal, silakan hubungi admin kami untuk verifikasi manual.</li>
                        </ul>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                        {code && (
                            <Link
                                href={`/booking/${code}`}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition-transform flex items-center justify-center space-x-2 text-sm"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Cek Status & Bayar Ulang</span>
                            </Link>
                        )}
                        <Link
                            href="/"
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl shadow-sm transition-transform flex items-center justify-center space-x-2 text-sm"
                        >
                            <Home className="w-4 h-4" />
                            <span>Kembali ke Beranda</span>
                        </Link>
                    </div>
                </div>

                <div className="text-center mt-6">
                    <a 
                        href="https://wa.me/6281234567890" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-slate-500 hover:text-slate-800 text-xs font-semibold space-x-1"
                    >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Laporkan Kendala via WhatsApp</span>
                    </a>
                </div>
            </main>
        </div>
    );
}

export default function BookingFailedPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center py-64 min-h-screen bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        }>
            <BookingFailedContent />
        </Suspense>
    );
}
