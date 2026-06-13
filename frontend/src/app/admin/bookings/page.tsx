'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axiosClient from '@/lib/axios';
import { Booking } from '@/types';
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { 
    Search, 
    SlidersHorizontal, 
    Download, 
    Loader2, 
    ChevronRight,
    ArrowUpDown,
    Eye,
    MessageSquare
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
        
        // Open the streamed CSV download endpoint in a new window with bearer token auth query (we bypass custom headers by using direct link)
        window.open(`${axiosClient.defaults.baseURL}/admin/analytics/export?from=${from}&to=${to}&token=${token}`, '_blank');
        toast.info('Laporan booking sedang diunduh...');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manajemen Pemesanan</h1>
                    <p className="text-slate-500 text-sm mt-1">Kelola status check-in, detail pembayaran, dan riwayat pesanan tamu.</p>
                </div>
                <button
                    onClick={handleExport}
                    className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                    <Download className="w-4 h-4" />
                    <span>Unduh Laporan (CSV)</span>
                </button>
            </div>

            {/* Filter and Search Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2 relative">
                        <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Cari Pesanan</label>
                        <input 
                            type="text" 
                            placeholder="Cari kode booking, nama tamu, atau email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 bottom-3" />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Status Booking</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                        >
                            <option value="">Semua Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
                        >
                            Cari Data
                        </button>
                    </div>
                </form>

                {/* Extended filters drawer panel toggle */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-slate-100 pt-4 text-xs font-semibold">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Status Bayar</label>
                        <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                        >
                            <option value="">Semua Pembayaran</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="paid">Paid</option>
                            <option value="refunded">Refunded</option>
                            <option value="expired">Expired</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Check-in Mulai</label>
                        <input 
                            type="date"
                            value={checkInFrom}
                            onChange={(e) => setCheckInFrom(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Check-in Sampai</label>
                        <input 
                            type="date"
                            value={checkInTo}
                            onChange={(e) => setCheckInTo(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={handleResetFilters}
                            className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer text-center"
                        >
                            Reset Filter
                        </button>
                    </div>
                </div>
            </div>

            {/* Bookings Table card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                    </div>
                ) : bookings.length === 0 ? (
                    <p className="text-slate-400 text-sm py-16 text-center">Tidak ada data pemesanan yang cocok dengan filter aktif.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left text-slate-500 border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                                    <th onClick={() => toggleSort('booking_code')} className="py-3 px-4 cursor-pointer hover:bg-slate-100/50">
                                        <div className="flex items-center space-x-1">
                                            <span>Code</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="py-3 px-4">Villa</th>
                                    <th className="py-3 px-4">Nama Tamu</th>
                                    <th onClick={() => toggleSort('check_in')} className="py-3 px-4 cursor-pointer hover:bg-slate-100/50">
                                        <div className="flex items-center space-x-1">
                                            <span>Check-in</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th onClick={() => toggleSort('check_out')} className="py-3 px-4 cursor-pointer hover:bg-slate-100/50">
                                        <div className="flex items-center space-x-1">
                                            <span>Check-out</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4 text-center">Bayar</th>
                                    <th onClick={() => toggleSort('total_amount')} className="py-3 px-4 cursor-pointer hover:bg-slate-100/50">
                                        <div className="flex items-center space-x-1">
                                            <span>Total</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="py-3 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((b) => (
                                    <tr key={b.id} className="border-b border-slate-150 hover:bg-slate-50/50">
                                        <td className="py-4 px-4 font-bold text-slate-900">{b.booking_code}</td>
                                        <td className="py-4 px-4 font-semibold text-slate-800 truncate max-w-[140px]">{b.villa?.name}</td>
                                        <td className="py-4 px-4">
                                            <p className="font-semibold text-slate-900">{b.guest_name}</p>
                                            <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{b.guest_email}</p>
                                        </td>
                                        <td className="py-4 px-4 font-medium">
                                            {format(parseISO(b.check_in), 'dd MMM yyyy', { locale: localeID })}
                                        </td>
                                        <td className="py-4 px-4 font-medium">
                                            {format(parseISO(b.check_out), 'dd MMM yyyy', { locale: localeID })}
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            {b.status === 'confirmed' && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-green-50 text-green-700 text-[10px] border border-rose-100">
                                                    Confirmed
                                                </span>
                                            )}
                                            {b.status === 'pending' && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 text-[10px] border border-amber-100">
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
                                        <td className="py-4 px-4 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                                                b.payment_status === 'paid' 
                                                    ? 'bg-green-50 text-green-700 border-green-100' 
                                                    : b.payment_status === 'expired' 
                                                        ? 'bg-slate-100 text-slate-500 border-slate-200' 
                                                        : 'bg-red-50 text-red-700 border-red-100'
                                            }`}>
                                                {b.payment_status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 font-extrabold text-slate-900">
                                            Rp {Number(b.total_amount).toLocaleString('id-ID')}
                                        </td>
                                        <td className="py-4 px-4 text-right space-x-2">
                                            <div className="flex items-center justify-end space-x-2">
                                                <a 
                                                    href={`https://wa.me/${b.guest_phone.replace(/^0/, '62')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-lg border border-slate-200 transition-colors"
                                                    title="Hubungi WhatsApp"
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                </a>
                                                <Link 
                                                    href={`/admin/bookings/${b.id}`}
                                                    className="inline-flex bg-rose-600 hover:bg-rose-700 text-white font-bold py-1.5 px-2.5 rounded-lg text-xs items-center space-x-1"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span>Detail</span>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination footer */}
                {totalPages > 1 && !loading && (
                    <div className="flex items-center justify-center space-x-2 py-5 border-t border-slate-200">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                        >
                            Sebelumnya
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                    currentPage === i + 1
                                        ? 'bg-rose-600 text-white'
                                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                        >
                            Selanjutnya
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
