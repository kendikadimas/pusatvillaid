'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axiosClient from '@/lib/axios';
import { Booking } from '@/types';
import { format, parseISO } from 'date-fns';
import { 
    Calendar, 
    Home, 
    BookOpen, 
    Star, 
    TrendingUp, 
    Percent, 
    Loader2, 
    MessageSquare, 
    ArrowUpRight,
    CheckCircle2,
    Clock,
    XCircle,
    UserCheck,
    UserMinus
} from 'lucide-react';
import { toast } from 'sonner';

interface Stats {
    checkins_today: number;
    bookings_this_month: number;
    revenue_this_month: number;
    pending_payments: number;
    pending_reviews: number;
    occupancy_rate: number;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
    const [todayCheckIns, setTodayCheckIns] = useState<any[]>([]);
    const [todayCheckOuts, setTodayCheckOuts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await axiosClient.get('/admin/dashboard');
                setStats(response.data.stats);
                setRecentBookings(response.data.recent_bookings || []);
                setTodayCheckIns(response.data.today_checkins || []);
                setTodayCheckOuts(response.data.today_checkouts || []);
            } catch (err) {
                console.error('Failed to load dashboard data:', err);
                toast.error('Gagal memuat ringkasan dashboard.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading || !stats) {
        return (
            <div className="flex justify-center items-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Greeting Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Utama</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Selamat datang kembali! Berikut adalah ikhtisar operasional properti Anda hari ini, {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
                </p>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 flex-shrink-0">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Pendapatan Bulan Ini</span>
                        <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
                            Rp {stats.revenue_this_month.toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Pemesanan Baru (MTD)</span>
                        <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
                            {stats.bookings_this_month} Pesanan
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                        <Percent className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Tingkat Hunian (Occupancy)</span>
                        <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
                            {stats.occupancy_rate}%
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Belum Bayar (Unpaid)</span>
                        <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
                            {stats.pending_payments} Booking
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Action Alerts */}
            {stats.pending_reviews > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                    <div className="flex items-center space-x-3 text-xs font-semibold text-rose-800">
                        <Star className="w-5 h-5 text-rose-500 fill-rose-50" />
                        <span>Ada <strong>{stats.pending_reviews} ulasan tamu baru</strong> yang memerlukan persetujuan moderasi sebelum tampil publik.</span>
                    </div>
                    <Link 
                        href="/admin/reviews"
                        className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center space-x-1 shadow-xs transition-colors"
                    >
                        <span>Moderasi</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            )}

            {/* Split Section: Today Arrivals vs Recent Bookings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left side: Today Arrivals/Departures lists (1 column) */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Check In Today */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center space-x-2 font-bold text-slate-900 border-b border-slate-100 pb-3">
                            <UserCheck className="w-5 h-5 text-rose-500" />
                            <span>Check-in Hari Ini ({todayCheckIns.length})</span>
                        </div>
                        {todayCheckIns.length === 0 ? (
                            <p className="text-slate-400 text-xs py-4 text-center">Tidak ada jadwal kedatangan tamu hari ini.</p>
                        ) : (
                            <div className="space-y-3">
                                {todayCheckIns.map((item) => (
                                    <div key={item.id} className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-xs flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-slate-900">{item.guest_name}</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">{item.villa?.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">Code: {item.booking_code}</p>
                                        </div>
                                        <a 
                                            href={`https://wa.me/${item.guest_phone.replace(/^0/, '62')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 p-2 rounded-xl transition-colors shadow-xs"
                                            title="Chat WhatsApp"
                                        >
                                            <MessageSquare className="w-4 h-4 text-slate-500" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Check Out Today */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center space-x-2 font-bold text-slate-900 border-b border-slate-100 pb-3">
                            <UserMinus className="w-5 h-5 text-red-500" />
                            <span>Check-out Hari Ini ({todayCheckOuts.length})</span>
                        </div>
                        {todayCheckOuts.length === 0 ? (
                            <p className="text-slate-400 text-xs py-4 text-center">Tidak ada jadwal kepulangan tamu hari ini.</p>
                        ) : (
                            <div className="space-y-3">
                                {todayCheckOuts.map((item) => (
                                    <div key={item.id} className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-xs flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-slate-900">{item.guest_name}</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">{item.villa?.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">Code: {item.booking_code}</p>
                                        </div>
                                        <a 
                                            href={`https://wa.me/${item.guest_phone.replace(/^0/, '62')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 p-2 rounded-xl transition-colors shadow-xs"
                                            title="Chat WhatsApp"
                                        >
                                            <MessageSquare className="w-4 h-4 text-slate-500" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right side: 5 Recent Bookings (2 columns) */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6">
                            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                                <Calendar className="w-5 h-5 text-rose-500" />
                                <span>5 Pemesanan Terbaru</span>
                            </h3>
                            <Link href="/admin/bookings" className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline">
                                Lihat Semua
                            </Link>
                        </div>

                        {recentBookings.length === 0 ? (
                            <p className="text-slate-400 text-xs py-12 text-center">Belum ada data pemesanan masuk.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left text-slate-500 border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                                            <th className="py-3 px-2">Code</th>
                                            <th className="py-3 px-2">Villa</th>
                                            <th className="py-3 px-2">Tamu</th>
                                            <th className="py-3 px-2">Check-in</th>
                                            <th className="py-3 px-2">Total</th>
                                            <th className="py-3 px-2 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentBookings.map((b) => (
                                            <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                                <td className="py-3 px-2 font-bold text-slate-800">
                                                    <Link href={`/admin/bookings/${b.id}`} className="hover:underline hover:text-rose-500">
                                                        {b.booking_code}
                                                    </Link>
                                                </td>
                                                <td className="py-3 px-2 text-slate-900 font-semibold truncate max-w-[120px]">{b.villa?.name}</td>
                                                <td className="py-3 px-2 font-medium">{b.guest_name}</td>
                                                <td className="py-3 px-2 font-medium">
                                                    {format(parseISO(b.check_in), 'dd MMM yy')}
                                                </td>
                                                <td className="py-3 px-2 text-slate-950 font-bold">
                                                    Rp {Number(b.total_amount).toLocaleString('id-ID')}
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    {b.status === 'confirmed' && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-green-50 text-green-700 text-[10px] border border-green-100">
                                                            Confirmed
                                                        </span>
                                                    )}
                                                    {b.status === 'pending' && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 text-[10px] border border-amber-100 animate-pulse">
                                                            Pending
                                                        </span>
                                                    )}
                                                    {b.status === 'cancelled' && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-red-50 text-red-700 text-[10px] border border-red-100">
                                                            Cancelled
                                                        </span>
                                                    )}
                                                    {b.status === 'completed' && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 text-[10px] border border-slate-200">
                                                            Completed
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
