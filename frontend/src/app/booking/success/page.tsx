'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import axiosClient from '@/lib/axios';
import { Booking } from '@/types';
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { 
    CheckCircle2, 
    Calendar, 
    MapPin, 
    Loader2, 
    Copy,
    Printer, 
    Home,
    Phone,
    Check
} from 'lucide-react';
import { toast } from 'sonner';

function BookingSuccessContent() {
    const searchParams = useSearchParams();
    const code = searchParams.get('code');

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!code) {
            setLoading(false);
            return;
        }

        const fetchBooking = async () => {
            try {
                const email = sessionStorage.getItem(`checkout_email_${code}`);
                if (!email) {
                    setLoading(false);
                    return; // Cannot load details without validation email
                }

                const response = await axiosClient.get(`/bookings/${code}`, {
                    params: { email }
                });
                setBooking(response.data);
            } catch (err) {
                console.error('Failed to fetch booking details for receipt:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [code]);

    const handleCopyCode = () => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopied(true);
        toast.success('Kode booking berhasil disalin!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => {
        if (typeof window !== 'undefined') {
            window.print();
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-64 min-h-screen bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-slate-50 text-slate-800 print:bg-white print:text-black">
            {/* Header (hidden on print) */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-150/80 shadow-xs print:hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-2xl font-serif font-black tracking-tight bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
                            PusatVilla.id
                        </span>
                    </Link>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-4 py-16 w-full flex-1 flex flex-col justify-center">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6 print:border-0 print:shadow-none print:p-0">
                    
                    {/* Success Icon (hidden on print) */}
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 print:hidden">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>

                    <div>
                        <h1 className="font-serif text-2xl font-medium text-[#0d0d0d] tracking-tight">Pembayaran Sukses!</h1>
                        <p className="text-slate-505 text-xs mt-1.5 print:hidden">
                            Pemesanan Anda telah dikonfirmasi dan jadwal sewa Anda telah aktif.
                        </p>
                    </div>

                    {/* Booking Code Board */}
                    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex flex-col items-center justify-center relative print:border-slate-300 print:bg-slate-50">
                        <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider mb-1">KODE BOOKING</span>
                        <div className="flex items-center space-x-2">
                            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{code || 'VB-XXXX-XXXX'}</span>
                            <button 
                                onClick={handleCopyCode}
                                className="bg-white hover:bg-slate-100 border border-slate-200 p-1.5 rounded-lg text-slate-600 hover:text-slate-800 transition-colors print:hidden"
                                title="Salin Kode"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Details Receipt */}
                    {booking && (
                        <div className="border border-slate-200 rounded-2xl p-5 text-left space-y-4 text-xs">
                            <h3 className="font-serif text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">Detail Rincian</h3>
                            <div className="flex justify-between text-slate-600">
                                <span>Nama Villa:</span>
                                <span className="font-bold text-slate-900">{booking.villa?.name}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Nama Tamu:</span>
                                <span className="font-semibold text-slate-900">{booking.guest_name}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Email Tamu:</span>
                                <span className="font-semibold text-slate-900">{booking.guest_email}</span>
                            </div>
                            
                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-150 py-3 text-[11px] font-semibold text-slate-700">
                                <div className="space-y-0.5">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">CHECK-IN</span>
                                    <div>{format(parseISO(booking.check_in), 'dd MMMM yyyy', { locale: localeID })}</div>
                                    <span className="text-[10px] text-slate-400 font-normal">Setelah {booking.villa?.check_in_time.substring(0, 5) || '14:00'} WIB</span>
                                </div>
                                <div className="space-y-0.5 border-l border-slate-200 pl-4">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">CHECK-OUT</span>
                                    <div>{format(parseISO(booking.check_out), 'dd MMMM yyyy', { locale: localeID })}</div>
                                    <span className="text-[10px] text-slate-400 font-normal">Sebelum {booking.villa?.check_out_time.substring(0, 5) || '12:00'} WIB</span>
                                </div>
                            </div>

                            <div className="flex justify-between text-slate-600">
                                <span>Total Durasi:</span>
                                <span className="font-semibold text-slate-900">{booking.total_nights} malam</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Jumlah Tamu:</span>
                                <span className="font-semibold text-slate-900">{booking.num_guests} orang</span>
                            </div>
                            <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-3 text-sm">
                                <span>Total Terbayar:</span>
                                <span className="text-emerald-600">Rp {Number(booking.total_amount).toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    )}

                    {/* Instruction Box */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 text-left space-y-2 leading-relaxed print:bg-white print:border-slate-300">
                        <h4 className="font-serif text-sm font-bold text-slate-800">Informasi Penting Check-in:</h4>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>Nota konfirmasi check-in telah kami kirimkan ke email Anda. Cek folder spam jika belum masuk.</li>
                            <li>Tunjukkan halaman ini atau sebutkan <strong>Kode Booking</strong> saat tiba di lokasi villa.</li>
                            <li>Kontak villa kami: +62 812-3456-7890 (WhatsApp).</li>
                        </ul>
                    </div>

                    {/* CTA buttons (hidden on print) */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100 print:hidden">
                        <button
                            onClick={handlePrint}
                            className="w-full sm:w-auto flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl shadow-sm transition-transform flex items-center justify-center space-x-2 text-sm"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Cetak Halaman</span>
                        </button>
                        <Link
                            href="/"
                            className="w-full sm:w-auto flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold py-3 rounded-xl shadow-lg transition-transform flex items-center justify-center space-x-2 text-sm"
                        >
                            <Home className="w-4 h-4" />
                            <span>Kembali ke Beranda</span>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function BookingSuccessPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center py-64 min-h-screen bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        }>
            <BookingSuccessContent />
        </Suspense>
    );
}
