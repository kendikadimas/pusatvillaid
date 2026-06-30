'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosClient from '@/lib/axios';
import { Booking, PaymentMethod } from '@/types';
import PublicHeader from '@/components/PublicHeader';
import BookingSummaryCard from '@/components/BookingSummaryCard';
import AuthImage from '@/components/ui/AuthImage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatPrice } from '@/lib/format';
import { 
    CreditCard, 
    Loader2,
    ArrowRight, 
    ShieldCheck,
    Building,
    Upload,
    Check,
    ExternalLink,
    AlertCircle,
    Smartphone,
    Lock
} from 'lucide-react';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { useSettings } from '@/context/SettingsContext';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useResilientBooking } from '@/hooks/useResilientBooking';

function BookingPaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { whatsappNumber } = useSettings();
    const { user, loading: authLoading } = useAuth();
    const code = searchParams.get('code') || '';
    const emailFromUrl = searchParams.get('email') || '';
    // const snapTokenParam = searchParams.get('token'); // ARCHIVED: Midtrans belum diaktifkan

    const [manualEmail, setManualEmail] = useState('');
    const email = manualEmail || emailFromUrl || (typeof window !== 'undefined' ? sessionStorage.getItem(`checkout_email_${code}`) || user?.email : user?.email);
    // Fallback: cek localStorage anchor untuk email (disimpan saat confirm) — penting saat tab di-kill & sessionStorage hilang
    const anchorEmail = (() => {
        if (typeof window === 'undefined' || email) return null;
        try {
            const raw = localStorage.getItem('pusatvilla-active-booking');
            if (raw) {
                const parsed = JSON.parse(raw);
                return parsed.email || null;
            }
        } catch {}
        return null;
    })();
    const resolvedEmail = email || anchorEmail || undefined;
    const { booking, status, isFromCache, refetch } = useResilientBooking(code, resolvedEmail);
    const loading = status === 'loading' || status === 'idle';
    const needsEmail = !resolvedEmail;
    // const [snapToken, setSnapToken] = useState<string | null>(snapTokenParam); // ARCHIVED: Midtrans
    // const [scriptLoaded, setScriptLoaded] = useState(false); // ARCHIVED: Midtrans

    // Manual payment states
    // paymentType state dipertahankan untuk kompatibilitas UI tab (isOnlineEnabled = false jadi tab tidak muncul)
    const [paymentType, setPaymentType] = useState<'online' | 'manual'>('manual');
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string | null>(null);
    const [submittingProof, setSubmittingProof] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [copiedMethodId, setCopiedMethodId] = useState<number | null>(null);
    const [uploadTapAnim, setUploadTapAnim] = useState(false);
    const [compressing, setCompressing] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Compress image client-side before preview & upload (max 1200px, quality 0.82)
    const compressImage = (file: File): Promise<{ file: File; preview: string }> => {
        return new Promise((resolve, reject) => {
            const MAX_SIZE = 1200;
            const QUALITY = 0.82;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;
                    if (width > MAX_SIZE || height > MAX_SIZE) {
                        if (width > height) { height = Math.round((height * MAX_SIZE) / width); width = MAX_SIZE; }
                        else { width = Math.round((width * MAX_SIZE) / height); height = MAX_SIZE; }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) { reject(new Error('Compression failed')); return; }
                            const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
                            const preview = URL.createObjectURL(compressed);
                            resolve({ file: compressed, preview });
                        },
                        'image/jpeg',
                        QUALITY
                    );
                };
                img.onerror = reject;
                img.src = ev.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // ARCHIVED: Midtrans belum diaktifkan
    // const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    // const isOnlineEnabled = Boolean(
    //     midtransClientKey &&
    //     !midtransClientKey.includes('placeholder') &&
    //     !midtransClientKey.includes('Mid-client-key-anda')
    // );
    const isOnlineEnabled = false;

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualEmail.trim()) {
            toast.error('Silakan masukkan email Anda.');
            return;
        }
        setManualEmail(manualEmail.trim());
    };

    // Redirect logic dari hook — dipindah dari fetch manual ke sini
    useEffect(() => {
        if (!booking) return;

        // Auto-select payment method from booking
        if (booking.payment_method_id) {
            setSelectedMethodId(booking.payment_method_id);
        }

        if (booking.payment_status === 'paid' || booking.status === 'confirmed') {
            toast.success('Pemesanan ini sudah dibayar.');
            router.push(`/booking/success?code=${booking.booking_code}`);
            return;
        }

        if (booking.status === 'cancelled') {
            toast.error('Pemesanan ini sudah dibatalkan.');
            router.push(`/booking/failed?code=${booking.booking_code}`);
            return;
        }
    }, [booking]);

    /* ARCHIVED: Midtrans Snap.js loader (belum diaktifkan)
    useEffect(() => {
        if (!isOnlineEnabled) return;
        const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
        const snapSrc = isProduction
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js';
        const existingScript = document.querySelector(`script[src="${snapSrc}"]`);
        if (existingScript) { setScriptLoaded(true); return; }
        const script = document.createElement('script');
        script.src = snapSrc;
        script.setAttribute('data-client-key', midtransClientKey as string);
        script.async = true;
        script.onload = () => setScriptLoaded(true);
        script.onerror = () => toast.error('Gagal memuat sistem pembayaran Midtrans.');
        document.body.appendChild(script);
    }, []);
    */

    // Fetch active manual payment methods
    useEffect(() => {
        const fetchPaymentMethods = async () => {
            try {
                const response = await axiosClient.get('/payment-methods');
                setPaymentMethods(response.data);
            } catch (err) {
                console.error('Failed to fetch payment methods:', err);
            }
        };
        fetchPaymentMethods();
    }, []);

    const handleManualPaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMethodId) {
            toast.error('Silakan pilih bank transfer.');
            return;
        }
        if (!proofFile) {
            toast.error('Silakan unggah bukti transfer pembayaran.');
            return;
        }

        setSubmittingProof(true);
        setUploadProgress(0);
        try {
            const formData = new FormData();
            formData.append('payment_method_id', String(selectedMethodId));
            formData.append('payment_proof', proofFile);

            const response = await axiosClient.post(
                `/bookings/${code}/confirm-manual-payment`, 
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            setUploadProgress(percent);
                        }
                    }
                }
            );

            toast.success('Bukti Pembayaran Terkirim! Pembayaran Anda sedang direview oleh admin. Silakan cek status booking secara berkala.', {
                duration: 5000,
            });
            
            // Navigate to status page — avoids static-cache stale reload issue
            setTimeout(() => {
                router.push(`/booking/status?code=${code}`);
            }, 2000);
        } catch (err: any) {
            console.error('Failed to submit manual payment:', err);
            const errMsg = err.response?.data?.message || 'Gagal mengirim bukti pembayaran.';
            toast.error(errMsg);
        } finally {
            setSubmittingProof(false);
        }
    };

    /* ARCHIVED: Midtrans triggerPayment & simulateMockPayment (belum diaktifkan)
    const triggerPayment = () => { ... };
    const simulateMockPayment = async () => { ... };
    const uniqid = () => Math.random().toString(36).substring(2, 9);
    */

    // Email diperlukan — tampilkan form input email inline, jangan redirect
    if (needsEmail && !booking) {
        return (
            <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50/30 text-slate-850">
                <main className="max-w-md mx-auto px-4 py-24 w-full flex-1 flex flex-col justify-center">
                    <div className="bg-white border border-slate-200/80 rounded-[32px] p-6 sm:p-8 shadow-lg text-center space-y-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-blue-600">
                                <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
                                <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="font-serif text-2xl font-normal text-slate-900 tracking-tight">Verifikasi Email</h1>
                            <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                                Masukkan email yang Anda gunakan saat melakukan pemesanan untuk kode <strong className="font-mono">{code}</strong>.
                            </p>
                        </div>
                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                            <input
                                type="email"
                                required
                                placeholder="email@contoh.com"
                                value={manualEmail}
                                onChange={(e) => setManualEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white font-semibold transition-all"
                            />
                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all text-sm cursor-pointer active:scale-[0.98]"
                            >
                                Cari Pemesanan
                            </button>
                        </form>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                            Email ini digunakan untuk memverifikasi kepemilikan pemesanan. Data Anda aman dan tidak akan dibagikan.
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    // Loading state — render spinner
    if (loading && !booking) {
        return <LoadingSpinner message="Menyiapkan halaman pembayaran..." />;
    }

    // Error state — tampilkan retry + opsi ganti email
    if (!booking && status === 'error') {
        return (
            <div className="text-center py-64 min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col justify-center items-center px-4 animate-in fade-in duration-300">
                <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-sm w-full shadow-lg space-y-4">
                    <p className="text-slate-655 text-sm font-medium">Gagal memuat data booking.</p>
                    <p className="text-xs text-slate-400 font-medium">Periksa kembali email Anda atau coba lagi.</p>
                    <button
                        onClick={refetch}
                        className="w-full inline-flex items-center justify-center bg-blue-900 hover:bg-blue-950 text-white font-bold py-3 rounded-xl shadow-md transition-all text-xs cursor-pointer"
                    >
                        Coba Lagi
                    </button>
                    <button
                        onClick={() => setManualEmail('')}
                        className="w-full inline-flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold py-3 rounded-xl shadow-sm transition-all text-xs cursor-pointer"
                    >
                        Gunakan email berbeda
                    </button>
                    <Link href="/villas" className="block text-xs text-slate-500 hover:text-slate-700 underline text-center">
                        Kembali ke Katalog Villa
                    </Link>
                </div>
            </div>
        );
    }

    // Masih loading tapi belum ada data — spinner
    if (!booking) {
        return <LoadingSpinner message="Menyiapkan halaman pembayaran..." />;
    }

    if (booking.payment?.status === 'pending' && booking.payment?.payment_proof) {
        return (
            <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50/30 text-slate-850">
                <PublicHeader>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/booking/status?code=${code}&email=${booking.guest_email}`}
                            className="flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-full border border-blue-200 shadow-sm transition-all active:scale-95"
                        >
                            <span>Lihat Status Pemesanan</span>
                        </Link>
                        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-550 bg-slate-100/80 backdrop-blur px-3.5 py-1.5 rounded-full border border-slate-200/60 shadow-sm">
                            <Lock className="w-3 h-3 text-emerald-600" />
                            <span>Checkout Status</span>
                        </div>
                    </div>
                </PublicHeader>

                <main className="max-w-md mx-auto px-4 py-12 sm:py-16 w-full flex-1 flex flex-col justify-center animate-in fade-in duration-300">
                    <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(30,58,138,0.04)] text-center space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-900 via-blue-500 to-indigo-900" />

                        <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl flex items-center justify-center mx-auto border border-blue-200/50 shadow-sm animate-pulse">
                            <ShieldCheck className="w-8 h-8 text-blue-900" />
                        </div>

                        <div>
                            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-slate-900 tracking-tight">Menunggu Verifikasi</h1>
                            <div className="inline-flex items-center space-x-1.5 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/50 mt-2">
                                <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Kode Booking:</span>
                                <span className="text-xs font-extrabold text-blue-900 tracking-wide font-mono">{code}</span>
                            </div>
                        </div>

                        <div className="bg-blue-50/50 border border-blue-200/60 rounded-2xl p-5 text-left space-y-2 text-xs text-blue-900 leading-relaxed shadow-sm">
                            <p className="font-bold text-blue-950 text-sm flex items-center space-x-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping inline-block" />
                                <span>Bukti Transfer Berhasil Dikirim!</span>
                            </p>
                            <p className="text-slate-650">Tim admin kami sedang memverifikasi pembayaran Anda. Proses ini biasanya memakan waktu kurang dari 30 menit pada jam operasional.</p>
                        </div>

                        <div className="bg-slate-50/60 rounded-2xl border border-slate-200/60 p-5 text-left space-y-3.5 shadow-inner">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-medium">Nama Villa:</span>
                                <span className="font-bold text-slate-900">{booking.villa?.name}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-medium">Total Tagihan:</span>
                                <span className="font-bold text-blue-900 text-sm">{formatPrice(booking.total_amount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-medium">Bukti Transfer:</span>
                                    <div className="w-full h-40 rounded-xl overflow-hidden border border-slate-200 bg-white">
                                        <AuthImage
                                            src={`/bookings/${booking.booking_code}/payment-proof`}
                                            alt="Bukti Transfer"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Link 
                                href={`/booking/status?code=${code}`}
                                className="w-full inline-flex items-center justify-center bg-gradient-to-r from-blue-900 to-blue-950 hover:from-blue-950 hover:to-blue-900 text-white font-bold py-3.5 rounded-2xl shadow-[0_8px_30px_rgba(30,58,138,0.2)] hover:shadow-[0_8px_30px_rgba(30,58,138,0.25)] transition-all duration-300 text-sm cursor-pointer active:scale-[0.98]"
                            >
                                Lihat Status Pemesanan
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50/30 text-slate-850">
            {/* Header */}
            <PublicHeader>
                <div className="flex items-center gap-2">
                    <Link
                        href={`/booking/status?code=${code}&email=${booking.guest_email}`}
                        className="flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-full border border-blue-200 shadow-sm transition-all active:scale-95"
                    >
                        <span>Lihat Status Pemesanan</span>
                    </Link>
                    <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-550 bg-slate-100/80 backdrop-blur px-3.5 py-1.5 rounded-full border border-slate-200/60 shadow-sm">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        <span>Checkout Secure</span>
                    </div>
                </div>
            </PublicHeader>

            <main className="max-w-md mx-auto px-4 py-12 sm:py-16 w-full flex-1 flex flex-col justify-center animate-in fade-in duration-300">
                <div className="bg-white border border-slate-200/80 rounded-[32px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(30,58,138,0.04)] text-center space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-900 via-blue-500 to-indigo-900" />

                    <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl flex items-center justify-center mx-auto border border-blue-200/50 shadow-sm relative transition-transform duration-350 hover:scale-105">
                        <CreditCard className="w-8 h-8 text-blue-900" />
                    </div>

                    <div>
                        <h1 className="font-serif text-2xl sm:text-3xl font-normal text-slate-900 tracking-tight">Selesaikan Pembayaran</h1>
                        <div className="inline-flex items-center space-x-1.5 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/50 mt-2">
                            <span className="text-[10px] font-bold text-slate-550 tracking-wider uppercase">Kode Booking:</span>
                            <span className="text-xs font-extrabold text-blue-900 tracking-wide font-mono">{code}</span>
                        </div>
                        {isFromCache && status === 'error' && (
                            <div className="text-xs text-amber-600 flex items-center justify-center gap-2 mt-2">
                                <span>Gagal sinkronisasi data terbaru — menampilkan data tersimpan.</span>
                                <button onClick={refetch} className="underline font-bold cursor-pointer">Coba lagi</button>
                            </div>
                        )}
                    </div>

                    {/* Rejected payment notice */}
                    {booking.payment?.status === 'failed' && booking.payment?.rejection_reason && (
                        <div className="bg-red-50/50 border border-red-200 rounded-2xl p-4 text-left space-y-1.5">
                            <div className="flex items-center space-x-1.5">
                                <AlertCircle className="w-4 h-4 text-red-650" />
                                <p className="text-xs font-bold text-red-900">Bukti transfer sebelumnya ditolak</p>
                            </div>
                            <p className="text-[11px] text-red-750/90 leading-relaxed italic text-slate-700">"{booking.payment.rejection_reason}"</p>
                            <p className="text-[11px] text-red-600 font-semibold pt-0.5">Silakan periksa kembali dan unggah ulang bukti transfer Anda di bawah ini.</p>
                        </div>
                    )}

                    {/* Payment Type Tabs */}
                    {isOnlineEnabled && paymentMethods.length > 0 && (
                        <div className="grid grid-cols-2 gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/50">
                            <button
                                type="button"
                                onClick={() => setPaymentType('online')}
                                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-305 flex items-center justify-center space-x-1.5 cursor-pointer ${
                                    paymentType === 'online'
                                        ? 'bg-white text-blue-900 shadow-sm border border-slate-200/20'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Bayar Online</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentType('manual')}
                                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-305 flex items-center justify-center space-x-1.5 cursor-pointer ${
                                    paymentType === 'manual'
                                        ? 'bg-white text-blue-900 shadow-sm border border-slate-200/20'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Building className="w-3.5 h-3.5" />
                                <span>Transfer Manual</span>
                            </button>
                        </div>
                    )}

                    {/* Invoice detail */}
                    <div className="bg-slate-50/60 backdrop-blur-sm rounded-2xl border border-slate-250/60 p-5 text-left space-y-3 shadow-inner">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-550 font-medium">Nama Villa:</span>
                            <span className="font-bold text-slate-900 text-right">{booking.villa?.name}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-550 font-medium">Durasi Menginap:</span>
                            <span className="font-semibold text-slate-800">{booking.total_nights} malam</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-550 font-medium">Tamu:</span>
                            <span className="font-semibold text-slate-800">{booking.num_guests} orang</span>
                        </div>
                        <div className="border-t border-slate-200/80 pt-3 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-900">Total Tagihan</span>
                            <span className="text-blue-900 font-extrabold text-lg tracking-tight">
                                {formatPrice(booking.total_amount)}
                            </span>
                        </div>
                    </div>

                    {paymentType === 'manual' && (() => {
                        const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId);
                        if (!selectedMethod) {
                            return (
                                <div className="text-center py-4 text-xs text-slate-400 font-medium">
                                    Memuat informasi pembayaran...
                                </div>
                            );
                        }
                        const isQris = selectedMethod.code === 'qris';
                        return (
                        <div className="text-left space-y-4 animate-in fade-in duration-200">
                                    <div className="bg-slate-50/60 border border-slate-250/60 rounded-2xl p-5 space-y-4 shadow-inner">
                                        {isQris ? (
                                                <>  
                                                <div className="text-center space-y-3">
                                                    <div className="w-fit mx-auto bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-lg">
                                                        {selectedMethod.logo_url ? (
                                                            <img
                                                                src={selectedMethod.logo_url}
                                                                alt="QRIS QR Code"
                                                                className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 object-contain mx-auto"
                                                            />
                                                        ) : (
                                                            <div className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-400">
                                                                <Smartphone className="w-16 h-16 mb-3 stroke-[1.5]" />
                                                                <span className="text-xs font-bold tracking-wider">QRIS Code</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mx-auto max-w-md">
                                                        <p className="text-xs text-blue-900 font-bold mb-1">Cara Pembayaran:</p>
                                                        <ol className="text-[11px] text-blue-800 font-medium space-y-1 list-decimal list-inside leading-relaxed">
                                                            <li>Buka aplikasi e-wallet atau mobile banking</li>
                                                            <li>Pilih menu Scan QR / QRIS</li>
                                                            <li>Arahkan kamera ke QR code di atas</li>
                                                            <li>Konfirmasi pembayaran sesuai nominal</li>
                                                        </ol>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-550 font-medium">Merchant:</span>
                                                    <span className="font-bold text-slate-800">{selectedMethod.account_name}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-550 font-medium">Total Pembayaran:</span>
                                                    <span className="font-extrabold text-blue-900 text-sm">
                                                        {formatPrice(booking.total_amount)}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-550 font-medium">Bank Tujuan:</span>
                                                    <span className="font-bold text-slate-800">{selectedMethod.name}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-550 font-medium">Nomor Rekening:</span>
                                                    <div className="flex items-center space-x-1.5">
                                                        <span className="font-mono font-bold text-slate-900 text-sm tracking-wider bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/50">
                                                            {selectedMethod.account_number}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(selectedMethod.account_number);
                                                                setCopiedMethodId(selectedMethod.id);
                                                                toast.success('Nomor rekening berhasil disalin!');
                                                                setTimeout(() => setCopiedMethodId(null), 2000);
                                                            }}
                                                            className="text-[10px] font-bold text-blue-900 hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg border border-blue-200/50 transition-all cursor-pointer shadow-sm active:scale-95"
                                                        >
                                                            {copiedMethodId === selectedMethod.id ? 'Tersalin' : 'Salin'}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-555 font-medium">Atas Nama:</span>
                                                    <span className="font-bold text-slate-800">{selectedMethod.account_name}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-555 font-medium">Jumlah Transfer:</span>
                                                    <span className="font-extrabold text-blue-900 text-sm">
                                                        {formatPrice(booking.total_amount)}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                            {/* Proof Upload Input */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">
                                    Upload Bukti {paymentMethods.find(m => m.id === selectedMethodId)?.code === 'qris' ? 'Pembayaran' : 'Transfer'} *
                                </label>
                                 {/* Hidden file input — triggered programmatically */}
                                 <input
                                     ref={fileInputRef}
                                     type="file"
                                     accept="image/jpeg,image/png,image/jpg,image/webp"
                                     className="hidden"
                                     onChange={async (e) => {
                                         const file = e.target.files?.[0];
                                         // Reset so same file can be re-selected
                                         e.target.value = '';
                                         if (!file) return;
                                         if (file.size > 10 * 1024 * 1024) {
                                             toast.error('Ukuran file maksimal adalah 10MB.');
                                             return;
                                         }
                                         setCompressing(true);
                                         try {
                                             const { file: compressed, preview } = await compressImage(file);
                                             setProofFile(compressed);
                                             setProofPreview(preview);
                                         } catch {
                                             // Fallback: use original file without compression
                                             setProofFile(file);
                                             setProofPreview(URL.createObjectURL(file));
                                         } finally {
                                             setCompressing(false);
                                         }
                                     }}
                                 />

                                 <div
                                     className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer relative group overflow-hidden transition-all duration-200 ${
                                         uploadTapAnim
                                             ? 'border-blue-500 bg-blue-50/40 scale-[0.97]'
                                             : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/30 bg-slate-50/20'
                                     }`}
                                     onClick={() => {
                                         if (compressing) return;
                                         setUploadTapAnim(true);
                                         setTimeout(() => setUploadTapAnim(false), 400);
                                         fileInputRef.current?.click();
                                     }}
                                 >
                                     {compressing ? (
                                         <div className="py-4 flex flex-col items-center space-y-2.5">
                                             <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                             <span className="text-xs font-bold text-blue-600">Memproses gambar...</span>
                                         </div>
                                     ) : proofPreview ? (
                                         <div className="space-y-3">
                                             <div className="relative w-full h-44 mx-auto rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                                                 <img
                                                     src={proofPreview}
                                                     alt="Preview bukti"
                                                     className="w-full h-full object-contain"
                                                 />
                                             </div>
                                             <div className="text-xs text-slate-600 font-medium flex items-center justify-center space-x-1.5">
                                                 <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                                                     <Check className="w-2.5 h-2.5 text-white stroke-[2.5]" />
                                                 </div>
                                                 <span className="truncate max-w-[200px] font-semibold">{proofFile?.name}</span>
                                             </div>
                                             <span className="inline-block text-[11px] font-bold px-3.5 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors shadow-sm active:scale-95">
                                                 Ganti Bukti Transfer
                                             </span>
                                         </div>
                                     ) : (
                                         <div className="py-2 space-y-2.5 flex flex-col items-center">
                                             <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-200 shadow-sm ${
                                                 uploadTapAnim
                                                     ? 'bg-blue-600 border-blue-600 text-white scale-110'
                                                     : 'bg-white border-slate-200/80 text-slate-400 group-hover:text-blue-600 group-hover:border-blue-400 group-hover:shadow-md'
                                             }`}>
                                                 <Upload className={`w-5 h-5 stroke-[1.5] ${uploadTapAnim ? 'animate-bounce' : ''}`} />
                                             </div>
                                             <div>
                                                 <span className={`text-xs font-bold block transition-colors ${uploadTapAnim ? 'text-blue-600' : 'text-slate-700 group-hover:text-blue-600'}`}>
                                                     {uploadTapAnim ? 'Buka galeri...' : 'Pilih file gambar'}
                                                 </span>
                                                 <span className="text-[10px] text-slate-400 block mt-1">JPG, PNG, WEBP (Maks 10MB, dikompres otomatis)</span>
                                             </div>
                                         </div>
                                     )}
                                 </div>
                            </div>
                        </div>
                    )})()}

                    {paymentType === 'online' && (
                        <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 text-left font-medium leading-relaxed shadow-sm">
                            ⚠️ <strong>Penting:</strong> Selesaikan pembayaran Anda sebelum 24 jam untuk menghindari pembatalan otomatis oleh sistem.
                        </div>
                    )}

                    {/* Payment Trigger Button */}
                    {/* ARCHIVED: Online payment tab (Midtrans belum diaktifkan — isOnlineEnabled = false, tab tidak pernah muncul) */}
                    {paymentType === 'online' ? null : (
                        <>
                        <button
                            onClick={handleManualPaymentSubmit}
                            disabled={submittingProof || !selectedMethodId || !proofFile}
                            className="w-full bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950 hover:from-blue-950 hover:to-blue-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl shadow-[0_8px_30px_rgba(30,58,138,0.2)] hover:shadow-[0_8px_30px_rgba(30,58,138,0.25)] transition-all duration-300 flex items-center justify-center space-x-2 text-sm cursor-pointer active:scale-[0.98] relative overflow-hidden group"
                        >
                            {/* Ripple effect background */}
                            <span className="absolute inset-0 bg-white/10 opacity-0 group-active:opacity-100 transition-opacity duration-200"></span>
                            
                            {submittingProof ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Mengirim Bukti Pembayaran...</span>
                                </>
                            ) : (
                                <>
                                    <span className="relative z-10">Konfirmasi Pembayaran</span>
                                    <ArrowRight className="w-4 h-4 relative z-10 group-active:translate-x-1 transition-transform duration-200" />
                                </>
                            )}
                        </button>

                        {/* Upload Progress Bar */}
                        {submittingProof && (
                            <div className="space-y-2 animate-in fade-in duration-200">
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-blue-500 to-blue-700 h-2 rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <div className="flex justify-between items-center text-[11px] text-slate-500 font-semibold">
                                    <span>Mengupload bukti transfer...</span>
                                    <span className="text-blue-700 font-bold">{uploadProgress}%</span>
                                </div>
                            </div>
                        )}
                        </>
                    )}

                    <div className="border-t border-slate-100 pt-6 flex items-center justify-center space-x-2 text-xs text-slate-500 font-semibold">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Metode pembayaran lengkap terproteksi</span>
                    </div>
                </div>

                <div className="text-center mt-6">
                    <a 
                        href={`https://api.whatsapp.com/send?phone=${whatsappNumber}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-slate-500 hover:text-slate-800 text-xs font-semibold space-x-1 hover:underline transition-all"
                    >
                        <WhatsAppIcon className="w-3.5 h-3.5 text-green-500" />
                        <span>Butuh bantuan pembayaran? <span className="text-green-500">WhatsApp</span> Kami</span>
                    </a>
                </div>
            </main>
        </div>
    );
}

export default function BookingPaymentPage() {
    return (
        <Suspense fallback={<LoadingSpinner message="Menyiapkan halaman pembayaran..." />}>
            <BookingPaymentContent />
        </Suspense>
    );
}
