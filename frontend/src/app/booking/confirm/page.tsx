'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBookingStore } from '@/store/bookingStore';
import axiosClient from '@/lib/axios';
import { formatPrice, formatPriceOrLoading } from '@/lib/format';
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
    Smartphone,
    ShieldCheck,
    Clock,
    Check,
    Building,
    ArrowLeft,
    ChevronLeft,
    X,
    Star,
    MapPin,
    Upload,
    ImagePlus,
    FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { PaymentMethod } from '@/types';

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
    const [mounted, setMounted] = useState(false);
    const [dataMissing, setDataMissing] = useState(false);
    const navigatingAway = useRef(false);
    const bookingCompleted = useRef(false);
    
    // Payment Method selection
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
    const [methodsLoading, setMethodsLoading] = useState(true);
    const [taxPercentage, setTaxPercentage] = useState<number>(0);

    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [agree, setAgree] = useState(false);
    const [formErrors, setFormErrors] = useState<any>({});

    // KTP Upload State
    const [ktpFile, setKtpFile] = useState<File | null>(null);
    const [ktpPreview, setKtpPreview] = useState<string | null>(null);
    const [ktpLoading, setKtpLoading] = useState(false);
    const ktpInputRef = useRef<HTMLInputElement>(null);
    const ktpMobileInputRef = useRef<HTMLInputElement>(null);

    const handleKtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/heic', 'image/heif'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Format file KTP tidak valid. Gunakan JPG, PNG, atau WebP.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Ukuran file KTP maksimal 5MB.');
            return;
        }
        setKtpLoading(true);
        setKtpFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => {
            setKtpPreview(ev.target?.result as string);
            setKtpLoading(false);
        };
        reader.onerror = () => {
            setKtpLoading(false);
            toast.error('Gagal membaca file KTP. Silakan coba lagi.');
        };
        reader.readAsDataURL(file);
        setFormErrors((prev: any) => ({ ...prev, ktp_image: undefined }));
    };

    const removeKtp = () => {
        setKtpFile(null);
        setKtpPreview(null);
        if (ktpInputRef.current) ktpInputRef.current.value = '';
        if (ktpMobileInputRef.current) ktpMobileInputRef.current.value = '';
    };

    // Mobile Wizard States
    const [currentStep, setCurrentStep] = useState(1);
    const [isPriceDetailOpen, setIsPriceDetailOpen] = useState(false);

    // Layer 4: Hold timer (30 minutes countdown)
    const HOLD_DURATION_SECONDS = 30 * 60; // 30 minutes
    const [secondsLeft, setSecondsLeft] = useState(HOLD_DURATION_SECONDS);
    const [holdExpired, setHoldExpired] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Set mounted on client mount
    useEffect(() => {
        setMounted(true);
    }, []);

    // Reset zustand store when navigating away after successful booking
    useEffect(() => {
        return () => {
            if (bookingCompleted.current) {
                resetStore();
            }
        };
    }, []);

    // Enforce login
    useEffect(() => {
        if (navigatingAway.current) return;
        if (mounted && !authLoading && !user) {
            navigatingAway.current = true;
            toast.error('Silakan masuk (login) terlebih dahulu untuk melanjutkan pembayaran.');
            router.push('/login?redirect=/booking/confirm');
        }
    }, [mounted, user, authLoading, router]);

    // Prefill form states once user loads
    useEffect(() => {
        if (user) {
            setName(prev => prev || user.name || '');
            setEmail(prev => prev || user.email || '');
            setPhone(prev => prev || user.phone || '');
        }
    }, [user]);

    useEffect(() => {
        if (!mounted || navigatingAway.current) return;
        if (!selectedVilla || !checkIn || !checkOut || totalNights <= 0) {
            setDataMissing(true);
        }
    }, [mounted, selectedVilla, checkIn, checkOut, totalNights]);

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

    // Fetch available payment methods
    useEffect(() => {
        const fetchMethods = async () => {
            try {
                const response = await axiosClient.get('/payment-methods');
                setPaymentMethods(response.data);
                if (response.data.length > 0) {
                    setSelectedMethodId(response.data[0].id);
                }
            } catch (err) {
                console.error('Failed to fetch payment methods:', err);
            } finally {
                setMethodsLoading(false);
            }
        };
        fetchMethods();
    }, []);

    // Fetch public settings (tax_percentage)
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axiosClient.get('/settings/public');
                if (response.data.tax_percentage !== undefined) {
                    setTaxPercentage(response.data.tax_percentage);
                }
            } catch (err) {
                console.error('Failed to fetch public settings:', err);
            }
        };
        fetchSettings();
    }, []);

    // Format seconds to MM:SS
    const formatTimer = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const baseTotal = totalAmount;
    const taxAmount = Math.round((taxPercentage / 100) * baseTotal);
    const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId);
    const adminFee = selectedMethod?.admin_fee || 0;
    const finalTotalAmount = methodsLoading ? null : Math.round(baseTotal + taxAmount + adminFee);

    if (dataMissing) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-screen">
                <div className="max-w-md space-y-4">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">Data Pemesanan Tidak Ditemukan</h2>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Sepertinya Anda refresh halaman ini atau data pemesanan telah kedaluwarsa.
                        Silakan pilih villa dan tanggal terlebih dahulu.
                    </p>
                    <div className="flex gap-3 justify-center pt-2">
                        <button
                            onClick={() => router.push('/villas')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all"
                        >
                            Cari Villa
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!mounted || authLoading || !user || !selectedVilla || !checkIn || !checkOut) {
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
        if (!ktpFile) errors.ktp_image = 'Foto KTP wajib diunggah untuk verifikasi identitas.';
        if (!agree) errors.agree = 'Anda harus menyetujui syarat & ketentuan.';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        if (!validateForm()) {
            toast.error('Silakan periksa kembali isian form Anda.');
            return;
        }

        // Layer 4: Check if hold timer has expired
        if (holdExpired) {
            toast.error('Waktu reservasi Anda telah habis. Silakan pilih tanggal kembali.');
            navigatingAway.current = true;
            router.push(`/villas/${selectedVilla.slug}`);
            resetStore();
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

            const payload = new FormData();
            payload.append('villa_id', String(selectedVilla.id));
            if (selectedMethodId) payload.append('payment_method_id', String(selectedMethodId));
            payload.append('guest_name', name);
            payload.append('guest_email', email);
            payload.append('guest_phone', phone);
            payload.append('check_in', checkIn!);
            payload.append('check_out', checkOut!);
            payload.append('num_guests', String(numGuests));
            if (notes) payload.append('notes', notes);
            payload.append('is_refundable', isRefundable ? '1' : '0');
            if (utm_source) payload.append('utm_source', utm_source);
            if (utm_medium) payload.append('utm_medium', utm_medium);
            if (utm_campaign) payload.append('utm_campaign', utm_campaign);
            if (ktpFile) payload.append('ktp_image', ktpFile);

            const response = await axiosClient.post('/bookings', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            // Save email used for checkout in sessionStorage to allow verification access to checking status
            sessionStorage.setItem(`checkout_email_${response.data.booking_code}`, email);

            // BARU: simpan anchor & cache instan, sebelum redirect
            try {
                const code = response.data.booking_code;
                localStorage.setItem('pusatvilla-active-booking', JSON.stringify({
                    code,
                    email: email,
                    createdAt: Date.now(),
                }));
                if (response.data.booking) {
                    localStorage.setItem(`pusatvilla-booking-cache-${code}`, JSON.stringify(response.data.booking));
                }
            } catch (e) {
                console.warn('Gagal menyimpan booking cache:', e);
            }

            toast.success(response.data.message || 'Booking berhasil dibuat.');

            navigatingAway.current = true;
            bookingCompleted.current = true;

            router.push(`/booking/payment?code=${response.data.booking_code}&email=${encodeURIComponent(email)}`);

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

    const mainPhoto = getMainPhoto(selectedVilla);    // Mobile Back Handler
    const handleMobileBack = () => {
        if (currentStep === 1) {
            router.back();
        } else if (currentStep === 2) {
            setCurrentStep(1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (currentStep === 3) {
            setCurrentStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Step 1 validation and navigation
    const handleNextStep1 = () => {
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
        if (!ktpFile) errors.ktp_image = 'Foto KTP wajib diunggah untuk verifikasi identitas.';
        
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            toast.error('Silakan lengkapi detail kontak dan foto KTP Anda terlebih dahulu.');
            return;
        }
        
        setFormErrors({});
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Step 2 validation and navigation
    const handleNextStep2 = () => {
        if (!selectedMethodId) {
            toast.error('Silakan pilih metode pembayaran terlebih dahulu.');
            return;
        }
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 font-sans">
            {/* Desktop Header */}
            <div className="hidden md:block">
                <PublicHeader
                    showBackButton
                    onBackClick={() => router.back()}
                />
            </div>

            {/* Mobile Header */}
            <div className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200/60 px-4 py-4 flex items-center justify-between shadow-xs">
                <button 
                    onClick={handleMobileBack}
                    className="p-2 hover:bg-slate-100 rounded-full transition-all active:scale-90"
                    aria-label="Kembali"
                >
                    <ChevronLeft className="w-5 h-5 text-slate-800" />
                </button>
                <div className="text-center">
                    <h1 className="font-bold text-xs text-slate-900">
                        {currentStep === 1 && "Tinjau Pemesanan"}
                        {currentStep === 2 && "Pilih Pembayaran"}
                        {currentStep === 3 && "Rincian & Konfirmasi"}
                    </h1>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                        Langkah {currentStep} dari 3
                    </p>
                </div>
                <div className="w-9 h-9" />
            </div>

            {/* Main content container with responsive layout and responsive padding/margins */}
            <main className="max-w-6xl mx-auto px-0 md:px-4 sm:px-6 lg:px-8 py-0 md:py-12 w-full flex-1 flex flex-col">
                
                {/* Desktop View */}
                <div className="hidden md:block w-full">
                    {/* Stepper Progress */}
                    <div className="flex items-center flex-wrap gap-y-1.5 space-x-2.5 text-[8px] sm:text-[9px] text-slate-400 font-black uppercase tracking-widest mb-10">
                        <span>1. Pilih Tanggal</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-blue-500">2. Konfirmasi & Bayar</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                        <span>3. Selesai</span>
                    </div>

                    {/* Hold Timer Banner */}
                    <CountdownTimer totalSeconds={HOLD_DURATION_SECONDS} onExpired={() => setHoldExpired(true)} />

                    <div className="grid grid-cols-12 gap-12">
                        {/* Left Column (Checkout Form Groups) */}
                        <div className="lg:col-span-7 space-y-8">
                            <h1 className="font-serif text-2xl md:text-[40px] md:leading-[44px] font-medium text-[#0d0d0d] tracking-tight">Konfirmasikan dan Bayar</h1>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Step 1: Payment Method */}
                                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-md hover:shadow-lg transition-all space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                        <h2 className="font-serif text-lg font-bold text-slate-900">1. Metode Pembayaran</h2>
                                    </div>

                                    {/* Dynamic Payment Methods */}
                                    {methodsLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                        </div>
                                    ) : paymentMethods.length === 0 ? (
                                        <p className="text-xs text-slate-500 text-center py-4">Belum ada metode pembayaran tersedia.</p>
                                    ) : (
                                        <>
                                            {(() => {
                                                const qrisMethods = paymentMethods.filter(m => m.code === 'qris');
                                                const bankMethods = paymentMethods.filter(m => m.code !== 'qris');
                                                const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId);
                                                return (
                                                    <div className="space-y-3">
                                                        {qrisMethods.length > 0 && (
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-wider">QRIS</label>
                                                                <div className="grid grid-cols-1 gap-2">
                                                                    {qrisMethods.map((method) => (
                                                                        <button
                                                                            key={method.id}
                                                                            type="button"
                                                                            onClick={() => setSelectedMethodId(method.id)}
                                                                            className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                                                                selectedMethodId === method.id
                                                                                    ? 'border-blue-500 bg-blue-50/20 ring-1 ring-blue-500/20'
                                                                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                                                            }`}
                                                                        >
                                                                            <div className="flex items-center space-x-3">
                                                                                <div className="w-10 h-7 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-150">
                                                                                    <Smartphone className="w-4 h-4 text-slate-400" />
                                                                                </div>
                                                                                <div>
                                                                                    <span className="font-bold text-slate-900 text-xs block">{method.name}</span>
                                                                                    <span className="text-[10px] text-slate-500">{method.account_name}</span>
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
                                                        )}
                                                        {bankMethods.length > 0 && (
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-wider">Bank Transfer</label>
                                                                <div className="grid grid-cols-1 gap-2">
                                                                    {bankMethods.map((method) => (
                                                                        <button
                                                                            key={method.id}
                                                                            type="button"
                                                                            onClick={() => setSelectedMethodId(method.id)}
                                                                            className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                                                                selectedMethodId === method.id
                                                                                    ? 'border-blue-500 bg-blue-50/20 ring-1 ring-blue-500/20'
                                                                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                                                            }`}
                                                                        >
                                                                            <div className="flex items-center space-x-3">
                                                                                {method.logo_url ? (
                                                                                    <img src={method.logo_url} alt={method.name} className="w-10 h-7 object-contain rounded border border-slate-100 bg-white" />
                                                                                ) : (
                                                                                    <div className="w-10 h-7 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-150">
                                                                                        <Building className="w-4 h-4 text-slate-400" />
                                                                                    </div>
                                                                                )}
                                                                                <div>
                                                                                    <span className="font-bold text-slate-900 text-xs block">{method.name}</span>
                                                                                    <span className="text-[10px] text-slate-500">a.n. {method.account_name}</span>
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
                                                        )}
                                                        {selectedMethod && (
                                                            <div className="mt-3 p-4 bg-blue-50 border border-blue-200/80 rounded-2xl">
                                                                {selectedMethod.code === 'qris' ? (
                                                                    <div className="space-y-2">
                                                                        <p className="text-xs font-bold text-blue-900">Pembayaran via QRIS</p>
                                                                        <p className="text-xs font-semibold text-blue-700 leading-relaxed">
                                                                            Scan kode QR yang akan ditampilkan di halaman pembayaran menggunakan aplikasi e-wallet atau mobile banking.
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-3">
                                                                        <p className="text-xs font-bold text-blue-900">Detail Transfer Bank</p>
                                                                        <div className="space-y-2">
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-xs text-blue-700 font-semibold">Bank:</span>
                                                                                <span className="text-xs font-bold text-blue-900">{selectedMethod.name}</span>
                                                                            </div>
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-xs text-blue-700 font-semibold">No. Rekening:</span>
                                                                                <span className="text-xs font-mono font-bold text-blue-900 bg-white px-2 py-1 rounded border border-blue-200">{selectedMethod.account_number}</span>
                                                                            </div>
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-xs text-blue-700 font-semibold">Atas Nama:</span>
                                                                                <span className="text-xs font-bold text-blue-900">{selectedMethod.account_name}</span>
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-[10px] text-blue-600 mt-2 font-semibold italic">
                                                                            Upload bukti transfer di halaman berikutnya setelah melakukan pembayaran.
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </>
                                    )}
                                </div>

                                {/* Step 2: Guest Details */}
                                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-md hover:shadow-lg transition-all space-y-6">
                                    <h2 className="font-serif text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">2. Detail Tamu</h2>
                                    
                                    <div className="space-y-6">
                                        <div className="relative border-b border-slate-200 focus-within:border-blue-500 transition-colors py-1">
                                            <label className="text-[11px] font-black text-slate-400 block uppercase tracking-widest">Nama Lengkap Sesuai KTP</label>
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
                                                <label className="text-[11px] font-black text-slate-400 block uppercase tracking-widest">Alamat Email</label>
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
                                                <label className="text-[11px] font-black text-slate-400 block uppercase tracking-widest">Nomor WhatsApp</label>
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
                                            <label className="text-[11px] font-black text-slate-400 block uppercase tracking-widest">Catatan Tambahan (Opsional)</label>
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

                                {/* Step 2b: KTP Upload */}
                                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-md hover:shadow-lg transition-all space-y-5">
                                    <div className="border-b border-slate-100 pb-4">
                                        <h2 className="font-serif text-lg font-bold text-slate-900">3. Upload KTP / Identitas</h2>
                                        <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">Diperlukan untuk verifikasi identitas tamu sesuai regulasi penginapan.</p>
                                    </div>

                                    <input
                                        ref={ktpInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleKtpChange}
                                        id="ktp-upload-desktop"
                                        onClick={(e) => { e.currentTarget.value = ''; }}
                                    />

                                    {ktpPreview ? (
                                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 group">
                                            <img
                                                src={ktpPreview}
                                                alt="Preview KTP"
                                                className="w-full h-48 object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                            <button
                                                type="button"
                                                onClick={removeKtp}
                                                className="absolute top-3 right-3 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 cursor-pointer"
                                            >
                                                <X className="w-4 h-4 text-slate-700" />
                                            </button>
                                            <div className="absolute bottom-3 left-3 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                                <Check className="w-3 h-3" />
                                                KTP Terunggah
                                            </div>
                                        </div>
                                    ) : ktpLoading ? (
                                        <div className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-2xl border-blue-200 bg-blue-50/20">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                            <p className="text-xs font-bold text-slate-600">Memproses file KTP...</p>
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor="ktp-upload-desktop"
                                            className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50/30 ${formErrors.ktp_image ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-slate-50/40'}`}
                                        >
                                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                                                <ImagePlus className="w-6 h-6 text-blue-500" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-bold text-slate-700">Klik untuk unggah foto KTP</p>
                                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">JPG, PNG, WebP · Maks. 5MB</p>
                                            </div>
                                        </label>
                                    )}

                                    {formErrors.ktp_image && (
                                        <p className="text-red-500 text-[10px] font-bold flex items-center gap-1">
                                            <X className="w-3 h-3" />{formErrors.ktp_image}
                                        </p>
                                    )}

                                    <div className="bg-blue-50/50 border border-blue-200/60 rounded-2xl p-4 flex items-start space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div className="text-[11px] text-slate-550 font-medium leading-relaxed">
                                            Foto KTP harus jelas dan terbaca. Data KTP hanya digunakan untuk keperluan verifikasi identitas dan tidak akan dibagikan kepada pihak ketiga.
                                        </div>
                                    </div>
                                </div>

                                {/* Step 4: Terms and Agreement */}
                                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-md hover:shadow-lg transition-all space-y-6">
                                    <h2 className="font-serif text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">4. Syarat & Ketentuan</h2>
                                    
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
                                                    <span className="">Konfirmasi dan Bayar</span>
                                                    <ChevronRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Right Column (Summary Card) */}
                        <div className="lg:col-span-5">
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl sticky top-24 space-y-6">
                                <BookingSummaryCard
                                    villa={selectedVilla}
                                    mainPhoto={mainPhoto}
                                />

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

                                <div className="border-t border-slate-100 pt-5 space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-955 uppercase tracking-widest">Perincian Harga</h4>
                                    
                                    <div className="space-y-3 text-xs font-semibold text-slate-550">
                                        {priceBreakdown.weekdays.count > 0 && (
                                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                                                <span className="break-words">{priceBreakdown.weekdays.count} malam x {formatPrice(selectedVilla.price_per_night)} (Weekday)</span>
                                                <span className="text-slate-800 font-bold font-sans whitespace-nowrap">{formatPrice(priceBreakdown.weekdays.total)}</span>
                                            </div>
                                        )}
                                        {priceBreakdown.weekends.count > 0 && (
                                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                                                <span className="break-words">{priceBreakdown.weekends.count} malam x {formatPrice(selectedVilla.weekend_price || selectedVilla.price_per_night)} (Weekend)</span>
                                                <span className="text-slate-800 font-bold font-sans whitespace-nowrap">{formatPrice(priceBreakdown.weekends.total)}</span>
                                            </div>
                                        )}
                                        {isRefundable && (
                                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                                                <span>Pilihan tarif (Bisa dikembalikan +11.1%)</span>
                                                <span className="text-blue-500 font-bold font-sans whitespace-nowrap">+{formatPrice(Math.round((priceBreakdown.weekdays.total + priceBreakdown.weekends.total) * 0.11111))}</span>
                                            </div>
                                        )}
                                        {taxPercentage > 0 && (
                                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 border-t border-slate-50 pt-2.5">
                                                <span>Pajak ({taxPercentage}%)</span>
                                                <span className="text-slate-800 font-bold font-sans whitespace-nowrap">+{formatPrice(taxAmount)}</span>
                                            </div>
                                        )}
                                        {adminFee > 0 && (
                                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 border-t border-slate-50 pt-2.5">
                                                <span>Biaya Admin ({selectedMethod?.name})</span>
                                                <span className="text-slate-800 font-bold font-sans whitespace-nowrap">+{formatPrice(adminFee)}</span>
                                            </div>
                                        )}
                                    </div>
 
                                    <div className="border-t border-slate-150 pt-4 flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-4 font-black text-slate-950 text-sm">
                                        <span>Total Biaya</span>
                                        <span className="text-blue-500 font-sans">{formatPriceOrLoading(finalTotalAmount, methodsLoading)}</span>
                                    </div>
                                </div>

                                <div className="bg-slate-955 text-white rounded-2xl p-4 flex items-center space-x-3 text-xs border border-slate-900 shadow-xs">
                                    <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                    <div>
                                        <span className="font-bold text-black block">Sistem Pembayaran Aman</span>
                                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5 leading-normal">Pembayaran anda akan direview oleh Admin dan akan diproses setelah konfirmasi.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Wizard Layout */}
                <div className="md:hidden w-full flex-1 bg-slate-50 flex flex-col pb-28">
                    {/* Hold Timer Banner */}
                    <div className="px-4 pt-4">
                        <CountdownTimer totalSeconds={HOLD_DURATION_SECONDS} onExpired={() => setHoldExpired(true)} className="mb-0" />
                    </div>

                    <div className="p-4 space-y-4">
                        {currentStep === 1 && (
                            <>
                                {/* Step 1: Tinjau dan Lanjutkan */}
                                <div className="flex gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                                    <div className="w-24 aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                        <img src={mainPhoto} alt={selectedVilla.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col justify-between py-0.5 flex-1 min-w-0">
                                        <div>
                                            <h3 className="font-serif font-bold text-slate-900 text-xs line-clamp-2">{selectedVilla.name}</h3>
                                            <div className="flex items-center text-slate-400 text-[10px] font-bold mt-1.5 uppercase tracking-wider">
                                                <MapPin className="w-3.5 h-3.5 mr-0.5 text-slate-350" />
                                                <span className="truncate">{selectedVilla.location.split(',').pop()?.trim() || selectedVilla.location}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center text-slate-700 text-[10px] font-bold mt-1">
                                            <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-1" />
                                            <span>5.0</span>
                                            <span className="text-slate-455 font-semibold ml-1.5">(Terfavorit)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                                    <h3 className="font-serif font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2.5">
                                        Rincian Perjalanan
                                    </h3>
                                    <div className="space-y-4 text-xs">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-[9px] text-slate-400 block font-black uppercase tracking-widest">Tanggal</span>
                                                <span className="text-slate-800 font-bold">
                                                    {format(parseISO(checkIn), 'dd MMM')} - {format(parseISO(checkOut), 'dd MMM yyyy', { locale: localeID })}
                                                </span>
                                            </div>
                                            <Link href={`/villas/${selectedVilla.slug}`} className="text-xs font-bold text-blue-500 hover:underline">
                                                Ubah
                                            </Link>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                                            <div>
                                                <span className="text-[9px] text-slate-400 block font-black uppercase tracking-widest">Tamu</span>
                                                <span className="text-slate-800 font-bold">{numGuests} Tamu</span>
                                            </div>
                                            <Link href={`/villas/${selectedVilla.slug}`} className="text-xs font-bold text-blue-500 hover:underline">
                                                Ubah
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                                    <h3 className="font-serif font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2.5">
                                        Detail Kontak
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 block uppercase tracking-widest mb-1">Nama Lengkap</label>
                                            <input
                                                type="text"
                                                placeholder="Nama lengkap..."
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${formErrors.name ? 'border-red-400' : 'border-slate-200'}`}
                                            />
                                            {formErrors.name && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.name}</p>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[9px] font-black text-slate-400 block uppercase tracking-widest mb-1">Email</label>
                                                <input
                                                    type="email"
                                                    placeholder="email@contoh.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${formErrors.email ? 'border-red-400' : 'border-slate-200'}`}
                                                />
                                                {formErrors.email && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.email}</p>}
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-slate-400 block uppercase tracking-widest mb-1">WhatsApp</label>
                                                <input
                                                    type="tel"
                                                    placeholder="08xxxxx"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${formErrors.phone ? 'border-red-400' : 'border-slate-200'}`}
                                                />
                                                {formErrors.phone && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.phone}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* KTP Upload (Mobile) */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                                    <div className="border-b border-slate-100 pb-2.5">
                                        <h3 className="font-serif font-bold text-slate-900 text-xs uppercase tracking-wider">
                                            Upload KTP / Identitas
                                        </h3>
                                        <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">Wajib untuk verifikasi identitas tamu.</p>
                                    </div>

                                    <input
                                        ref={ktpMobileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleKtpChange}
                                        id="ktp-upload-mobile"
                                        onClick={(e) => { e.currentTarget.value = ''; }}
                                    />

                                    {ktpLoading ? (
                                        <div className="flex items-center gap-3 p-4 border-2 border-dashed rounded-xl border-blue-200 bg-blue-50/20">
                                            <Loader2 className="w-6 h-6 animate-spin text-blue-500 shrink-0" />
                                            <p className="text-xs font-bold text-slate-600">Memproses...</p>
                                        </div>
                                    ) : ktpPreview ? (
                                        <div className="relative rounded-xl overflow-hidden border border-slate-200">
                                            <img
                                                src={ktpPreview}
                                                alt="Preview KTP"
                                                className="w-full h-36 object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeKtp}
                                                className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 cursor-pointer"
                                            >
                                                <X className="w-3.5 h-3.5 text-slate-700" />
                                            </button>
                                            <div className="absolute bottom-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <Check className="w-2.5 h-2.5" />
                                                Terunggah
                                            </div>
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor="ktp-upload-mobile"
                                            className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${formErrors.ktp_image ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-slate-50/40'}`}
                                        >
                                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <ImagePlus className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">Tap untuk unggah foto KTP</p>
                                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">JPG, PNG, WebP · Maks. 5MB</p>
                                            </div>
                                        </label>
                                    )}

                                    {formErrors.ktp_image && (
                                        <p className="text-red-500 text-[10px] font-bold flex items-center gap-1">
                                            <X className="w-3 h-3" />{formErrors.ktp_image}
                                        </p>
                                    )}

                                    <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-2.5 flex items-start gap-2">
                                        <FileText className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-amber-800 font-semibold leading-relaxed">
                                            Foto KTP hanya digunakan untuk verifikasi identitas dan tidak dibagikan ke pihak ketiga.
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}

                        {currentStep === 2 && (
                            <>
                                {/* Step 2: Pilih Metode Pembayaran */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                                    <h3 className="font-serif font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2.5">
                                        Pilih Metode Pembayaran
                                    </h3>
                                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                                        Pilih salah satu metode pembayaran di bawah. Admin kami akan melakukan verifikasi manual atas transfer Anda.
                                    </p>
                                </div>

                                {methodsLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                    </div>
                                ) : paymentMethods.length === 0 ? (
                                    <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-slate-500 text-xs">
                                        Belum ada metode pembayaran tersedia.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {(() => {
                                            const qrisMethods = paymentMethods.filter(m => m.code === 'qris');
                                            const bankMethods = paymentMethods.filter(m => m.code !== 'qris');
                                            return (
                                                <>
                                                    {qrisMethods.length > 0 && (
                                                        <div className="space-y-2">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">QRIS</span>
                                                            {qrisMethods.map((method) => {
                                                                const isSelected = selectedMethodId === method.id;
                                                                return (
                                                                    <button
                                                                        key={method.id}
                                                                        type="button"
                                                                        onClick={() => setSelectedMethodId(method.id)}
                                                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                                                                            isSelected
                                                                                ? 'border-blue-500 bg-blue-50/20 ring-1 ring-blue-500/20 shadow-xs'
                                                                                : 'border-slate-200 bg-white hover:border-slate-350'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center space-x-3 min-w-0">
                                                                            <div className="w-12 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-150 flex-shrink-0">
                                                                                <Smartphone className="w-5 h-5 text-slate-400" />
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <span className="font-bold text-slate-900 text-xs block">{method.name}</span>
                                                                                <span className="text-[10px] text-slate-500 truncate block">{method.account_name}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all flex-shrink-0 ${
                                                                            isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                                                                        }`}>
                                                                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {bankMethods.length > 0 && (
                                                        <div className="space-y-2">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Transfer Bank</span>
                                                            {bankMethods.map((method) => {
                                                                const isSelected = selectedMethodId === method.id;
                                                                return (
                                                                    <button
                                                                        key={method.id}
                                                                        type="button"
                                                                        onClick={() => setSelectedMethodId(method.id)}
                                                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                                                                            isSelected
                                                                                ? 'border-blue-500 bg-blue-50/20 ring-1 ring-blue-500/20 shadow-xs'
                                                                                : 'border-slate-200 bg-white hover:border-slate-350'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center space-x-3 min-w-0">
                                                                            {method.logo_url ? (
                                                                                <img src={method.logo_url} alt={method.name} className="w-12 h-8 object-contain rounded border border-slate-100 bg-white flex-shrink-0" />
                                                                            ) : (
                                                                                <div className="w-12 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-150 flex-shrink-0">
                                                                                    <Building className="w-5 h-5 text-slate-400" />
                                                                                </div>
                                                                            )}
                                                                            <div className="min-w-0">
                                                                                <span className="font-bold text-slate-900 text-xs block">{method.name}</span>
                                                                                <span className="text-[10px] text-slate-500 truncate block">a.n. {method.account_name}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all flex-shrink-0 ${
                                                                            isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                                                                        }`}>
                                                                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {selectedMethodId && (
                                                        <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-2xl text-xs font-semibold text-slate-605 leading-relaxed shadow-3xs">
                                                            {(() => {
                                                                const method = paymentMethods.find(m => m.id === selectedMethodId);
                                                                if (!method) return null;
                                                                if (method.code === 'qris') {
                                                                    return (
                                                                        <p>
                                                                            <strong>QRIS:</strong> Scan kode QR yang akan ditampilkan di halaman pembayaran menggunakan aplikasi e-wallet atau mobile banking.
                                                                        </p>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <p>
                                                                            <strong>{method.name}:</strong> Transfer ke rekening <span className="font-mono font-bold text-blue-600">{method.account_number}</span> a.n. {method.account_name}. Upload bukti transfer di halaman berikutnya.
                                                                        </p>
                                                                    );
                                                                }
                                                            })()}
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                            </>
                        )}

                        {currentStep === 3 && (
                            <>
                                {/* Step 3: Rincian Harga & Konfirmasi */}
                                {(() => {
                                    const method = paymentMethods.find(m => m.id === selectedMethodId);
                                    if (!method) return null;
                                    return (
                                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                                            <div className="flex items-center space-x-3 min-w-0">
                                                {method.logo_url ? (
                                                    <img src={method.logo_url} alt={method.name} className="w-10 h-7 object-contain rounded border border-slate-100 bg-white flex-shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-7 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-150 flex-shrink-0">
                                                        {method.code === 'qris' ? <Smartphone className="w-4 h-4 text-slate-400" /> : <Building className="w-4 h-4 text-slate-455" />}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <span className="text-[9px] text-slate-400 font-black block uppercase tracking-widest">Metode Pembayaran</span>
                                                    <span className="font-bold text-slate-900 text-xs block truncate">{method.name}</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setCurrentStep(2)}
                                                className="text-xs font-bold text-blue-500 hover:underline flex-shrink-0"
                                            >
                                                Ubah
                                            </button>
                                        </div>
                                    );
                                })()}

                                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                                    <div className="flex items-center space-x-3 min-w-0">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                            {name.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-[9px] text-slate-400 font-black block uppercase tracking-widest">Detail Pemesan</span>
                                            <span className="font-bold text-slate-900 text-xs block truncate">{name}</span>
                                            <span className="text-[10px] text-slate-500 block truncate">{email}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setCurrentStep(1);
                                        }}
                                        className="text-xs font-bold text-blue-500 hover:underline flex-shrink-0"
                                    >
                                        Ubah
                                    </button>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                                    <h3 className="font-serif font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2.5">
                                        Rincian Harga
                                    </h3>
                                    <div className="space-y-3 text-xs font-semibold text-slate-605">
                                        {priceBreakdown.weekdays.count > 0 && (
                                            <div className="flex justify-between items-start gap-4">
                                                <span className="text-left">{priceBreakdown.weekdays.count} malam x {formatPrice(selectedVilla.price_per_night)} (Weekday)</span>
                                                <span className="text-slate-800 font-bold font-sans flex-shrink-0">{formatPrice(priceBreakdown.weekdays.total)}</span>
                                            </div>
                                        )}
                                        {priceBreakdown.weekends.count > 0 && (
                                            <div className="flex justify-between items-start gap-4 border-t border-slate-50 pt-2.5">
                                                <span className="text-left">{priceBreakdown.weekends.count} malam x {formatPrice(selectedVilla.weekend_price || selectedVilla.price_per_night)} (Weekend)</span>
                                                <span className="text-slate-800 font-bold font-sans flex-shrink-0">{formatPrice(priceBreakdown.weekends.total)}</span>
                                            </div>
                                        )}
                                        {isRefundable && (
                                            <div className="flex justify-between items-start gap-4 border-t border-slate-50 pt-2.5">
                                                <span className="text-left">Pilihan tarif (Bisa dikembalikan +11.1%)</span>
                                                <span className="text-blue-500 font-bold font-sans flex-shrink-0">+{formatPrice(Math.round((priceBreakdown.weekdays.total + priceBreakdown.weekends.total) * 0.11111))}</span>
                                            </div>
                                        )}
                                        {taxPercentage > 0 && (
                                            <div className="flex justify-between items-start gap-4 border-t border-slate-50 pt-2.5">
                                                <span className="text-left">Pajak ({taxPercentage}%)</span>
                                                <span className="text-slate-800 font-bold font-sans flex-shrink-0">+{formatPrice(taxAmount)}</span>
                                            </div>
                                        )}
                                        {adminFee > 0 && (
                                            <div className="flex justify-between items-start gap-4 border-t border-slate-50 pt-2.5">
                                                <span className="text-left">Biaya Admin ({selectedMethod?.name})</span>
                                                <span className="text-slate-800 font-bold font-sans flex-shrink-0">+{formatPrice(adminFee)}</span>
                                            </div>
                                        )}
                                        
                                        <div className="border-t border-slate-150 pt-4 flex justify-between items-center font-black text-slate-900 text-sm">
                                            <span>Total Biaya</span>
                                            <span className="text-blue-600 font-sans text-base">{formatPriceOrLoading(finalTotalAmount, methodsLoading)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                                    <label className="flex items-start space-x-3 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={agree}
                                            onChange={(e) => setAgree(e.target.checked)}
                                            className="mt-0.5 rounded border-slate-300 text-blue-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                        />
                                        <span className="text-xs text-slate-550 leading-normal font-semibold text-left">
                                            Saya menyetujui <span className="text-blue-500 font-bold hover:underline">Aturan Menginap</span> properti, termasuk larangan membawa hewan peliharaan, larangan merokok di dalam kamar, dan mematuhi jam tenang setelah pukul 22.00.
                                        </span>
                                    </label>
                                    {formErrors.agree && (
                                        <p className="text-red-500 text-[10px] font-bold text-left">{formErrors.agree}</p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Sticky Bottom Actions */}
                    {currentStep === 1 && (
                        <div className="fixed bottom-0 left-0 right-0 z-45 bg-white border-t border-slate-200/80 px-5 py-4 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.05)] pb-[safe]">
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">Total Biaya</div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-black text-slate-900 font-sans">{formatPriceOrLoading(finalTotalAmount, methodsLoading)}</span>
                                    <button 
                                        onClick={() => setIsPriceDetailOpen(true)}
                                        className="text-[10px] font-bold text-blue-500 hover:underline cursor-pointer"
                                    >
                                        Detail
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={handleNextStep1}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-3.5 rounded-xl transition-all active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                            >
                                <span>Pilih Pembayaran</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="fixed bottom-0 left-0 right-0 z-45 bg-white border-t border-slate-200/80 px-5 py-4 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.05)] pb-[safe]">
                            <button
                                onClick={() => {
                                    setCurrentStep(1);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors py-3 px-1"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span>Kembali</span>
                            </button>
                            <button
                                onClick={handleNextStep2}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-3.5 rounded-xl transition-all active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                            >
                                <span>Rincian Harga</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="fixed bottom-0 left-0 right-0 z-45 bg-white border-t border-slate-200/80 px-5 py-4 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.05)] pb-[safe]">
                            <button
                                onClick={() => {
                                    setCurrentStep(2);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors py-3 px-1"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span>Kembali</span>
                            </button>
                            
                            <button
                                onClick={() => handleSubmit()}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-750 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Memproses...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Konfirmasi & Bayar</span>
                                        <Check className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Price Detail Bottom Sheet */}
            {isPriceDetailOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-end justify-center p-0">
                    <div className="absolute inset-0" onClick={() => setIsPriceDetailOpen(false)} />
                    <div className="relative bg-white rounded-t-3xl p-6 w-full max-w-md shadow-2xl space-y-6 z-10 animate-slideUp">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-serif text-lg font-bold text-slate-900">Perincian Harga</h3>
                            <button 
                                onClick={() => setIsPriceDetailOpen(false)}
                                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        
                        <div className="space-y-4 text-xs font-semibold text-slate-600">
                            {priceBreakdown.weekdays.count > 0 && (
                                <div className="flex justify-between items-start gap-4">
                                    <span className="text-left">{priceBreakdown.weekdays.count} malam x {formatPrice(selectedVilla.price_per_night)} (Weekday)</span>
                                    <span className="text-slate-800 font-bold font-sans flex-shrink-0">{formatPrice(priceBreakdown.weekdays.total)}</span>
                                </div>
                            )}
                            {priceBreakdown.weekends.count > 0 && (
                                <div className="flex justify-between items-start gap-4 border-t border-slate-50 pt-2.5">
                                    <span className="text-left">{priceBreakdown.weekends.count} malam x {formatPrice(selectedVilla.weekend_price || selectedVilla.price_per_night)} (Weekend)</span>
                                    <span className="text-slate-850 font-bold font-sans flex-shrink-0">{formatPrice(priceBreakdown.weekends.total)}</span>
                                </div>
                            )}
                            {isRefundable && (
                                <div className="flex justify-between items-start gap-4 border-t border-slate-50 pt-2.5">
                                    <span className="text-left">Pilihan tarif (Bisa dikembalikan +11.1%)</span>
                                    <span className="text-blue-500 font-bold font-sans flex-shrink-0">+{formatPrice(Math.round((priceBreakdown.weekdays.total + priceBreakdown.weekends.total) * 0.11111))}</span>
                                </div>
                            )}
                            {taxPercentage > 0 && (
                                <div className="flex justify-between items-start gap-4 border-t border-slate-50 pt-2.5">
                                    <span className="text-left">Pajak ({taxPercentage}%)</span>
                                    <span className="text-slate-800 font-bold font-sans flex-shrink-0">+{formatPrice(taxAmount)}</span>
                                </div>
                            )}
                            {adminFee > 0 && (
                                <div className="flex justify-between items-start gap-4 border-t border-slate-50 pt-2.5">
                                    <span className="text-left">Biaya Admin ({selectedMethod?.name})</span>
                                    <span className="text-slate-800 font-bold font-sans flex-shrink-0">+{formatPrice(adminFee)}</span>
                                </div>
                            )}
                            
                            <div className="border-t border-slate-100 pt-4 flex justify-between items-center font-black text-slate-900 text-sm">
                                <span>Total</span>
                                <span className="text-blue-600 font-sans text-base">{formatPriceOrLoading(finalTotalAmount, methodsLoading)}</span>
                            </div>
                        </div>
                        
                        <button
                            onClick={() => setIsPriceDetailOpen(false)}
                            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer text-xs uppercase tracking-wider"
                        >
                            Tutup Detail
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
