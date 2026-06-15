'use client';

import React, { useEffect, useState } from 'react';
import axiosClient from '@/lib/axios';
import { Destination } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import { 
    Plus, 
    MapPin, 
    Loader2, 
    Edit, 
    Trash2, 
    Search,
    X,
    Image as ImageIcon,
    Tag,
    Globe
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDestinationsPage() {
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // Form inputs
    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [query, setQuery] = useState('');
    const [image, setImage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Fetch destinations
    const fetchDestinations = async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get('/admin/destinations');
            setDestinations(response.data.data || []);
        } catch (err) {
            console.error('Failed to load destinations:', err);
            toast.error('Gagal memuat daftar destinasi wisata.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDestinations();
    }, []);

    // Open modal for creation
    const handleOpenCreate = () => {
        setModalMode('create');
        setSelectedId(null);
        setName('');
        setCity('');
        setQuery('');
        setImage('');
        setIsModalOpen(true);
    };

    // Open modal for editing
    const handleOpenEdit = (dest: Destination) => {
        setModalMode('edit');
        setSelectedId(dest.id);
        setName(dest.name);
        setCity(dest.city);
        setQuery(dest.query);
        setImage(dest.image);
        setIsModalOpen(true);
    };

    // Handle delete
    const handleDelete = async (id: number, destName: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus destinasi "${destName}"?`)) {
            return;
        }

        try {
            await axiosClient.delete(`/admin/destinations/${id}`);
            toast.success(`Destinasi "${destName}" berhasil dihapus.`);
            setDestinations(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            console.error('Failed to delete destination:', err);
            toast.error('Gagal menghapus destinasi.');
        }
    };

    // Handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const queryVal = query || name;
        if (!name || !city || !image) {
            toast.error('Semua kolom wajib harus diisi.');
            return;
        }

        setSubmitting(true);
        const payload = {
            name,
            city,
            query: queryVal,
            image,
        };

        try {
            if (modalMode === 'create') {
                const response = await axiosClient.post('/admin/destinations', payload);
                toast.success(response.data.message || 'Destinasi berhasil dibuat.');
                setIsModalOpen(false);
                fetchDestinations();
            } else {
                if (!selectedId) return;
                const response = await axiosClient.put(`/admin/destinations/${selectedId}`, payload);
                toast.success(response.data.message || 'Destinasi berhasil diperbarui.');
                setIsModalOpen(false);
                fetchDestinations();
            }
        } catch (err: any) {
            console.error('Failed to save destination:', err);
            const errMsg = err.response?.data?.message || 'Gagal menyimpan destinasi.';
            toast.error(errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await axiosClient.post('/admin/destinations/upload-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setImage(response.data.image_url);
            toast.success('Foto destinasi berhasil diunggah.');
        } catch (err: any) {
            console.error('Failed to upload destination image:', err);
            toast.error(err.response?.data?.message || 'Gagal mengunggah gambar destinasi.');
        } finally {
            setUploadingImage(false);
        }
    };

    // Filtered destinations
    const filteredDestinations = destinations.filter(dest => 
        dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.query.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-3xl font-black text-[#222222] tracking-tight">Destinasi wisata</h1>
                    <p className="text-[#6a6a6a] text-xs mt-1.5 font-medium">
                        Kelola daerah atau area tujuan wisata untuk mempermudah pencarian tamu di halaman depan.
                    </p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-5 rounded-[8px]   hover: transition-all duration-200 flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer"
                >
                    <Plus className="w-4.5 h-4.5" />
                    <span>Tambah destinasi</span>
                </button>
            </div>

            {/* Filter/Search Section */}
            <div className="flex items-center bg-white border border-[#dddddd] rounded-[8px] px-4 py-2.5 max-w-md transition-colors focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                <Search className="w-4 h-4 text-slate-500 mr-2.5 flex-shrink-0" />
                <input
                    type="text"
                    placeholder="Cari destinasi berdasarkan nama atau kota..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none text-xs text-[#222222] placeholder-slate-400 focus:outline-none focus:ring-0 p-0"
                />
                {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery('')} 
                        className="text-slate-500 hover:text-[#222222] p-2.5 rounded-[8px] hover:bg-slate-100 active:scale-90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label="Bersihkan pencarian"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Loading / Cards Grid */}
            <div className="bg-white border border-[#dddddd] rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)]">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#dddddd]">
                    <h3 className="font-bold text-[#222222] flex items-center space-x-2 text-sm tracking-tight">
                        <Globe className="w-4 h-4 text-blue-500" />
                        <span className="text-slate-855">Daftar destinasi</span>
                    </h3>
                </div>
                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-40 space-y-4">
                            <Loader2 className="w-9 h-9 animate-spin text-blue-500" />
                            <p className="text-slate-500 text-xs font-semibold animate-pulse">Memuat destinasi...</p>
                        </div>
                    ) : filteredDestinations.length === 0 ? (
                        <div className="py-24 text-center max-w-md mx-auto">
                            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-[#dddddd]">
                                <Globe className="w-6 h-6 text-slate-500" />
                            </div>
                            <p className="text-slate-500 text-xs font-medium mb-6">
                                {searchQuery ? 'Tidak ada destinasi yang cocok dengan pencarian Anda.' : 'Daftar destinasi Anda masih kosong.'}
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={handleOpenCreate}
                                    className="inline-flex bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-[8px] transition-all duration-200 active:scale-95 "
                                >
                                    Tambah Destinasi Pertama Anda
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredDestinations.map((dest) => (
                                <div 
                                    key={dest.id} 
                                    className="group/card bg-white border border-[#dddddd] rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col hover:-translate-y-0.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                                >
                                    {/* Card Visual Top */}
                                    <div className="aspect-[16/10] overflow-hidden bg-slate-100 relative">
                                        {dest.image ? (
                                            <img 
                                                src={dest.image} 
                                                alt={dest.name} 
                                                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 ease-out" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                                <ImageIcon className="w-6 h-6 text-slate-300" />
                                            </div>
                                        )}
                                        
                                    </div>

                                    {/* Card Details Bottom */}
                                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                        <div>
                                            <h3 className="font-extrabold text-[#222222] text-sm tracking-tight leading-snug">
                                                {dest.name}
                                            </h3>
                                            <div className="flex items-center text-slate-500 text-xs mt-1.5 font-medium">
                                                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500" />
                                                <span>{dest.city}</span>
                                            </div>
                                            <div className="mt-2.5">
                                                <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-[#dddddd] font-semibold tracking-tight">
                                                    <Tag className="w-2.5 h-2.5" />
                                                    <span>query: {dest.query}</span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#dddddd]">
                                            <button 
                                                onClick={() => handleOpenEdit(dest)}
                                                className="inline-flex justify-center bg-white hover:bg-slate-50 text-[#222222] font-extrabold py-2 px-3 rounded-[8px] text-xs items-center space-x-1 cursor-pointer border border-[#dddddd] active:scale-95 transition-all"
                                                title="Edit Destinasi"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                                <span>Edit</span>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(dest.id, dest.name)}
                                                className="inline-flex justify-center bg-blue-50/50 hover:bg-blue-50 text-blue-600 font-extrabold py-2 px-3 rounded-[8px] text-xs items-center space-x-1 cursor-pointer border border-blue-100/60 active:scale-95 transition-all"
                                                title="Hapus Destinasi"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Hapus</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#222222]/40 p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-[#dddddd] rounded-[14px] w-full max-w-md shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 relative">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-4 sm:px-6 py-4.5 border-b border-[#dddddd]">
                            <div>
                                <h3 className="text-sm font-bold text-[#222222] tracking-tight">
                                    {modalMode === 'create' ? 'Tambah destinasi baru' : 'Edit destinasi wisata'}
                                </h3>
                                 <p className="text-[10px] text-slate-500 font-medium mt-0.5">Lengkapi parameter destinasi di bawah.</p>
                            </div>
                             <button 
                                onClick={() => setIsModalOpen(false)}
                                className="w-11 h-11 rounded-[8px] bg-white border border-[#dddddd] text-slate-500 hover:text-[#222222] flex items-center justify-center transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                aria-label="Tutup modal"
                            >
                                <X className="w-4.5 h-4.5" />
                            </button>
                        </div>

                        {/* Modal Body / Form */}
                        <form onSubmit={handleSubmit}>
                            <div className="p-4 sm:p-6 space-y-4 text-xs">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Nama destinasi *</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Ubud, Gianyar"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-slate-50/50 hover:bg-slate-50 border border-[#dddddd] rounded-[8px] px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Kota/kabupaten *</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Gianyar, Bali"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="w-full bg-slate-50/50 hover:bg-slate-50 border border-[#dddddd] rounded-[8px] px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                        required
                                    />
                                </div>



                                <div>
                                    <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Foto Destinasi *</label>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                                        {image ? (
                                            <div className="relative w-24 h-16 rounded-xl border border-[#dddddd] overflow-hidden flex-shrink-0 bg-slate-50">
                                                <img src={image} alt="Destination Preview" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setImage('')}
                                                    className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 text-[10px] font-bold cursor-pointer"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-24 h-16 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 select-none">
                                                <ImageIcon className="w-6 h-6 text-blue-500" />
                                            </div>
                                        )}
                                        <div className="flex-1 space-y-2 w-full sm:w-auto">
                                            <div className="flex items-center space-x-2">
                                                <label className="bg-white hover:bg-slate-50 border border-[#dddddd] text-[#222222] font-extrabold text-[11px] py-2 px-3.5 rounded-[8px] cursor-pointer transition-all duration-200 active:scale-95 inline-flex items-center space-x-1.5">
                                                    {uploadingImage ? (
                                                        <>
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            <span>Mengunggah...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>Pilih Gambar</span>
                                                        </>
                                                    )}
                                                    <input 
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        disabled={uploadingImage}
                                                        className="hidden"
                                                    />
                                                </label>
                                                {image && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setImage('')}
                                                        className="bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold text-[11px] py-2 px-3 rounded-[8px] transition-all cursor-pointer"
                                                    >
                                                        Hapus
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-medium">Format JPG, PNG, atau WebP (Maks 2MB). Atau masukkan URL.</p>
                                        </div>
                                    </div>
                                    <div className="mt-2.5">
                                        <input
                                            type="text"
                                            placeholder="Atau masukkan URL foto destinasi di sini (https://...)"
                                            value={image}
                                            onChange={(e) => setImage(e.target.value)}
                                            className="w-full bg-slate-50/50 hover:bg-slate-50 border border-[#dddddd] rounded-[8px] px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            required
                                        />
                                    </div>
                                </div>


                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end space-x-3 px-4 sm:px-6 py-4.5 border-t border-[#dddddd]">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 border border-[#dddddd] text-[#222222] rounded-[8px] text-xs font-semibold hover:bg-slate-100 transition-all active:scale-95 cursor-pointer"
                                    disabled={submitting}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] text-xs font-semibold flex items-center space-x-1.5 active:scale-95  transition-all"
                                    disabled={submitting}
                                >
                                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                                    <span>Simpan</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
