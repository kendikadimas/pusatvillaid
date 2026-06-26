'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosClient from '@/lib/axios';
import { Booking } from '@/types';
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { generateInvoicePDF } from '@/lib/generateInvoicePDF';
import PageHeader from '@/components/ui/PageHeader';
import AuthImage from '@/components/ui/AuthImage';
import { formatPrice } from '@/lib/format';
import { 
    ArrowLeft, 
    Calendar, 
    MapPin, 
    User,
    Phone,
    Mail,
    MessageSquare,
    CreditCard,
    CheckCircle,
    Send,
    Copy,
    Check,
    Loader2,
    FileText,
    ExternalLink,
    X,
    XCircle,
    AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useSettings } from '@/context/SettingsContext';

function AdminBookingDetailContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id') || '';
    const router = useRouter();
    const { settings } = useSettings();
    
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Status update states
    const [status, setStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [updating, setUpdating] = useState(false);
    const [generatingInvoice, setGeneratingInvoice] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [copiedJson, setCopiedJson] = useState(false);

    // Manual payment verification states
    const [approvingPayment, setApprovingPayment] = useState(false);
    const [rejectingPayment, setRejectingPayment] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

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

    const handleSendInvoiceWhatsApp = async () => {
        if (!booking) return;
        
        setGeneratingInvoice(true);
        try {
            // 1. Generate & download the PDF invoice
            const invoiceBooking = {
                booking_code: booking.booking_code,
                guest_name: booking.guest_name,
                guest_email: booking.guest_email,
                guest_phone: booking.guest_phone,
                check_in: booking.check_in,
                check_out: booking.check_out,
                total_nights: booking.total_nights,
                num_guests: booking.num_guests,
                base_price: Number(booking.base_price || 0),
                tax_amount: Number(booking.tax_amount || 0),
                admin_fee: Number(booking.admin_fee || 0),
                total_amount: booking.total_amount,
                payment_status: booking.payment_status,
                villa: booking.villa ? {
                    name: booking.villa.name,
                    location: booking.villa.location,
                    check_in_time: booking.villa.check_in_time,
                    check_out_time: booking.villa.check_out_time,
                } : undefined,
                payment_method: booking.payment ? {
                    name: booking.payment.payment_type?.replace('manual_', '')
                } : null
            };
            await generateInvoicePDF(invoiceBooking, booking.booking_code, settings);
            toast.success('Invoice PDF berhasil diunduh.');

            // 2. Format details
            const guestPhone = booking.guest_phone.replace(/^0/, '62');
            const paymentStatusLabel = booking.payment_status === 'paid' 
                ? 'LUNAS' 
                : booking.payment_status === 'pending' 
                    ? 'MENUNGGU VERIFIKASI' 
                    : 'BELUM BAYAR';
            
            const formattedCheckIn = format(parseISO(booking.check_in), 'dd MMM yyyy', { locale: localeID });
            const formattedCheckOut = format(parseISO(booking.check_out), 'dd MMM yyyy', { locale: localeID });
            const formattedTotalAmount = Number(booking.total_amount).toLocaleString('id-ID');

            // 3. Construct WhatsApp message
            const message = `Halo *${booking.guest_name}*,

Berikut adalah Invoice Pemesanan Anda di *PusatVilla.id*:

• *Kode Booking*: ${booking.booking_code}
• *Villa*: ${booking.villa?.name || 'Villa'}
• *Check-in*: ${formattedCheckIn}
• *Check-out*: ${formattedCheckOut}
• *Durasi*: ${booking.total_nights} Malam
• *Tamu*: ${booking.num_guests} Orang
• *Total Bayar*: Rp ${formattedTotalAmount}
• *Status Pembayaran*: *${paymentStatusLabel}*

Terima kasih telah memesan melalui PusatVilla.id. Silakan periksa file invoice PDF yang terlampir.`;

            // 4. Open WhatsApp
            const waUrl = `https://api.whatsapp.com/send?phone=${guestPhone}&text=${encodeURIComponent(message)}`;
            window.open(waUrl, '_blank');
        } catch (err) {
            console.error('Failed to generate or send invoice:', err);
            toast.error('Gagal memproses pengiriman invoice.');
        } finally {
            setGeneratingInvoice(false);
        }
    };

    const handleApproveManualPayment = async () => {
        setApprovingPayment(true);
        try {
            const response = await axiosClient.post(`/admin/bookings/${id}/approve-manual-payment`);
            setBooking(response.data.booking);
            setStatus('confirmed');
            setPaymentStatus('paid');
            toast.success(response.data.message || 'Pembayaran manual berhasil disetujui.');
            fetchBookingDetails();
        } catch (err: any) {
            console.error('Failed to approve manual payment:', err);
            toast.error(err.response?.data?.message || 'Gagal menyetujui pembayaran.');
        } finally {
            setApprovingPayment(false);
        }
    };

    const handleRejectManualPayment = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Silakan isi alasan penolakan.');
            return;
        }
        setRejectingPayment(true);
        try {
            const response = await axiosClient.post(`/admin/bookings/${id}/reject-manual-payment`, {
                rejection_reason: rejectionReason,
            });
            setBooking(response.data.booking);
            setPaymentStatus('unpaid');
            toast.success(response.data.message || 'Bukti pembayaran ditolak.');
            setShowRejectModal(false);
            setRejectionReason('');
            fetchBookingDetails();
        } catch (err: any) {
            console.error('Failed to reject manual payment:', err);
            toast.error(err.response?.data?.message || 'Gagal menolak pembayaran.');
        } finally {
            setRejectingPayment(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedJson(true);
        toast.success('Response payload berhasil disalin!');
        setTimeout(() => setCopiedJson(false), 2000);
    };

    if (loading) {
        return <LoadingSpinner fullPage={false} message="Memuat rincian booking..." />;
    }

    if (!booking) {
        return (
            <div className="text-center py-24 bg-white rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] max-w-md mx-auto p-8">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <User className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-[#222222] font-bold text-base mb-1">Pemesanan tidak ditemukan</h3>
                <p className="text-[#6a6a6a] text-xs mb-6">Booking ID tidak valid atau data telah dihapus.</p>
                <Link 
                    href="/admin/bookings" 
                    className="inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-5 rounded-[8px] transition-all duration-200 active:scale-95 "
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke pemesanan</span>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div className="flex items-center space-x-3.5">
                    <Link 
                        href="/admin/bookings" 
                        className="group flex items-center justify-center w-10 h-10 rounded-[8px] bg-white border border-[#dddddd] text-[#6a6a6a] hover:text-[#222222] hover:border-[#dddddd]  transition-all duration-200 active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-lg sm:text-2xl font-black text-[#222222] tracking-tight">Pemesanan <span className="font-mono tracking-wider text-blue-600 bg-blue-50/50 border border-blue-100 px-1.5 py-0.5 rounded-[8px] text-base sm:text-lg md:text-xl">{booking.booking_code}</span></h1>
                            <StatusBadge variant={booking.status as any} />
                            <StatusBadge variant={booking.payment_status as any} />
                        </div>
                        <p className="text-[#6a6a6a] text-xs mt-1 font-medium">Dibuat & diperbarui pada {format(parseISO(booking.created_at), 'dd MMM yyyy HH:mm', { locale: localeID })}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
                
                {/* Left side: Detailed content cards (2 columns) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Card 1: Guest Information */}
                    <div className="bg-white rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-6 sm:p-8 transition-all duration-300">
                        <div className="flex items-center space-x-2.5 pb-3 mb-6 border-b border-[#dddddd]">
                            <div className="w-8 h-8 rounded-[8px] bg-blue-50 flex items-center justify-center">
                                <User className="w-4.5 h-4.5 text-blue-600" />
                            </div>
                            <h2 className="text-sm font-bold text-[#222222] uppercase tracking-wide">
                                Informasi tamu & kontak
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                            <div className="space-y-1 bg-slate-50/50 border border-[#dddddd] rounded-[14px] p-4">
                                <span className="text-[10px] text-[#6a6a6a] font-bold block">Nama lengkap tamu</span>
                                <span className="font-extrabold text-[#222222] text-sm">{booking.guest_name}</span>
                            </div>
                            
                            <div className="space-y-1 bg-slate-50/50 border border-[#dddddd] rounded-[14px] p-4">
                                <span className="text-[10px] text-[#6a6a6a] font-bold block">Nomor WhatsApp</span>
                                <a 
                                    href={`https://api.whatsapp.com/send?phone=${booking.guest_phone.replace(/^0/, '62')}&text=${encodeURIComponent(
                                        `Halo ${booking.guest_name}, saya dari Admin PusatVilla.id. Terkait pemesanan Anda dengan kode booking *${booking.booking_code}* di *${booking.villa?.name || 'Villa'}* untuk tanggal *${format(parseISO(booking.check_in), 'dd MMM yyyy', { locale: localeID })}* s/d *${format(parseISO(booking.check_out), 'dd MMM yyyy', { locale: localeID })}*, kami ingin mengonfirmasi detail pemesanan Anda.`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-extrabold text-emerald-600 text-sm hover:text-emerald-700 transition-all active:scale-95 flex items-center space-x-1.5 w-fit group"
                                >
                                    <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600 group-hover:text-emerald-700" />
                                    <span className="tabular-nums">{booking.guest_phone}</span>
                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            </div>

                            <div className="space-y-1 bg-slate-50/50 border border-[#dddddd] rounded-[14px] p-4 sm:col-span-2">
                                <span className="text-[10px] text-[#6a6a6a] font-bold block">Alamat email</span>
                                <a 
                                    href={`mailto:${booking.guest_email}`}
                                    className="font-extrabold text-[#222222] text-sm hover:text-blue-600 transition-colors flex items-center space-x-1 w-fit"
                                >
                                    <Mail className="w-3.5 h-3.5 text-[#6a6a6a]" />
                                    <span>{booking.guest_email}</span>
                                </a>
                            </div>
                        </div>

                        {booking.notes && (
                            <div className="bg-amber-50/30 border border-amber-200/40 rounded-[14px] p-4 mt-6">
                                <div className="flex items-center space-x-1.5 mb-1">
                                    <MessageSquare className="w-4 h-4 text-amber-600" />
                                    <p className="font-bold text-amber-800 text-[10px] uppercase tracking-wider">Catatan tambahan tamu</p>
                                </div>
                                <p className="text-xs text-amber-900/80 italic font-medium leading-relaxed">"{booking.notes}"</p>
                            </div>
                        )}
                    </div>

                    {/* Card 1.5: KTP / Identitas Tamu */}
                    <div className="bg-white rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-6 sm:p-8 transition-all duration-300">
                        <div className="flex items-center space-x-2.5 pb-3 mb-6 border-b border-[#dddddd]">
                            <div className="w-8 h-8 rounded-[8px] bg-violet-50 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-violet-600" />
                            </div>
                            <h2 className="text-sm font-bold text-[#222222] uppercase tracking-wide">
                                KTP / Identitas Tamu
                            </h2>
                        </div>

                        {booking.ktp_image ? (
                            <div className="space-y-4">
                                <div className="relative border border-[#dddddd] rounded-[14px] overflow-hidden bg-slate-100 flex justify-center items-center h-48 sm:h-64">
                                    <AuthImage
                                        src={`/bookings/${booking.booking_code}/ktp`}
                                        alt="KTP Tamu"
                                        className="max-h-full max-w-full object-contain"
                                    />
                                </div>
                                <div className="bg-violet-50 border border-violet-200/60 rounded-[10px] p-3 text-[10px] text-violet-800 font-semibold leading-relaxed">
                                    KTP diunggah oleh tamu saat booking. Verifikasi kesesuaian nama di KTP dengan nama pemesan.
                                </div>
                            </div>
                        ) : (
                            <div className="bg-amber-50 border border-amber-200/60 rounded-[14px] p-4 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-amber-800">KTP tidak diunggah</p>
                                    <p className="text-[10px] text-amber-700 mt-0.5 leading-relaxed">Tamu tidak mengunggah foto KTP pada saat melakukan pemesanan.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Card 2: Rental Information */}
                    <div className="bg-white rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-6 sm:p-8 transition-all duration-300">
                        <div className="flex items-center space-x-2.5 pb-3 mb-6 border-b border-[#dddddd]">
                            <div className="w-8 h-8 rounded-[8px] bg-blue-50 flex items-center justify-center">
                                <Calendar className="w-4.5 h-4.5 text-blue-600" />
                            </div>
                            <h2 className="text-sm font-bold text-[#222222] uppercase tracking-wide">
                                Rincian sewa villa
                            </h2>
                        </div>

                        <div className="bg-slate-50/40 border border-[#dddddd] rounded-[14px] p-5 mb-6">
                            <h3 className="font-black text-[#222222] text-base">{booking.villa?.name}</h3>
                            <div className="flex items-center text-[#6a6a6a] text-xs mt-1.5 font-medium">
                                <MapPin className="w-3.5 h-3.5 mr-1 text-[#6a6a6a]" />
                                <span>{booking.villa?.location}</span>
                            </div>
                        </div>

                        {/* Visual Ticket pass for Check-in / Check-out */}
                        <div className="border border-[#dddddd] rounded-[14px] overflow-hidden mb-6">
                            <div className="grid grid-cols-2 divide-x divide-[#dddddd] bg-white">
                                <div className="p-4 sm:p-5">
                                    <span className="text-[10px] text-[#6a6a6a] font-extrabold block mb-1">Check-in</span>
                                    <span className="font-extrabold text-[#222222] text-xs sm:text-sm">
                                        {format(parseISO(booking.check_in), 'EEEE, dd MMMM yyyy', { locale: localeID })}
                                    </span>
                                </div>
                                <div className="p-4 sm:p-5">
                                    <span className="text-[10px] text-[#6a6a6a] font-extrabold block mb-1">Check-out</span>
                                    <span className="font-extrabold text-[#222222] text-xs sm:text-sm">
                                        {format(parseISO(booking.check_out), 'EEEE, dd MMMM yyyy', { locale: localeID })}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-slate-50 border-t border-[#dddddd] px-5 py-3.5 flex flex-wrap justify-between items-center text-xs gap-3">
                                <div className="flex items-center space-x-1 text-[#6a6a6a] font-semibold">
                                    <span>Durasi menginap:</span>
                                    <span className="text-[#222222] font-bold bg-white px-2 py-0.5 rounded-[8px] border border-[#dddddd]">{booking.total_nights} malam</span>
                                </div>
                                <div className="flex items-center space-x-1 text-[#6a6a6a] font-semibold">
                                    <span>Jumlah tamu:</span>
                                    <span className="text-[#222222] font-bold bg-white px-2 py-0.5 rounded-[8px] border border-[#dddddd]">{booking.num_guests} orang</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2.5: Bukti Pembayaran Manual */}
                    {booking.payment?.payment_proof && (
                        <div className="bg-white rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-6 sm:p-8 transition-all duration-300">
                            <div className="flex items-center space-x-2.5 pb-3 mb-6 border-b border-[#dddddd]">
                                <div className="w-8 h-8 rounded-[8px] bg-blue-50 flex items-center justify-center">
                                    <FileText className="w-4.5 h-4.5 text-blue-600" />
                                </div>
                                <h2 className="text-sm font-bold text-[#222222] uppercase tracking-wide">
                                    Bukti Pembayaran Transfer Manual
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-50 border border-[#dddddd] rounded-[14px] p-4 text-xs space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-[#6a6a6a] font-medium">Metode Pembayaran:</span>
                                        <span className="font-bold text-[#222222] uppercase">{booking.payment.payment_type?.replace('manual_', '') || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#6a6a6a] font-medium">Jumlah Tagihan:</span>
                                        <span className="font-bold text-blue-600 text-xs">{formatPrice(booking.payment.amount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#6a6a6a] font-medium">Status Pembayaran:</span>
                                        <span className="font-bold text-[#222222]">
                                            {booking.payment_status === 'paid'
                                                ? 'Lunas (Paid)'
                                                : booking.payment?.status === 'failed'
                                                    ? 'Ditolak (Rejected)'
                                                    : 'Menunggu Konfirmasi (Pending)'}
                                        </span>
                                    </div>
                                </div>

                                {/* Previous rejection note */}
                                {booking.payment?.status === 'failed' && booking.payment?.rejection_reason && (
                                    <div className="bg-red-50 border border-red-200 rounded-[14px] p-4">
                                        <div className="flex items-center space-x-1.5 mb-1">
                                            <AlertTriangle className="w-4 h-4 text-red-600" />
                                            <p className="font-bold text-red-800 text-[10px] uppercase tracking-wider">Bukti sebelumnya ditolak</p>
                                        </div>
                                        <p className="text-xs text-red-900/80 font-medium leading-relaxed">{booking.payment.rejection_reason}</p>
                                        <p className="text-[10px] text-red-500 mt-1.5">Menunggu tamu mengunggah ulang bukti transfer yang baru.</p>
                                    </div>
                                )}

                                <div className="relative border border-[#dddddd] rounded-[14px] overflow-hidden bg-slate-100 flex justify-center items-center h-48 sm:h-64 md:h-80">
                                    <AuthImage
                                        src={`/bookings/${booking.booking_code}/payment-proof`}
                                        alt="Bukti Transfer"
                                        className="max-h-full max-w-full object-contain"
                                    />
                                </div>

                                {booking.payment_status !== 'paid' && (
                                    <div className="bg-blue-50/50 border border-blue-100 rounded-[14px] p-4 space-y-3">
                                        <div>
                                            <p className="text-xs font-bold text-[#222222]">Verifikasi pembayaran manual</p>
                                            <p className="text-[10px] text-[#6a6a6a] mt-0.5">Cek mutasi rekening Anda terlebih dahulu. Setujui jika dana sudah masuk, atau tolak dengan alasan agar tamu dapat mengunggah ulang.</p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2.5">
                                            <button
                                                type="button"
                                                onClick={handleApproveManualPayment}
                                                disabled={approvingPayment || rejectingPayment}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-[8px] transition-all cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
                                            >
                                                {approvingPayment ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Check className="w-3.5 h-3.5" />
                                                )}
                                                <span>Setujui Pembayaran</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowRejectModal(true)}
                                                disabled={approvingPayment || rejectingPayment}
                                                className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 font-bold text-xs px-4 py-2.5 rounded-[8px] transition-all cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
                                            >
                                                <XCircle className="w-3.5 h-3.5" />
                                                <span>Tolak Bukti</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Card 3: Midtrans Audit Logs — ARCHIVED (Midtrans belum diaktifkan) */}
                </div>

                {/* Right side: Widgets & Actions (1 column) */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-6 transition-all duration-300">
                        <div className="pb-3 mb-4 border-b border-[#dddddd]">
                            <h3 className="font-bold text-[#222222] text-sm uppercase tracking-wide">
                                Pembaruan status
                            </h3>
                        </div>
                        
                        <form onSubmit={handleUpdateStatus} className="space-y-5">
                            <div>
                                <label className="text-[11px] font-bold text-[#6a6a6a] block mb-1.5">Status booking</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full bg-slate-50/50 border border-[#dddddd] rounded-[8px] px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-[#dddddd] font-semibold cursor-pointer transition-all duration-205"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-[#6a6a6a] block mb-1.5">Status pembayaran</label>
                                <select
                                    value={paymentStatus}
                                    onChange={(e) => setPaymentStatus(e.target.value)}
                                    className="w-full bg-slate-50/50 border border-[#dddddd] rounded-[8px] px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-[#dddddd] font-semibold cursor-pointer transition-all duration-205"
                                >
                                    <option value="unpaid">Unpaid (belum lunas)</option>
                                    <option value="pending">Pending (menunggu verifikasi)</option>
                                    <option value="paid">Paid (lunas)</option>
                                    <option value="refunded">Refunded (dikembalikan)</option>
                                    <option value="expired">Expired (kadaluarsa)</option>
                                </select>
                            </div>

                            {status === 'cancelled' && (
                                <div className="space-y-1.5 animate-in slide-in-from-top duration-200">
                                    <label className="text-[11px] font-bold text-[#6a6a6a] block mb-1.5">Alasan pembatalan *</label>
                                    <textarea
                                        rows={3}
                                        required
                                        placeholder="Berikan keterangan pembatalan..."
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        className="w-full bg-slate-50/50 border border-[#dddddd] rounded-[8px] px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-[#dddddd] font-semibold transition-all duration-200"
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={updating}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-[8px] text-xs   hover: transition-all duration-300 flex items-center justify-center space-x-1.5 disabled:opacity-50 active:scale-[0.98] cursor-pointer"
                            >
                                {updating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Menyimpan perubahan...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Simpan perubahan</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Quick Actions Widget */}
                    <div className="bg-white rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-6 transition-all duration-300">
                        <div className="pb-3 mb-4 border-b border-[#dddddd]">
                            <h3 className="font-bold text-[#222222] text-sm uppercase tracking-wide">
                                Tindakan cepat
                            </h3>
                        </div>
                        
                        <button
                            onClick={() => setShowInvoiceModal(true)}
                            disabled={generatingInvoice}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-[8px] text-xs transition-all duration-300 flex items-center justify-center space-x-1.5 disabled:opacity-50 active:scale-[0.98] cursor-pointer"
                        >
                            <WhatsAppIcon className="w-4 h-4 text-white" />
                            <span>Kirim Invoice ke WhatsApp</span>
                        </button>
                    </div>
                </div>

            </div>

            {/* Reject Manual Payment Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-2.5">
                                <div className="w-9 h-9 rounded-[8px] bg-red-50 flex items-center justify-center">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#222222] text-sm">Tolak Bukti Pembayaran</h3>
                                    <p className="text-[10px] text-[#6a6a6a]">Booking {booking.booking_code}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowRejectModal(false)}
                                className="text-[#6a6a6a] hover:text-[#222222] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs text-[#6a6a6a] mb-3 leading-relaxed">
                            Jelaskan alasan penolakan. Pesan ini akan dikirim ke email tamu agar mereka dapat mengunggah ulang bukti transfer yang benar.
                        </p>

                        <textarea
                            rows={4}
                            autoFocus
                            placeholder="Contoh: Nominal transfer tidak sesuai dengan total tagihan, atau bukti transfer tidak terbaca dengan jelas..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full bg-slate-50/50 border border-[#dddddd] rounded-[8px] px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium transition-all"
                        />

                        <div className="flex gap-2.5 mt-5">
                            <button
                                type="button"
                                onClick={() => setShowRejectModal(false)}
                                disabled={rejectingPayment}
                                className="flex-1 bg-white hover:bg-slate-50 text-[#222222] border border-[#dddddd] font-bold text-xs py-2.5 rounded-[8px] transition-all disabled:opacity-50 cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleRejectManualPayment}
                                disabled={rejectingPayment || !rejectionReason.trim()}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-[8px] transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                            >
                                {rejectingPayment ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <XCircle className="w-3.5 h-3.5" />
                                )}
                                <span>Tolak & Kirim Email</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Invoice Preview Modal */}
            {showInvoiceModal && booking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-lg p-6 my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="flex items-start justify-between mb-4 pb-3 border-b border-[#dddddd] shrink-0">
                            <div className="flex items-center space-x-2.5">
                                <div className="w-9 h-9 rounded-[8px] bg-blue-50 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#222222] text-sm">Pratinjau Invoice Pemesanan</h3>
                                    <p className="text-[10px] text-[#6a6a6a]">Booking {booking.booking_code}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowInvoiceModal(false)}
                                className="text-[#6a6a6a] hover:text-[#222222] transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Invoice visual mockup */}
                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                            {/* Invoice Paper Card */}
                            <div className="border border-[#dddddd] rounded-xl overflow-hidden shadow-xs text-xs">
                                {/* Header */}
                                <div className="bg-blue-600 text-white p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-sm tracking-wide">PusatVilla.id</h4>
                                            <p className="text-[9px] opacity-90">Platform Sewa Villa Premium</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">INVOICE</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-4 space-y-4 bg-slate-50/30">
                                    {/* Info columns */}
                                    <div className="grid grid-cols-2 gap-4 border-b border-dashed border-slate-200 pb-3">
                                        <div>
                                            <span className="text-[9px] text-[#6a6a6a] font-bold block uppercase">Kode Booking</span>
                                            <span className="font-mono font-bold text-[#222222]">{booking.booking_code}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] text-[#6a6a6a] font-bold block uppercase">Status Bayar</span>
                                            <span className={`font-bold ${booking.payment_status === 'paid' ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {booking.payment_status === 'paid' ? 'LUNAS' : booking.payment_status === 'pending' ? 'PENDING' : 'BELUM BAYAR'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Guest & Villa Info */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] border-b border-slate-100 pb-3">
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-[#6a6a6a] font-bold block uppercase">Detail Tamu</span>
                                            <p className="font-bold text-slate-800">{booking.guest_name}</p>
                                            <p className="text-slate-500">{booking.guest_phone}</p>
                                            <p className="text-slate-500 truncate">{booking.guest_email}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-[#6a6a6a] font-bold block uppercase">Detail Villa</span>
                                            <p className="font-bold text-slate-800">{booking.villa?.name}</p>
                                            <p className="text-slate-500">{booking.total_nights} malam ({booking.num_guests} tamu)</p>
                                            <p className="text-slate-500">
                                                {format(parseISO(booking.check_in), 'dd MMM yyyy', { locale: localeID })} s/d {format(parseISO(booking.check_out), 'dd MMM yyyy', { locale: localeID })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Pricing breakdown */}
                                    <div className="space-y-2">
                                        <span className="text-[9px] text-[#6a6a6a] font-bold block uppercase">Rincian Pembayaran</span>
                                        <div className="space-y-1 text-slate-600">
                                            <div className="flex justify-between">
                                                <span>Harga Sewa</span>
                                                <span className="font-mono">Rp {Number(booking.base_price || 0).toLocaleString('id-ID')}</span>
                                            </div>
                                            {Number(booking.tax_amount || 0) > 0 && (
                                                <div className="flex justify-between">
                                                    <span>Pajak</span>
                                                    <span className="font-mono">Rp {Number(booking.tax_amount).toLocaleString('id-ID')}</span>
                                                </div>
                                            )}
                                            {Number(booking.admin_fee || 0) > 0 && (
                                                <div className="flex justify-between">
                                                    <span>Biaya Admin</span>
                                                    <span className="font-mono">Rp {Number(booking.admin_fee).toLocaleString('id-ID')}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-1.5 text-xs">
                                                <span>Total Amount</span>
                                                <span className="font-mono text-blue-600">Rp {Number(booking.total_amount).toLocaleString('id-ID')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* WhatsApp Message Preview */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider">Preview Pesan WhatsApp</label>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed border-l-4 border-l-emerald-500">
                                    {`Halo *${booking.guest_name}*,

Berikut adalah Invoice Pemesanan Anda di *PusatVilla.id*:

• *Kode Booking*: ${booking.booking_code}
• *Villa*: ${booking.villa?.name || 'Villa'}
• *Check-in*: ${format(parseISO(booking.check_in), 'dd MMM yyyy', { locale: localeID })}
• *Check-out*: ${format(parseISO(booking.check_out), 'dd MMM yyyy', { locale: localeID })}
• *Durasi*: ${booking.total_nights} Malam
• *Tamu*: ${booking.num_guests} Orang
• *Total Bayar*: Rp ${Number(booking.total_amount).toLocaleString('id-ID')}
• *Status Pembayaran*: *${booking.payment_status === 'paid' ? 'LUNAS' : booking.payment_status === 'pending' ? 'MENUNGGU VERIFIKASI' : 'BELUM BAYAR'}*

Terima kasih telah memesan melalui PusatVilla.id. Silakan periksa file invoice PDF yang terlampir.`}
                                </div>
                            </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="flex gap-2.5 mt-5 pt-3 border-t border-[#dddddd] shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowInvoiceModal(false)}
                                className="flex-1 bg-white hover:bg-slate-50 text-[#222222] border border-[#dddddd] font-bold text-xs py-2.5 rounded-[8px] transition-all cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    handleSendInvoiceWhatsApp();
                                    setShowInvoiceModal(false);
                                }}
                                disabled={generatingInvoice}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-[8px] transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {generatingInvoice ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                        <span>Mengunduh...</span>
                                    </>
                                ) : (
                                    <>
                                        <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
                                        <span>Unduh & Kirim WA</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminBookingDetailPage() {
    return (
        <Suspense fallback={<LoadingSpinner fullPage={false} message="Memuat rincian booking..." />}>
            <AdminBookingDetailContent />
        </Suspense>
    );
}
