'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axiosClient from '@/lib/axios';
import { Villa } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice } from '@/lib/format';
import { getMainPhoto } from '@/lib/villaUtils';
import { 
    Plus, 
    Home,
    MapPin, 
    BedDouble, 
    Bath, 
    Users, 
    Loader2,
    Edit, 
    ToggleLeft,
    ToggleRight,
    ExternalLink,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminVillasPage() {
    const [villas, setVillas] = useState<Villa[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState<string>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const fetchVillas = async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get('/admin/villas');
            setVillas(response.data || []);
        } catch (err) {
            console.error('Failed to load villas list:', err);
            toast.error('Gagal memuat daftar katalog villa.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVillas();
    }, []);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const sortedVillas = [...villas].sort((a, b) => {
        const order = sortOrder === 'asc' ? 1 : -1;
        switch (sortField) {
            case 'name': return a.name.localeCompare(b.name) * order;
            case 'location': return (a.location || '').localeCompare(b.location || '') * order;
            case 'bedrooms': return (a.bedrooms - b.bedrooms) * order;
            case 'price_per_night': return (a.price_per_night - b.price_per_night) * order;
            case 'weekend_price': return ((a.weekend_price ?? 0) - (b.weekend_price ?? 0)) * order;
            case 'is_active': return (Number(a.is_active) - Number(b.is_active)) * order;
            default: return 0;
        }
    });

    const SortIcon = ({ field }: { field: string }) => {
        if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-40" />;
        return sortOrder === 'asc'
            ? <ArrowUp className="w-3 h-3 ml-1 inline-block text-blue-600" />
            : <ArrowDown className="w-3 h-3 ml-1 inline-block text-blue-600" />;
    };

    const handleToggleStatus = async (villa: Villa) => {
        try {
            const nextStatus = !villa.is_active;
            
            // To toggle status, we can call PUT/PUT endpoint to update is_active field
            await axiosClient.put(`/admin/villas/${villa.id}`, {
                name: villa.name,
                description: villa.description,
                short_desc: villa.short_desc,
                location: villa.location,
                maps_url: villa.maps_url,
                bedrooms: villa.bedrooms,
                bathrooms: villa.bathrooms,
                max_guests: villa.max_guests,
                price_per_night: villa.price_per_night,
                weekend_price: villa.weekend_price,
                min_nights: villa.min_nights,
                amenities: villa.amenities,
                check_in_time: villa.check_in_time,
                check_out_time: villa.check_out_time,
                is_active: nextStatus
            });

            toast.success(`Villa "${villa.name}" sekarang ${nextStatus ? 'aktif' : 'nonaktif'}.`);
            fetchVillas();
        } catch (err) {
            console.error('Failed to toggle status:', err);
            toast.error('Gagal mengubah status keaktifan villa.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#dddddd] pb-5">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#222222] tracking-tight">Katalog Villa</h1>
                    <p className="text-[#6a6a6a] text-sm mt-1">Kelola konten deskripsi, galeri foto, fasilitas, harga sewa, dan penutupan tanggal villa.</p>
                </div>
                <Link
                    href="/admin/villas/new"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs p-2.5 sm:px-4 sm:py-2.5 rounded-[8px] transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
                    title="Tambah Villa Baru"
                >
                    <Plus className="w-4.5 h-4.5" />
                    <span className="hidden sm:inline">Tambah Villa Baru</span>
                </Link>
            </div>

            {/* Table or Cards grid */}
            <div className="bg-white border border-[#dddddd] rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] overflow-hidden">
                {loading ? (
                    <LoadingSpinner fullPage={false} />
                ) : villas.length === 0 ? (
                    <div className="py-20 text-center">
                        <p className="text-slate-500 text-sm mb-4">Katalog villa Anda masih kosong.</p>
                        <Link 
                            href="/admin/villas/new" 
                            className="inline-flex bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-[8px]"
                        >
                            Tambah Villa Pertama Anda
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Mobile card view */}
                        <div className="md:hidden divide-y divide-[#dddddd]">
                            {sortedVillas.map((villa) => {
                                const mainPhoto = getMainPhoto(villa);
                                return (
                                    <div key={villa.id} className="p-4 space-y-3">
                                        <div className="flex gap-3">
                                            <div className="w-20 aspect-video rounded-[8px] overflow-hidden bg-[#f7f7f7] border border-[#dddddd] shrink-0">
                                                <img src={mainPhoto} alt={villa.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-[#222222] text-sm truncate">{villa.name}</p>
                                                <span className="text-[10px] text-slate-500 font-semibold block truncate">{villa.slug}</span>
                                                <div className="flex items-center text-slate-500 text-xs mt-0.5">
                                                    <MapPin className="w-3 h-3 mr-0.5 shrink-0" />
                                                    <span className="truncate">{villa.location}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                                            <div className="flex items-center space-x-0.5" title="Kamar Tidur">
                                                <BedDouble className="w-3.5 h-3.5 text-blue-500" />
                                                <span>{villa.bedrooms}</span>
                                            </div>
                                            <div className="flex items-center space-x-0.5" title="Kamar Mandi">
                                                <Bath className="w-3.5 h-3.5 text-blue-500" />
                                                <span>{villa.bathrooms}</span>
                                            </div>
                                            <div className="flex items-center space-x-0.5" title="Kapasitas Tamu">
                                                <Users className="w-3.5 h-3.5 text-blue-500" />
                                                <span>{villa.max_guests}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs">
                                            <span className="font-extrabold text-[#222222] font-mono tabular-nums">
                                                Rp {Number(villa.price_per_night).toLocaleString('id-ID')}
                                            </span>
                                            {villa.weekend_price !== null && (
                                                <span className="text-blue-600 font-semibold text-[10px]">
                                                    | Weekend Rp {Number(villa.weekend_price).toLocaleString('id-ID')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between border-t border-[#dddddd] pt-3">
                                            <button
                                                onClick={() => handleToggleStatus(villa)}
                                                className="focus:outline-none cursor-pointer active:scale-90 transition-transform duration-200"
                                                title={villa.is_active ? 'Klik untuk Nonaktifkan' : 'Klik untuk Aktifkan'}
                                            >
                                                {villa.is_active ? (
                                                    <ToggleRight className="w-9 h-6 text-blue-600" />
                                                ) : (
                                                    <ToggleLeft className="w-9 h-6 text-slate-300" />
                                                )}
                                            </button>
                                            <div className="flex items-center space-x-2">
                                                <a
                                                    href={`/villas/${villa.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-[#f7f7f7] hover:bg-[#eeeeee] text-slate-500 p-1.5 rounded-[8px] border border-[#dddddd] transition-all duration-200 active:scale-95"
                                                    title="Lihat di Website"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                                <Link 
                                                    href={`/admin/villas/edit?id=${villa.id}`}
                                                    className="inline-flex bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold p-2 sm:px-2.5 sm:py-1.5 rounded-[8px] text-xs items-center space-x-1 transition-all duration-200 shrink-0"
                                                    title="Edit Villa"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                    <span className="hidden sm:inline">Edit</span>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-600 border-collapse">
                                <thead>
                                    <tr className="border-b border-[#dddddd] bg-[#f7f7f7] text-slate-500 uppercase font-bold text-[11px] sm:text-xs tracking-wider">
                                        <th className="py-4 px-6 w-20">Foto</th>
                                        <th className="py-4 px-6 cursor-pointer select-none hover:text-blue-600 transition-colors" onClick={() => handleSort('name')}>
                                            <div className="flex items-center gap-1">
                                                Nama Villa <SortIcon field="name" />
                                            </div>
                                        </th>
                                        <th className="py-4 px-6 hidden sm:table-cell cursor-pointer select-none hover:text-blue-600 transition-colors" onClick={() => handleSort('location')}>
                                            <div className="flex items-center gap-1">
                                                Lokasi <SortIcon field="location" />
                                            </div>
                                        </th>
                                        <th className="py-4 px-6 text-center hidden lg:table-cell cursor-pointer select-none hover:text-blue-600 transition-colors" onClick={() => handleSort('bedrooms')}>
                                            <div className="flex items-center justify-center gap-1">
                                                Spek <SortIcon field="bedrooms" />
                                            </div>
                                        </th>
                                        <th className="py-4 px-6 text-right cursor-pointer select-none hover:text-blue-600 transition-colors" onClick={() => handleSort('price_per_night')}>
                                            <div className="flex items-center justify-end gap-1">
                                                Weekday / Malam <SortIcon field="price_per_night" />
                                            </div>
                                        </th>
                                        <th className="py-4 px-6 text-right hidden sm:table-cell cursor-pointer select-none hover:text-blue-600 transition-colors" onClick={() => handleSort('weekend_price')}>
                                            <div className="flex items-center justify-end gap-1">
                                                Weekend / Malam <SortIcon field="weekend_price" />
                                            </div>
                                        </th>
                                        <th className="py-4 px-6 text-center hidden sm:table-cell cursor-pointer select-none hover:text-blue-600 transition-colors" onClick={() => handleSort('is_active')}>
                                            <div className="flex items-center justify-center gap-1">
                                                Status <SortIcon field="is_active" />
                                            </div>
                                        </th>
                                        <th className="py-4 px-6 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedVillas.map((villa) => {
                                        const mainPhoto = getMainPhoto(villa);

                                        return (
                                            <tr key={villa.id} className="border-b border-[#dddddd] hover:bg-[#f7f7f7] transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="w-16 aspect-video rounded-[10px] overflow-hidden bg-[#f7f7f7] border border-[#dddddd] shadow-sm">
                                                        <img src={mainPhoto} alt={villa.name} className="w-full h-full object-cover" />
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <p className="font-bold text-[#222222] text-sm leading-snug">{villa.name}</p>
                                                    <span className="text-[11px] text-slate-400 font-medium">{villa.slug}</span>
                                                </td>
                                                <td className="py-4 px-6 hidden sm:table-cell">
                                                    <div className="flex items-center gap-1.5 text-slate-500">
                                                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                                        <span className="text-sm">{villa.location}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center hidden lg:table-cell">
                                                    <div className="flex items-center justify-center gap-4 text-slate-500">
                                                        <div className="flex items-center gap-1" title="Kamar Tidur">
                                                            <BedDouble className="w-4 h-4 text-blue-500" />
                                                            <span className="text-sm font-semibold text-slate-700">{villa.bedrooms}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1" title="Kamar Mandi">
                                                            <Bath className="w-4 h-4 text-blue-500" />
                                                            <span className="text-sm font-semibold text-slate-700">{villa.bathrooms}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1" title="Kapasitas Tamu">
                                                            <Users className="w-4 h-4 text-blue-500" />
                                                            <span className="text-sm font-semibold text-slate-700">{villa.max_guests}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <span className="font-bold text-[#222222] text-sm font-mono tabular-nums">
                                                        Rp {Number(villa.price_per_night).toLocaleString('id-ID')}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right hidden sm:table-cell">
                                                    <span className="font-bold text-[#222222] text-sm font-mono tabular-nums">
                                                        {villa.weekend_price !== null 
                                                            ? `Rp ${Number(villa.weekend_price).toLocaleString('id-ID')}` 
                                                            : <span className="text-slate-300 font-semibold">—</span>}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center hidden sm:table-cell">
                                                    <button
                                                        onClick={() => handleToggleStatus(villa)}
                                                        className="focus:outline-none cursor-pointer active:scale-90 transition-transform duration-200"
                                                        title={villa.is_active ? 'Klik untuk Nonaktifkan' : 'Klik untuk Aktifkan'}
                                                    >
                                                        {villa.is_active ? (
                                                            <ToggleRight className="w-10 h-6 text-blue-600" />
                                                        ) : (
                                                            <ToggleLeft className="w-10 h-6 text-slate-300" />
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <a
                                                            href={`/villas/${villa.slug}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="bg-[#f7f7f7] hover:bg-[#eeeeee] text-slate-500 p-2 rounded-[10px] border border-[#dddddd] transition-all duration-200 active:scale-95"
                                                            title="Lihat di Website"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                        <Link 
                                                            href={`/admin/villas/edit?id=${villa.id}`}
                                                            className="inline-flex bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-2 px-4 rounded-[10px] text-xs items-center gap-1.5 transition-all duration-200"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                            <span>Edit</span>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
