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

    // Villa autocomplete state
    const [villaSearch, setVillaSearch] = useState('');
    const [showVillaSuggestions, setShowVillaSuggestions] = useState(false);

    const filteredVillas = villaSearch.trim()
        ? villas.filter(v => v.name.toLowerCase().includes(villaSearch.toLowerCase()))
        : [];

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
        setFormVillaId('');
        setVillaSearch('');
        setShowVillaSuggestions(false);
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
        setFormVillaId(String(r.villa_id || ''));
        setVillaSearch(r.villa?.name || '');
        setShowVillaSuggestions(false);
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
                    <div className="bg-white border border-[#dddddd] rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] max-w-2xl w-full overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 relative max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#dddddd] bg-[#f7f7f7] shrink-0">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Star className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[#222222]">
                                        {editingReview ? 'Edit ulasan tamu' : 'Tambah ulasan baru'}
                                    </h3>
                                </div>
                            </div>
                            <button 
                                onClick={() => setModalOpen(false)}
                                className="w-8 h-8 rounded-lg bg-white border border-[#dddddd] text-slate-500 hover:text-[#222222] flex items-center justify-center transition-all cursor-pointer active:scale-95"
                                aria-label="Tutup modal"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleFormSubmit} className="overflow-y-auto">
                            <div className="p-4 sm:p-5">
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    {/* Left Column: Basic info */}
                                    <div className="md:col-span-2 space-y-3">
                                        {!editingReview && (
                                            <div className="relative">
                                                <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Villa *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Ketik nama villa..."
                                                    value={villaSearch}
                                                    onChange={(e) => {
                                                        setVillaSearch(e.target.value);
                                                        setShowVillaSuggestions(true);
                                                        setFormVillaId('');
                                                    }}
                                                    onFocus={() => setShowVillaSuggestions(true)}
                                                    onBlur={() => setTimeout(() => setShowVillaSuggestions(false), 200)}
                                                    className="w-full bg-slate-50 border border-[#dddddd] rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                />
                                                {showVillaSuggestions && villaSearch.trim() && filteredVillas.length > 0 && (
                                                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-36 overflow-y-auto">
                                                        {filteredVillas.map(v => (
                                                            <button
                                                                key={v.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setVillaSearch(v.name);
                                                                    setFormVillaId(String(v.id));
                                                                    setShowVillaSuggestions(false);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 font-semibold text-slate-700 border-b border-slate-50 last:border-0"
                                                            >
                                                                {v.name}
                                                                <span className="text-slate-400 ml-1 font-normal">({v.location})</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                {villaSearch.trim() && filteredVillas.length === 0 && (
                                                    <p className="text-[10px] text-amber-600 mt-1">Villa tidak ditemukan. Coba ketik nama lain.</p>
                                                )}
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Nama tamu *</label>
                                            <input 
                                                type="text" required
                                                placeholder="Nama tamu"
                                                value={formGuestName}
                                                onChange={(e) => setFormGuestName(e.target.value)}
                                                className="w-full bg-slate-50 border border-[#dddddd] rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Rating *</label>
                                                <select
                                                    required
                                                    value={formRating}
                                                    onChange={(e) => setFormRating(e.target.value)}
                                                    className="w-full bg-slate-50 border border-[#dddddd] rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                >
                                                    <option value="5">★ 5</option>
                                                    <option value="4">★ 4</option>
                                                    <option value="3">★ 3</option>
                                                    <option value="2">★ 2</option>
                                                    <option value="1">★ 1</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Tanggal *</label>
                                                <input 
                                                    type="date" required
                                                    value={formCreatedAt}
                                                    onChange={(e) => setFormCreatedAt(e.target.value)}
                                                    className="w-full bg-slate-50 border border-[#dddddd] rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Subtitle</label>
                                            <input 
                                                type="text"
                                                placeholder="Contoh: Tamu Airbnb"
                                                value={formGuestSubtitle}
                                                onChange={(e) => setFormGuestSubtitle(e.target.value)}
                                                className="w-full bg-slate-50 border border-[#dddddd] rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>

                                        {/* Avatar - compact */}
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Avatar</label>
                                            <div className="flex items-center gap-2">
                                                <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
                                                    {formGuestAvatar ? (
                                                        <img src={formGuestAvatar} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400 uppercase">
                                                            {formGuestName ? formGuestName.substring(0, 2) : 'G'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 grid grid-cols-1 gap-1.5">
                                                    <label className="bg-white hover:bg-slate-50 border border-[#dddddd] text-slate-700 font-bold text-[10px] py-1.5 px-2.5 rounded-lg cursor-pointer transition-all text-center">
                                                        {uploadingAvatar ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Unggah'}
                                                        <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} className="hidden" />
                                                    </label>
                                                    <input 
                                                        type="url"
                                                        placeholder="atau URL..."
                                                        value={formGuestAvatar}
                                                        onChange={(e) => setFormGuestAvatar(e.target.value)}
                                                        className="w-full bg-slate-50 border border-[#dddddd] rounded-lg px-2.5 py-1.5 text-[10px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2 pt-1">
                                            <input 
                                                type="checkbox" id="formIsApproved"
                                                checked={formIsApproved}
                                                onChange={(e) => setFormIsApproved(e.target.checked)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                            />
                                            <label htmlFor="formIsApproved" className="text-[10px] font-semibold text-slate-600 cursor-pointer select-none">
                                                Setujui langsung (approved)
                                            </label>
                                        </div>
                                    </div>

                                    {/* Right Column: Comment */}
                                    <div className="md:col-span-3 space-y-3">
                                        <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Komentar / ulasan *</label>
                                        <textarea 
                                            rows={8}
                                            required
                                            placeholder="Tulis ulasan tamu di sini..."
                                            value={formComment}
                                            onChange={(e) => setFormComment(e.target.value)}
                                            className="w-full bg-slate-50 border border-[#dddddd] rounded-lg px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-full min-h-[220px]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end space-x-2 px-4 sm:px-6 py-3 bg-[#f7f7f7] border-t border-[#dddddd] shrink-0">
                                <button 
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="bg-white border border-[#dddddd] text-[#222222] rounded-lg text-xs font-semibold py-2 px-4 transition-all active:scale-95 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold py-2 px-5 transition-all flex items-center space-x-1.5 disabled:opacity-50 active:scale-95 cursor-pointer"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-3.5 h-3.5" />
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
