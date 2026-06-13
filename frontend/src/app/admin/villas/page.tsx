'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axiosClient from '@/lib/axios';
import { Villa } from '@/types';
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
    ExternalLink 
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminVillasPage() {
    const [villas, setVillas] = useState<Villa[]>([]);
    const [loading, setLoading] = useState(true);

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Katalog Villa</h1>
                    <p className="text-slate-500 text-sm mt-1">Kelola konten deskripsi, galeri foto, fasilitas, harga sewa, dan penutupan tanggal villa.</p>
                </div>
                <Link
                    href="/admin/villas/new"
                    className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                    <Plus className="w-4.5 h-4.5" />
                    <span>Tambah Villa Baru</span>
                </Link>
            </div>

            {/* Table or Cards grid */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                    </div>
                ) : villas.length === 0 ? (
                    <div className="py-20 text-center">
                        <p className="text-slate-400 text-sm mb-4">Katalog villa Anda masih kosong.</p>
                        <Link 
                            href="/admin/villas/new" 
                            className="inline-flex bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
                        >
                            Tambah Villa Pertama Anda
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left text-slate-500 border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                                    <th className="py-3 px-4 w-16">Foto</th>
                                    <th className="py-3 px-4">Nama Villa</th>
                                    <th className="py-3 px-4">Lokasi</th>
                                    <th className="py-3 px-4 text-center">Spek</th>
                                    <th className="py-3 px-4 text-right">Weekday / Malam</th>
                                    <th className="py-3 px-4 text-right">Weekend / Malam</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {villas.map((villa) => {
                                    const mainPhoto = villa.photos && villa.photos.length > 0 
                                        ? villa.photos[0] 
                                        : 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=80&q=80';

                                    return (
                                        <tr key={villa.id} className="border-b border-slate-150 hover:bg-slate-55/50">
                                            <td className="py-3 px-4">
                                                <div className="w-14 aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                                                    <img src={mainPhoto} alt={villa.name} className="w-full h-full object-cover" />
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="font-bold text-slate-900 text-sm">{villa.name}</p>
                                                <span className="text-[10px] text-slate-400 font-semibold">{villa.slug}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center text-slate-600">
                                                    <MapPin className="w-3.5 h-3.5 mr-0.5 text-slate-400" />
                                                    <span>{villa.location}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center font-medium">
                                                <div className="flex items-center justify-center space-x-3 text-slate-600">
                                                    <div className="flex items-center space-x-0.5" title="Kamar Tidur">
                                                        <BedDouble className="w-3.5 h-3.5 text-rose-500" />
                                                        <span>{villa.bedrooms}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-0.5" title="Kamar Mandi">
                                                        <Bath className="w-3.5 h-3.5 text-rose-500" />
                                                        <span>{villa.bathrooms}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-0.5" title="Kapasitas Tamu">
                                                        <Users className="w-3.5 h-3.5 text-rose-500" />
                                                        <span>{villa.max_guests}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                                                Rp {Number(villa.price_per_night).toLocaleString('id-ID')}
                                            </td>
                                            <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                                                {villa.weekend_price !== null 
                                                    ? `Rp ${Number(villa.weekend_price).toLocaleString('id-ID')}` 
                                                    : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    onClick={() => handleToggleStatus(villa)}
                                                    className="focus:outline-none cursor-pointer"
                                                    title={villa.is_active ? 'Klik untuk Nonaktifkan' : 'Klik untuk Aktifkan'}
                                                >
                                                    {villa.is_active ? (
                                                        <ToggleRight className="w-9 h-6 text-rose-600" />
                                                    ) : (
                                                        <ToggleLeft className="w-9 h-6 text-slate-300" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4 text-right space-x-2">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <a
                                                        href={`/villas/${villa.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-lg border border-slate-200 transition-colors"
                                                        title="Lihat di Website"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                    <Link 
                                                        href={`/admin/villas/${villa.id}/edit`}
                                                        className="inline-flex bg-rose-600 hover:bg-rose-700 text-white font-bold py-1.5 px-2.5 rounded-lg text-xs items-center space-x-1"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
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
                )}
            </div>
        </div>
    );
}
