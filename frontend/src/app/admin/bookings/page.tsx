'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axiosClient from '@/lib/axios';
import { Booking } from '@/types';
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import PageHeader from '@/components/ui/PageHeader';
import { formatPrice } from '@/lib/format';
import { 
    Search, 
    SlidersHorizontal, 
    Download,
    Loader2,
    ChevronRight,
    ArrowUpDown,
    Eye,
    MessageSquare,
    BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Search, Filter & Sort params
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [checkInFrom, setCheckInFrom] = useState('');
    const [checkInTo, setCheckInTo] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const params: any = {
                page: currentPage,
                sort_by: sortBy,
                sort_order: sortOrder,
            };

            if (search.trim()) params.search = search;
            if (status) params.status = status;
            if (paymentStatus) params.payment_status = paymentStatus;
            if (checkInFrom && checkInTo) {
                params.check_in_from = checkInFrom;
                params.check_in_to = checkInTo;
            }

            const response = await axiosClient.get('/admin/bookings', { params });
            setBookings(response.data.data || []);
            setTotalPages(response.data.meta?.last_page || 1);
        } catch (err) {
            console.error('Failed to load bookings list:', err);
            toast.error('Gagal memuat daftar pesanan.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [currentPage, sortBy, sortOrder]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchBookings();
    };

    const handleResetFilters = () => {
        setSearch('');
        setStatus('');
        setPaymentStatus('');
        setCheckInFrom('');
        setCheckInTo('');
        setSortBy('created_at');
        setSortOrder('desc');
        setCurrentPage(1);
        setTimeout(() => fetchBookings(), 0);
    };

    const toggleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
        setCurrentPage(1);
    };

    const handleExport = () => {
        const from = checkInFrom || format(new Date().setDate(new Date().getDate() - 30), 'yyyy-MM-dd');
        const to = checkInTo || format(new Date(), 'yyyy-MM-dd');
        const token = localStorage.getItem('admin_token');
        
        window.open(`${axiosClient.defaults.baseURL}/admin/analytics/export?from=${from}&to=${to}&token=${token}`, '_blank');
        toast.info('Laporan booking sedang diunduh...');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#dddddd] pb-5">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight">Manajemen pemesanan</h1>
                    <p className="text-[#6a6a6a] text-xs sm:text-sm mt-1.5 font-medium">Kelola status check-in, detail pembayaran, dan riwayat pesanan tamu.</p>
                </div>
                <button
                    onClick={handleExport}
                    className="w-full sm:w-auto bg-white border border-[#dddddd] hover:bg-slate-50 active:scale-95 text-[#6a6a6a] font-extrabold py-2.5 px-4 rounded-[8px] hover:border-[#dddddd] transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                    <Download className="w-4 h-4 text-[#6a6a6a]" />
                    <span>Unduh laporan (CSV)</span>
                </button>
            </div>

            {/* Filter and Search Panel */}
            <div className="bg-white border border-[#dddddd] rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-6">
                <div className="flex items-center space-x-2 border-b border-[#dddddd] pb-3 mb-5">
                    <SlidersHorizontal className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-bold text-[#222222] tracking-tight">Filter pencarian</span>
                </div>
                
                <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2 relative">
                        <label className="text-[11px] font-bold text-slate-500 block mb-1.5">Cari pesanan</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Cari kode booking, nama tamu, atau email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-slate-50 border border-[#dddddd] rounded-[8px] pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold transition-all"
                            />
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1.5">Status booking</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full bg-slate-50 border border-[#dddddd] rounded-[8px] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold transition-all"
                        >
                            <option value="">Semua status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="w-full bg-blue-500 hover:bg-blue-650 active:scale-95 text-white font-extrabold text-xs py-2.5 rounded-[8px] transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            Cari data
                        </button>
                    </div>
                </form>

                {/* Extended filters panel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 border-t border-[#dddddd] pt-5 mt-5 text-xs font-semibold">
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1.5">Status bayar</label>
                        <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                            className="w-full bg-slate-50 border border-[#dddddd] rounded-[8px] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold transition-all"
                        >
                            <option value="">Semua pembayaran</option>
                            <option value="unpaid">Belum Bayar</option>
                            <option value="pending">Menunggu Verifikasi</option>
                            <option value="paid">Lunas</option>
                            <option value="refunded">Refund</option>
                            <option value="expired">Kadaluarsa</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1.5">Check-in mulai</label>
                        <input 
                            type="date"
                            value={checkInFrom}
                            onChange={(e) => setCheckInFrom(e.target.value)}
                            className="w-full bg-slate-50 border border-[#dddddd] rounded-[8px] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1.5">Check-in sampai</label>
                        <input 
                            type="date"
                            value={checkInTo}
                            onChange={(e) => setCheckInTo(e.target.value)}
                            className="w-full bg-slate-50 border border-[#dddddd] rounded-[8px] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold transition-all"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={handleResetFilters}
                            className="w-full bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-500 font-extrabold text-xs py-2.5 rounded-[8px] border border-[#dddddd] transition-all duration-200 cursor-pointer text-center"
                        >
                            Reset filter
                        </button>
                    </div>
                </div>
            </div>

            {/* Bookings Table card */}
            <div className="bg-white border border-[#dddddd] rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#dddddd]">
                    <h3 className="font-bold text-[#222222] flex items-center space-x-2 text-sm tracking-tight">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span>Daftar pemesanan</span>
                    </h3>
                </div>
                {loading ? (
                    <LoadingSpinner fullPage={false} />
                ) : bookings.length === 0 ? (
                    <p className="text-[#6a6a6a] text-sm py-16 text-center font-medium">Tidak ada data pemesanan yang cocok dengan filter aktif.</p>
                ) : (
                    <>
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-xs text-left text-[#6a6a6a] border-collapse">
                            <thead>
                                <tr className="bg-[#f7f7f7] border-b border-[#dddddd] text-[#6a6a6a] font-bold text-[11px]">
                                    <th onClick={() => toggleSort('booking_code')} className="py-4 px-6 cursor-pointer hover:bg-slate-50/20 transition-colors w-24">
                                        <div className="flex items-center space-x-1 justify-between">
                                            <span>Kode</span>
                                            <ArrowUpDown className="w-3 h-3 text-[#6a6a6a]" />
                                        </div>
                                    </th>
                                    <th className="py-4 px-4">Villa</th>
                                    <th className="py-4 px-4">Nama tamu</th>
                                    <th onClick={() => toggleSort('check_in')} className="py-4 px-4 cursor-pointer hover:bg-slate-50/20 transition-colors">
                                        <div className="flex items-center space-x-1 justify-between">
                                            <span>Check-in</span>
                                            <ArrowUpDown className="w-3 h-3 text-[#6a6a6a]" />
                                        </div>
                                    </th>
                                    <th onClick={() => toggleSort('check_out')} className="py-4 px-4 cursor-pointer hover:bg-slate-50/20 transition-colors">
                                        <div className="flex items-center space-x-1 justify-between">
                                            <span>Check-out</span>
                                            <ArrowUpDown className="w-3 h-3 text-[#6a6a6a]" />
                                        </div>
                                    </th>
                                    <th className="py-4 px-4 text-center">Status</th>
                                    <th className="py-4 px-4 text-center">Bayar</th>
                                    <th onClick={() => toggleSort('total_amount')} className="py-4 px-4 cursor-pointer hover:bg-slate-50/20 transition-colors">
                                        <div className="flex items-center space-x-1 justify-between">
                                            <span>Total</span>
                                            <ArrowUpDown className="w-3 h-3 text-[#6a6a6a]" />
                                        </div>
                                    </th>
                                    <th className="py-4 px-6 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((b) => (
                                    <tr key={b.id} className="border-b border-[#dddddd] hover:bg-slate-50/40 transition-colors duration-200">
                                        <td className="py-3.5 px-6 font-mono font-bold text-[#222222] tracking-wider text-[11px]">{b.booking_code}</td>
                                        <td className="py-3.5 px-4 font-bold text-[#222222] truncate max-w-[140px]">{b.villa?.name}</td>
                                        <td className="py-3.5 px-4">
                                            <p className="font-semibold text-[#222222]">{b.guest_name}</p>
                                            <p className="text-[10px] text-[#6a6a6a] mt-0.5 truncate max-w-[140px] font-medium">{b.guest_email}</p>
                                        </td>
                                        <td className="py-3.5 px-4 font-mono tabular-nums text-[#222222] font-semibold">
                                            {format(parseISO(b.check_in), 'dd MMM yyyy', { locale: localeID })}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono tabular-nums text-[#222222] font-semibold">
                                            {format(parseISO(b.check_out), 'dd MMM yyyy', { locale: localeID })}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <StatusBadge variant={b.status as any} />
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <StatusBadge variant={b.payment_status as any} />
                                        </td>
                                        <td className="py-3.5 px-4 font-mono font-black tabular-nums text-[#222222]">
                                            Rp {Number(b.total_amount).toLocaleString('id-ID')}
                                        </td>
                                        <td className="py-3.5 px-6 text-right">
                                            <div className="flex items-center justify-end space-x-1.5">
                                                <a 
                                                    href={`https://api.whatsapp.com/send?phone=${b.guest_phone.replace(/^0/, '62')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-white hover:bg-slate-50 text-[#6a6a6a] hover:text-[#222222] p-2 rounded-[8px] border border-[#dddddd] transition-all duration-250 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                                    title="Hubungi WhatsApp"
                                                    aria-label="Hubungi via WhatsApp"
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                </a>
                                                <Link 
                                                    href={`/admin/bookings/detail?id=${b.id}`}
                                                    className="inline-flex bg-white hover:bg-slate-50 text-[#222222] border border-[#dddddd] font-extrabold py-2 px-3 rounded-[8px] text-xs items-center space-x-1.5 transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                                >
                                                    <Eye className="w-3.5 h-3.5 text-[#6a6a6a]" />
                                                    <span>Detail</span>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Mobile card view */}
                    <div className="block md:hidden space-y-3 px-6 pb-2">
                        {bookings.map((b) => (
                            <div key={b.id} className="bg-white border border-[#dddddd] rounded-[12px] p-4 space-y-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono font-bold text-[#222222] tracking-wider text-[11px]">{b.booking_code}</span>
                                    <StatusBadge variant={b.status as any} />
                                </div>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-[#6a6a6a] font-medium">Tamu</span>
                                        <span className="font-semibold text-[#222222]">{b.guest_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#6a6a6a] font-medium">Villa</span>
                                        <span className="font-bold text-[#222222] truncate max-w-[180px]">{b.villa?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#6a6a6a] font-medium">Check-in</span>
                                        <span className="font-mono tabular-nums text-[#222222] font-semibold">{format(parseISO(b.check_in), 'dd MMM yyyy', { locale: localeID })}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#6a6a6a] font-medium">Check-out</span>
                                        <span className="font-mono tabular-nums text-[#222222] font-semibold">{format(parseISO(b.check_out), 'dd MMM yyyy', { locale: localeID })}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#6a6a6a] font-medium">Pembayaran</span>
                                        <StatusBadge variant={b.payment_status as any} />
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#6a6a6a] font-medium">Total</span>
                                        <span className="font-mono font-black tabular-nums text-[#222222]">Rp {Number(b.total_amount).toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end space-x-1.5 pt-2 border-t border-[#dddddd]">
                                    <a 
                                        href={`https://api.whatsapp.com/send?phone=${b.guest_phone.replace(/^0/, '62')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-white hover:bg-slate-50 text-[#6a6a6a] hover:text-[#222222] p-2 rounded-[8px] border border-[#dddddd] transition-all duration-250 active:scale-95"
                                        title="Hubungi WhatsApp"
                                        aria-label="Hubungi via WhatsApp"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                    </a>
                                    <Link 
                                        href={`/admin/bookings/detail?id=${b.id}`}
                                        className="inline-flex bg-white hover:bg-slate-50 text-[#222222] border border-[#dddddd] font-extrabold py-2 px-3 rounded-[8px] text-xs items-center space-x-1.5 transition-all duration-200 active:scale-95"
                                    >
                                        <Eye className="w-3.5 h-3.5 text-[#6a6a6a]" />
                                        <span>Detail</span>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                    </>
                )}

                {/* Pagination footer */}
                {totalPages > 1 && !loading && (
                    <div className="flex items-center justify-center space-x-1.5 py-5 border-t border-[#dddddd] bg-slate-50/20">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-[8px] border border-[#dddddd] text-xs font-semibold text-[#6a6a6a] hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            Sebelumnya
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`px-3 py-1.5 rounded-[8px] text-xs font-extrabold transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                                    currentPage === i + 1
                                        ? 'bg-blue-500 text-white'
                                        : 'border border-[#dddddd] text-[#6a6a6a] hover:bg-slate-50 bg-white'
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 rounded-[8px] border border-[#dddddd] text-xs font-semibold text-[#6a6a6a] hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            Selanjutnya
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
