'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PublicHeader from '@/components/PublicHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import { XCircle, ArrowLeft, Home } from 'lucide-react';

function BookingFailedContent() {
    const searchParams = useSearchParams();
    const code = searchParams.get('code');

    return (
        <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50/30 text-slate-850">
            <PublicHeader />

            <main className="max-w-md mx-auto px-4 py-16 w-full flex-1 flex flex-col justify-center animate-in fade-in duration-300">
                <div className="bg-white border border-slate-200/80 rounded-[32px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(30,58,138,0.04)] text-center space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-650 via-orange-500 to-yellow-600" />

                    <div className="w-16 h-16 bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl flex items-center justify-center mx-auto border border-red-250/50 shadow-sm animate-pulse">
                        <XCircle className="w-8 h-8 text-red-650" />
                    </div>

                    <div>
                        <h1 className="font-serif text-3xl font-normal text-slate-900 tracking-tight">Pembayaran Gagal</h1>
                        <p className="text-slate-500 text-xs mt-2 px-4 leading-relaxed">
                            Transaksi pembayaran untuk pesanan Anda gagal dilakukan, dibatalkan, atau telah kadaluarsa karena melebihi batas waktu 24 jam.
                        </p>
                    </div>

                    {code && (
                        <div className="bg-slate-50/60 border border-slate-200/60 rounded-2xl p-4 flex justify-between items-center text-xs shadow-inner">
                            <span className="text-slate-500 font-medium font-bold uppercase">Kode Booking</span>
                            <span className="font-mono font-extrabold text-slate-900 text-sm tracking-wide">{code}</span>
                        </div>
                    )}

                    <div className="bg-slate-50/60 border border-slate-200/60 rounded-2xl p-5 text-xs text-slate-655 text-left space-y-2.5 leading-relaxed shadow-sm">
                        <h4 className="font-serif text-sm font-bold text-slate-850">Langkah yang dapat Anda lakukan:</h4>
                        <ul className="list-disc pl-4 space-y-1.5 text-slate-550 font-medium">
                            <li>Jika Anda tidak sengaja menutup widget checkout, Anda bisa mengecek status booking untuk mengulangi pembayaran.</li>
                            <li>Jika dana Anda telah terpotong namun booking gagal, silakan hubungi admin kami untuk verifikasi manual.</li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-3 pt-5 border-t border-slate-100">
                        {code && (
                            <Link href={`/booking/status?code=${code}`} className="bg-gradient-to-r from-blue-900 to-blue-955 hover:from-blue-955 hover:to-blue-900 text-white font-bold py-3.5 rounded-xl shadow-[0_8px_30px_rgba(30,58,138,0.15)] transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer active:scale-[0.98]">
                                <ArrowLeft className="w-4 h-4" />
                                <span>Cek Status & Bayar Ulang</span>
                            </Link>
                        )}
                        <Link href="/" className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer active:scale-[0.98]">
                            <Home className="w-4 h-4" />
                            <span>Kembali ke Beranda</span>
                        </Link>
                    </div>
                </div>

                <div className="text-center mt-6">
                    <WhatsAppButton phone="6281234567890" variant="link" label="Laporkan Kendala via WhatsApp" />
                </div>
            </main>
        </div>
    );
}

export default function BookingFailedPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <BookingFailedContent />
        </Suspense>
    );
}
