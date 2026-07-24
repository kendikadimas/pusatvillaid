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
    BookOpen,
    Trash2
} from 'lucide-react';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export default function AdminBookingsPage() {
    const { admin } = useAuth();
    const isSuperAdmin = admin?.role === 'super_admin';

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    
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

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        setDeletingId(confirmDeleteId);
        try {
            await axiosClient.delete(`/admin/bookings/${confirmDeleteId}`);
            toast.success('Booking berhasil dihapus.');
            setBookings(prev => prev.filter(b => b.id !== confirmDeleteId));
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menghapus booking.');
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    const handleExport = async () => {
        const from = checkInFrom || format(new Date().setDate(new Date().getDate() - 30), 'yyyy-MM-dd');
        const to = checkInTo || format(new Date(), 'yyyy-MM-dd');
        const token = localStorage.getItem('admin_token');
        
        try {
            const response = await axiosClient.get('/admin/analytics/export', {
                params: { from, to },
                responseType: 'blob',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `laporan-booking-${from}-ke-${to}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success('Laporan booking berhasil diunduh!');
        } catch (err) {
            console.error('Export failed:', err);
            toast.error('Gagal mengunduh laporan. Silakan coba lagi.');
        }
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
                    className="bg-white border border-[#dddddd] hover:bg-slate-50 active:scale-95 text-[#6a6a6a] font-extrabold p-2.5 sm:px-4 sm:py-2.5 rounded-[8px] hover:border-[#dddddd] transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 shrink-0"
                    title="Unduh laporan (CSV)"
                >
                    <Download className="w-4 h-4 text-[#6a6a6a]" />
                    <span className="hidden sm:inline">Unduh laporan (CSV)</span>
                </button>
            </div>

            {/* Filter and Search Panel */}
            <div className="bg-white border border-[#dddddd] rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-6">
                <div className="flex items-center space-x-2 border-b border-[#dddddd] pb-3 mb-5">
                    <SlidersHorizontal className="w-4 h-4 text-green-500" />
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
                                className="w-full bg-slate-50 border border-[#dddddd] rounded-[8px] pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 font-semibold transition-all"
                            />
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1.5">Status booking</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full bg-slate-50 border border-[#dddddd] rounded-[8px] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 font-semibold transition-all"
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
                            className="w-full bg-green-500 hover:bg-green-650 active:scale-95 text-white font-extrabold text-xs py-2.5 rounded-[8px] transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
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
                            className="w-full bg-slate-50 border border-[#dddddd] rounded-[8px] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 font-semibold transition-all"
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
                            className="w-full bg-slate-50 border border-[#dddddd] rounded-[8px] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 font-semibold transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1.5">Check-in sampai</label>
                        <input 
                            type="date"
                            value={checkInTo}
                            onChange={(e) => setCheckInTo(e.target.value)}
                            className="w-full bg-slate-50 border border-[#dddddd] rounded-[8px] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 font-semibold transition-all"
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
                        <BookOpen className="w-4 h-4 text-green-500" />
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
                                    <th onClick={() => toggleSort('created_at')} className="py-4 px-4 cursor-pointer hover:bg-slate-50/20 transition-colors">
                                        <div className="flex items-center space-x-1 justify-between">
                                            <span>Dibooking</span>
                                            <ArrowUpDown className="w-3 h-3 text-[#6a6a6a]" />
                                        </div>
                                    </th>
                                    <th className="py-4 px-6 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((b) => {
                                    const message = `Halo ${b.guest_name}, saya dari Admin PusatVilla.id. Terkait pemesanan Anda dengan kode booking *${b.booking_code}* di *${b.villa?.name || 'Villa'}* untuk tanggal *${format(parseISO(b.check_in), 'dd MMM yyyy', { locale: localeID })}* s/d *${format(parseISO(b.check_out), 'dd MMM yyyy', { locale: localeID })}*, kami ingin mengonfirmasi detail pemesanan Anda.`;
                                    const waUrl = `https://api.whatsapp.com/send?phone=${b.guest_phone.replace(/^0/, '62')}&text=${encodeURIComponent(message)}`;
                                    return (
                                        <tr key={b.id} className="border-b border-[#dddddd] hover:bg-slate-50/40 transition-colors duration-200">
                                            <td className="py-3.5 px-6 font-mono font-bold text-[#222222] tracking-wider text-[11px]">{b.booking_code}</td>
                                            <td className="py-3.5 px-4 font-bold text-[#222222] truncate max-w-[140px]">{b.villa?.name}</td>
                                            <td className="py-3.5 px-4">
                                                <p className="font-semibold text-[#222222]">{b.guest_name}</p>
                                                <p className="text-[10px] text-[#6a6a6a] mt-0.5 truncate max-w-[140px] font-medium">{b.guest_email}</p>
                                            </td>
                                            <td className="py-3.5 px-4 text-[#222222] font-semibold">
                                                {format(parseISO(b.check_in), 'dd MMM yyyy', { locale: localeID })}
                                            </td>
                                            <td className="py-3.5 px-4 text-[#222222] font-semibold">
                                                {format(parseISO(b.check_out), 'dd MMM yyyy', { locale: localeID })}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <StatusBadge variant={b.status as any} />
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <StatusBadge variant={b.payment_status as any} />
                                            </td>
                                            <td className="py-3.5 px-4 font-black text-[#222222]">
                                                {formatPrice(b.total_amount)}
                                            </td>
                                            <td className="py-3.5 px-4 text-[#222222] font-semibold whitespace-nowrap">
                                                {b.created_at ? format(parseISO(b.created_at), 'dd MMM yyyy HH:mm', { locale: localeID }) : '-'}
                                            </td>
                                            <td className="py-3.5 px-6 text-right">
                                                <div className="flex items-center justify-end space-x-1.5">
                                                    {isSuperAdmin && (
                                                        <button
                                                            onClick={() => setConfirmDeleteId(b.id)}
                                                            disabled={deletingId === b.id}
                                                            className="bg-white hover:bg-red-50 text-red-500 hover:text-red-600 p-2 rounded-[8px] border border-[#dddddd] hover:border-red-200 transition-all duration-250 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
                                                            title="Hapus Booking"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    <a 
                                                        href={waUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="bg-white hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 p-2 rounded-[8px] border border-[#dddddd] hover:border-emerald-200 transition-all duration-250 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                                        title="Hubungi WhatsApp"
                                                        aria-label="Hubungi via WhatsApp"
                                                    >
                                                        <WhatsAppIcon className="w-3.5 h-3.5" />
                                                    </a>
                                                    <Link 
                                                        href={`/admin/bookings/detail?id=${b.id}`}
                                                        className="inline-flex bg-white hover:bg-slate-50 text-[#222222] border border-[#dddddd] font-extrabold p-2 sm:py-2 sm:px-3 rounded-[8px] text-xs items-center space-x-1.5 transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 shrink-0"
                                                        title="Detail Pesanan"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 text-[#6a6a6a]" />
                                                        <span className="hidden sm:inline">Detail</span>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Mobile card view */}
                    <div className="block md:hidden space-y-3 px-6 pb-2">
                        {bookings.map((b) => {
                            const message = `Halo ${b.guest_name}, saya dari Admin PusatVilla.id. Terkait pemesanan Anda dengan kode booking *${b.booking_code}* di *${b.villa?.name || 'Villa'}* untuk tanggal *${format(parseISO(b.check_in), 'dd MMM yyyy', { locale: localeID })}* s/d *${format(parseISO(b.check_out), 'dd MMM yyyy', { locale: localeID })}*, kami ingin mengonfirmasi detail pemesanan Anda.`;
                            const waUrl = `https://api.whatsapp.com/send?phone=${b.guest_phone.replace(/^0/, '62')}&text=${encodeURIComponent(message)}`;
                            return (
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
                                            <span className="text-[#222222] font-semibold">{format(parseISO(b.check_in), 'dd MMM yyyy', { locale: localeID })}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#6a6a6a] font-medium">Check-out</span>
                                            <span className="text-[#222222] font-semibold">{format(parseISO(b.check_out), 'dd MMM yyyy', { locale: localeID })}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[#6a6a6a] font-medium">Pembayaran</span>
                                            <StatusBadge variant={b.payment_status as any} />
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#6a6a6a] font-medium">Total</span>
                                            <span className="font-black text-[#222222]">{formatPrice(b.total_amount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#6a6a6a] font-medium">Dibooking</span>
                                            <span className="text-[#222222] font-semibold">{b.created_at ? format(parseISO(b.created_at), 'dd MMM HH:mm', { locale: localeID }) : '-'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end space-x-1.5 pt-2 border-t border-[#dddddd]">
                                        {isSuperAdmin && (
                                            <button
                                                onClick={() => setConfirmDeleteId(b.id)}
                                                disabled={deletingId === b.id}
                                                className="bg-white hover:bg-red-50 text-red-500 hover:text-red-600 p-2 rounded-[8px] border border-[#dddddd] hover:border-red-200 transition-all duration-250 active:scale-95 cursor-pointer"
                                                title="Hapus Booking"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <a 
                                            href={waUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-white hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 p-2 rounded-[8px] border border-[#dddddd] hover:border-emerald-200 transition-all duration-250 active:scale-95"
                                            title="Hubungi WhatsApp"
                                            aria-label="Hubungi via WhatsApp"
                                        >
                                            <WhatsAppIcon className="w-3.5 h-3.5" />
                                        </a>
                                        <Link 
                                            href={`/admin/bookings/detail?id=${b.id}`}
                                            className="inline-flex bg-white hover:bg-slate-50 text-[#222222] border border-[#dddddd] font-extrabold p-2 sm:py-2 sm:px-3 rounded-[8px] text-xs items-center space-x-1.5 transition-all duration-200 active:scale-95 shrink-0"
                                            title="Detail Pesanan"
                                        >
                                            <Eye className="w-3.5 h-3.5 text-[#6a6a6a]" />
                                            <span className="hidden sm:inline">Detail</span>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    </>
                )}

                {/* Pagination footer */}
                {totalPages > 1 && !loading && (
                    <div className="flex items-center justify-center space-x-1.5 py-5 border-t border-[#dddddd] bg-slate-50/20">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-[8px] border border-[#dddddd] text-xs font-semibold text-[#6a6a6a] hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                        >
                            Sebelumnya
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`px-3 py-1.5 rounded-[8px] text-xs font-extrabold transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
                                    currentPage === i + 1
                                        ? 'bg-green-500 text-white'
                                        : 'border border-[#dddddd] text-[#6a6a6a] hover:bg-slate-50 bg-white'
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 rounded-[8px] border border-[#dddddd] text-xs font-semibold text-[#6a6a6a] hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                        >
                            Selanjutnya
                        </button>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {confirmDeleteId !== null && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="absolute inset-0" onClick={() => setConfirmDeleteId(null)} />
                    <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-5 z-10">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Trash2 className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="font-bold text-[#222222] text-base">Hapus Booking</h3>
                            <p className="text-xs text-[#6a6a6a] mt-2 leading-relaxed">
                                Apakah Anda yakin ingin menghapus booking ini? Tindakan ini tidak dapat dibatalkan.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                disabled={deletingId !== null}
                                className="flex-1 bg-white hover:bg-slate-50 border border-[#dddddd] text-[#6a6a6a] font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deletingId !== null}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {deletingId !== null ? (
                                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menghapus...</>
                                ) : (
                                    'Ya, Hapus'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
