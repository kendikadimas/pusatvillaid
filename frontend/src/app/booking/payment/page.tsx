'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosClient from '@/lib/axios';
import { Booking, PaymentMethod } from '@/types';
import PublicHeader from '@/components/PublicHeader';
import BookingSummaryCard from '@/components/BookingSummaryCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatPrice } from '@/lib/format';
import { 
    CreditCard, 
    Loader2,
    Phone,
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
import { toast } from 'sonner';

function BookingPaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const code = searchParams.get('code') || '';
    const snapTokenParam = searchParams.get('token');

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [snapToken, setSnapToken] = useState<string | null>(snapTokenParam);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    // New states for manual payment
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [paymentType, setPaymentType] = useState<'online' | 'manual'>('manual');
    const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string | null>(null);
    const [submittingProof, setSubmittingProof] = useState(false);
    const [copiedMethodId, setCopiedMethodId] = useState<number | null>(null);

    // Online payment (Midtrans) is only available when a real client key is configured.
    const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    const isOnlineEnabled = Boolean(
        midtransClientKey &&
        !midtransClientKey.includes('placeholder') &&
        !midtransClientKey.includes('Mid-client-key-anda')
    );

    useEffect(() => {
        // 1. Fetch booking details to verify unpaid status
        const fetchBooking = async () => {
            try {
                // To fetch details we need the email. We retrieve it from sessionStorage (saved during confirm checkout)
                const email = sessionStorage.getItem(`checkout_email_${code}`);
                if (!email) {
                    // If no email, redirect back to home or request check status
                    toast.error('Otorisasi pembayaran diperlukan. Silakan verifikasi email Anda.');
                    router.push(`/booking/status?code=${code}`);
                    return;
                }

                const response = await axiosClient.get(`/bookings/${code}`, {
                    params: { email }
                });
                
                const b = response.data;
                setBooking(b);
                
                if (b.payment_status === 'paid' || b.status === 'confirmed') {
                    toast.success('Pemesanan ini sudah dibayar.');
                    router.push(`/booking/success?code=${code}`);
                    return;
                }

                if (b.status === 'cancelled') {
                    toast.error('Pemesanan ini sudah dibatalkan.');
                    router.push(`/booking/failed?code=${code}`);
                    return;
                }

                // If token exists in DB but not in URL, use it
                if (!snapToken && b.payment?.snap_token) {
                    setSnapToken(b.payment.snap_token);
                }

            } catch (err) {
                console.error('Failed to fetch booking:', err);
                toast.error('Gagal mengambil detail pemesanan.');
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [code, snapTokenParam]);

    // 2. Load Midtrans Snap.js script (only when online payment is enabled)
    useEffect(() => {
        if (!isOnlineEnabled) {
            return;
        }
        const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
        const snapSrc = isProduction 
            ? 'https://app.midtrans.com/snap/snap.js' 
            : 'https://app.sandbox.midtrans.com/snap/snap.js';

        // Check if script already exists
        const existingScript = document.querySelector(`script[src="${snapSrc}"]`);
        if (existingScript) {
            setScriptLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = snapSrc;
        script.setAttribute('data-client-key', midtransClientKey as string);
        script.async = true;
        
        script.onload = () => {
            setScriptLoaded(true);
        };

        script.onerror = () => {
            console.error('Gagal memuat library Midtrans Snap.');
            toast.error('Gagal memuat sistem pembayaran Midtrans. Coba segarkan halaman.');
        };

        document.body.appendChild(script);

        return () => {
            // Clean up is not strictly necessary but nice to avoid duplicate script tags
        };
    }, []);

    // Fetch active manual payment methods
    useEffect(() => {
        const fetchPaymentMethods = async () => {
            try {
                const response = await axiosClient.get('/payment-methods');
                setPaymentMethods(response.data);
                if (response.data.length > 0) {
                    setSelectedMethodId(response.data[0].id);
                }
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
                    }
                }
            );

            toast.success('Bukti Pembayaran Terkirim! Pembayaran Anda sedang direview oleh admin. Silakan cek status booking secara berkala.', {
                duration: 5000,
            });
            
            // Re-fetch booking details or redirect to refresh status
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (err: any) {
            console.error('Failed to submit manual payment:', err);
            const errMsg = err.response?.data?.message || 'Gagal mengirim bukti pembayaran.';
            toast.error(errMsg);
        } finally {
            setSubmittingProof(false);
        }
    };

    const triggerPayment = () => {
        if (!snapToken) {
            toast.error('Token pembayaran tidak valid.');
            return;
        }

        if (snapToken.startsWith('mock-snap-token-')) {
            // Development/offline mock payment simulation!
            toast.info('Simulasi Pembayaran: Menggunakan mockup token untuk testing offline.');
            simulateMockPayment();
            return;
        }

        if (typeof window !== 'undefined' && (window as any).snap) {
            (window as any).snap.pay(snapToken, {
                onSuccess: function (result: any) {
                    console.log('Payment success:', result);
                    toast.success('Pembayaran sukses terkonfirmasi!');
                    router.push(`/booking/success?code=${code}`);
                },
                onPending: function (result: any) {
                    console.log('Payment pending:', result);
                    toast.info('Menunggu penyelesaian pembayaran.');
                    router.push(`/booking/status?code=${code}&status=pending`);
                },
                onError: function (result: any) {
                    console.error('Payment error:', result);
                    toast.error('Pembayaran gagal dilakukan.');
                    router.push(`/booking/failed?code=${code}`);
                },
                onClose: function () {
                    console.log('Payment checkout widget closed');
                    toast.warning('Checkout ditutup sebelum pembayaran selesai.');
                }
            });
        } else {
            toast.error('Sistem pembayaran belum siap. Silakan tunggu beberapa saat.');
        }
    };

    const simulateMockPayment = async () => {
        setLoading(true);
        try {
            // In mock mode, we trigger the webhook simulator endpoint or directly call a mock success simulation
            // To make this fully functional locally, we can make an API request to simulate payment approval
            // For example, mock direct notification callback
            const mockWebhookPayload = {
                order_id: booking?.payment?.midtrans_order_id || (code + '-mock'),
                status_code: '200',
                gross_amount: booking?.total_amount ? String(booking.total_amount) : '0',
                signature_key: 'mock-signature-key-approved',
                transaction_status: 'settlement',
                payment_type: 'mock_qris',
                transaction_id: 'mock-transaction-' + uniqid(),
            };

            await axiosClient.post('/payment/notification', mockWebhookPayload);
            toast.success('Simulasi Pembayaran Berhasil! Booking Anda telah aktif.');
            router.push(`/booking/success?code=${code}`);
        } catch (err) {
            console.error('Mock payment simulation failed:', err);
            toast.error('Simulasi pembayaran gagal.');
        } finally {
            setLoading(false);
        }
    };

    const uniqid = () => Math.random().toString(36).substring(2, 9);

    if (loading) {
        return <LoadingSpinner message="Menyiapkan halaman pembayaran..." />;
    }

    if (!booking) {
        return (
            <div className="text-center py-64 min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col justify-center items-center px-4 animate-in fade-in duration-300">
                <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-sm w-full shadow-lg space-y-4">
                    <p className="text-slate-655 text-sm font-medium">Transaksi tidak ditemukan.</p>
                    <Link href="/villas" className="w-full inline-flex items-center justify-center bg-blue-900 hover:bg-blue-950 text-white font-bold py-3 rounded-xl shadow-md transition-all text-xs">
                        Kembali ke Katalog Villa
                    </Link>
                </div>
            </div>
        );
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
                                <a 
                                    href={booking.payment.payment_proof} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="font-bold text-blue-900 hover:text-blue-950 hover:underline flex items-center space-x-1"
                                >
                                    <span>Lihat Gambar</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
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
                        const qrisMethods = paymentMethods.filter(m => m.code === 'qris');
                        const bankMethods = paymentMethods.filter(m => m.code !== 'qris');
                        return (
                        <div className="text-left space-y-4 animate-in fade-in duration-200">
                            {qrisMethods.length > 0 && (
                                <div>
                                    <label className="text-[10px] font-extrabold text-slate-400 block mb-2 uppercase tracking-wider">
                                        Pembayaran via QRIS
                                    </label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {qrisMethods.map((method) => (
                                            <button
                                                key={method.id}
                                                type="button"
                                                onClick={() => setSelectedMethodId(method.id)}
                                                className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all duration-350 cursor-pointer ${
                                                    selectedMethodId === method.id
                                                        ? 'border-blue-900 bg-blue-50/20 ring-1 ring-blue-900/30 shadow-md shadow-blue-900/5'
                                                        : 'border-slate-200 bg-white hover:border-slate-350'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-3.5">
                                                    {method.logo_url ? (
                                                        <img 
                                                            src={method.logo_url} 
                                                            alt={method.name} 
                                                            className="w-10 h-6 object-contain rounded border border-slate-100 bg-white"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-6 bg-slate-100 rounded flex items-center justify-center border border-slate-150">
                                                            <Smartphone className="w-4 h-4 text-slate-400" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="font-bold text-slate-900 text-xs block">{method.name}</span>
                                                        <span className="text-[10px] text-slate-500">Scan QRIS</span>
                                                    </div>
                                                </div>
                                                {selectedMethodId === method.id && (
                                                    <div className="w-5 h-5 bg-blue-900 rounded-full flex items-center justify-center shadow-sm">
                                                        <Check className="w-3 h-3 text-white stroke-[2.5]" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {bankMethods.length > 0 && (
                                <div>
                                    <label className="text-[10px] font-extrabold text-slate-400 block mb-2 uppercase tracking-wider">
                                        Pilih Bank Transfer
                                    </label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {bankMethods.map((method) => (
                                            <button
                                                key={method.id}
                                                type="button"
                                                onClick={() => setSelectedMethodId(method.id)}
                                                className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all duration-350 cursor-pointer ${
                                                    selectedMethodId === method.id
                                                        ? 'border-blue-900 bg-blue-50/20 ring-1 ring-blue-900/30 shadow-md shadow-blue-900/5'
                                                        : 'border-slate-200 bg-white hover:border-slate-350'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-3.5">
                                                    {method.logo_url ? (
                                                        <img 
                                                            src={method.logo_url} 
                                                            alt={method.name} 
                                                            className="w-10 h-6 object-contain rounded border border-slate-100 bg-white"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-6 bg-slate-100 rounded flex items-center justify-center border border-slate-150">
                                                            <Building className="w-4 h-4 text-slate-400" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="font-bold text-slate-900 text-xs block">{method.name}</span>
                                                        <span className="text-[10px] text-slate-500">Manual Transfer</span>
                                                    </div>
                                                </div>
                                                {selectedMethodId === method.id && (
                                                    <div className="w-5 h-5 bg-blue-900 rounded-full flex items-center justify-center shadow-sm">
                                                        <Check className="w-3 h-3 text-white stroke-[2.5]" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Show payment details for selected method */}
                            {(() => {
                                const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId);
                                if (!selectedMethod) return null;
                                const isQris = selectedMethod.code === 'qris';
                                return (
                                    <div className="bg-slate-50/60 border border-slate-250/60 rounded-2xl p-5 space-y-4 shadow-inner">
                                        {isQris ? (
                                                <>  
                                                <div className="text-center space-y-3">
                                                    <div className="w-fit mx-auto bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-lg">
                                                        {selectedMethod.logo_url ? (
                                                            <img
                                                                src={selectedMethod.logo_url}
                                                                alt="QRIS QR Code"
                                                                className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 object-contain mx-auto"
                                                            />
                                                        ) : (
                                                            <div className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-400">
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
                                );
                            })()}

                            {/* Proof Upload Input */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">
                                    Upload Bukti {paymentMethods.find(m => m.id === selectedMethodId)?.code === 'qris' ? 'Pembayaran' : 'Transfer'} *
                                </label>
                                <div className="border-2 border-dashed border-slate-200 hover:border-blue-900 hover:bg-slate-50/30 active:border-blue-700 active:bg-blue-50/20 active:scale-[0.99] transition-all duration-200 rounded-2xl p-6 bg-slate-50/20 text-center cursor-pointer relative group overflow-hidden">
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg,image/webp"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                if (file.size > 5120 * 1024) {
                                                    toast.error('Ukuran file maksimal adalah 5MB.');
                                                    return;
                                                }
                                                toast.success('Foto bukti transfer berhasil dipilih!');
                                                setProofFile(file);
                                                setProofPreview(URL.createObjectURL(file));
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    {proofPreview ? (
                                        <div className="space-y-3 z-20 relative">
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
                                            <span className="inline-block text-[11px] text-blue-900 group-hover:underline font-bold bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm group-active:scale-95 transition-all duration-200">
                                                Ganti Bukti Transfer
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="py-2 space-y-2.5 flex flex-col items-center z-20 relative">
                                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-blue-900 group-hover:border-blue-900 group-hover:shadow-md group-active:scale-95 transition-all duration-200 shadow-sm">
                                                <Upload className="w-5 h-5 stroke-[1.5] group-active:animate-pulse" />
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-slate-700 block group-hover:text-blue-900 transition-colors">Pilih file gambar</span>
                                                <span className="text-[10px] text-slate-400 block mt-1">JPG, JPEG, PNG, atau WEBP (Maks 5MB)</span>
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
                    {paymentType === 'online' ? (
                        <button
                            onClick={triggerPayment}
                            disabled={!scriptLoaded || !snapToken}
                            className="w-full bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950 hover:from-blue-950 hover:to-blue-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl shadow-[0_8px_30px_rgba(30,58,138,0.2)] hover:shadow-[0_8px_30px_rgba(30,58,138,0.25)] transition-all duration-300 flex items-center justify-center space-x-2 text-sm cursor-pointer active:scale-[0.98]"
                        >
                            {!scriptLoaded ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Menyiapkan Gateway...</span>
                                </>
                            ) : (
                                <>
                                    <span>Bayar Sekarang (Online)</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    ) : (
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
                    )}

                    <div className="border-t border-slate-100 pt-6 flex items-center justify-center space-x-2 text-xs text-slate-500 font-semibold">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Metode pembayaran lengkap terproteksi</span>
                    </div>
                </div>

                <div className="text-center mt-6">
                    <a 
                        href="https://api.whatsapp.com/send?phone=6281234567890" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-slate-500 hover:text-slate-800 text-xs font-semibold space-x-1 hover:underline transition-all"
                    >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Butuh bantuan pembayaran? WhatsApp Kami</span>
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
