'use client';

import React, { useEffect, useState } from 'react';
import axiosClient from '@/lib/axios';
import { Review } from '@/types';
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import ReviewStars from '@/components/ui/ReviewStars';
import PageHeader from '@/components/ui/PageHeader';
import { 
    Star, 
    Loader2, 
    Check, 
    X,
    MessageSquare,
    Eye,
    ThumbsUp,
    Trash,
    Plus,
    Save,
    ChevronLeft,
    ChevronRight,
    UserCheck,
    MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [status, setStatus] = useState('pending'); // default to pending moderation
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Manual Creation / Editing
    const [villas, setVillas] = useState<any[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingReview, setEditingReview] = useState<Review | null>(null);

    const [formGuestName, setFormGuestName] = useState('');
    const [formGuestAvatar, setFormGuestAvatar] = useState('');
    const [formGuestSubtitle, setFormGuestSubtitle] = useState('');
    const [formRating, setFormRating] = useState('5');
    const [formComment, setFormComment] = useState('');
    const [formIsApproved, setFormIsApproved] = useState(true);
    const [formVillaId, setFormVillaId] = useState('');
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [formCreatedAt, setFormCreatedAt] = useState('');

    useEffect(() => {
        const fetchVillasList = async () => {
            try {
                const res = await axiosClient.get('/admin/villas');
                setVillas(res.data || []);
            } catch (err) {
                console.error('Failed to load villas for dropdown:', err);
            }
        };
        fetchVillasList();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const params: any = {
                page: currentPage,
            };
            if (status !== 'all') {
                params.status = status; // approved or pending
            }

            const response = await axiosClient.get('/admin/reviews', { params });
            setReviews(response.data.data || []);
            setTotalPages(response.data.meta?.last_page || 1);
        } catch (err) {
            console.error('Failed to load reviews list:', err);
            toast.error('Gagal memuat ulasan tamu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [currentPage, status]);

    const handleApprove = async (id: number) => {
        try {
            const response = await axiosClient.patch(`/admin/reviews/${id}/approve`);
            toast.success(response.data.message || 'Ulasan disetujui untuk dipublikasi!');
            fetchReviews();
        } catch (err) {
            console.error('Failed to approve review:', err);
            toast.error('Gagal menyetujui ulasan.');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menolak dan menghapus ulasan ini?')) return;
        
        try {
            const response = await axiosClient.delete(`/admin/reviews/${id}`);
            toast.success(response.data.message || 'Ulasan berhasil dihapus.');
            fetchReviews();
        } catch (err) {
            console.error('Failed to delete review:', err);
            toast.error('Gagal menghapus ulasan.');
        }
    };

    const openCreateModal = () => {
        setEditingReview(null);
        setFormGuestName('');
        setFormGuestAvatar('');
        setFormGuestSubtitle('');
        setFormRating('5');
        setFormComment('');
        setFormIsApproved(true);
        setFormCreatedAt(format(new Date(), 'yyyy-MM-dd'));
        if (villas.length > 0) setFormVillaId(String(villas[0].id));
        setModalOpen(true);
    };

    const openEditModal = (r: Review) => {
        setEditingReview(r);
        setFormGuestName(r.guest_name);
        setFormGuestAvatar(r.guest_avatar || '');
        setFormGuestSubtitle(r.guest_subtitle || '');
        setFormRating(String(r.rating));
        setFormComment(r.comment);
        setFormIsApproved(r.is_approved);
        setFormVillaId(String(r.villa_id));
        setFormCreatedAt(r.created_at ? format(parseISO(r.created_at), 'yyyy-MM-dd') : '');
        setModalOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formGuestName.trim() || !formComment.trim()) {
            toast.error('Nama tamu dan komentar ulasan wajib diisi.');
            return;
        }
        if (!editingReview && !formVillaId) {
            toast.error('Pilih villa terlebih dahulu.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                guest_name: formGuestName,
                guest_avatar: formGuestAvatar || null,
                guest_subtitle: formGuestSubtitle || null,
                rating: Number(formRating),
                comment: formComment,
                is_approved: formIsApproved,
                created_at: formCreatedAt || null,
            };

            if (editingReview) {
                await axiosClient.put(`/admin/reviews/${editingReview.id}`, payload);
                toast.success('Ulasan berhasil diperbarui!');
            } else {
                await axiosClient.post('/admin/reviews', {
                    ...payload,
                    villa_id: Number(formVillaId),
                });
                toast.success('Ulasan berhasil ditambahkan!');
            }
            setModalOpen(false);
            fetchReviews();
        } catch (err: any) {
            console.error('Failed to save review:', err);
            toast.error(err.response?.data?.message || 'Gagal menyimpan ulasan.');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await axiosClient.post('/admin/reviews/upload-avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setFormGuestAvatar(response.data.avatar_url);
            toast.success('Avatar berhasil diunggah.');
        } catch (err: any) {
            console.error('Failed to upload avatar:', err);
            toast.error(err.response?.data?.message || 'Gagal mengunggah avatar.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#222222] tracking-tight">Moderasi ulasan</h1>
                    <p className="text-[#6a6a6a] text-xs sm:text-sm mt-1.5 font-medium">
                        Setujui atau tolak ulasan masuk dari tamu pasca check-out villa.
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-[8px] transition-all duration-300 flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span>Tambah ulasan manual</span>
                </button>
            </div>

            {/* Status Segment filters */}
            <div className="bg-[#f7f7f7] border border-[#dddddd] p-1 rounded-[14px] flex items-center space-x-1 w-full sm:w-fit overflow-x-auto">
                <button
                    onClick={() => { setStatus('pending'); setCurrentPage(1); }}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-[8px] text-xs font-bold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer text-center whitespace-nowrap active:scale-95 ${
                        status === 'pending' 
                            ? 'bg-white text-blue-600 border border-[#dddddd] font-extrabold' 
                            : 'text-slate-500 hover:text-[#222222]'
                    }`}
                >
                    Pending moderasi
                </button>
                <button
                    onClick={() => { setStatus('approved'); setCurrentPage(1); }}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-[8px] text-xs font-bold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer text-center whitespace-nowrap active:scale-95 ${
                        status === 'approved' 
                            ? 'bg-white text-blue-600 border border-[#dddddd] font-extrabold' 
                            : 'text-slate-500 hover:text-[#222222]'
                    }`}
                >
                    Approved (publik)
                </button>
                <button
                    onClick={() => { setStatus('all'); setCurrentPage(1); }}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-[8px] text-xs font-bold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer text-center whitespace-nowrap active:scale-95 ${
                        status === 'all' 
                            ? 'bg-white text-blue-600 border border-[#dddddd] font-extrabold' 
                            : 'text-slate-500 hover:text-[#222222]'
                    }`}
                >
                    Semua
                </button>
            </div>

            {/* List Board cards */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-40 space-y-4 bg-white border border-[#dddddd] rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)]">
                        <Loader2 className="w-9 h-9 animate-spin text-blue-500" />
                        <p className="text-slate-500 text-xs font-semibold animate-pulse">Memuat ulasan...</p>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="bg-white border border-[#dddddd] rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-20 text-center">
                        <div className="w-12 h-12 rounded-full bg-[#f7f7f7] border border-[#dddddd] flex items-center justify-center mx-auto mb-4">
                            <MessageCircle className="w-6 h-6 text-slate-500" />
                        </div>
                        <p className="text-slate-500 text-xs font-semibold">Tidak ada ulasan dalam kategori ini.</p>
                    </div>
                ) : (
                    reviews.map((r) => (
                        <div 
                            key={r.id} 
                            className="bg-white border border-[#dddddd] rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.06),0_6px_16px_rgba(0,0,0,0.12)] transition-all duration-300"
                        >
                            <div className="flex-1 space-y-4">
                                <div className="flex items-start space-x-3.5 text-xs">
                                    {r.guest_avatar ? (
                                        <img src={r.guest_avatar} alt={r.guest_name} className="w-11 h-11 rounded-2xl object-cover flex-shrink-0 border border-[#dddddd]" />
                                    ) : (
                                        <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 font-extrabold flex items-center justify-center text-xs flex-shrink-0 uppercase">
                                            {r.guest_name.substring(0, 2)}
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <h4 className="font-extrabold text-[#222222] text-sm flex items-center gap-2">
                                            <span>{r.guest_name}</span>
                                            {status === 'all' && (
                                                <StatusBadge variant={r.is_approved ? 'confirmed' : 'pending'} label={r.is_approved ? 'Approved' : 'Pending'} />
                                            )}
                                        </h4>
                                        {r.guest_subtitle && (
                                            <p className="text-[10px] text-slate-500 font-medium">{r.guest_subtitle}</p>
                                        )}
                                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 pt-0.5 text-[10px] text-slate-500 font-semibold">
                                            <span>Villa: <span className="text-[#222222] font-bold">{r.villa?.name}</span></span>
                                            <span className="hidden sm:inline text-[#dddddd]">•</span>
                                            <span>Kode booking: <span className="text-[#222222] font-bold font-mono tracking-wider text-[11px]">{r.booking?.booking_code || 'Ulasan manual'}</span></span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center text-amber-400 space-x-0.5 pl-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                                    ))}
                                    <span className="text-[10px] font-black text-[#222222] ml-1.5 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/30 font-mono tabular-nums">{r.rating} / 5</span>
                                </div>

                                <p className="text-[#222222] text-xs leading-relaxed whitespace-pre-line pl-1 font-medium italic">
                                    &ldquo;{r.comment}&rdquo;
                                </p>
                            </div>

                            {/* Action Block */}
                            <div className="flex items-center justify-end md:flex-col md:items-end gap-2.5 flex-wrap border-t md:border-t-0 border-[#dddddd] pt-4 md:pt-0">
                                <button
                                    onClick={() => openEditModal(r)}
                                    className="bg-white hover:bg-[#f7f7f7] border border-[#dddddd] text-[#222222] font-extrabold text-[11px] py-2 px-3.5 rounded-[8px] flex items-center space-x-1.5 cursor-pointer transition-all duration-200 active:scale-95  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                    aria-label="Edit ulasan"
                                >
                                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Edit</span>
                                </button>
                                {!r.is_approved && (
                                    <button
                                        onClick={() => handleApprove(r.id)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white font-extrabold text-[11px] py-2 px-3.5 rounded-[8px] flex items-center space-x-1.5 cursor-pointer transition-all duration-200 active:scale-95  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                        aria-label="Setujui ulasan"
                                    >
                                        <ThumbsUp className="w-3.5 h-3.5" />
                                        <span>Setujui</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(r.id)}
                                    className="bg-white hover:bg-blue-50 border border-[#dddddd] hover:border-blue-200 text-blue-600 hover:text-blue-700 font-extrabold text-[11px] py-2 px-3.5 rounded-[8px] flex items-center space-x-1.5 cursor-pointer transition-all duration-200 active:scale-95  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                    aria-label={r.is_approved ? 'Hapus ulasan' : 'Tolak ulasan'}
                                >
                                    <Trash className="w-3.5 h-3.5" />
                                    <span>{r.is_approved ? 'Hapus' : 'Tolak'}</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && !loading && (
                <div className="flex items-center justify-center space-x-1.5 py-6 border-t border-[#dddddd]">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2.5 rounded-[8px] border border-[#dddddd] text-slate-500 hover:bg-[#f7f7f7] hover:text-[#222222] disabled:opacity-40 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label="Halaman sebelumnya"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`w-9 h-9 rounded-[8px] text-xs font-bold transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                                currentPage === i + 1
                                    ? 'bg-blue-600 text-white border border-blue-600 '
                                    : 'border border-[#dddddd] text-slate-500 hover:bg-[#f7f7f7] hover:text-[#222222]'
                             }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2.5 rounded-[8px] border border-[#dddddd] text-slate-500 hover:bg-[#f7f7f7] hover:text-[#222222] disabled:opacity-40 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label="Halaman berikutnya"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* EDIT/CREATE DIALOG MODAL */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-[#dddddd] rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] max-w-lg w-full overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 relative">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-4 sm:px-6 py-4.5 border-b border-[#dddddd] bg-[#f7f7f7]">
                            <div>
                                <h3 className="text-sm font-bold text-[#222222] tracking-tight">
                                    {editingReview ? 'Edit ulasan tamu' : 'Tambah ulasan baru (manual)'}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                    {editingReview ? 'Perbarui informasi ulasan dari database.' : 'Tambahkan ulasan testimoni manual untuk villa Anda.'}
                                </p>
                            </div>
                            <button 
                                onClick={() => setModalOpen(false)}
                                className="w-11 h-11 rounded-[8px] bg-white border border-[#dddddd] text-slate-500 hover:text-[#222222] flex items-center justify-center transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                aria-label="Tutup modal"
                            >
                                <X className="w-4.5 h-4.5" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleFormSubmit}>
                            <div className="p-4 sm:p-6 space-y-4.5 text-xs">
                                {!editingReview && (
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Pilih villa *</label>
                                        <select
                                            required
                                            value={formVillaId}
                                            onChange={(e) => setFormVillaId(e.target.value)}
                                            className="w-full bg-slate-50/50 hover:bg-slate-50 border border-[#dddddd] rounded-[8px] px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold cursor-pointer transition-all duration-200"
                                        >
                                            <option value="">-- Pilih villa --</option>
                                            {villas.map(v => (
                                                <option key={v.id} value={v.id}>{v.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Nama tamu *</label>
                                        <input 
                                            type="text"
                                            required
                                            placeholder="Contoh: Maximilian"
                                            value={formGuestName}
                                            onChange={(e) => setFormGuestName(e.target.value)}
                                            className="w-full bg-slate-50/50 hover:bg-slate-50 border border-[#dddddd] rounded-[8px] px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Rating bintang *</label>
                                        <select
                                            required
                                            value={formRating}
                                            onChange={(e) => setFormRating(e.target.value)}
                                            className="w-full bg-slate-50/50 hover:bg-slate-50 border border-[#dddddd] rounded-[8px] px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold cursor-pointer transition-all duration-200"
                                        >
                                            <option value="5">5 bintang (sangat puas)</option>
                                            <option value="4">4 bintang (puas)</option>
                                            <option value="3">3 bintang (cukup)</option>
                                            <option value="2">2 bintang (buruk)</option>
                                            <option value="1">1 bintang (sangat buruk)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Subtitle tamu (waktu/lokasi)</label>
                                        <input 
                                            type="text"
                                            placeholder="Contoh: Tamu Airbnb / Sleman, Indonesia"
                                            value={formGuestSubtitle}
                                            onChange={(e) => setFormGuestSubtitle(e.target.value)}
                                            className="w-full bg-slate-50/50 hover:bg-slate-50 border border-[#dddddd] rounded-[8px] px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Tanggal ulasan *</label>
                                        <input 
                                            type="date"
                                            required
                                            value={formCreatedAt}
                                            onChange={(e) => setFormCreatedAt(e.target.value)}
                                            className="w-full bg-slate-50/50 hover:bg-slate-50 border border-[#dddddd] rounded-[8px] px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Avatar Tamu</label>
                                    <div className="flex items-center space-x-4">
                                        {formGuestAvatar ? (
                                            <div className="relative w-16 h-16 rounded-2xl border border-[#dddddd] overflow-hidden flex-shrink-0 bg-slate-50">
                                                <img src={formGuestAvatar} alt="Guest Avatar" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormGuestAvatar('')}
                                                    className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 text-[10px] font-bold cursor-pointer"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 font-extrabold flex items-center justify-center text-sm flex-shrink-0 uppercase select-none">
                                                {formGuestName ? formGuestName.substring(0, 2) : 'G'}
                                            </div>
                                        )}
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <label className="bg-white hover:bg-slate-50 border border-[#dddddd] text-[#222222] font-extrabold text-[11px] py-2 px-3.5 rounded-[8px] cursor-pointer transition-all duration-200 active:scale-95 inline-flex items-center space-x-1.5">
                                                    {uploadingAvatar ? (
                                                        <>
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            <span>Mengunggah...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>Pilih Berkas</span>
                                                        </>
                                                    )}
                                                    <input 
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleAvatarUpload}
                                                        disabled={uploadingAvatar}
                                                        className="hidden"
                                                    />
                                                </label>
                                                {formGuestAvatar && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormGuestAvatar('')}
                                                        className="bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold text-[11px] py-2 px-3 rounded-[8px] transition-all cursor-pointer"
                                                    >
                                                        Hapus Foto
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-medium">Unggah foto format JPG, PNG, atau WebP (Maks 2MB). Atau masukkan URL di bawah.</p>
                                        </div>
                                    </div>
                                    <div className="mt-2.5">
                                        <input 
                                            type="url"
                                            placeholder="Atau masukkan URL foto avatar di sini (https://...)"
                                            value={formGuestAvatar}
                                            onChange={(e) => setFormGuestAvatar(e.target.value)}
                                            className="w-full bg-slate-50/50 hover:bg-slate-50 border border-[#dddddd] rounded-[8px] px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Komentar / ulasan *</label>
                                    <textarea 
                                        rows={4}
                                        required
                                        placeholder="Tulis ulasan tamu di sini..."
                                        value={formComment}
                                        onChange={(e) => setFormComment(e.target.value)}
                                        className="w-full bg-slate-50/50 hover:bg-slate-50 border border-[#dddddd] rounded-[8px] px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                    />
                                </div>

                                <div className="flex items-center space-x-2.5 pt-1">
                                    <input 
                                        type="checkbox"
                                        id="formIsApproved"
                                        checked={formIsApproved}
                                        onChange={(e) => setFormIsApproved(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-[#dddddd] rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <label htmlFor="formIsApproved" className="text-[11px] font-semibold text-[#6a6a6a] cursor-pointer select-none">
                                        Setujui langsung untuk ditampilkan (approved)
                                    </label>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end space-x-3 px-4 sm:px-6 py-4 bg-[#f7f7f7] border-t border-[#dddddd]">
                                <button 
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="bg-white border border-[#dddddd] text-[#222222] rounded-[8px] text-xs font-semibold py-2.5 px-4 transition-all active:scale-95 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] text-xs font-semibold py-2.5 px-4 transition-all flex items-center space-x-1.5 disabled:opacity-50 active:scale-95 cursor-pointer"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Simpan ulasan</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
