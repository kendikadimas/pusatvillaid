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
    XOctagon,
    Lock,
    Download,
    Loader2
} from 'lucide-react';
import { generateInvoicePDF } from '@/lib/generateInvoicePDF';
import { useSettings } from '@/context/SettingsContext';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useResilientBooking } from '@/hooks/useResilientBooking';

function BookingStatusContent() {
    const { settings } = useSettings();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const code = searchParams.get('code') || '';
    const emailParam = searchParams.get('email');

    const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
    const [resolvingInitial, setResolvingInitial] = useState(true);
    // Form Input state
    const [emailInput, setEmailInput] = useState(emailParam || '');
    const [verifying, setVerifying] = useState(false);

    const { booking, status, isFromCache, refetch } = useResilientBooking(code, verifiedEmail || undefined);
    const loading = status === 'loading' || status === 'idle';

    useEffect(() => {
        if (authLoading) return;

        const savedEmail = emailParam || (typeof window !== 'undefined' ? sessionStorage.getItem(`checkout_email_${code}`) : null) || user?.email;
        if (savedEmail) {
            setVerifiedEmail(savedEmail);
        } else if (user) {
            const fetchWithoutEmail = async () => {
                try {
                    const response = await axiosClient.get(`/bookings/${code}`);
                    if (typeof window !== 'undefined') {
                        sessionStorage.setItem(`checkout_email_${code}`, response.data.guest_email);
                    }
                    setVerifiedEmail(response.data.guest_email);
                } catch (err) {
                    console.warn('Failed to fetch booking status without email:', err);
                }
            };
            fetchWithoutEmail();
        }
        setResolvingInitial(false);
    }, [code, emailParam, user, authLoading]);

    // Pastikan resolvingInitial jadi false walau authLoading tetap true
    useEffect(() => {
        if (!authLoading) return;
        const timer = setTimeout(() => setResolvingInitial(false), 5000);
        return () => clearTimeout(timer);
    }, [authLoading]);

    // Reaksi terhadap perubahan status hook setelah user submit email
    useEffect(() => {
        if (!verifying || !verifiedEmail) return;
        if (status === 'success') {
            setVerifying(false);
        } else if (status === 'error') {
            setVerifying(false);
            setVerifiedEmail(null);
            toast.error(`Booking dengan kode ${code} tidak ditemukan untuk email "${verifiedEmail}". Periksa kembali email Anda atau gunakan email lain saat pemesanan.`);
        }
    }, [status, verifying, verifiedEmail]);

    const handleVerifySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailInput.trim()) {
            toast.error('Silakan isi email Anda.');
            return;
        }
        setVerifying(true);
        setVerifiedEmail(emailInput);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(`checkout_email_${code}`, emailInput);
        }
    };

    if (resolvingInitial || (loading && verifiedEmail && !booking)) {
        return <LoadingSpinner message="Memeriksa status pemesanan..." />;
    }

    if (!booking && status === 'error' && verifiedEmail) {
        return (
            <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50/30 text-slate-850">
                <PublicHeader>
                    <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-550 bg-slate-100/80 backdrop-blur px-3.5 py-1.5 rounded-full border border-slate-200/60 shadow-sm">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Status Booking</span>
                    </div>
                </PublicHeader>
                <main className="max-w-md mx-auto px-4 py-24 w-full flex-1 flex flex-col justify-center animate-in fade-in duration-300">
                    <div className="bg-white border border-slate-200/80 rounded-[32px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(30,58,138,0.04)] text-center space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-900 via-blue-500 to-indigo-900" />
                        <div className="w-16 h-16 bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl flex items-center justify-center mx-auto border border-red-200/50 shadow-sm">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <div>
                            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-slate-900 tracking-tight">Gagal Memuat Data</h1>
                            <p className="text-slate-500 text-xs mt-2.5 leading-relaxed px-4">
                                Tidak dapat memuat status booking. Periksa koneksi internet Anda.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={refetch}
                                className="w-full bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950 hover:from-blue-950 hover:to-blue-900 text-white font-bold py-3.5 rounded-xl shadow-md transition-all text-sm cursor-pointer"
                            >
                                Coba Lagi
                            </button>
                            <button
                                onClick={() => setVerifiedEmail(null)}
                                className="w-full text-xs text-slate-500 hover:text-slate-700 underline"
                            >
                                Gunakan email berbeda
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Initial load (no verifiedEmail yet, not loading) — show verification form
    if (!verifiedEmail || !booking) {
        return (
            <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50/30 text-slate-850">
                <PublicHeader>
                    <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-550 bg-slate-100/80 backdrop-blur px-3.5 py-1.5 rounded-full border border-slate-200/60 shadow-sm">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Status Booking</span>
                    </div>
                </PublicHeader>

                <main className="max-w-md mx-auto px-4 py-24 w-full flex-1 flex flex-col justify-center animate-in fade-in duration-300">
                    <div className="bg-white border border-slate-200/80 rounded-[32px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(30,58,138,0.04)] text-center space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-900 via-blue-500 to-indigo-900" />

                        <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl flex items-center justify-center mx-auto border border-blue-200/50 shadow-sm">
                            <ShieldCheck className="w-8 h-8 text-blue-900" />
                        </div>

                        <div>
                            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-slate-900 tracking-tight">Verifikasi Booking</h1>
                            <p className="text-slate-500 text-xs mt-2.5 leading-relaxed px-4">
                                Masukkan email yang Anda gunakan saat memesan villa dengan kode <strong className="text-slate-800 font-mono">{code}</strong>.
                            </p>
                        </div>

                        <form onSubmit={handleVerifySubmit} className="space-y-4 text-left">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">Alamat Email</label>
                                <input 
                                    type="email" 
                                    required
                                    placeholder="budi@example.com"
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/40 focus:bg-white font-semibold transition-all"
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={verifying}
                                className="w-full bg-gradient-to-r from-blue-900 via-blue-800 to-blue-955 hover:from-blue-955 hover:to-blue-900 text-white font-bold py-3.5 rounded-xl shadow-[0_8px_30px_rgba(30,58,138,0.15)] transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50 cursor-pointer active:scale-[0.98]"
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

                        <div className="border-t border-slate-100 pt-5 space-y-3.5 text-xs text-slate-500 text-left">
                            <details className="group">
                                <summary className="font-bold text-slate-600 cursor-pointer hover:text-blue-900 transition-colors list-none flex items-center justify-between">
                                    <span>Tidak ingat email yang digunakan?</span>
                                    <span className="transition-transform group-open:rotate-180">↓</span>
                                </summary>
                                <ul className="mt-2.5 space-y-2 text-[11px] leading-relaxed text-slate-550 border-l-2 border-slate-200 pl-3">
                                    <li>Cek kotak masuk email Anda untuk email konfirmasi dari <strong>{settings.settings_prop_name}</strong></li>
                                    <li>Cek folder Spam atau Promosi jika tidak ditemukan di Inbox</li>
                                    <li>Email tersebut berisi kode booking dan rincian lengkap Anda</li>
                                </ul>
                            </details>
                            
                            <details className="group">
                                <summary className="font-bold text-slate-600 cursor-pointer hover:text-blue-900 transition-colors list-none flex items-center justify-between">
                                    <span>Tidak punya kode booking?</span>
                                    <span className="transition-transform group-open:rotate-180">↓</span>
                                </summary>
                                <p className="mt-2.5 text-[11px] leading-relaxed text-slate-550 border-l-2 border-slate-200 pl-3">
                                    Kode booking dikirim otomatis setelah pemesanan dengan format <strong>VB-2026-XXXX</strong>.
                                    Cek inbox email Anda atau hubungi kami di <strong>{settings.settings_email}</strong>.
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
        <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50/30 text-slate-855">
            <PublicHeader>
                <nav className="flex items-center space-x-2">
                    <Link href="/villas" className="text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-blue-900 transition-colors border border-slate-200 bg-white/80 backdrop-blur px-3.5 py-1.5 rounded-full hover:shadow-sm active:scale-95">
                        Cari Villa
                    </Link>
                    {booking.status === 'pending' && booking.payment_status === 'unpaid' && booking.payment?.snap_token && (
                        <Link
                            href={`/booking/payment?code=${code}&token=${booking.payment.snap_token}`}
                            className="text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-3.5 py-1.5 rounded-full shadow-sm transition-all active:scale-95"
                        >
                            Lanjut Bayar
                        </Link>
                    )}
                </nav>
            </PublicHeader>

            <main className="max-w-4xl mx-auto px-4 py-12 w-full flex-1 space-y-8 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between border-b border-slate-205 pb-6 gap-4">
                    <div>
                        <h1 className="font-serif text-3xl md:text-[44px] md:leading-[48px] font-normal text-slate-900 tracking-tight">Status Pemesanan</h1>
                        <div className="inline-flex items-center space-x-1.5 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/50 mt-3.5">
                            <span className="text-[10px] font-bold text-slate-550 tracking-wider uppercase">Kode Booking:</span>
                            <span className="text-xs font-extrabold text-blue-900 tracking-wide font-mono">{code}</span>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center space-x-2">
                        <StatusBadge variant={booking.status as any} className="animate-pulse shadow-sm" />
                    </div>
                </div>

                {isFromCache && status === 'error' && (
                    <div className="text-xs text-amber-600 flex items-center gap-2 bg-amber-50/50 border border-amber-200/60 rounded-xl px-4 py-3">
                        <span>Gagal sinkronisasi data terbaru — menampilkan data tersimpan.</span>
                        <button onClick={refetch} className="underline font-bold whitespace-nowrap cursor-pointer">Coba lagi</button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Columns (Booking receipt and details) */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Pending Checkout Alert */}
                        {booking.status === 'pending' && booking.payment_status === 'unpaid' && (
                            <div className="bg-amber-50/50 border border-amber-200/85 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                                <div className="flex items-start space-x-3 text-xs text-amber-900 font-medium">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-sm text-slate-900 mb-0.5">Pembayaran Belum Diterima</p>
                                        <p className="leading-relaxed text-slate-650">Segera selesaikan transaksi Anda sebelum batas waktu berakhir untuk mengamankan pesanan Anda.</p>
                                    </div>
                                </div>
                                <Link
                                    href={`/booking/payment?code=${code}&token=${booking.payment?.snap_token || ''}`}
                                    className="bg-gradient-to-r from-blue-900 to-blue-950 hover:from-blue-955 hover:to-blue-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all text-xs flex items-center space-x-1.5 flex-shrink-0 cursor-pointer active:scale-95"
                                >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>Bayar Sekarang</span>
                                    <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                        )}

                        {/* Waiting for verification alert */}
                        {booking.status === 'pending' && booking.payment_status === 'pending' && (
                            <div className="bg-blue-50/50 border border-blue-200/60 rounded-2xl p-5 flex items-start space-x-3 text-xs text-blue-900 font-medium shadow-sm">
                                <ShieldCheck className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-sm text-slate-900 mb-0.5">Menunggu Verifikasi Pembayaran</p>
                                    <p className="leading-relaxed text-slate-650">Bukti pembayaran Anda telah kami terima dan sedang diverifikasi oleh tim admin. Proses ini biasanya memakan waktu kurang dari 30 menit pada jam operasional.</p>
                                </div>
                            </div>
                        )}

                        {/* Cancellation Alert */}
                        {booking.status === 'cancelled' && (
                            <div className="bg-red-50/50 border border-red-200/85 rounded-2xl p-5 flex items-start space-x-3 text-xs text-red-900 font-medium shadow-sm">
                                <XOctagon className="w-5 h-5 text-red-650 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-sm text-slate-900 mb-0.5">Booking Dibatalkan</p>
                                    <p className="leading-relaxed mb-2 text-slate-650">Pemesanan villa ini dibatalkan dari sistem.</p>
                                    {booking.cancel_reason && (
                                        <div className="bg-white/80 border border-red-150 p-3 rounded-xl text-slate-700 font-semibold italic">
                                            Alasan: "{booking.cancel_reason}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Villa details card */}
                        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/70 rounded-2xl p-6 shadow-sm space-y-6">
                            <h2 className="font-serif text-xl font-normal text-slate-900 border-b border-slate-100 pb-3.5">Informasi Properti</h2>
                            
                            <div className="flex flex-col sm:flex-row gap-5">
                                <div className="w-full sm:w-44 aspect-video rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200/40">
                                    <img src={mainPhoto} alt={booking.villa?.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                                </div>
                                <div className="space-y-1.5">
                                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{booking.villa?.name}</h3>
                                    <div className="flex items-center text-slate-500 text-xs">
                                        <MapPin className="w-4 h-4 mr-0.5 text-slate-400 stroke-[1.5]" />
                                        <span>{booking.villa?.location}</span>
                                    </div>
                                    <p className="text-slate-600 text-xs leading-relaxed pt-1">{booking.villa?.short_desc}</p>
                                </div>
                            </div>

                            {/* Date Timeline */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-150/80 pt-6 text-sm font-semibold text-slate-800">
                                <div className="space-y-1.5">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">TANGGAL CHECK-IN</span>
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="w-4.5 h-4.5 text-blue-900" />
                                        <span className="font-bold text-slate-900">{format(parseISO(booking.check_in), 'dd MMMM yyyy', { locale: localeID })}</span>
                                    </div>
                                    <span className="text-xs text-slate-500 font-normal block pl-6.5">Setelah {booking.villa?.check_in_time.substring(0, 5) || '14:00'} WIB</span>
                                </div>
                                <div className="space-y-1.5 border-l-0 sm:border-l border-slate-150/80 sm:pl-6 pl-0">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">TANGGAL CHECK-OUT</span>
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="w-4.5 h-4.5 text-blue-900" />
                                        <span className="font-bold text-slate-900">{format(parseISO(booking.check_out), 'dd MMMM yyyy', { locale: localeID })}</span>
                                    </div>
                                    <span className="text-xs text-slate-500 font-normal block pl-6.5">Sebelum {booking.villa?.check_out_time.substring(0, 5) || '12:00'} WIB</span>
                                </div>
                            </div>
                        </div>

                        {/* Check-in instructions (only shown if confirmed/completed) */}
                        {(booking.status === 'confirmed' || booking.status === 'completed') && (
                            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/70 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in duration-300">
                                <h2 className="font-serif text-xl font-normal text-slate-900 border-b border-slate-100 pb-3.5">Petunjuk Menginap</h2>
                                <div className="text-xs text-slate-650 space-y-3 leading-relaxed">
                                    <p>Selamat, pesanan Anda telah lunas dikonfirmasi! Berikut adalah koordinasi petunjuk saat tiba:</p>
                                    <ul className="list-decimal pl-4 space-y-2 font-medium">
                                        <li>Tunjukkan nota status digital ini atau sebutkan <strong className="text-slate-900">Kode Booking ({code})</strong> kepada petugas/penjaga villa saat Anda tiba.</li>
                                        <li>Batas keterlambatan check-in adalah pukul 22.00 WIB malam, harap koordinasikan via <span className="text-green-600 font-semibold">WhatsApp</span> jika Anda tiba larut malam.</li>
                                        <li>Aturan villa wajib dipatuhi: <span className="text-slate-700 italic">"{booking.villa?.rules || 'Dilarang merokok di dalam kamar dan mematuhi jam tenang.'}"</span></li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Side Column (Receipt Details summary) */}
                    <div className="md:col-span-1">
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                            <h3 className="font-serif text-xl font-normal text-slate-900 border-b border-slate-100 pb-3.5">Ringkasan Tagihan</h3>
                            
                            <div className="space-y-4 text-xs font-medium">
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>Nama Tamu:</span>
                                    <span className="font-bold text-slate-900">{booking.guest_name}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>Nomor WA:</span>
                                    <span className="font-bold text-slate-900">{booking.guest_phone}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>Durasi Menginap:</span>
                                    <span className="font-semibold text-slate-800">{booking.total_nights} malam</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>Tamu:</span>
                                    <span className="font-semibold text-slate-800">{booking.num_guests} orang</span>
                                </div>
                                
                                <div className="border-t border-slate-150/80 pt-4 space-y-3">
                                    <div className="flex justify-between items-center text-slate-500">
                                        <span>Status Bayar:</span>
                                        <span className={`font-bold capitalize px-2.5 py-0.5 rounded-full border text-[10px] ${
                                            booking.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                                            booking.payment_status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200/60' :
                                            booking.payment_status === 'unpaid' ? 'bg-red-50 text-red-750 border-red-200/60' :
                                            'bg-slate-50 text-slate-600 border-slate-200/60'
                                        }`}>
                                            {booking.payment_status === 'paid' ? 'Lunas' :
                                             booking.payment_status === 'pending' ? 'Verifikasi' :
                                             booking.payment_status === 'unpaid' ? 'Belum Bayar' :
                                             booking.payment_status === 'refunded' ? 'Refund' :
                                             booking.payment_status === 'expired' ? 'Kadaluarsa' :
                                             booking.payment_status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-500">
                                        <span>Metode:</span>
                                        <span className="font-bold text-slate-800 capitalize">
                                            {booking.payment_method?.name || booking.payment?.payment_type || '-'}
                                        </span>
                                    </div>
                                    {((booking.tax_amount && booking.tax_amount > 0) || (booking.admin_fee && booking.admin_fee > 0)) && (
                                        <div className="flex justify-between items-center text-slate-505 border-t border-slate-100 pt-2.5">
                                            <span>Harga Sewa:</span>
                                            <span className="font-bold text-slate-850">{formatPrice(booking.base_price)}</span>
                                        </div>
                                    )}
                                    {booking.tax_amount !== undefined && booking.tax_amount > 0 && (
                                        <div className="flex justify-between items-center text-slate-505">
                                            <span>Pajak:</span>
                                            <span className="font-bold text-slate-850">{formatPrice(booking.tax_amount)}</span>
                                        </div>
                                    )}
                                    {booking.admin_fee !== undefined && booking.admin_fee > 0 && (
                                        <div className="flex justify-between items-center text-slate-505">
                                            <span>Biaya Admin:</span>
                                            <span className="font-bold text-slate-850">{formatPrice(booking.admin_fee)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-150/80 pt-4 text-sm">
                                    <span>Total Biaya:</span>
                                    <span className="text-blue-900 text-base">{formatPrice(booking.total_amount)}</span>
                                </div>
                            </div>

                            {/* Download Invoice Button */}
                            {booking.payment_status === 'paid' && (
                                <button
                                    onClick={async () => {
                                        try {
                                            await generateInvoicePDF(booking, code, settings);
                                            toast.success('Invoice berhasil didownload!');
                                        } catch (error) {
                                            console.error('Failed to generate PDF:', error);
                                            toast.error('Gagal membuat invoice PDF.');
                                        }
                                    }}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer active:scale-[0.98]"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Download Invoice PDF</span>
                                </button>
                            )}
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
