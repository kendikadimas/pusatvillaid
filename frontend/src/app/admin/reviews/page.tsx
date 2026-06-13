'use client';

import React, { useEffect, useState } from 'react';
import axiosClient from '@/lib/axios';
import { Review } from '@/types';
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
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
    Save
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Moderasi Ulasan Tamu</h1>
                    <p className="text-slate-500 text-sm mt-1">Setujui atau tolak ulasan masuk dari tamu pasca check-out.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-colors flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Ulasan Manual</span>
                </button>
            </div>

                {/* Status Segment filters */}
                <div className="bg-slate-200/80 p-1 rounded-xl flex items-center space-x-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <button
                        onClick={() => { setStatus('pending'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            status === 'pending' ? 'bg-white text-rose-600 shadow-sm' : 'hover:text-slate-800'
                        }`}
                    >
                        Pending Moderasi
                    </button>
                    <button
                        onClick={() => { setStatus('approved'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            status === 'approved' ? 'bg-white text-rose-600 shadow-sm' : 'hover:text-slate-800'
                        }`}
                    >
                        Approved (Publik)
                    </button>
                    <button
                        onClick={() => { setStatus('all'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            status === 'all' ? 'bg-white text-rose-600 shadow-sm' : 'hover:text-slate-800'
                        }`}
                    >
                        Semua
                    </button>
                </div>

            {/* List Board cards */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center items-center py-20 bg-white rounded-2xl border border-slate-200">
                        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-xs text-slate-400">
                        Tidak ada ulasan dalam daftar ini.
                    </div>
                ) : (
                    reviews.map((r) => (
                        <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="space-y-3 flex-1">
                                <div className="flex items-center space-x-3 text-xs font-semibold">
                                    {r.guest_avatar ? (
                                        <img src={r.guest_avatar} alt={r.guest_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-green-50 text-green-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                                            {r.guest_name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">{r.guest_name}</h4>
                                        {r.guest_subtitle && (
                                            <p className="text-[10px] text-slate-500 font-semibold">{r.guest_subtitle}</p>
                                        )}
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            Villa: <span className="font-semibold text-slate-700">{r.villa?.name}</span>
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            Code: <span className="font-semibold text-slate-650">{r.booking?.booking_code || 'Manual Seeding'}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center text-amber-400 space-x-0.5 pl-1 bg-amber-50/50 border border-amber-200/30 w-fit px-2 py-0.5 rounded-lg">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                                    ))}
                                    <span className="text-[10px] font-bold text-slate-800 ml-1">{r.rating} / 5</span>
                                </div>

                                <p className="text-slate-605 text-xs leading-relaxed whitespace-pre-line pl-1">
                                    "{r.comment}"
                                </p>
                            </div>

                            {/* Action Board */}
                            <div className="flex items-center sm:flex-col sm:items-end justify-end gap-2 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                                <button
                                    onClick={() => openEditModal(r)}
                                    className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-[11px] py-1.5 px-3 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors active:scale-95"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                </button>
                                {!r.is_approved && (
                                    <button
                                        onClick={() => handleApprove(r.id)}
                                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors active:scale-95"
                                    >
                                        <ThumbsUp className="w-3.5 h-3.5" />
                                        <span>Setujui</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(r.id)}
                                    className="bg-red-50 hover:bg-red-500/10 border border-red-200 text-red-650 font-bold text-[11px] py-1.5 px-3 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors active:scale-95"
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
                <div className="flex items-center justify-center space-x-2 py-6 border-t border-slate-200">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-650 hover:bg-slate-50 disabled:opacity-50 transition-colors"
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
                                    : 'border border-slate-200 text-slate-655 hover:bg-slate-50'
                             }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-655 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                        Selanjutnya
                    </button>
                </div>
            )}

            {/* EDIT/CREATE DIALOG MODAL */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 relative animate-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => setModalOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div>
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingReview ? 'Edit Ulasan Tamu' : 'Tambah Ulasan Baru (Manual)'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                {editingReview ? 'Perbarui informasi ulasan dari database.' : 'Tambahkan ulasan testimoni manual untuk villa Anda.'}
                            </p>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            {!editingReview && (
                                <div>
                                    <label className="text-[10px] font-bold text-slate-605 block mb-1.5 uppercase tracking-wider">Pilih Villa *</label>
                                    <select
                                        required
                                        value={formVillaId}
                                        onChange={(e) => setFormVillaId(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold cursor-pointer"
                                    >
                                        <option value="">-- Pilih Villa --</option>
                                        {villas.map(v => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-605 block mb-1.5 uppercase tracking-wider">Nama Tamu *</label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="Contoh: Maximilian"
                                        value={formGuestName}
                                        onChange={(e) => setFormGuestName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-605 block mb-1.5 uppercase tracking-wider">Rating Bintang *</label>
                                    <select
                                        required
                                        value={formRating}
                                        onChange={(e) => setFormRating(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold cursor-pointer"
                                    >
                                        <option value="5">5 Bintang (Sangat Puas)</option>
                                        <option value="4">4 Bintang (Puas)</option>
                                        <option value="3">3 Bintang (Cukup)</option>
                                        <option value="2">2 Bintang (Buruk)</option>
                                        <option value="1">1 Bintang (Sangat Buruk)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-605 block mb-1.5 uppercase tracking-wider">Subtitle Tamu (Waktu/Lokasi)</label>
                                <input 
                                    type="text"
                                    placeholder="Contoh: 8 tahun bergabung di Airbnb / Sleman, Indonesia"
                                    value={formGuestSubtitle}
                                    onChange={(e) => setFormGuestSubtitle(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-605 block mb-1.5 uppercase tracking-wider">Avatar Tamu (URL Foto)</label>
                                <input 
                                    type="url"
                                    placeholder="https://images.unsplash.com/..."
                                    value={formGuestAvatar}
                                    onChange={(e) => setFormGuestAvatar(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-605 block mb-1.5 uppercase tracking-wider">Komentar / Ulasan *</label>
                                <textarea 
                                    rows={4}
                                    required
                                    placeholder="Tulis ulasan tamu di sini..."
                                    value={formComment}
                                    onChange={(e) => setFormComment(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <input 
                                    type="checkbox"
                                    id="formIsApproved"
                                    checked={formIsApproved}
                                    onChange={(e) => setFormIsApproved(e.target.checked)}
                                    className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500 cursor-pointer"
                                />
                                <label htmlFor="formIsApproved" className="text-[10px] font-bold text-slate-605 uppercase tracking-wider cursor-pointer">
                                    Setujui Langsung untuk Ditampilkan (Approved)
                                </label>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                                <button 
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={saving}
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-colors flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Simpan Ulasan</span>
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
