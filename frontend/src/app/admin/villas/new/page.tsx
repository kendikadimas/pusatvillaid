'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axiosClient from '@/lib/axios';
import { 
    ArrowLeft, 
    Home, 
    Save, 
    Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminNewVillaPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<any>({});

    // Form fields states
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [pricePerNight, setPricePerNight] = useState('');
    const [weekendPrice, setWeekendPrice] = useState('');
    const [minNights, setMinNights] = useState('1');
    const [bedrooms, setBedrooms] = useState('1');
    const [bathrooms, setBathrooms] = useState('1');
    const [maxGuests, setMaxGuests] = useState('2');
    const [checkInTime, setCheckInTime] = useState('14:00');
    const [checkOutTime, setCheckOutTime] = useState('12:00');
    const [description, setDescription] = useState('');
    const [shortDesc, setShortDesc] = useState('');
    const [mapsUrl, setMapsUrl] = useState('');
    const [rules, setRules] = useState('');
    const [isActive, setIsActive] = useState(true);

    const availableAmenities = [
        'Kolam Renang', 'WiFi', 'AC', 'Dapur Lengkap', 'BBQ Area', 
        'Water Heater', 'Smart TV', 'Private Jacuzzi', 'Butler Service', 
        'Spa Room', 'Floating Breakfast', 'Karaoke'
    ];
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

    const handleAmenityChange = (amenity: string) => {
        setSelectedAmenities(prev => 
            prev.includes(amenity)
                ? prev.filter(item => item !== amenity)
                : [...prev, amenity]
        );
    };

    const validateForm = () => {
        const errors: any = {};
        if (!name.trim()) errors.name = 'Nama villa wajib diisi.';
        if (!location.trim()) errors.location = 'Alamat/lokasi villa wajib diisi.';
        if (!pricePerNight || Number(pricePerNight) <= 0) {
            errors.price_per_night = 'Harga weekday harus lebih besar dari 0.';
        }
        if (!description.trim()) errors.description = 'Deskripsi villa wajib diisi.';
        if (!shortDesc.trim()) {
            errors.short_desc = 'Deskripsi singkat wajib diisi.';
        } else if (shortDesc.length > 150) {
            errors.short_desc = 'Deskripsi singkat maksimal berisi 150 karakter.';
        }
        if (!checkInTime) errors.check_in_time = 'Jam check-in wajib diisi.';
        if (!checkOutTime) errors.check_out_time = 'Jam check-out wajib diisi.';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error('Silakan periksa kembali isian form Anda.');
            return;
        }

        setSubmitting(true);
        setFormErrors({});

        try {
            const payload = {
                name,
                location,
                price_per_night: Number(pricePerNight),
                weekend_price: weekendPrice ? Number(weekendPrice) : null,
                min_nights: Number(minNights),
                bedrooms: Number(bedrooms),
                bathrooms: Number(bathrooms),
                max_guests: Number(maxGuests),
                check_in_time: checkInTime + ':00',
                check_out_time: checkOutTime + ':00',
                description,
                short_desc: shortDesc,
                maps_url: mapsUrl || null,
                rules: rules || null,
                amenities: selectedAmenities,
                is_active: isActive
            };

            const response = await axiosClient.post('/admin/villas', payload);
            toast.success(response.data.message || 'Villa berhasil ditambahkan!');
            // Redirect to edit page to allow uploading photos
            router.push(`/admin/villas/${response.data.villa.id}/edit`);

        } catch (err: any) {
            console.error('Failed to create villa:', err);
            const errMsg = err.response?.data?.message || 'Gagal menambahkan villa.';
            toast.error(errMsg);
            if (err.response?.data?.errors) {
                setFormErrors(err.response.data.errors);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center space-x-3">
                <Link href="/admin/villas" className="text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tambah Villa Baru</h1>
                    <p className="text-slate-500 text-xs mt-0.5">Definisikan spesifikasi, harga sewa, dan fasilitas properti baru Anda.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
                
                {/* 1. General Info */}
                <div className="space-y-5">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Informasi Dasar</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Nama Villa *</label>
                            <input 
                                type="text" 
                                placeholder="Contoh: Villa Kencana Cilember"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold ${
                                    formErrors.name ? 'border-red-500' : 'border-slate-200'
                                }`}
                            />
                            {formErrors.name && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.name}</p>}
                        </div>

                        <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Deskripsi Singkat Card (Max 150 Karakter) *</label>
                            <input 
                                type="text" 
                                placeholder="Tulis deskripsi singkat untuk listing card villa (maksimal 150 karakter)."
                                value={shortDesc}
                                onChange={(e) => setShortDesc(e.target.value)}
                                maxLength={150}
                                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold ${
                                    formErrors.short_desc ? 'border-red-500' : 'border-slate-200'
                                }`}
                            />
                            <div className="flex justify-between items-center text-[9px] text-slate-400 mt-1 font-semibold">
                                <span>Tampil di halaman katalog.</span>
                                <span>{shortDesc.length}/150</span>
                            </div>
                            {formErrors.short_desc && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.short_desc}</p>}
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Lokasi / Alamat Ringkas *</label>
                            <input 
                                type="text" 
                                placeholder="Contoh: Cilember, Cisarua, Bogor"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold ${
                                    formErrors.location ? 'border-red-500' : 'border-slate-200'
                                }`}
                            />
                            {formErrors.location && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.location}</p>}
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Google Maps Embed URL (Iframe src)</label>
                            <input 
                                type="text" 
                                placeholder="https://www.google.com/maps/embed?pb=..."
                                value={mapsUrl}
                                onChange={(e) => setMapsUrl(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Deskripsi Lengkap Villa *</label>
                        <textarea 
                            rows={5}
                            placeholder="Tulis deskripsi detail villa..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold ${
                                formErrors.description ? 'border-red-500' : 'border-slate-200'
                            }`}
                        />
                        {formErrors.description && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.description}</p>}
                    </div>
                </div>

                {/* 2. Specs and Time */}
                <div className="space-y-5">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Spesifikasi & Waktu</h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Kamar Tidur</label>
                            <input 
                                type="number" 
                                min="1"
                                value={bedrooms}
                                onChange={(e) => setBedrooms(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Kamar Mandi</label>
                            <input 
                                type="number" 
                                min="1"
                                value={bathrooms}
                                onChange={(e) => setBathrooms(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Kapasitas Tamu</label>
                            <input 
                                type="number" 
                                min="1"
                                value={maxGuests}
                                onChange={(e) => setMaxGuests(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Min Menginap (Malam)</label>
                            <input 
                                type="number" 
                                min="1"
                                value={minNights}
                                onChange={(e) => setMinNights(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Default Jam Check-in</label>
                            <input 
                                type="time" 
                                value={checkInTime}
                                onChange={(e) => setCheckInTime(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Default Jam Check-out</label>
                            <input 
                                type="time" 
                                value={checkOutTime}
                                onChange={(e) => setCheckOutTime(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Pricing */}
                <div className="space-y-5">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Tarif Sewa (IDR)</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Harga Weekday per Malam *</label>
                            <input 
                                type="number" 
                                placeholder="Contoh: 2500000"
                                value={pricePerNight}
                                onChange={(e) => setPricePerNight(e.target.value)}
                                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold ${
                                    formErrors.price_per_night ? 'border-red-500' : 'border-slate-200'
                                }`}
                            />
                            {formErrors.price_per_night && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.price_per_night}</p>}
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Harga Weekend per Malam (Opsional)</label>
                            <input 
                                type="number" 
                                placeholder="Kosongkan jika sama dengan harga weekday"
                                value={weekendPrice}
                                onChange={(e) => setWeekendPrice(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                            />
                        </div>
                    </div>
                </div>

                {/* 4. Amenities Checklist */}
                <div className="space-y-5">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Fasilitas Villa</h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {availableAmenities.map((amenity) => {
                            const checked = selectedAmenities.includes(amenity);
                            return (
                                <label 
                                    key={amenity}
                                    className={`flex items-center space-x-2.5 border rounded-xl p-3 text-xs font-semibold cursor-pointer transition-colors ${
                                        checked 
                                            ? 'border-rose-500 bg-rose-50 text-rose-900' 
                                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                    }`}
                                >
                                    <input 
                                        type="checkbox" 
                                        checked={checked}
                                        onChange={() => handleAmenityChange(amenity)}
                                        className="rounded border-slate-350 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5 cursor-pointer"
                                    />
                                    <span>{amenity}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* Rules & Status toggle */}
                <div className="space-y-5">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Kebijakan & Status</h3>
                    
                    <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Aturan Tambahan Villa (Jam tenang, dilarang merokok, dll.)</label>
                        <textarea 
                            rows={3}
                            placeholder="Tulis aturan villa dipisahkan dengan baris baru..."
                            value={rules}
                            onChange={(e) => setRules(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                        />
                    </div>

                    <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
                        <input 
                            type="checkbox" 
                            id="isActive"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor="isActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                            Aktifkan Villa (Tampilkan langsung di katalog website setelah disimpan)
                        </label>
                    </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-6 border-t border-slate-200 flex items-center justify-end space-x-3">
                    <Link 
                        href="/admin/villas"
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-colors text-center"
                    >
                        Batal
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-colors flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Menyimpan...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                <span>Simpan & Lanjut ke Foto</span>
                            </>
                        )}
                    </button>
                </div>

            </form>
        </div>
    );
}
