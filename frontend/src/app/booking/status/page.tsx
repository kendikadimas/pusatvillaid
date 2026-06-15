'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosClient from '@/lib/axios';
import { Booking } from '@/types';
import { format, parseISO } from 'date-fns';
import PublicHeader from '@/components/PublicHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatPrice } from '@/lib/format';
import { getMainPhoto } from '@/lib/villaUtils';
import { id as localeID } from 'date-fns/locale';
import { 
    Calendar, 
    MapPin, 
    ShieldCheck,
    CreditCard,
    ArrowRight,
    AlertTriangle,
    XOctagon
} from 'lucide-react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

function BookingStatusContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const code = searchParams.get('code') || '';
    const emailParam = searchParams.get('email');

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
    
    // Form Input state
    const [emailInput, setEmailInput] = useState(emailParam || '');
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        // Attempt to find verified email from query param, state, or sessionStorage
        const savedEmail = emailParam || (typeof window !== 'undefined' ? sessionStorage.getItem(`checkout_email_${code}`) : null);
        if (savedEmail) {
            setVerifiedEmail(savedEmail);
            fetchBookingStatus(savedEmail);
        } else {
            setLoading(false);
        }
    }, [code, emailParam]);

    const fetchBookingStatus = async (email: string) => {
        setLoading(true);
        try {
            const response = await axiosClient.get(`/bookings/${code}`, {
                params: { email }
            });
            setBooking(response.data);
            if (typeof window !== 'undefined') {
                sessionStorage.setItem(`checkout_email_${code}`, email);
            }
        } catch (err: any) {
            console.error('Failed to verify booking status:', err);
            toast.error(err.response?.data?.message || 'Gagal memuat status booking. Periksa kembali email Anda.');
            setVerifiedEmail(null); // Reset verification state
        } finally {
            setLoading(false);
            setVerifying(false);
        }
    };

    const handleVerifySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailInput.trim()) {
            toast.error('Silakan isi email Anda.');
            return;
        }
        setVerifying(true);
        setVerifiedEmail(emailInput);
        fetchBookingStatus(emailInput);
    };

    if (loading) {
        return <LoadingSpinner message="Memeriksa status pemesanan..." />;
    }

    // Security Gate Form: if not verified, ask for the guest email
    if (!verifiedEmail || !booking) {
        return (
            <div className="flex-1 flex flex-col bg-slate-50 text-slate-800">
                <PublicHeader />

                <main className="max-w-md mx-auto px-4 py-24 w-full flex-1 flex flex-col justify-center">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
                        <div className="w-16 h-16 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-center mx-auto">
                            <ShieldCheck className="w-8 h-8 text-blue-600" />
                        </div>

                        <div>
                            <h1 className="font-serif text-xl sm:text-2xl font-medium text-[#0d0d0d] tracking-tight">Verifikasi Booking</h1>
                            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                                Masukkan email yang Anda gunakan saat memesan villa dengan kode <strong>{code}</strong>.
                            </p>
                        </div>

                        <form onSubmit={handleVerifySubmit} className="space-y-4 text-left">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase">Alamat Email</label>
                                <input 
                                    type="email" 
                                    required
                                    placeholder="budi@example.com"
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={verifying}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition-transform flex items-center justify-center space-x-2 text-sm disabled:opacity-50 cursor-pointer"
                            >
                                {verifying ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Memverifikasi...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Lihat Status Booking</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="border-t border-slate-100 pt-4 space-y-3 text-xs text-slate-500">
                            <details className="group">
                                <summary className="font-bold text-slate-600 cursor-pointer hover:text-blue-500 transition-colors">
                                    Tidak ingat email yang digunakan?
                                </summary>
                                <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-left">
                                    <li>• Cek kotak masuk email Anda untuk email konfirmasi dari <strong>PusatVilla.id</strong></li>
                                    <li>• Cek folder Spam atau Promosi</li>
                                    <li>• Email berisi kode booking dan detail pemesanan Anda</li>
                                </ul>
                            </details>
                            
                            <details className="group">
                                <summary className="font-bold text-slate-600 cursor-pointer hover:text-blue-500 transition-colors">
                                    Tidak punya kode booking?
                                </summary>
                                <p className="mt-2 text-[11px] leading-relaxed">
                                    Kode booking dikirim ke email Anda setelah pemesanan. Format: <strong>VB-2025-XXXX</strong>.
                                    Cek email atau hubungi kami di <strong>support@pusatvilla.id</strong> untuk bantuan.
                                </p>
                            </details>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const mainPhoto = getMainPhoto(booking.villa);

    return (
        <div className="flex-1 flex flex-col bg-slate-50 text-slate-800">
            <PublicHeader>
                <nav className="flex items-center space-x-8">
                    <Link href="/villas" className="text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-blue-500 transition-colors">
                        Cari Villa
                    </Link>
                </nav>
            </PublicHeader>

            <main className="max-w-4xl mx-auto px-4 py-12 w-full flex-1 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 pb-5 gap-4">
                    <div>
                        <h1 className="font-serif text-2xl md:text-[40px] md:leading-[44px] font-medium text-[#0d0d0d] tracking-tight">Status Pemesanan</h1>
                        <p className="text-slate-505 text-xs mt-2 font-semibold uppercase tracking-wider">
                            Kode Booking: <span className="font-bold text-slate-800">{code}</span>
                        </p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center space-x-2">
                        <StatusBadge variant={booking.status as any} className="animate-pulse" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Columns (Booking receipt and details) */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Pending Checkout Alert */}
                        {booking.status === 'pending' && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-start space-x-3 text-xs text-amber-800 font-medium">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-sm text-slate-900 mb-0.5">Pembayaran Belum Diterima</p>
                                        <p className="leading-relaxed">Segera selesaikan transaksi Anda sebelum batas waktu berakhir untuk mengamankan pesanan Anda.</p>
                                    </div>
                                </div>
                                <Link
                                    href={`/booking/payment?code=${code}&token=${booking.payment?.snap_token || ''}`}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl shadow-md transition-colors text-xs flex items-center space-x-1 flex-shrink-0"
                                >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>Bayar Sekarang</span>
                                    <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                        )}

                        {/* Cancellation Alert */}
                        {booking.status === 'cancelled' && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start space-x-3 text-xs text-red-800 font-medium">
                                <XOctagon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-sm text-slate-900 mb-0.5">Booking Dibatalkan</p>
                                    <p className="leading-relaxed mb-2">Pemesanan villa ini dibatalkan dari sistem.</p>
                                    {booking.cancel_reason && (
                                        <div className="bg-white border border-red-150 p-3 rounded-lg text-slate-600 font-semibold italic">
                                            Alasan: "{booking.cancel_reason}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Villa details card */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                            <h2 className="font-serif text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Informasi Properti</h2>
                            
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="w-full sm:w-40 aspect-video rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                    <img src={mainPhoto} alt={booking.villa?.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-950 text-lg">{booking.villa?.name}</h3>
                                    <div className="flex items-center text-slate-500 text-xs mt-1">
                                        <MapPin className="w-4 h-4 mr-0.5 text-slate-400" />
                                        <span>{booking.villa?.location}</span>
                                    </div>
                                    <p className="text-slate-600 text-xs mt-3 line-clamp-2">{booking.villa?.short_desc}</p>
                                </div>
                            </div>

                            {/* Date Timeline */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-6 text-sm font-semibold text-slate-800">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase block">TANGGAL CHECK-IN</span>
                                    <div className="flex items-center space-x-1.5">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                        <span>{format(parseISO(booking.check_in), 'dd MMMM yyyy', { locale: localeID })}</span>
                                    </div>
                                    <span className="text-xs text-slate-400 font-normal block pl-5.5">Setelah {booking.villa?.check_in_time.substring(0, 5) || '14:00'} WIB</span>
                                </div>
                                <div className="space-y-1 border-l-0 sm:border-l border-slate-100 sm:pl-6 pl-0">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase block">TANGGAL CHECK-OUT</span>
                                    <div className="flex items-center space-x-1.5">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                        <span>{format(parseISO(booking.check_out), 'dd MMMM yyyy', { locale: localeID })}</span>
                                    </div>
                                    <span className="text-xs text-slate-400 font-normal block pl-5.5">Sebelum {booking.villa?.check_out_time.substring(0, 5) || '12:00'} WIB</span>
                                </div>
                            </div>
                        </div>

                        {/* Check-in instructions (only shown if confirmed/completed) */}
                        {(booking.status === 'confirmed' || booking.status === 'completed') && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                                <h2 className="font-serif text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Petunjuk Menginap</h2>
                                <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                                    <p>Selamat, pesanan Anda telah lunas dikonfirmasi! Berikut adalah koordinasi petunjuk saat tiba:</p>
                                    <ul className="list-decimal pl-4 space-y-2">
                                        <li>Tunjukkan nota status digital ini atau sebutkan <strong>Kode Booking ({code})</strong> kepada petugas/penjaga villa saat Anda tiba.</li>
                                        <li>Batas keterlambatan check-in adalah pukul 22.00 WIB malam, harap koordinasikan via WhatsApp jika Anda tiba larut malam.</li>
                                        <li>Aturan villa wajib dipatuhi: {booking.villa?.rules || 'Dilarang merokok di dalam kamar dan mematuhi jam tenang.'}</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Side Column (Receipt Details summary) */}
                    <div className="md:col-span-1">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                            <h3 className="font-serif text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Ringkasan Tagihan</h3>
                            
                            <div className="space-y-4 text-xs">
                                <div className="flex justify-between text-slate-600">
                                    <span>Nama Tamu:</span>
                                    <span className="font-bold text-slate-900">{booking.guest_name}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Nomor WA:</span>
                                    <span className="font-semibold text-slate-900">{booking.guest_phone}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Durasi Menginap:</span>
                                    <span className="font-semibold text-slate-900">{booking.total_nights} malam</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Tamu:</span>
                                    <span className="font-semibold text-slate-900">{booking.num_guests} orang</span>
                                </div>
                                
                                <div className="border-t border-slate-100 pt-4 space-y-2">
                                    <div className="flex justify-between text-slate-500">
                                        <span>Status Bayar:</span>
                                        <span className={`font-bold capitalize ${
                                            booking.payment_status === 'paid' ? 'text-blue-600' : 'text-red-500'
                                        }`}>{booking.payment_status}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>Metode:</span>
                                        <span className="font-semibold text-slate-700">{booking.payment?.payment_type || '-'}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-4 text-sm">
                                    <span>Total Biaya:</span>
                                    <span className="text-blue-600">{formatPrice(booking.total_amount)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function BookingStatusPage() {
    return (
        <Suspense fallback={<LoadingSpinner message="Memeriksa status pemesanan..." />}>
            <BookingStatusContent />
        </Suspense>
    );
}
