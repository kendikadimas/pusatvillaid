'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosClient from '@/lib/axios';
import { Booking } from '@/types';
import { 
    CreditCard, 
    Calendar, 
    MapPin, 
    Loader2, 
    ArrowRight, 
    Phone,
    ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface PageProps {
    params: Promise<{ code: string }>;
}

export default function BookingPaymentPage({ params }: PageProps) {
    const { code } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const snapTokenParam = searchParams.get('token');

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [snapToken, setSnapToken] = useState<string | null>(snapTokenParam);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    useEffect(() => {
        // 1. Fetch booking details to verify unpaid status
        const fetchBooking = async () => {
            try {
                // To fetch details we need the email. We retrieve it from sessionStorage (saved during confirm checkout)
                const email = sessionStorage.getItem(`checkout_email_${code}`);
                if (!email) {
                    // If no email, redirect back to home or request check status
                    toast.error('Otorisasi pembayaran diperlukan. Silakan verifikasi email Anda.');
                    router.push(`/booking/${code}`);
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

    // 2. Load Midtrans Snap.js script
    useEffect(() => {
        const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-placeholder';
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
        script.setAttribute('data-client-key', midtransClientKey);
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
                    router.push(`/booking/${code}?status=pending`);
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
        return (
            <div className="flex justify-center items-center py-64 min-h-screen bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="text-center py-64 min-h-screen bg-slate-50 flex flex-col justify-center items-center">
                <p className="text-slate-600 text-lg mb-4">Transaksi tidak ditemukan.</p>
                <Link href="/villas" className="text-emerald-600 font-bold hover:underline">
                    Kembali ke Katalog Villa
                </Link>
            </div>
        );
    }

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
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                        Checkout Secure
                    </span>
                </div>
            </header>

            <main className="max-w-md mx-auto px-4 py-16 w-full flex-1 flex flex-col justify-center">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                        <CreditCard className="w-8 h-8 text-emerald-600" />
                    </div>

                    <div>
                        <h1 className="font-serif text-2xl font-medium text-[#0d0d0d] tracking-tight">Selesaikan Pembayaran</h1>
                        <p className="text-slate-500 text-xs mt-1.5">
                            Booking Code: <span className="font-bold text-slate-700">{code}</span>
                        </p>
                    </div>

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
                            <span className="text-emerald-600">Rp {Number(booking.total_amount).toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 text-left font-medium leading-relaxed">
                        ⚠️ <strong>Penting:</strong> Selesaikan pembayaran Anda sebelum 24 jam untuk menghindari pembatalan otomatis oleh sistem.
                    </div>

                    {/* Payment Trigger Button */}
                    <button
                        onClick={triggerPayment}
                        disabled={!scriptLoaded || !snapToken}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 disabled:opacity-50 text-white font-bold py-3 rounded-2xl shadow-lg transition-transform flex items-center justify-center space-x-2 text-sm"
                    >
                        {!scriptLoaded ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Menyiapkan Gateway...</span>
                            </>
                        ) : (
                            <>
                                <span>Bayar Sekarang</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>

                    <div className="border-t border-slate-100 pt-6 flex items-center justify-center space-x-2 text-xs text-slate-500 font-semibold">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span>Metode pembayaran lengkap terproteksi</span>
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
                        <span>Butuh bantuan pembayaran? WhatsApp Kami</span>
                    </a>
                </div>
            </main>
        </div>
    );
}
