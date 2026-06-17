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
    AlertCircle
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

            toast.success(response.data.message || 'Bukti pembayaran berhasil dikirim!');
            
            // Re-fetch booking details or redirect to refresh status
            window.location.reload();
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
            <div className="text-center py-64 min-h-screen bg-slate-50 flex flex-col justify-center items-center">
                <p className="text-slate-600 text-base sm:text-lg mb-4">Transaksi tidak ditemukan.</p>
                <Link href="/villas" className="text-blue-600 font-bold hover:underline">
                    Kembali ke Katalog Villa
                </Link>
            </div>
        );
    }

    if (booking.payment?.status === 'pending' && booking.payment?.payment_proof) {
        return (
            <div className="flex-1 flex flex-col bg-slate-50 text-slate-800">
                <PublicHeader>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                        Checkout Status
                    </span>
                </PublicHeader>

                <main className="max-w-md mx-auto px-4 py-12 sm:py-16 w-full flex-1 flex flex-col justify-center animate-in fade-in duration-350">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto border border-blue-100 animate-pulse">
                            <ShieldCheck className="w-8 h-8 text-blue-600" />
                        </div>

                        <div>
                            <h1 className="font-serif text-xl sm:text-2xl font-medium text-[#0d0d0d] tracking-tight">Menunggu Verifikasi</h1>
                            <p className="text-slate-500 text-xs mt-1.5">
                                Kode Booking: <span className="font-bold text-slate-700">{code}</span>
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-left space-y-2 text-xs text-blue-800 leading-relaxed">
                            <p className="font-bold">Bukti Transfer Berhasil Dikirim!</p>
                            <p>Tim admin kami sedang memverifikasi pembayaran Anda. Proses ini biasanya memakan waktu kurang dari 30 menit pada jam operasional.</p>
                        </div>

                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-left space-y-3">
                            <div className="flex justify-between text-xs text-slate-600">
                                <span>Nama Villa:</span>
                                <span className="font-semibold text-slate-900">{booking.villa?.name}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600">
                                <span>Total Tagihan:</span>
                                <span className="font-bold text-blue-600">Rp {Number(booking.total_amount).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600">
                                <span>Bukti Transfer:</span>
                                <a 
                                    href={booking.payment.payment_proof} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="font-bold text-blue-650 hover:underline flex items-center space-x-1"
                                >
                                    <span>Lihat Gambar</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Link 
                                href={`/booking/status?code=${code}`}
                                className="w-full inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-2xl shadow-lg transition-transform text-sm"
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
        <div className="flex-1 flex flex-col bg-slate-50 text-slate-800">
            {/* Header */}
            <PublicHeader>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    Checkout Secure
                </span>
            </PublicHeader>

            <main className="max-w-md mx-auto px-4 py-12 sm:py-16 w-full flex-1 flex flex-col justify-center">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
                        <CreditCard className="w-8 h-8 text-blue-600" />
                    </div>

                    <div>
                        <h1 className="font-serif text-xl sm:text-2xl font-medium text-[#0d0d0d] tracking-tight">Selesaikan Pembayaran</h1>
                        <p className="text-slate-500 text-xs mt-1.5">
                            Booking Code: <span className="font-bold text-slate-700">{code}</span>
                        </p>
                    </div>

                    {/* Rejected payment notice */}
                    {booking.payment?.status === 'failed' && booking.payment?.rejection_reason && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-left space-y-1.5">
                            <div className="flex items-center space-x-1.5">
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <p className="text-xs font-bold text-red-800">Bukti transfer sebelumnya ditolak</p>
                            </div>
                            <p className="text-[11px] text-red-700/90 leading-relaxed">{booking.payment.rejection_reason}</p>
                            <p className="text-[11px] text-red-600 font-semibold pt-0.5">Silakan periksa kembali dan unggah ulang bukti transfer Anda di bawah ini.</p>
                        </div>
                    )}

                    {/* Payment Type Tabs */}
                    {isOnlineEnabled && paymentMethods.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
                            <button
                                type="button"
                                onClick={() => setPaymentType('online')}
                                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 ${
                                    paymentType === 'online'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Bayar Online</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentType('manual')}
                                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 ${
                                    paymentType === 'manual'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Building className="w-3.5 h-3.5" />
                                <span>Transfer Manual</span>
                            </button>
                        </div>
                    )}

                    {/* Invoice detail */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-left space-y-3">
                        <div className="flex justify-between text-xs text-slate-600">
                            <span>Nama Villa:</span>
                            <span className="font-semibold text-slate-900">{booking.villa?.name}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600">
                            <span>Durasi Menginap:</span>
                            <span className="font-semibold text-slate-900">{booking.total_nights} malam</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600">
                            <span>Tamu:</span>
                            <span className="font-semibold text-slate-900">{booking.num_guests} orang</span>
                        </div>
                        <div className="border-t border-slate-200 pt-3 flex justify-between font-bold text-slate-900 text-sm">
                            <span>Total Tagihan:</span>
                            <span className="text-blue-650 font-extrabold">Rp {Number(booking.total_amount).toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    {paymentType === 'manual' && (
                        <div className="text-left space-y-4 animate-in fade-in duration-200">
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 block mb-2 uppercase tracking-wider">
                                    Pilih Bank Transfer
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {paymentMethods.map((method) => (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() => setSelectedMethodId(method.id)}
                                            className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                                                selectedMethodId === method.id
                                                    ? 'border-blue-650 bg-blue-50/20 ring-1 ring-blue-600/30'
                                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-3">
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
                                                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                                    <Check className="w-3.5 h-3.5 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Show transfer details for selected bank */}
                            {(() => {
                                const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId);
                                if (!selectedMethod) return null;
                                return (
                                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-medium">Bank Tujuan:</span>
                                            <span className="font-bold text-slate-800">{selectedMethod.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-medium">Nomor Rekening:</span>
                                            <div className="flex items-center space-x-1.5">
                                                <span className="font-mono font-bold text-slate-850 text-sm tracking-wider">
                                                    {selectedMethod.account_number}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(selectedMethod.account_number);
                                                        toast.success('Nomor rekening berhasil disalin!');
                                                    }}
                                                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100"
                                                >
                                                    Salin
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-medium">Atas Nama:</span>
                                            <span className="font-bold text-slate-800">{selectedMethod.account_name}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-medium">Jumlah Transfer:</span>
                                            <span className="font-extrabold text-blue-650 text-sm">
                                                Rp {Number(booking.total_amount).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Proof Upload Input */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                                    Upload Bukti Transfer *
                                </label>
                                <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 transition-colors rounded-2xl p-4 bg-white text-center cursor-pointer relative group">
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
                                                setProofFile(file);
                                                setProofPreview(URL.createObjectURL(file));
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    {proofPreview ? (
                                        <div className="space-y-3">
                                            <div className="relative w-full h-40 mx-auto rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                                                <img 
                                                    src={proofPreview} 
                                                    alt="Preview bukti" 
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <div className="text-xs text-slate-500 font-medium flex items-center justify-center space-x-1.5">
                                                <Check className="w-4 h-4 text-emerald-500" />
                                                <span className="truncate max-w-[200px]">{proofFile?.name}</span>
                                            </div>
                                            <span className="text-[10px] text-blue-650 group-hover:underline font-bold">
                                                Ganti Bukti Transfer
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="py-4 space-y-2 flex flex-col items-center">
                                            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors">
                                                <Upload className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-slate-700 block">Pilih file gambar</span>
                                                <span className="text-[10px] text-slate-400 block mt-0.5">JPG, JPEG, PNG, atau WEBP (Maks 5MB)</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {paymentType === 'online' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 text-left font-medium leading-relaxed">
                            ⚠️ <strong>Penting:</strong> Selesaikan pembayaran Anda sebelum 24 jam untuk menghindari pembatalan otomatis oleh sistem.
                        </div>
                    )}

                    {/* Payment Trigger Button */}
                    {paymentType === 'online' ? (
                        <button
                            onClick={triggerPayment}
                            disabled={!scriptLoaded || !snapToken}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-2xl shadow-lg transition-transform flex items-center justify-center space-x-2 text-sm"
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
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-2xl shadow-lg transition-transform flex items-center justify-center space-x-2 text-sm cursor-pointer"
                        >
                            {submittingProof ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Mengirim Bukti...</span>
                                </>
                            ) : (
                                <>
                                    <span>Konfirmasi Pembayaran Transfer</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    )}

                    <div className="border-t border-slate-100 pt-6 flex items-center justify-center space-x-2 text-xs text-slate-500 font-semibold">
                        <ShieldCheck className="w-4 h-4 text-blue-500" />
                        <span>Metode pembayaran lengkap terproteksi</span>
                    </div>
                </div>

                <div className="text-center mt-6">
                    <a 
                        href="https://api.whatsapp.com/send?phone=6281234567890" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-slate-500 hover:text-slate-800 text-xs font-semibold space-x-1"
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
