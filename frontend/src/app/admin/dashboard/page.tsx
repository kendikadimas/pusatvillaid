'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axiosClient from '@/lib/axios';
import { Booking } from '@/types';
import { format, parseISO } from 'date-fns';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import { formatPrice } from '@/lib/format';
import { 
    Calendar, 
    Home, 
    BookOpen, 
    Star, 
    TrendingUp, 
    Percent, 
    Loader2,
    Clock,
    ArrowUpRight,
    MessageSquare,
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
        return <LoadingSpinner fullPage={false} />;
    }

    return (
        <div className="space-y-8">
            {/* Greeting Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight">
                        Dashboard utama
                    </h1>
                    <p className="text-[#6a6a6a] text-xs sm:text-sm mt-1.5 font-medium">
                        Selamat datang kembali! Berikut adalah ikhtisar operasional properti Anda hari ini, <span className="text-[#222222] font-bold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>.
                    </p>
                </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Stat 1 */}
                <div className="group cursor-pointer bg-white border border-[#dddddd] rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-5 transition-all duration-300 active:scale-[0.98]">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-[14px] bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 transition-transform duration-400 group-hover:scale-110">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[11px] text-slate-500 font-bold block mb-0.5 truncate uppercase tracking-wider">Pendapatan bulan ini</span>
                            <span className="text-xl sm:text-2xl font-black text-[#222222] tracking-tight font-mono tabular-nums">
                                Rp {stats.revenue_this_month.toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stat 2 */}
                <div className="group cursor-pointer bg-white border border-[#dddddd] rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-5 transition-all duration-300 active:scale-[0.98]">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-[14px] bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 transition-transform duration-400 group-hover:scale-110">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[11px] text-slate-500 font-bold block mb-0.5 truncate uppercase tracking-wider">Pemesanan baru (MTD)</span>
                            <span className="text-xl sm:text-2xl font-black text-[#222222] tracking-tight font-mono tabular-nums">
                                {stats.bookings_this_month}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stat 3 */}
                <div className="group cursor-pointer bg-white border border-[#dddddd] rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-5 transition-all duration-300 active:scale-[0.98]">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-[14px] bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0 transition-transform duration-400 group-hover:scale-110">
                            <Percent className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[11px] text-slate-500 font-bold block mb-0.5 truncate uppercase tracking-wider">Tingkat hunian (occupancy)</span>
                            <span className="text-xl sm:text-2xl font-black text-[#222222] tracking-tight font-mono tabular-nums">
                                {stats.occupancy_rate}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stat 4 */}
                <div className="group cursor-pointer bg-white border border-[#dddddd] rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-5 transition-all duration-300 active:scale-[0.98]">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-[14px] bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 transition-transform duration-400 group-hover:scale-110">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[11px] text-slate-500 font-bold block mb-0.5 truncate uppercase tracking-wider">Belum bayar (unpaid)</span>
                            <span className="text-xl sm:text-2xl font-black text-[#222222] tracking-tight font-mono tabular-nums">
                                {stats.pending_payments}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Action Alerts */}
            {stats.pending_reviews > 0 && (
                <div className="bg-white border border-[#dddddd] rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-3 text-xs font-semibold text-[#222222]">
                        <div className="p-2 rounded-[8px] bg-blue-50 text-blue-600">
                            <Star className="w-4 h-4 fill-blue-500" />
                        </div>
                        <span>Ada <strong className="text-blue-600">{stats.pending_reviews} ulasan tamu baru</strong> yang memerlukan persetujuan moderasi sebelum tampil publik.</span>
                    </div>
                    <Link 
                        href="/admin/reviews"
                        className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white text-xs font-bold py-2 px-4 rounded-[8px] flex items-center justify-center space-x-1.5  transition-all duration-200 self-start sm:self-auto"
                    >
                        <span>Moderasi</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            )}

            {/* Split Section: Today Arrivals vs Recent Bookings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left side: Today Arrivals/Departures lists (1 column) */}
                <div className="lg:col-span-1 space-y-5">
                    {/* Check In Today */}
                    <div className="bg-white border border-[#dddddd] rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] transition-all duration-300 overflow-hidden">
                        <div className="px-5 pt-5 pb-0">
                            <div className="flex items-center space-x-2.5 font-bold text-[#222222] border-b border-[#dddddd] pb-3">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-50" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                                </span>
                                <span className="text-sm tracking-tight">Check-in hari ini ({todayCheckIns.length})</span>
                            </div>
                        </div>
                        <div className="p-5 space-y-4">
                            {todayCheckIns.length === 0 ? (
                                <p className="text-[#6a6a6a] text-xs py-6 text-center font-medium">Tidak ada jadwal kedatangan tamu hari ini.</p>
                            ) : (
                                <div className="space-y-2.5">
                                    {todayCheckIns.map((item) => (
                                        <div key={item.id} className="bg-[#f7f7f7]/50 hover:bg-[#f7f7f7] border border-[#dddddd] p-3.5 rounded-[8px] text-xs flex items-center justify-between transition-all duration-200 group">
                                            <div className="min-w-0">
                                                <p className="font-bold text-[#222222] truncate">{item.guest_name}</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold truncate">{item.villa?.name}</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                                                    Kode: <span className="font-mono font-bold text-slate-500 bg-[#f7f7f7] px-1 rounded-[4px]">{item.booking_code}</span>
                                                </p>
                                            </div>
                                            <a 
                                                href={`https://api.whatsapp.com/send?phone=${item.guest_phone.replace(/^0/, '62')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-white hover:bg-blue-50 text-slate-500 hover:text-blue-600 border border-[#dddddd] hover:border-blue-200 p-2.5 rounded-[8px] transition-all duration-200  active:scale-95 flex-shrink-0"
                                                title="Chat WhatsApp"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Check Out Today */}
                    <div className="bg-white border border-[#dddddd] rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] transition-all duration-300 overflow-hidden">
                        <div className="px-5 pt-5 pb-0">
                            <div className="flex items-center space-x-2.5 font-bold text-[#222222] border-b border-[#dddddd] pb-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                <span className="text-sm tracking-tight">Check-out hari ini ({todayCheckOuts.length})</span>
                            </div>
                        </div>
                        <div className="p-5 space-y-4">
                            {todayCheckOuts.length === 0 ? (
                                <p className="text-[#6a6a6a] text-xs py-6 text-center font-medium">Tidak ada jadwal kepulangan tamu hari ini.</p>
                            ) : (
                                <div className="space-y-2.5">
                                    {todayCheckOuts.map((item) => (
                                        <div key={item.id} className="bg-[#f7f7f7]/50 hover:bg-[#f7f7f7] border border-[#dddddd] p-3.5 rounded-[8px] text-xs flex items-center justify-between transition-all duration-200 group">
                                            <div className="min-w-0">
                                                <p className="font-bold text-[#222222] truncate">{item.guest_name}</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold truncate">{item.villa?.name}</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                                                    Kode: <span className="font-mono font-bold text-slate-500 bg-[#f7f7f7] px-1 rounded-[4px]">{item.booking_code}</span>
                                                </p>
                                            </div>
                                            <a 
                                                href={`https://api.whatsapp.com/send?phone=${item.guest_phone.replace(/^0/, '62')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-white hover:bg-blue-50 text-slate-500 hover:text-blue-600 border border-[#dddddd] hover:border-blue-200 p-2.5 rounded-[8px] transition-all duration-200  active:scale-95 flex-shrink-0"
                                                title="Chat WhatsApp"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right side: 5 Recent Bookings (2 columns) */}
                <div className="lg:col-span-2 bg-white border border-[#dddddd] rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] transition-all duration-300 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center justify-between border-b border-[#dddddd] pb-3 mb-5">
                            <h3 className="font-bold text-[#222222] flex items-center space-x-2 text-sm tracking-tight">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                <span>5 pemesanan terbaru</span>
                            </h3>
                            <Link href="/admin/bookings" className="text-xs font-extrabold text-blue-500 hover:text-blue-600 transition-colors active:scale-95 inline-block">
                                Lihat semua
                            </Link>
                        </div>

                        {recentBookings.length === 0 ? (
                            <p className="text-[#6a6a6a] text-xs py-12 text-center font-medium">Belum ada data pemesanan masuk.</p>
                        ) : (
                            <>
                            <div className="hidden md:block overflow-x-auto -mx-6 px-6">
                                <table className="w-full text-xs text-left text-[#6a6a6a] border-collapse">
                                    <thead>
                                    <tr className="border-b border-[#dddddd] bg-[#f7f7f7] text-[#6a6a6a] font-bold text-[11px]">
                                        <th className="py-3 px-2">Kode</th>
                                        <th className="py-3 px-2">Villa</th>
                                        <th className="py-3 px-2">Tamu</th>
                                        <th className="py-3 px-2">Check-in</th>
                                        <th className="py-3 px-2">Total</th>
                                        <th className="py-3 px-2 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentBookings.map((b) => (
                                        <tr key={b.id} className="border-b border-[#dddddd] hover:bg-[#f7f7f7]/30 transition-colors">
                                            <td className="py-3.5 px-2">
                                                <Link href={`/admin/bookings/detail?id=${b.id}`} className="hover:text-blue-500 transition-colors font-mono tracking-wider font-bold text-[11px] text-[#222222]">
                                                    {b.booking_code}
                                                </Link>
                                            </td>
                                            <td className="py-3.5 px-2 text-[#222222] font-bold truncate max-w-[130px]">{b.villa?.name}</td>
                                            <td className="py-3.5 px-2 font-semibold text-[#222222]">{b.guest_name}</td>
                                            <td className="py-3.5 px-2 font-medium font-mono tabular-nums">
                                                {format(parseISO(b.check_in), 'dd MMM yy')}
                                            </td>
                                            <td className="py-3.5 px-2 text-[#222222] font-black font-mono tabular-nums">
                                                Rp {Number(b.total_amount).toLocaleString('id-ID')}
                                            </td>
                                            <td className="py-3.5 px-2 text-right">
                                                <StatusBadge variant={b.status as any} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                            {/* Mobile card view */}
                            <div className="block md:hidden space-y-3">
                                {recentBookings.map((b) => (
                                    <div key={b.id} className="bg-white border border-[#dddddd] rounded-[12px] p-4 space-y-3 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <Link href={`/admin/bookings/detail?id=${b.id}`} className="font-mono tracking-wider font-bold text-[11px] text-blue-600 hover:text-blue-800">
                                                {b.booking_code}
                                            </Link>
                                            <StatusBadge variant={b.status as any} />
                                        </div>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-[#6a6a6a] font-medium">Villa</span>
                                                <span className="font-bold text-[#222222] truncate max-w-[180px]">{b.villa?.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#6a6a6a] font-medium">Tamu</span>
                                                <span className="font-semibold text-[#222222]">{b.guest_name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#6a6a6a] font-medium">Check-in</span>
                                                <span className="font-mono tabular-nums text-[#222222] font-medium">{format(parseISO(b.check_in), 'dd MMM yy')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#6a6a6a] font-medium">Total</span>
                                                <span className="font-mono font-black tabular-nums text-[#222222]">Rp {Number(b.total_amount).toLocaleString('id-ID')}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            </>
                    )}
                    </div>
                </div>
            </div>
        </div>
    );
}
