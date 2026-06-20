'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axiosClient from '@/lib/axios';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import BottomNav from '@/components/BottomNav';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getPhotoUrl } from '@/lib/villaUtils';
import { formatPrice } from '@/lib/format';
import { 
    User, 
    Mail, 
    Calendar, 
    CreditCard, 
    LogOut, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    XCircle,
    ChevronRight,
    MapPin,
    ArrowRight,
    Download
} from 'lucide-react';
import { generateInvoicePDF } from '@/lib/generateInvoicePDF';
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { toast } from 'sonner';

interface Booking {
    id: number;
    booking_code: string;
    check_in: string;
    check_out: string;
    total_nights: number;
    num_guests: number;
    total_amount: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    payment_status: 'unpaid' | 'pending' | 'paid' | 'refunded' | 'expired';
    villa: {
        id: number;
        name: string;
        location: string;
        photos: string[];
    };
    payment?: {
        id: number;
        status: string;
        snap_token: string;
    };
}

export default function ProfilePage() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/profile');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            (async () => {
                try {
                    const res = await axiosClient.get('/user/bookings');
                    setBookings(res.data);
                } catch (err) {
                    console.error('Gagal mengambil data booking:', err);
                    toast.error('Gagal memuat riwayat pesanan.');
                } finally {
                    setBookingsLoading(false);
                }
            })();
        }
    }, [user]);

    if (authLoading || !user) {
        return <LoadingSpinner />;
    }

    const handleLogout = async () => {
        try {
            await logout();
            toast.success('Berhasil keluar akun.');
        } catch (e) {
            toast.error('Gagal keluar akun.');
        }
    };

    const getStatusBadge = (status: Booking['status']) => {
        switch (status) {
            case 'completed':
                return <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">Selesai</span>;
            case 'confirmed':
                return <span className="bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">Dikonfirmasi</span>;
            case 'cancelled':
                return <span className="bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">Dibatalkan</span>;
            default:
                return <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">Menunggu</span>;
        }
    };

    const getPaymentStatusBadge = (status: Booking['payment_status']) => {
        switch (status) {
            case 'paid':
                return <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">Lunas</span>;
            case 'pending':
                return <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">Menunggu Verifikasi</span>;
            case 'expired':
                return <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">Kedaluwarsa</span>;
            case 'refunded':
                return <span className="bg-purple-50 text-purple-650 border border-purple-200 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">Refunded</span>;
            default:
                return <span className="bg-rose-50 text-rose-600 border border-rose-200 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">Belum Dibayar</span>;
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 font-sans min-h-screen">
            <PublicHeader />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24 md:pb-12 w-full flex-1">
                {/* Headline */}
                <div className="mb-10">
                    <h1 className="font-serif text-3xl md:text-4xl font-medium text-[#0d0d0d] tracking-tight">
                        Profil Saya
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Kelola akun Anda dan lihat detail reservasi villa Anda.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: User Profile Details Card */}
                    <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
                        <div className="flex items-center space-x-4 pb-6 border-b border-slate-100">
                            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold uppercase shadow-sm">
                                {user.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h2 className="font-serif text-lg font-bold text-slate-900 leading-tight">
                                    {user.name}
                                </h2>
                                <span className="bg-slate-100 text-slate-600 border border-slate-200/50 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mt-1.5 inline-block">
                                    Tamu
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4 text-xs font-semibold text-slate-700">
                            <div className="flex items-center space-x-3">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <div className="overflow-hidden">
                                    <span className="text-[9px] text-slate-400 block font-black uppercase tracking-widest">Email</span>
                                    <span className="text-slate-800 break-all">{user.email}</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <User className="w-4 h-4 text-slate-400" />
                                <div>
                                    <span className="text-[9px] text-slate-400 block font-black uppercase tracking-widest">Nama Lengkap</span>
                                    <span className="text-slate-800">{user.name}</span>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleLogout}
                            className="w-full bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold py-3.5 px-4 rounded-2xl border border-slate-200 hover:border-red-100 transition-all flex items-center justify-center space-x-2 text-xs uppercase tracking-wider cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Keluar Akun</span>
                        </button>
                    </div>

                    {/* Right: Booking History List */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-md">
                            <h3 className="font-serif text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6">
                                Riwayat Reservasi Villa
                            </h3>

                            {bookingsLoading ? (
                                <div className="py-12 flex justify-center">
                                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : bookings.length === 0 ? (
                                <div className="text-center py-12 space-y-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                        <Calendar className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-slate-600 font-bold">Anda belum memiliki riwayat reservasi.</p>
                                        <p className="text-slate-400 text-xs mt-1">Jelajahi berbagai villa mewah dan buat pesanan pertama Anda.</p>
                                    </div>
                                    <button 
                                        onClick={() => router.push('/villas')}
                                        className="py-2.5 px-5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer inline-flex items-center space-x-1.5"
                                    >
                                        <span>Cari Villa Sekarang</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {bookings.map((booking) => {
                                        const mainPhoto = booking.villa.photos?.[0] ? getPhotoUrl(booking.villa.photos[0]) : 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80';
                                        const isUnpaid = booking.payment_status === 'unpaid' && booking.status !== 'cancelled';

                                        return (
                                            <div 
                                                key={booking.id}
                                                className="border border-slate-200/80 rounded-2xl p-5 flex flex-col md:flex-row gap-5 hover:shadow-md transition-shadow bg-slate-50/30"
                                            >
                                                {/* Villa Thumbnail */}
                                                <div 
                                                    className="w-full md:w-40 h-28 rounded-xl bg-cover bg-center shrink-0 border border-slate-100"
                                                    style={{ backgroundImage: `url(${mainPhoto})` }}
                                                />

                                                {/* Booking Details */}
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                                        <div>
                                                            <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
                                                                {booking.villa.name}
                                                            </h4>
                                                            <p className="text-[10px] text-slate-500 flex items-center mt-0.5 font-medium">
                                                                <MapPin className="w-3 h-3 text-slate-400 mr-1 shrink-0" />
                                                                {booking.villa.location}
                                                            </p>
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-bold font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200/80">
                                                            {booking.booking_code}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-y border-slate-100 text-[11px] font-semibold text-slate-700">
                                                        <div>
                                                            <span className="text-[8px] text-slate-400 block font-black uppercase tracking-widest">Check-In</span>
                                                            <span className="text-slate-800">{format(parseISO(booking.check_in), 'dd MMM yyyy')}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[8px] text-slate-400 block font-black uppercase tracking-widest">Check-Out</span>
                                                            <span className="text-slate-800">{format(parseISO(booking.check_out), 'dd MMM yyyy')}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[8px] text-slate-400 block font-black uppercase tracking-widest">Durasi & Tamu</span>
                                                            <span className="text-slate-800">{booking.total_nights} Malam, {booking.num_guests} Tamu</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[8px] text-slate-400 block font-black uppercase tracking-widest">Total Biaya</span>
                                                            <span className="text-blue-600 font-bold">{formatPrice(booking.total_amount)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                                        <div className="flex items-center space-x-2">
                                                            <div>
                                                                <span className="text-[7px] text-slate-400 block font-black uppercase tracking-widest mb-0.5">Status Reservasi</span>
                                                                {getStatusBadge(booking.status)}
                                                            </div>
                                                            <div>
                                                                <span className="text-[7px] text-slate-400 block font-black uppercase tracking-widest mb-0.5">Pembayaran</span>
                                                                {getPaymentStatusBadge(booking.payment_status)}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {booking.payment_status === 'paid' && (
                                                                <button
                                                                    onClick={async () => {
                                                                        try {
                                                                            await generateInvoicePDF(booking, booking.booking_code);
                                                                            toast.success('Invoice berhasil didownload!');
                                                                        } catch (error) {
                                                                            console.error('Failed to generate PDF:', error);
                                                                            toast.error('Gagal membuat invoice PDF.');
                                                                        }
                                                                    }}
                                                                    className="py-2 px-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all cursor-pointer flex items-center space-x-1.5"
                                                                    title="Download Invoice"
                                                                >
                                                                    <Download className="w-3.5 h-3.5" />
                                                                    <span className="hidden sm:inline">Invoice</span>
                                                                </button>
                                                            )}
                                                            {isUnpaid && booking.payment?.snap_token && (
                                                                <button
                                                                    onClick={() => router.push(`/booking/payment?code=${booking.booking_code}&token=${booking.payment?.snap_token}`)}
                                                                    className="py-2 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 active:scale-95 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all cursor-pointer flex items-center space-x-1"
                                                                >
                                                                    <span>Bayar Sekarang</span>
                                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <div className="pb-20 lg:pb-0">
                <PublicFooter />
            </div>
            <BottomNav />
        </div>
    );
}
