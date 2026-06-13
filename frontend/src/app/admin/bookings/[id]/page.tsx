'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axiosClient from '@/lib/axios';
import { Booking } from '@/types';
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { 
    ArrowLeft, 
    Calendar, 
    MapPin, 
    Loader2, 
    Phone, 
    Mail, 
    User,
    CreditCard,
    CheckCircle,
    Send
} from 'lucide-react';
import { toast } from 'sonner';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function AdminBookingDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Status update states
    const [status, setStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [updating, setUpdating] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);

    const fetchBookingDetails = async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get(`/admin/bookings/${id}`);
            const b = response.data;
            setBooking(b);
            setStatus(b.status);
            setPaymentStatus(b.payment_status);
            setCancelReason(b.cancel_reason || '');
        } catch (err) {
            console.error('Failed to load booking details:', err);
            toast.error('Gagal memuat detail pemesanan.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookingDetails();
    }, [id]);

    const handleUpdateStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (status === 'cancelled' && !cancelReason.trim()) {
            toast.error('Silakan isi alasan pembatalan booking.');
            return;
        }

        setUpdating(true);
        try {
            const response = await axiosClient.patch(`/admin/bookings/${id}/status`, {
                status,
                payment_status: paymentStatus,
                cancel_reason: status === 'cancelled' ? cancelReason : null
            });
            setBooking(response.data.booking);
            toast.success(response.data.message || 'Status booking berhasil diperbarui.');
            fetchBookingDetails();
        } catch (err: any) {
            console.error('Failed to update status:', err);
            toast.error(err.response?.data?.message || 'Gagal memperbarui status booking.');
        } finally {
            setUpdating(false);
        }
    };

    const handleResendEmail = async () => {
        setSendingEmail(true);
        try {
            const response = await axiosClient.post(`/admin/bookings/${id}/resend-email`);
            toast.success(response.data.message || 'Email konfirmasi berhasil dikirim ulang.');
        } catch (err) {
            console.error('Failed to resend email:', err);
            toast.error('Gagal mengirim ulang email konfirmasi.');
        } finally {
            setSendingEmail(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                <p className="text-slate-500 text-sm mb-4">Pemesanan tidak ditemukan.</p>
                <Link href="/admin/bookings" className="text-rose-600 font-bold hover:underline text-sm flex items-center justify-center space-x-1">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Pemesanan</span>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <Link href="/admin/bookings" className="text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Pemesanan {booking.booking_code}</h1>
                    <p className="text-slate-500 text-xs mt-0.5">Mengelola status pemesanan villa tamu secara manual.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left side: Detailed receipts (2 columns) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Guest Information */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <h2 className="text-base font-bold border-b border-slate-100 pb-3 flex items-center space-x-2">
                            <User className="w-4.5 h-4.5 text-rose-600" />
                            <span>Detail Tamu & Kontak</span>
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-0.5">
                                <span className="text-slate-400 block font-semibold">Nama Lengkap Tamu</span>
                                <span className="font-bold text-slate-900 text-sm">{booking.guest_name}</span>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-slate-400 block font-semibold">Nomor WhatsApp</span>
                                <a 
                                    href={`https://wa.me/${booking.guest_phone.replace(/^0/, '62')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-rose-600 text-sm hover:underline flex items-center space-x-1"
                                >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>{booking.guest_phone}</span>
                                </a>
                            </div>
                            <div className="space-y-0.5 sm:col-span-2 mt-2">
                                <span className="text-slate-400 block font-semibold">Alamat Email</span>
                                <a 
                                    href={`mailto:${booking.guest_email}`}
                                    className="font-bold text-slate-800 text-sm hover:underline flex items-center space-x-1"
                                >
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>{booking.guest_email}</span>
                                </a>
                            </div>
                        </div>

                        {booking.notes && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 mt-4">
                                <p className="font-bold text-slate-700 mb-1">Catatan Tambahan Tamu:</p>
                                <p className="italic">"{booking.notes}"</p>
                            </div>
                        )}
                    </div>

                    {/* Booking Details */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <h2 className="text-base font-bold border-b border-slate-100 pb-3 flex items-center space-x-2">
                            <Calendar className="w-4.5 h-4.5 text-rose-600" />
                            <span>Rincian Sewa Villa</span>
                        </h2>

                        <div className="flex gap-4 border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="font-bold text-slate-900">{booking.villa?.name}</h3>
                                <div className="flex items-center text-slate-500 text-xs mt-1">
                                    <MapPin className="w-3.5 h-3.5 mr-0.5 text-slate-400" />
                                    <span>{booking.villa?.location}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-800 border-b border-slate-100 pb-4">
                            <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase block">CHECK-IN</span>
                                <span>{format(parseISO(booking.check_in), 'dd MMMM yyyy', { locale: localeID })}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase block">CHECK-OUT</span>
                                <span>{format(parseISO(booking.check_out), 'dd MMMM yyyy', { locale: localeID })}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                            <div className="flex justify-between">
                                <span>Durasi Menginap:</span>
                                <span className="font-bold text-slate-900">{booking.total_nights} malam</span>
                            </div>
                            <div className="flex justify-between pl-4 border-l border-slate-200">
                                <span>Jumlah Tamu:</span>
                                <span className="font-bold text-slate-900">{booking.num_guests} orang</span>
                            </div>
                        </div>
                    </div>

                    {/* Midtrans Payment Transaction Audit Details */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <h2 className="text-base font-bold border-b border-slate-100 pb-3 flex items-center space-x-2">
                            <CreditCard className="w-4.5 h-4.5 text-rose-600" />
                            <span>Audit Transaksi (Midtrans)</span>
                        </h2>

                        {booking.payment ? (
                            <div className="space-y-4 text-xs">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-0.5">
                                        <span className="text-slate-400 block font-semibold">Order ID</span>
                                        <span className="font-bold text-slate-800">{booking.payment.midtrans_order_id}</span>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-slate-400 block font-semibold">Transaction ID</span>
                                        <span className="font-bold text-slate-800">{booking.payment.midtrans_transaction_id || '-'}</span>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-slate-400 block font-semibold">Tipe Pembayaran</span>
                                        <span className="font-bold text-slate-800 uppercase">{booking.payment.payment_type || '-'}</span>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-slate-400 block font-semibold">Tanggal Bayar</span>
                                        <span className="font-bold text-slate-850">
                                            {booking.payment.paid_at 
                                                ? format(parseISO(booking.payment.paid_at), 'dd MMM yyyy HH:mm:ss') 
                                                : '-'}
                                        </span>
                                    </div>
                                </div>

                                {booking.payment.raw_response && (
                                    <div className="mt-4">
                                        <span className="text-slate-400 block font-semibold mb-1">Payload Response Lengkap</span>
                                        <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[10px] text-slate-600 max-h-48 overflow-y-auto font-mono">
                                            {JSON.stringify(booking.payment.raw_response, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-slate-400 text-xs py-4">Belum ada data pembayaran untuk pemesanan ini.</p>
                        )}
                    </div>
                </div>

                {/* Right side: Status modifier widget (1 column) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3">Update Status</h3>
                        
                        <form onSubmit={handleUpdateStatus} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Status Booking</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Status Pembayaran</label>
                                <select
                                    value={paymentStatus}
                                    onChange={(e) => setPaymentStatus(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                >
                                    <option value="unpaid">Unpaid</option>
                                    <option value="paid">Paid</option>
                                    <option value="refunded">Refunded</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </div>

                            {status === 'cancelled' && (
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Alasan Pembatalan *</label>
                                    <textarea
                                        rows={3}
                                        required
                                        placeholder="Tulis alasan pembatalan untuk tamu..."
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={updating}
                                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                            >
                                {updating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Simpan Perubahan</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Email and notification trigger board */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3">Tindakan Cepat</h3>
                        
                        <button
                            onClick={handleResendEmail}
                            disabled={sendingEmail}
                            className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                        >
                            {sendingEmail ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Mengirim...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    <span>Kirim Ulang Email Konfirmasi</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
