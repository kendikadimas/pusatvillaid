'use client';

import React, { useEffect, useState } from 'react';
import axiosClient from '@/lib/axios';
import { Destination } from '@/types';
import { 
    Plus, 
    MapPin, 
    Loader2, 
    Edit, 
    Trash2, 
    Search,
    X,
    Image as ImageIcon
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
    const [countFallback, setCountFallback] = useState('');
    const [submitting, setSubmitting] = useState(false);

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
        setCountFallback('');
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
        setCountFallback(dest.count_fallback || '');
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
            // Update state locally
            setDestinations(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            console.error('Failed to delete destination:', err);
            toast.error('Gagal menghapus destinasi.');
        }
    };

    // Handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !city || !query || !image) {
            toast.error('Semua kolom wajib (kecuali Label Jumlah) harus diisi.');
            return;
        }

        setSubmitting(true);
        const payload = {
            name,
            city,
            query,
            image,
            count_fallback: countFallback || null
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

    // Filtered destinations
    const filteredDestinations = destinations.filter(dest => 
        dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.query.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Destinasi Wisata</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Kelola daerah atau area tujuan wisata untuk mempermudah pencarian tamu di beranda.
                    </p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                    <Plus className="w-4.5 h-4.5" />
                    <span>Tambah Destinasi</span>
                </button>
            </div>

            {/* Filter/Search Section */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 max-w-md shadow-sm">
                <Search className="w-4 h-4 text-slate-400 mr-2" />
                <input
                    type="text"
                    placeholder="Cari destinasi berdasarkan nama atau kota..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Table / List */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                    </div>
                ) : filteredDestinations.length === 0 ? (
                    <div className="py-20 text-center">
                        <p className="text-slate-400 text-sm mb-4">
                            {searchQuery ? 'Tidak ada destinasi yang cocok dengan pencarian Anda.' : 'Daftar destinasi Anda masih kosong.'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={handleOpenCreate}
                                className="inline-flex bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                            >
                                Tambah Destinasi Pertama Anda
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left text-slate-500 border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                                    <th className="py-3.5 px-4 w-20">Foto</th>
                                    <th className="py-3.5 px-4">Nama Destinasi</th>
                                    <th className="py-3.5 px-4">Kota/Kabupaten</th>
                                    <th className="py-3.5 px-4">Kata Kunci (Query)</th>
                                    <th className="py-3.5 px-4">Label Jumlah (Fallback)</th>
                                    <th className="py-3.5 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDestinations.map((dest) => (
                                    <tr key={dest.id} className="border-b border-slate-150 hover:bg-slate-50/50">
                                        <td className="py-3 px-4">
                                            <div className="w-16 aspect-[3/2] rounded-lg overflow-hidden bg-slate-100 border border-slate-200 relative">
                                                {dest.image ? (
                                                    <img 
                                                        src={dest.image} 
                                                        alt={dest.name} 
                                                        className="w-full h-full object-cover" 
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-200">
                                                        <ImageIcon className="w-5 h-5 text-slate-400" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                                            {dest.name}
                                        </td>
                                        <td className="py-3 px-4 text-slate-600">
                                            <div className="flex items-center">
                                                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                                                <span>{dest.city}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[10px]">
                                                {dest.query}
                                            </code>
                                        </td>
                                        <td className="py-3 px-4 text-slate-600">
                                            {dest.count_fallback || '-'}
                                        </td>
                                        <td className="py-3 px-4 text-right space-x-2">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button 
                                                    onClick={() => handleOpenEdit(dest)}
                                                    className="inline-flex bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 px-2.5 rounded-lg text-xs items-center space-x-1 cursor-pointer border border-slate-200 transition-colors"
                                                    title="Edit Destinasi"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                    <span>Edit</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(dest.id, dest.name)}
                                                    className="inline-flex bg-red-50 hover:bg-red-100 text-red-600 font-bold py-1.5 px-2.5 rounded-lg text-xs items-center space-x-1 cursor-pointer border border-red-100 transition-colors"
                                                    title="Hapus Destinasi"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    <span>Hapus</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-base font-bold text-slate-900">
                                {modalMode === 'create' ? 'Tambah Destinasi Baru' : 'Edit Destinasi Wisata'}
                            </h3>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body / Form */}
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-4 text-xs">
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1.5">Nama Destinasi *</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Ubud, Gianyar"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1.5">Kota/Kabupaten *</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Ubud, Gianyar, Bali"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1.5">Kata Kunci Pencarian (Query) *</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Ubud (Kata kunci untuk filter villa)"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                                        required
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        Digunakan untuk menyaring villa di database yang lokasinya mengandung kata kunci ini.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1.5">URL Foto Destinasi *</label>
                                    <input
                                        type="url"
                                        placeholder="Contoh: https://images.unsplash.com/photo-..."
                                        value={image}
                                        onChange={(e) => setImage(e.target.value)}
                                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                                        required
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        Masukkan URL gambar yang valid (Unsplash, dll.)
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1.5">Label Jumlah Villa (Fallback)</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: 12+ Villa"
                                        value={countFallback}
                                        onChange={(e) => setCountFallback(e.target.value)}
                                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        Teks opsional untuk ditampilkan di bawah destinasi jika perhitungan otomatis tidak digunakan.
                                    </p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end space-x-2 px-6 py-4 bg-slate-50 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100 cursor-pointer"
                                    disabled={submitting}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center space-x-1 cursor-pointer"
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
