'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBookingStore } from '@/store/bookingStore';
import axiosClient from '@/lib/axios';
import { formatPrice } from '@/lib/format';
import { format, parseISO, eachDayOfInterval, subDays } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import PublicHeader from '@/components/PublicHeader';
import BookingSummaryCard from '@/components/BookingSummaryCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getMainPhoto } from '@/lib/villaUtils';
import FormField from '@/components/ui/FormField';
import CountdownTimer from '@/components/ui/CountdownTimer';
import { 
    ChevronRight,
    Loader2,
    CreditCard,
    Smartphone,
    Building2,
    ShieldCheck,
    Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export default function BookingConfirmPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { 
        selectedVilla, 
        checkIn, 
        checkOut, 
        numGuests, 
        notes,
        totalNights, 
        totalAmount,
        priceBreakdown,
        setNumGuests,
        setNotes,
        resetStore,
        isRefundable
    } = useBookingStore();

    const [loading, setLoading] = useState(false);
    
    // Payment Method selection
    const [paymentMethod, setPaymentMethod] = useState<'qris' | 'bank_transfer' | 'credit_card'>('bank_transfer');

    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [agree, setAgree] = useState(false);
    const [formErrors, setFormErrors] = useState<any>({});

    // Simulated Card details for UI fidelity
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [billingAddress, setBillingAddress] = useState('');

    // Layer 4: Hold timer (30 minutes countdown)
    const HOLD_DURATION_SECONDS = 30 * 60; // 30 minutes
    const [secondsLeft, setSecondsLeft] = useState(HOLD_DURATION_SECONDS);
    const [holdExpired, setHoldExpired] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Enforce login
    useEffect(() => {
        if (!authLoading && !user) {
            toast.error('Silakan masuk (login) terlebih dahulu untuk melanjutkan pembayaran.');
            router.push('/login?redirect=/booking/confirm');
        }
    }, [user, authLoading, router]);

    // Prefill form states once user loads
    useEffect(() => {
        if (user) {
            setName(prev => prev || user.name || '');
            setEmail(prev => prev || user.email || '');
            setPhone(prev => prev || user.phone || '');
        }
    }, [user]);

    useEffect(() => {
        // Guard check: redirect if booking details are missing
        if (!selectedVilla || !checkIn || !checkOut || totalNights <= 0) {
            toast.error('Data sewa tidak lengkap. Silakan pilih tanggal kembali.');
            router.push('/villas');
        }
    }, [selectedVilla, checkIn, checkOut, totalNights]);

    // Layer 4: Start countdown timer
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    setHoldExpired(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Format seconds to MM:SS
    const formatTimer = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (authLoading || !user || !selectedVilla || !checkIn || !checkOut) {
        return <LoadingSpinner />;
    }

    const validateForm = () => {
        const errors: any = {};
        if (!name.trim()) errors.name = 'Nama lengkap wajib diisi.';
        if (!email.trim()) {
            errors.email = 'Email wajib diisi.';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.email = 'Format email tidak valid.';
        }
        if (!phone.trim()) {
            errors.phone = 'Nomor WhatsApp wajib diisi.';
        } else if (phone.length < 9 || phone.length > 15) {
            errors.phone = 'Nomor telepon minimal 9 digit dan maksimal 15 digit.';
        }
        if (!agree) errors.agree = 'Anda harus menyetujui syarat & ketentuan.';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error('Silakan periksa kembali isian form Anda.');
            return;
        }

        // Layer 4: Check if hold timer has expired
        if (holdExpired) {
            toast.error('Waktu reservasi Anda telah habis. Silakan pilih tanggal kembali.');
            resetStore();
            router.push(`/villas/${selectedVilla.slug}`);
            return;
        }

        setLoading(true);
        try {
            // Layer 3: Pre-check availability before submitting
            try {
                const availRes = await axiosClient.get(`/villas/${selectedVilla.slug}/availability`);
                const disabledDates: string[] = availRes.data.disabled_dates || [];
                
                const checkInDate = parseISO(checkIn!);
                const checkOutDate = parseISO(checkOut!);
                const selectedDates = eachDayOfInterval({ 
                    start: checkInDate, 
                    end: subDays(checkOutDate, 1) 
                });
                
                const conflict = selectedDates.find(d => 
                    disabledDates.includes(format(d, 'yyyy-MM-dd'))
                );

                if (conflict) {
                    toast.error('Maaf, tanggal yang Anda pilih sudah tidak tersedia. Kemungkinan sudah dipesan tamu lain. Silakan pilih tanggal lain.');
                    resetStore();
                    router.push(`/villas/${selectedVilla.slug}`);
                    return;
                }
            } catch {
                // If availability check fails, proceed anyway — backend will catch duplicates
                console.warn('Pre-check availability failed, proceeding with booking...');
            }

            // Get UTM params if exist in URL/session
            const utm_source = sessionStorage.getItem('utm_source') || null;
            const utm_medium = sessionStorage.getItem('utm_medium') || null;
            const utm_campaign = sessionStorage.getItem('utm_campaign') || null;

            const payload = {
                villa_id: selectedVilla.id,
                guest_name: name,
                guest_email: email,
                guest_phone: phone,
                check_in: checkIn,
                check_out: checkOut,
                num_guests: numGuests,
                notes: notes,
                is_refundable: isRefundable,
                utm_source,
                utm_medium,
                utm_campaign,
            };

            const response = await axiosClient.post('/bookings', payload);
            
            // Save email used for checkout in sessionStorage to allow verification access to checking status
            sessionStorage.setItem(`checkout_email_${response.data.booking_code}`, email);

            toast.success(response.data.message || 'Booking berhasil dibuat.');

            // Clear booking selection store
            resetStore();

            // Redirect directly to payment checkout page
            router.push(`/booking/payment?code=${response.data.booking_code}&token=${response.data.snap_token}`);

        } catch (err: any) {
            console.error('Submit booking failed:', err);
            const errMsg = err.response?.data?.message || 'Gagal memproses pesanan Anda. Silakan coba beberapa saat lagi.';
            toast.error(errMsg);
            
            if (err.response?.data?.errors) {
                setFormErrors(err.response.data.errors);
            }
        } finally {
            setLoading(false);
        }
    };

    const mainPhoto = getMainPhoto(selectedVilla);

    return (
        <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 font-sans">
            {/* Header */}
            <PublicHeader
                showBackButton
                onBackClick={() => router.back()}
            />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1">
                {/* Stepper Progress */}
                <div className="flex items-center flex-wrap gap-y-1.5 space-x-2.5 text-[8px] sm:text-[9px] text-slate-400 font-black uppercase tracking-widest mb-10">
                    <span>1. Pilih Tanggal</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-blue-500">2. Konfirmasi & Bayar</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    <span>3. Selesai</span>
                </div>

                {/* Layer 4: Hold Timer Banner */}
                <CountdownTimer totalSeconds={HOLD_DURATION_SECONDS} onExpired={() => setHoldExpired(true)} />

                {/* Layer 4: Expired Modal Overlay */}
                {holdExpired && (
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-5">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                <Clock className="w-8 h-8 text-red-500" />
                            </div>
                            <h2 className="font-serif text-2xl font-bold text-slate-900">Waktu Reservasi Habis</h2>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Batas waktu 30 menit untuk menyelesaikan pembayaran telah berakhir. 
                                Tanggal yang Anda pilih mungkin sudah tidak tersedia.
                            </p>
                            <button
                                onClick={() => {
                                    resetStore();
                                    router.push('/villas');
                                }}
                                className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                            >
                                Pilih Tanggal Baru
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column (Checkout Form Groups) */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Smaller Headline: Poppins 40px, Medium, 44px line height on desktop */}
                        <h1 className="font-serif text-2xl md:text-[40px] md:leading-[44px] font-medium text-[#0d0d0d] tracking-tight">Konfirmasikan dan bayar</h1>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Step 1: Payment Method (Airbnb UI inspired but unique) */}
                            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-md hover:shadow-lg transition-all space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <h2 className="font-serif text-lg font-bold text-slate-905">1. Metode Pembayaran</h2>
                                    <span className="text-[9px] text-blue-600 font-black uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                                        ⚡ Otomatis
                                    </span>
                                </div>

                                {/* Selection Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('bank_transfer')}
                                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer active:scale-[0.98] ${
                                            paymentMethod === 'bank_transfer'
                                                ? 'bg-blue-50/50 border-blue-500 text-blue-500 shadow-xs ring-1 ring-blue-500/20'
                                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/50'
                                        }`}
                                    >
                                        <Building2 className="w-5 h-5 mb-2" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Virtual Account</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('qris')}
                                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer active:scale-[0.98] ${
                                            paymentMethod === 'qris'
                                                ? 'bg-blue-50/50 border-blue-500 text-blue-500 shadow-xs ring-1 ring-blue-500/20'
                                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/50'
                                        }`}
                                    >
                                        <Smartphone className="w-5 h-5 mb-2" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">QRIS & E-Wallet</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('credit_card')}
                                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer active:scale-[0.98] ${
                                            paymentMethod === 'credit_card'
                                                ? 'bg-blue-50/50 border-blue-500 text-blue-500 shadow-xs ring-1 ring-blue-500/20'
                                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/50'
                                        }`}
                                    >
                                        <CreditCard className="w-5 h-5 mb-2" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Kartu Kredit</span>
                                    </button>
                                </div>

                                {/* Simulated fields or notices based on method selection */}
                                <div className="mt-4 p-5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                                    {paymentMethod === 'bank_transfer' && (
                                        <div className="text-xs font-semibold text-slate-605 leading-relaxed">
                                            <strong>Virtual Account:</strong> Mendukung transfer bank otomatis (BCA, Mandiri, BNI, BRI, Permata). Anda akan menerima kode bayar unik setelah menekan tombol konfirmasi.
                                        </div>
                                    )}

                                    {paymentMethod === 'qris' && (
                                        <div className="text-xs font-semibold text-slate-605 leading-relaxed">
                                            <strong>QRIS & E-Wallet:</strong> Bayar instan menggunakan GoPay, OVO, ShopeePay, LinkAja, Dana, atau scan kode QRIS melalui aplikasi perbankan Anda.
                                        </div>
                                    )}

                                    {paymentMethod === 'credit_card' && (
                                        <div className="space-y-4">
                                            <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">
                                                Simulasi Kartu Kredit
                                            </div>
                                            <div className="space-y-3">
                                                <input 
                                                    type="text" 
                                                    placeholder="Nomor Kartu (16 digit)"
                                                    value={cardNumber}
                                                    onChange={(e) => setCardNumber(e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                />
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Kedaluwarsa (MM/YY)"
                                                        value={cardExpiry}
                                                        onChange={(e) => setCardExpiry(e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    />
                                                    <input 
                                                        type="password" 
                                                        placeholder="CVV"
                                                        value={cardCvv}
                                                        onChange={(e) => setCardCvv(e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    placeholder="Alamat Penagihan (Kota/Kode Pos)"
                                                    value={billingAddress}
                                                    onChange={(e) => setBillingAddress(e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                />
                                            </div>
                                            <div className="text-[10px] text-slate-450 font-semibold leading-relaxed mt-2 pt-2 border-t border-slate-200/50">
                                                Informasi di atas hanya merupakan bagian dari tata letak visual. Transaksi kartu kredit yang sesungguhnya tetap akan diproses dengan aman pada portal pembayaran terenkripsi Midtrans Snap.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Step 2: Guest Details (Elegant Minimal Input Panel) */}
                            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-md hover:shadow-lg transition-all space-y-6">
                                <h2 className="font-serif text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">2. Detail Tamu</h2>
                                
                                <div className="space-y-6">
                                    <div className="relative border-b border-slate-200 focus-within:border-blue-500 transition-colors py-1">
                                        <label className="text-[9px] font-black text-slate-400 block uppercase tracking-widest">Nama Lengkap Sesuai KTP</label>
                                        <input 
                                            type="text" 
                                            placeholder="Nama lengkap Anda..."
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-transparent border-none px-0 py-1.5 text-xs focus:ring-0 focus:outline-none font-bold text-slate-850"
                                        />
                                        {formErrors.name && (
                                            <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.name}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="relative border-b border-slate-200 focus-within:border-blue-500 transition-colors py-1">
                                            <label className="text-[9px] font-black text-slate-400 block uppercase tracking-widest">Alamat Email</label>
                                            <input 
                                                type="email" 
                                                placeholder="Contoh: budi@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-transparent border-none px-0 py-1.5 text-xs focus:ring-0 focus:outline-none font-bold text-slate-855"
                                            />
                                            {formErrors.email && (
                                                <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.email}</p>
                                            )}
                                        </div>

                                        <div className="relative border-b border-slate-200 focus-within:border-blue-500 transition-colors py-1">
                                            <label className="text-[9px] font-black text-slate-400 block uppercase tracking-widest">Nomor WhatsApp</label>
                                            <input 
                                                type="tel" 
                                                placeholder="Contoh: 081234567890"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full bg-transparent border-none px-0 py-1.5 text-xs focus:ring-0 focus:outline-none font-bold text-slate-855"
                                            />
                                            {formErrors.phone && (
                                                <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.phone}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="relative border-b border-slate-200 focus-within:border-blue-500 transition-colors py-1">
                                        <label className="text-[9px] font-black text-slate-400 block uppercase tracking-widest">Catatan Tambahan (Opsional)</label>
                                        <textarea 
                                            rows={2}
                                            placeholder="Request floating breakfast, sewa extra bed, check-in jam 1 siang..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="w-full bg-transparent border-none px-0 py-1.5 text-xs focus:ring-0 focus:outline-none font-bold text-slate-850 resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Step 3: Terms and Agreement */}
                            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-md hover:shadow-lg transition-all space-y-6">
                                <h2 className="font-serif text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">3. Syarat & Ketentuan</h2>
                                
                                <div className="space-y-4">
                                    <label className="flex items-start space-x-3 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={agree}
                                            onChange={(e) => setAgree(e.target.checked)}
                                            className="mt-0.5 rounded border-slate-350 text-blue-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                        />
                                        <span className="text-xs text-slate-555 leading-normal font-semibold">
                                            Saya menyetujui <span className="text-blue-500 font-bold hover:underline">Aturan Menginap</span> properti, termasuk larangan membawa hewan peliharaan, larangan merokok di dalam kamar, dan mematuhi jam tenang setelah pukul 22.00.
                                        </span>
                                    </label>
                                    {formErrors.agree && (
                                        <p className="text-red-500 text-[10px] font-bold">{formErrors.agree}</p>
                                    )}

                                    <button 
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] active:translate-y-[1px] text-white font-bold py-4 rounded-2xl shadow-lg transition-transform flex items-center justify-center space-x-2 text-xs uppercase tracking-wider disabled:opacity-50 mt-4 cursor-pointer"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Sedang memproses...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Konfirmasi dan Bayar</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Right Column (Summary Card - Airbnb Inspired Layout) */}
                    <div className="lg:col-span-5">
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl sticky top-24 space-y-6">
                            {/* Villa Card Summary Header */}
                            <BookingSummaryCard
                                villa={selectedVilla}
                                mainPhoto={mainPhoto}
                            />

                            {/* Free Cancellation Banner (Semantically Styled Checkmark) */}
                            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start space-x-3 text-xs text-slate-655 leading-relaxed font-semibold">
                                <div className="w-5 h-5 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5 border border-blue-500/20">
                                    ✓
                                </div>
                                <span>
                                    <strong>Kebijakan Fleksibel:</strong> Pembatalan gratis dan refund penuh (maksimal H-3 sebelum check-in) untuk ketenangan rencana liburan Anda.
                                </span>
                            </div>

                            {/* Booking details dates (Airbnb UI style) */}
                            <div className="space-y-4 pt-2">
                                <h4 className="text-[10px] font-black text-slate-955 uppercase tracking-widest">Informasi Reservasi</h4>
                                
                                <div className="space-y-4 text-xs font-bold text-slate-700">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="text-[9px] text-slate-400 block font-black uppercase tracking-widest">Tanggal</span>
                                            <span className="text-slate-800">
                                                {format(parseISO(checkIn), 'dd MMM')} - {format(parseISO(checkOut), 'dd MMM yyyy', { locale: localeID })}
                                            </span>
                                        </div>
                                        <Link href={`/villas/${selectedVilla.slug}`} className="text-xs font-bold text-blue-500 hover:underline active:scale-95 transition-transform">
                                            Ubah
                                        </Link>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="text-[9px] text-slate-400 block font-black uppercase tracking-widest">Tamu</span>
                                            <span className="text-slate-800">{numGuests} Tamu</span>
                                        </div>
                                        <Link href={`/villas/${selectedVilla.slug}`} className="text-xs font-bold text-blue-500 hover:underline active:scale-95 transition-transform">
                                            Ubah
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Price breakdown table */}
                            <div className="border-t border-slate-100 pt-5 space-y-4">
                                <h4 className="text-[10px] font-black text-slate-955 uppercase tracking-widest">Perincian Harga</h4>
                                
                                <div className="space-y-3 text-xs font-semibold text-slate-550">
                                    <div className="flex justify-between">
                                        <span>{priceBreakdown.weekdays.count} malam x Rp {Number(selectedVilla.price_per_night).toLocaleString('id-ID')} (Weekday)</span>
                                        <span className="text-slate-800 font-bold font-sans">Rp {priceBreakdown.weekdays.total.toLocaleString('id-ID')}</span>
                                    </div>
                                    {priceBreakdown.weekends.count > 0 && (
                                        <div className="flex justify-between">
                                            <span>{priceBreakdown.weekends.count} malam x Rp {Number(selectedVilla.weekend_price || selectedVilla.price_per_night).toLocaleString('id-ID')} (Weekend)</span>
                                            <span className="text-slate-800 font-bold font-sans">Rp {priceBreakdown.weekends.total.toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                    {isRefundable && (
                                        <div className="flex justify-between">
                                            <span>Pilihan tarif (Bisa dikembalikan +11.1%)</span>
                                            <span className="text-blue-500 font-bold font-sans">+Rp {Math.round((priceBreakdown.weekdays.total + priceBreakdown.weekends.total) * 0.11111).toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-slate-150 pt-4 flex justify-between font-black text-slate-950 text-sm">
                                    <span>Total Biaya</span>
                                    <span className="text-blue-500 font-sans">Rp {totalAmount.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            {/* Secure Payments Trust Badge */}
                            <div className="bg-slate-955 text-white rounded-2xl p-4 flex items-center space-x-3 text-xs border border-slate-900 shadow-xs">
                                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                <div>
                                    <span className="font-bold text-white block">Sistem Pembayaran Aman</span>
                                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5 leading-normal">Pembayaran diproses and dilindungi langsung secara otomatis melalui gateway enkripsi Midtrans Snap.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
