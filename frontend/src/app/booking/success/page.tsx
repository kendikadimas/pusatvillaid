'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import axiosClient from '@/lib/axios';
import { Booking } from '@/types';
import PublicHeader from '@/components/PublicHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatPrice } from '@/lib/format';
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { CheckCircle2, MapPin, Copy, Printer, Home, Check, Download } from 'lucide-react';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
// generateInvoicePDF diimport secara dynamic saat dibutuhkan untuk menghindari
// crash pada mobile browser yang tidak support jsPDF saat module load awal.
import { useSettings } from '@/context/SettingsContext';
import { toast } from 'sonner';
import { useResilientBooking } from '@/hooks/useResilientBooking';

function BookingSuccessContent() {
    const searchParams = useSearchParams();
    const code = searchParams.get('code') || '';
    const { settings } = useSettings();

    const email = typeof window !== 'undefined' ? sessionStorage.getItem(`checkout_email_${code}`) : null;
    const { booking, status, isFromCache, refetch } = useResilientBooking(code, email || undefined);
    const loading = status === 'loading' || status === 'idle';
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (booking?.payment_status === 'paid') {
            try {
                localStorage.removeItem('pusatvilla-active-booking');
            } catch {}
        }
    }, [booking]);

    const handleCopyCode = () => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopied(true);
        toast.success('Kode booking berhasil disalin!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => {
        if (typeof window !== 'undefined') {
            window.print();
        }
    };

    const handleDownloadPDF = async () => {
        if (!booking || !code) return;
        
        try {
            const { generateInvoicePDF } = await import('@/lib/generateInvoicePDF');
            await generateInvoicePDF(booking, code, settings);
            toast.success('Invoice berhasil didownload!');
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            toast.error('Gagal membuat invoice PDF.');
        }
    };

    const handleSendWa = () => {
        if (!booking) return;
        
        const codeText = code || 'VB-XXXX-XXXX';
        const checkInDate = format(parseISO(booking.check_in), 'dd MMMM yyyy', { locale: localeID });
        const checkOutDate = format(parseISO(booking.check_out), 'dd MMMM yyyy', { locale: localeID });
        const totalAmountText = Number(booking.total_amount).toLocaleString('id-ID');
        
        const host = typeof window !== 'undefined' ? window.location.origin : settings.settings_website;
        const invoiceUrl = `${host}/booking/status?code=${codeText}`;

        const message = `*INVOICE PEMESANAN VILLA - ${settings.settings_prop_name.toUpperCase()}*\n` +
            `--------------------------------------------------\n` +
            `Halo *${booking.guest_name}*,\n\n` +
            `Berikut adalah rincian invoice pemesanan Anda:\n\n` +
            `*Kode Booking:* ${codeText}\n` +
            `*Nama Villa:* ${booking.villa?.name || '-'}\n` +
            `*Check-in:* ${checkInDate}\n` +
            `*Check-out:* ${checkOutDate}\n` +
            `*Durasi:* ${booking.total_nights} malam\n` +
            `*Jumlah Tamu:* ${booking.num_guests} orang\n\n` +
            `*Total Terbayar:* Rp ${totalAmountText}\n` +
            `*Status Pembayaran:* Lunas / Sukses\n\n` +
            `Lihat detail status & petunjuk menginap:\n` +
            `${invoiceUrl}\n\n` +
            `Terima kasih telah mempercayai ${settings.settings_prop_name} untuk liburan Anda!`;

        let cleanPhone = booking.guest_phone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '62' + cleanPhone.substring(1);
        }

        const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
        if (typeof window !== 'undefined') {
            window.open(waUrl, '_blank');
        }
    };

    if (loading && !booking) {
        return <LoadingSpinner message="Memuat rincian booking..." />;
    }

    if (!booking && status === 'error') {
        return (
            <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50/30 text-slate-850 min-h-screen items-center justify-center px-4">
                <div className="bg-white border border-slate-200 rounded-[32px] p-8 max-w-sm w-full shadow-lg text-center space-y-4">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <p className="text-slate-655 text-sm font-medium">Gagal memuat rincian booking.</p>
                    <p className="text-xs text-slate-400">Periksa koneksi internet Anda.</p>
                    <button
                        onClick={refetch}
                        className="w-full bg-green-900 hover:bg-green-950 text-white font-bold py-3 rounded-xl shadow-md transition-all text-xs cursor-pointer"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    if (!booking) {
        return <LoadingSpinner message="Memuat rincian booking..." />;
    }

    return (
        <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50/30 text-slate-850 print:bg-white print:text-black">
            {/* Header (hidden on print) */}
            <div className="print:hidden">
                <PublicHeader />
            </div>

            <main className="max-w-xl mx-auto px-4 py-16 w-full flex-1 flex flex-col justify-center animate-in fade-in duration-300">
                <div className="bg-white border border-slate-200/80 rounded-[32px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(30,58,138,0.04)] text-center space-y-6 relative overflow-hidden print:border-0 print:shadow-none print:p-0">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-green-900 print:hidden" />

                    {isFromCache && status === 'error' && (
                        <div className="text-xs text-amber-600 flex items-center justify-center gap-2 bg-amber-50/50 border border-amber-200/60 rounded-xl px-4 py-2">
                            <span>Gagal sinkronisasi — menampilkan data tersimpan.</span>
                            <button onClick={refetch} className="underline font-bold cursor-pointer">Coba lagi</button>
                        </div>
                    )}
                    
                    {/* Success Icon (hidden on print) */}
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl flex items-center justify-center mx-auto border border-emerald-250/50 shadow-sm print:hidden animate-pulse">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>

                    <div>
                        <h1 className="font-serif text-3xl font-normal text-slate-900 tracking-tight">Pembayaran Sukses!</h1>
                        <p className="text-slate-500 text-xs mt-2 print:hidden px-4">
                            Pemesanan Anda telah dikonfirmasi dan jadwal sewa Anda telah aktif.
                        </p>
                    </div>

                    {/* Booking Code Board */}
                    <div className="bg-emerald-55/40 border border-emerald-200/60 rounded-2xl p-5 flex flex-col items-center justify-center relative print:border-slate-300 print:bg-slate-50">
                        <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider mb-1.5">KODE BOOKING</span>
                        <div className="flex items-center space-x-2.5">
                            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">{code || 'VB-XXXX-XXXX'}</span>
                            <button 
                                onClick={handleCopyCode}
                                className="bg-white hover:bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-slate-655 hover:text-slate-800 transition-colors shadow-sm cursor-pointer active:scale-95 print:hidden"
                                title="Salin Kode"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Details Receipt */}
                    {booking && (
                        <div className="border border-slate-200/80 rounded-2xl p-6 text-left space-y-4 text-xs bg-slate-50/30 shadow-inner">
                            <h3 className="font-serif text-base font-normal text-slate-900 border-b border-slate-200/60 pb-3 font-semibold">Detail Rincian</h3>
                            <div className="flex justify-between items-center text-slate-600">
                                <span className="font-medium text-slate-500">Nama Villa:</span>
                                <span className="font-bold text-slate-900 text-right">{booking.villa?.name}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600">
                                <span className="font-medium text-slate-500">Nama Tamu:</span>
                                <span className="font-bold text-slate-900">{booking.guest_name}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600">
                                <span className="font-medium text-slate-500">Email Tamu:</span>
                                <span className="font-semibold text-slate-800">{booking.guest_email}</span>
                            </div>
                            
                            {/* Dates */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-b border-slate-200/80 py-4 text-[11px] font-semibold text-slate-705">
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-400 font-extrabold tracking-wider uppercase">CHECK-IN</span>
                                    <div className="text-slate-900 font-bold">{format(parseISO(booking.check_in), 'dd MMMM yyyy', { locale: localeID })}</div>
                                    <span className="text-[10px] text-slate-500 font-normal">Setelah {booking.villa?.check_in_time.substring(0, 5) || '14:00'} WIB</span>
                                </div>
                                <div className="space-y-1 border-l sm:border-l border-slate-200 sm:pl-4 pl-0">
                                    <span className="text-[9px] text-slate-400 font-extrabold tracking-wider uppercase">CHECK-OUT</span>
                                    <div className="text-slate-900 font-bold">{format(parseISO(booking.check_out), 'dd MMMM yyyy', { locale: localeID })}</div>
                                    <span className="text-[10px] text-slate-500 font-normal">Sebelum {booking.villa?.check_out_time.substring(0, 5) || '12:00'} WIB</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-slate-600">
                                <span className="font-medium text-slate-550">Total Durasi:</span>
                                <span className="font-bold text-slate-800">{booking.total_nights} malam</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600">
                                <span className="font-medium text-slate-555">Jumlah Tamu:</span>
                                <span className="font-bold text-slate-800">{booking.num_guests} orang</span>
                            </div>
                            {((booking.tax_amount && booking.tax_amount > 0) || (booking.admin_fee && booking.admin_fee > 0)) && (
                                <div className="flex justify-between items-center text-slate-600 border-t border-slate-100 pt-2.5">
                                    <span className="font-medium text-slate-500">Harga Sewa:</span>
                                    <span className="font-bold text-slate-800">{formatPrice(booking.base_price)}</span>
                                </div>
                            )}
                            {booking.tax_amount !== undefined && booking.tax_amount > 0 && (
                                <div className="flex justify-between items-center text-slate-600">
                                    <span className="font-medium text-slate-500">Pajak:</span>
                                    <span className="font-bold text-slate-800">{formatPrice(booking.tax_amount)}</span>
                                </div>
                            )}
                            {booking.admin_fee !== undefined && booking.admin_fee > 0 && (
                                <div className="flex justify-between items-center text-slate-600">
                                    <span className="font-medium text-slate-500">Biaya Admin ({booking.payment_method?.name || 'Metode Pembayaran'}):</span>
                                    <span className="font-bold text-slate-800">{formatPrice(booking.admin_fee)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center font-bold text-slate-900 border-t border-slate-200/80 pt-3.5 text-sm">
                                <span>Total Terbayar</span>
                                <span className="text-emerald-700 text-base">{formatPrice(booking.total_amount)}</span>
                            </div>
                        </div>
                    )}

                    {/* Instruction Box */}
                    <div className="bg-slate-50/60 border border-slate-200/60 rounded-2xl p-5 text-xs text-slate-650 text-left space-y-2.5 leading-relaxed shadow-sm print:bg-white print:border-slate-300">
                        <h4 className="font-serif text-sm font-bold text-slate-850">Informasi Penting Check-in:</h4>
                        <ul className="list-disc pl-4 space-y-1.5 text-slate-550">
                            <li>Nota konfirmasi check-in telah kami kirimkan ke email Anda. Cek folder spam jika belum masuk.</li>
                            <li>Tunjukkan halaman ini atau sebutkan <strong>Kode Booking</strong> saat tiba di lokasi villa.</li>
                            <li>Kontak villa kami: +62 812-3456-7890 (<span className="text-green-600 font-semibold">WhatsApp</span>).</li>
                        </ul>
                    </div>

                    {/* CTA buttons (hidden on print) */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-5 border-t border-slate-100 print:hidden">
                        {booking && (
                            <>
                                <button
                                    onClick={handleDownloadPDF}
                                    className="w-full sm:w-auto flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer active:scale-[0.98]"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Download Invoice PDF</span>
                                </button>
                                <button
                                    onClick={handleSendWa}
                                    className="w-full sm:w-auto flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer active:scale-[0.98]"
                                >
                                    <WhatsAppIcon className="w-4 h-4" />
                                    <span>Kirim via WA</span>
                                </button>
                            </>
                        )}
                        <button
                            onClick={handlePrint}
                            className="w-full sm:w-auto flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer active:scale-[0.98]"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Cetak</span>
                        </button>
                        <Link
                            href="/"
                            className="w-full sm:w-auto flex-1 bg-gradient-to-r from-green-900 to-green-955 hover:from-green-955 hover:to-green-900 text-white font-bold py-3.5 rounded-xl shadow-[0_8px_30px_rgba(30,58,138,0.15)] transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer active:scale-[0.98]"
                        >
                            <Home className="w-4 h-4" />
                            <span>Beranda</span>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function BookingSuccessPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <BookingSuccessContent />
        </Suspense>
    );
}
