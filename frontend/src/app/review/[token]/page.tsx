'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axiosClient from '@/lib/axios';
import { Booking } from '@/types';
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { 
    Star, 
    Loader2, 
    ArrowRight, 
    CheckSquare,
    AlertTriangle,
    MapPin,
    Calendar
} from 'lucide-react';
import { toast } from 'sonner';

interface PageProps {
    params: Promise<{ token: string }>;
}

export default function SubmitReviewPage({ params }: PageProps) {
    const { token } = use(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [valid, setValid] = useState(false);
    const [booking, setBooking] = useState<Booking | null>(null);
    
    // Form States
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formErrors, setFormErrors] = useState<any>({});

    useEffect(() => {
        const validateToken = async () => {
            try {
                const response = await axiosClient.get(`/review/${token}`);
                setValid(response.data.valid);
                setBooking(response.data.booking);
            } catch (err: any) {
                console.error('Failed to validate review token:', err);
                setValid(false);
            } finally {
                setLoading(false);
            }
        };

        validateToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        const errors: any = {};
        if (rating === 0) errors.rating = 'Silakan pilih rating bintang Anda.';
        if (!comment.trim()) {
            errors.comment = 'Komentar ulasan wajib diisi.';
        } else if (comment.length < 20) {
            errors.comment = 'Komentar minimal berisi 20 karakter.';
        } else if (comment.length > 500) {
            errors.comment = 'Komentar maksimal berisi 500 karakter.';
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            toast.error('Silakan periksa kembali ulasan Anda.');
            return;
        }

        setSubmitting(true);
        setFormErrors({});

        try {
            const response = await axiosClient.post(`/review/${token}`, {
                rating,
                comment
            });
            toast.success(response.data.message || 'Ulasan berhasil dikirim!');
            setSubmitted(true);
        } catch (err: any) {
            console.error('Submit review failed:', err);
            toast.error(err.response?.data?.message || 'Gagal mengirimkan ulasan.');
            if (err.response?.data?.errors) {
                setFormErrors(err.response.data.errors);
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-64 min-h-screen bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    // Invalid Token Layout
    if (!valid || !booking) {
        return (
            <div className="flex-1 flex flex-col bg-slate-50 text-slate-800">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-150/80 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-2xl font-serif font-black tracking-tight bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
                            PusatVilla.id
                        </span>
                    </Link>
                </div>
            </header>

                <main className="max-w-md mx-auto px-4 py-24 w-full flex-1 flex flex-col justify-center">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
                        <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-8 h-8 text-amber-600" />
                        </div>

                        <div>
                            <h1 className="font-serif text-2xl font-medium text-[#0d0d0d] tracking-tight">Tautan Tidak Valid</h1>
                            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                                Token ulasan ini tidak valid, sudah pernah digunakan untuk mengirim ulasan, atau telah kadaluarsa melewati batas 30 hari pasca check-out.
                            </p>
                        </div>

                        <Link
                            href="/"
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold py-3 rounded-xl shadow-lg transition-transform flex items-center justify-center space-x-2 text-sm"
                        >
                            <span>Kembali ke Beranda</span>
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    const mainPhoto = booking.villa?.photos && booking.villa.photos.length > 0 
        ? booking.villa.photos[0] 
        : 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80';

    return (
        <div className="flex-1 flex flex-col bg-slate-50 text-slate-800">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-150/80 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-2xl font-serif font-black tracking-tight bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
                            PusatVilla.id
                        </span>
                    </Link>
                </div>
            </header>

            <main className="max-w-md mx-auto px-4 py-16 w-full flex-1 flex flex-col justify-center">
                {submitted ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                            <CheckSquare className="w-8 h-8 text-emerald-600" />
                        </div>

                        <div>
                            <h1 className="font-serif text-2xl font-medium text-[#0d0d0d] tracking-tight">Terima Kasih!</h1>
                            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                                Ulasan Anda telah berhasil disimpan dan akan segera diverifikasi oleh admin sebelum ditampilkan secara publik.
                            </p>
                        </div>

                        <Link
                            href="/"
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold py-3 rounded-xl shadow-lg transition-transform flex items-center justify-center space-x-2 text-sm"
                        >
                            <span>Kembali ke Beranda</span>
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
                        <div>
                            <h1 className="font-serif text-2xl font-medium text-[#0d0d0d] tracking-tight">Berikan Ulasan Anda</h1>
                            <p className="text-slate-505 text-xs mt-1.5 font-semibold uppercase tracking-wider">
                                Bagikan pengalaman menginap Anda di <span className="font-bold text-slate-700">{booking.villa?.name}</span>.
                            </p>
                        </div>

                        {/* Villa details card summary */}
                        <div className="flex space-x-3 bg-slate-50 rounded-xl p-3 border border-slate-200 text-left">
                            <div className="w-16 aspect-video rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                <img src={mainPhoto} alt={booking.villa?.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="text-xs">
                                <h4 className="font-bold text-slate-900 line-clamp-1">{booking.villa?.name}</h4>
                                <div className="flex items-center text-slate-500 text-[10px] mt-0.5">
                                    <MapPin className="w-3.5 h-3.5 mr-0.5 text-slate-400" />
                                    <span>{booking.villa?.location}</span>
                                </div>
                                <div className="flex items-center text-slate-500 text-[10px] mt-0.5">
                                    <Calendar className="w-3.5 h-3.5 mr-0.5 text-slate-400" />
                                    <span>
                                        {format(parseISO(booking.check_in), 'dd MMM', { locale: localeID })} - {format(parseISO(booking.check_out), 'dd MMM yyyy', { locale: localeID })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Review Form */}
                        <form onSubmit={handleSubmit} className="space-y-6 text-left">
                            {/* Stars rating select */}
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-2 text-center uppercase">BERIKAN RATING BINTANG</label>
                                <div className="flex justify-center items-center space-x-2">
                                    {[1, 2, 3, 4, 5].map((star) => {
                                        const isLit = (hoverRating || rating) >= star;
                                        return (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="transition-transform active:scale-95 text-slate-200"
                                            >
                                                <Star 
                                                    className={`w-10 h-10 ${
                                                        isLit ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
                                                    }`}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                                {formErrors.rating && (
                                    <p className="text-red-500 text-xs text-center mt-2 font-medium">{formErrors.rating}</p>
                                )}
                            </div>

                            {/* Comment textarea */}
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase">KOMENTAR ULASAN</label>
                                <textarea
                                    rows={4}
                                    required
                                    placeholder="Tuliskan ulasan Anda tentang kebersihan villa, fasilitas, lokasi, pelayanan penjaga villa, dll. (Minimal 20 karakter)"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    maxLength={500}
                                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold ${
                                        formErrors.comment ? 'border-red-500 focus:ring-red-200' : 'border-slate-200'
                                    }`}
                                />
                                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-semibold">
                                    <span>Minimal 20, Maksimal 500 karakter.</span>
                                    <span className={comment.length < 20 ? 'text-amber-600' : 'text-emerald-600'}>
                                        {comment.length} / 500
                                    </span>
                                </div>
                                {formErrors.comment && (
                                    <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.comment}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold py-3 rounded-xl shadow-lg transition-transform flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Mengirim Ulasan...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Kirim Ulasan Anda</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}
