'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axiosClient from '@/lib/axios';
import FormField from '@/components/ui/FormField';
import PageHeader from '@/components/ui/PageHeader';
import { 
    ArrowLeft, 
    Save, 
    Loader2,
    Plus,
    X,
    Check,
    ChevronDown,
    Star,
    Heart,
    Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { iconCatalog, getIconComponentByKey } from '@/lib/villaIcons';

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

    const [destinationId, setDestinationId] = useState('');
    const [destinations, setDestinations] = useState<any[]>([]);

    // Inline new destination form
    const [showNewDestination, setShowNewDestination] = useState(false);
    const [newDestName, setNewDestName] = useState('');
    const [newDestCity, setNewDestCity] = useState('');
    const [newDestImage, setNewDestImage] = useState('');
    const [savingDestination, setSavingDestination] = useState(false);

    useEffect(() => {
        fetchDestinations();
    }, []);

    const fetchDestinations = async () => {
        try {
            const response = await axiosClient.get('/admin/destinations');
            setDestinations(response.data.data || []);
        } catch (err) {
            console.error('Failed to load destinations:', err);
        }
    };

    const handleCreateDestination = async () => {
        if (!newDestName.trim() || !newDestCity.trim()) {
            toast.error('Nama dan kota destinasi wajib diisi.');
            return;
        }

        setSavingDestination(true);
        try {
            const response = await axiosClient.post('/admin/destinations', {
                name: newDestName.trim(),
                city: newDestCity.trim(),
                query: newDestName.trim(),
                image: newDestImage || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
            });

            toast.success('Destinasi baru berhasil ditambahkan.');
            const newDest = response.data.data || response.data;
            setDestinations(prev => [...prev, newDest]);
            setDestinationId(String(newDest.id));

            // Reset form
            setNewDestName('');
            setNewDestCity('');
            setNewDestImage('');
            setShowNewDestination(false);
        } catch (err: any) {
            console.error('Failed to create destination:', err);
            toast.error(err.response?.data?.message || 'Gagal menambahkan destinasi.');
        } finally {
            setSavingDestination(false);
        }
    };

    const [selectedAmenities, setSelectedAmenities] = useState<Array<{ name: string; icon: string }>>([]);
    const [newAmenityName, setNewAmenityName] = useState('');
    const [newAmenityIcon, setNewAmenityIcon] = useState('Check');
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');

    const [refundableRate, setRefundableRate] = useState('11.11');
    const [cancellationFreeDays, setCancellationFreeDays] = useState('5');
    const [beds, setBeds] = useState('');
    const [cleaningFee, setCleaningFee] = useState('');

    const addAmenity = () => {
        if (!newAmenityName.trim()) {
            toast.error('Nama fasilitas tidak boleh kosong');
            return;
        }
        setSelectedAmenities(prev => [...prev, { name: newAmenityName.trim(), icon: newAmenityIcon }]);
        setNewAmenityName('');
        setNewAmenityIcon('Check');
    };

    const removeAmenity = (index: number) => {
        setSelectedAmenities(prev => prev.filter((_, i) => i !== index));
    };

    const validateForm = () => {
        const errors: any = {};
        if (!name.trim()) errors.name = 'Nama villa wajib diisi.';
        if (!location.trim()) errors.location = 'Alamat/lokasi villa wajib diisi.';
        if (!destinationId) errors.destination_id = 'Destinasi wilayah wajib dipilih.';
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
                destination_id: destinationId ? Number(destinationId) : null,
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
                is_active: isActive,
                refundable_surcharge_rate: Number(refundableRate) / 100,
                cancellation_free_days: Number(cancellationFreeDays),
                beds: beds ? Number(beds) : null,
                cleaning_fee: cleaningFee ? Number(cleaningFee) : null,
            };

            const response = await axiosClient.post('/admin/villas', payload);
            toast.success(response.data.message || 'Villa berhasil ditambahkan!');
            // Redirect to edit page to allow uploading photos
            router.push(`/admin/villas/edit?id=${response.data.villa.id}&tab=photos`);

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
        <div className="space-y-6 max-w-[1400px] mx-auto px-4 sm:px-6">
            <div className="flex items-center space-x-3">
                <Link href="/admin/villas" className="text-[#6a6a6a] hover:text-[#222222] transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-[#222222] tracking-tight">Tambah villa baru</h1>
                    <p className="text-[#6a6a6a] text-xs mt-0.5 font-medium">Definisikan spesifikasi, harga sewa, dan fasilitas properti baru Anda.</p>
                </div>
            </div>

            {/* Tabs Selector segment */}
            <div className="flex border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider space-x-4 sm:space-x-6 overflow-x-auto scrollbar-hide">
                <button 
                    type="button"
                    className="pb-3 border-b-2 border-blue-500 text-blue-600 cursor-pointer"
                >
                    1. Info Detail
                </button>
                <button 
                    type="button"
                    onClick={() => toast.info('Silakan simpan Informasi Dasar terlebih dahulu untuk dapat mengunggah foto.')}
                    className="pb-3 border-b-2 border-transparent text-slate-400 cursor-not-allowed flex items-center space-x-1"
                >
                    <span>2. Galeri Foto</span>
                    <span className="text-[10px]">🔒</span>
                </button>
                <button 
                    type="button"
                    onClick={() => toast.info('Silakan simpan Informasi Dasar terlebih dahulu untuk dapat memblokir tanggal.')}
                    className="pb-3 border-b-2 border-transparent text-slate-400 cursor-not-allowed flex items-center space-x-1"
                >
                    <span>3. Blokir Tanggal</span>
                    <span className="text-[10px]">🔒</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Form Section */}
                <div className="lg:col-span-7 bg-white rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)]">
                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8 transition-all duration-300">
                    
                    {/* 1. General Info */}
                    <div className="space-y-5">
                        <h3 className="text-sm font-semibold text-[#222222] border-b border-[#dddddd] pb-2">Informasi dasar</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Nama villa *</label>
                                <input 
                                    type="text" 
                                    placeholder="Contoh: Villa Kencana Cilember"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold transition-all duration-200 ${
                                        formErrors.name ? 'border-red-500' : 'border-[#dddddd] hover:border-[#bbbbbb]'
                                    }`}
                                />
                                {formErrors.name && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.name}</p>}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Deskripsi singkat card (max 150 karakter) *</label>
                                <input 
                                    type="text" 
                                    placeholder="Tulis deskripsi singkat untuk listing card villa (maksimal 150 karakter)."
                                    value={shortDesc}
                                    onChange={(e) => setShortDesc(e.target.value)}
                                    maxLength={150}
                                    className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold transition-all duration-200 ${
                                        formErrors.short_desc ? 'border-red-500' : 'border-[#dddddd] hover:border-[#bbbbbb]'
                                    }`}
                                />
                                <div className="flex justify-between items-center text-[9px] text-[#6a6a6a] mt-1 font-semibold">
                                    <span>Tampil di halaman katalog.</span>
                                    <span>{shortDesc.length}/150</span>
                                </div>
                                {formErrors.short_desc && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.short_desc}</p>}
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Lokasi / alamat ringkas *</label>
                                <input 
                                    type="text" 
                                    placeholder="Contoh: Cilember, Cisarua, Bogor"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold transition-all duration-200 ${
                                        formErrors.location ? 'border-red-500' : 'border-[#dddddd] hover:border-[#bbbbbb]'
                                    }`}
                                />
                                {formErrors.location && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.location}</p>}
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Destinasi Wilayah *</label>
                                {!showNewDestination ? (
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <select 
                                                value={destinationId}
                                                onChange={(e) => setDestinationId(e.target.value)}
                                                className={`flex-1 bg-slate-50 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold transition-all duration-200 cursor-pointer ${
                                                    formErrors.destination_id ? 'border-red-500' : 'border-[#dddddd] hover:border-[#bbbbbb]'
                                                }`}
                                            >
                                                <option value="">-- Pilih Destinasi --</option>
                                                {destinations.map((dest) => (
                                                    <option key={dest.id} value={dest.id}>{dest.name} ({dest.city})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowNewDestination(true)}
                                            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 underline transition-colors"
                                        >
                                            + Tambah destinasi baru
                                        </button>
                                        {formErrors.destination_id && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.destination_id}</p>}
                                    </div>
                                ) : (
                                    <div className="space-y-2 p-3 border border-blue-200 bg-blue-50/30 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-blue-700">Tambah Destinasi Baru</span>
                                            <button
                                                type="button"
                                                onClick={() => setShowNewDestination(false)}
                                                className="text-[10px] text-slate-400 hover:text-slate-600"
                                            >
                                                Batal
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Nama destinasi *"
                                            value={newDestName}
                                            onChange={(e) => setNewDestName(e.target.value)}
                                            className="w-full bg-white border border-[#dddddd] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Kota/kabupaten *"
                                            value={newDestCity}
                                            onChange={(e) => setNewDestCity(e.target.value)}
                                            className="w-full bg-white border border-[#dddddd] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleCreateDestination}
                                            disabled={savingDestination}
                                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5"
                                        >
                                            {savingDestination ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    <span>Menyimpan...</span>
                                                </>
                                            ) : (
                                                <span>Simpan Destinasi</span>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Google Maps embed URL (iframe src)</label>
                                <input 
                                    type="text" 
                                    placeholder="https://www.google.com/maps/embed?pb=..."
                                    value={mapsUrl}
                                    onChange={(e) => setMapsUrl(e.target.value)}
                                    className="w-full bg-slate-50 border border-[#dddddd] hover:border-[#bbbbbb] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold transition-all duration-200"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Deskripsi lengkap villa *</label>
                            <textarea 
                                rows={5}
                                placeholder="Tulis deskripsi detail villa..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold transition-all duration-200 ${
                                    formErrors.description ? 'border-red-500' : 'border-[#dddddd] hover:border-[#bbbbbb]'
                                }`}
                            />
                            {formErrors.description && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.description}</p>}
                        </div>
                    </div>

                    {/* 2. Specs and Time */}
                    <div className="space-y-5">
                        <h3 className="text-sm font-semibold text-[#222222] border-b border-[#dddddd] pb-2">Spesifikasi &amp; waktu</h3>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Kamar tidur</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={bedrooms}
                                    onChange={(e) => setBedrooms(e.target.value)}
                                    className="w-full bg-slate-50 border border-[#dddddd] hover:border-[#bbbbbb] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono tabular-nums font-semibold transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Tempat tidur (opsional)</label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Total tempat tidur"
                                    value={beds}
                                    onChange={(e) => setBeds(e.target.value)}
                                    className="w-full bg-slate-50 border border-[#dddddd] hover:border-[#bbbbbb] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono tabular-nums font-semibold transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Kamar mandi</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={bathrooms}
                                    onChange={(e) => setBathrooms(e.target.value)}
                                    className="w-full bg-slate-50 border border-[#dddddd] hover:border-[#bbbbbb] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono tabular-nums font-semibold transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Kapasitas tamu</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={maxGuests}
                                    onChange={(e) => setMaxGuests(e.target.value)}
                                    className="w-full bg-slate-50 border border-[#dddddd] hover:border-[#bbbbbb] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono tabular-nums font-semibold transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Min menginap (malam)</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={minNights}
                                    onChange={(e) => setMinNights(e.target.value)}
                                    className="w-full bg-slate-50 border border-[#dddddd] hover:border-[#bbbbbb] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono tabular-nums font-semibold transition-all duration-200"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Jam check-in default</label>
                                <input 
                                    type="time" 
                                    value={checkInTime}
                                    onChange={(e) => setCheckInTime(e.target.value)}
                                    className="w-full bg-slate-50 border border-[#dddddd] hover:border-[#bbbbbb] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono tabular-nums font-semibold transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Jam check-out default</label>
                                <input 
                                    type="time" 
                                    value={checkOutTime}
                                    onChange={(e) => setCheckOutTime(e.target.value)}
                                    className="w-full bg-slate-50 border border-[#dddddd] hover:border-[#bbbbbb] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono tabular-nums font-semibold transition-all duration-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. Pricing */}
                    <div className="space-y-5">
                        <h3 className="text-sm font-semibold text-[#222222] border-b border-[#dddddd] pb-2">Tarif sewa (IDR)</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Harga weekday per malam *</label>
                                <input 
                                    type="number" 
                                    placeholder="Contoh: 2500000"
                                    value={pricePerNight}
                                    onChange={(e) => setPricePerNight(e.target.value)}
                                    className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono tabular-nums font-semibold transition-all duration-200 ${
                                        formErrors.price_per_night ? 'border-red-500' : 'border-[#dddddd] hover:border-[#bbbbbb]'
                                    }`}
                                />
                                {formErrors.price_per_night && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.price_per_night}</p>}
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Harga weekend per malam (opsional)</label>
                                <input
                                    type="number"
                                    placeholder="Kosongkan jika sama dengan harga weekday"
                                    value={weekendPrice}
                                    onChange={(e) => setWeekendPrice(e.target.value)}
                                    className="w-full bg-slate-50 border border-[#dddddd] hover:border-[#bbbbbb] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono tabular-nums font-semibold transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Biaya kebersihan (opsional)</label>
                                <input
                                    type="number"
                                    placeholder="Contoh: 150000"
                                    value={cleaningFee}
                                    onChange={(e) => setCleaningFee(e.target.value)}
                                    className="w-full bg-slate-50 border border-[#dddddd] hover:border-[#bbbbbb] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono tabular-nums font-semibold transition-all duration-200"
                                />
                                <p className="text-[9px] text-[#6a6a6a] mt-1">Biaya sekali bayar di samping harga sewa.</p>
                            </div>
                        </div>
                    </div>

                    {/* Business Config — refundable rate & cancellation */}
                    <div className="space-y-5">
                        <h3 className="text-sm font-semibold text-[#222222] border-b border-[#dddddd] pb-2">Konfigurasi Bisnis</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Surcharge refundable (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={refundableRate}
                                    onChange={(e) => setRefundableRate(e.target.value)}
                                    className="w-full bg-slate-50 border border-[#dddddd] hover:border-[#bbbbbb] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono tabular-nums font-semibold transition-all duration-200"
                                />
                                <p className="text-[9px] text-[#6a6a6a] mt-1">Persentase tambahan jika tamu memilih tarif &quot;Bisa dikembalikan&quot;.</p>
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Batal gratis (hari sebelum check-in)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="60"
                                    value={cancellationFreeDays}
                                    onChange={(e) => setCancellationFreeDays(e.target.value)}
                                    className="w-full bg-slate-50 border border-[#dddddd] hover:border-[#bbbbbb] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono tabular-nums font-semibold transition-all duration-200"
                                />
                                <p className="text-[9px] text-[#6a6a6a] mt-1">Jumlah hari sebelum check-in di mana pembatalan masih gratis.</p>
                            </div>
                        </div>
                    </div>

                    {/* 4. Amenities Dynamic List Editor */}
                    <div className="space-y-5">
                        <h3 className="text-sm font-semibold text-[#222222] border-b border-[#dddddd] pb-2 uppercase tracking-wider">Fasilitas Villa</h3>
                        
                        {/* Current amenities list */}
                        {selectedAmenities.length > 0 && (
                            <div className="space-y-2">
                                {selectedAmenities.map((amenity, idx) => {
                                    const IconComp = getIconComponentByKey(amenity.icon);
                                    return (
                                        <div key={idx} className="flex items-center justify-between bg-slate-50 border border-[#dddddd] rounded-xl p-3">
                                            <div className="flex items-center space-x-3">
                                                <IconComp className="w-5 h-5 text-slate-600" strokeWidth={1.5} />
                                                <span className="text-xs font-semibold text-slate-800">{amenity.name}</span>
                                                <span className="text-[10px] text-slate-400 font-mono">{amenity.icon}</span>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => removeAmenity(idx)}
                                                className="text-red-500 hover:text-red-700 cursor-pointer p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Add new amenity form */}
                        <div className="bg-slate-50 border border-[#dddddd] rounded-xl p-4 space-y-3">
                            <label className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider">Tambah Fasilitas Baru</label>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
                                <div>
                                    <label className="text-[9px] font-semibold text-slate-500 block mb-1">Nama Fasilitas</label>
                                    <input 
                                        type="text" 
                                        value={newAmenityName}
                                        onChange={(e) => setNewAmenityName(e.target.value)}
                                        placeholder="Contoh: Kolam Renang Infinity"
                                        className="w-full bg-white border border-[#dddddd] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                                    />
                                </div>
                                
                                <div className="relative">
                                    <label className="text-[9px] font-semibold text-slate-500 block mb-1">Ikon</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
                                        className="bg-white border border-[#dddddd] hover:border-[#bbbbbb] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer min-w-[140px] flex items-center justify-between"
                                    >
                                        {(() => {
                                            const CurrentIcon = getIconComponentByKey(newAmenityIcon);
                                            const currentItem = iconCatalog.find(i => i.key === newAmenityIcon);
                                            return (
                                                <span className="flex items-center space-x-2">
                                                    <CurrentIcon className="w-4 h-4 text-slate-600 animate-[pulse_1.5s_infinite]" />
                                                    <span>{currentItem?.label || 'Pilih Ikon'}</span>
                                                </span>
                                            );
                                        })()}
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-2" />
                                    </button>

                                    {isIconPickerOpen && (
                                        <>
                                            <div 
                                                className="fixed inset-0 z-10" 
                                                onClick={() => {
                                                    setIsIconPickerOpen(false);
                                                    setIconSearch('');
                                                }}
                                            />
                                            <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <input 
                                                    type="text"
                                                    value={iconSearch}
                                                    onChange={(e) => setIconSearch(e.target.value)}
                                                    placeholder="Cari ikon..."
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                                                    autoFocus
                                                />
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                                                    {iconCatalog
                                                        .filter(item => item.label.toLowerCase().includes(iconSearch.toLowerCase()) || item.key.toLowerCase().includes(iconSearch.toLowerCase()))
                                                        .map((item) => {
                                                            const IconComp = item.component;
                                                            const isSelected = item.key === newAmenityIcon;
                                                            return (
                                                                <button
                                                                    key={item.key}
                                                                    type="button"
                                                                    title={item.label}
                                                                    onClick={() => {
                                                                        setNewAmenityIcon(item.key);
                                                                        setIsIconPickerOpen(false);
                                                                        setIconSearch('');
                                                                    }}
                                                                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all cursor-pointer ${
                                                                        isSelected 
                                                                            ? 'border-blue-500 bg-blue-50 text-blue-600' 
                                                                            : 'border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-600'
                                                                    }`}
                                                                >
                                                                    <IconComp className="w-4 h-4 mb-1" />
                                                                    <span className="text-[8px] font-medium text-center truncate w-full">{item.label}</span>
                                                                </button>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <button 
                                    type="button"
                                    onClick={addAmenity}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Tambah</span>
                                </button>
                            </div>

                            {/* Icon preview */}
                            <div className="flex items-center space-x-2 pt-2 border-t border-slate-200">
                                <span className="text-[9px] font-semibold text-slate-500">Preview:</span>
                                {(() => {
                                    const PreviewIcon = getIconComponentByKey(newAmenityIcon);
                                    return (
                                        <div className="flex items-center space-x-2 bg-white border border-[#dddddd] rounded-lg px-3 py-1.5">
                                            <PreviewIcon className="w-4 h-4 text-slate-600" strokeWidth={1.5} />
                                            <span className="text-xs font-semibold text-slate-700">{newAmenityName || 'Nama fasilitas'}</span>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Rules & Status toggle */}
                    <div className="space-y-5">
                        <h3 className="text-sm font-semibold text-[#222222] border-b border-[#dddddd] pb-2">Kebijakan &amp; status</h3>
                        
                        <div>
                            <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Aturan tambahan villa (jam tenang, dilarang merokok, dll.)</label>
                            <textarea 
                                rows={3}
                                placeholder="Tulis aturan villa dipisahkan dengan baris baru..."
                                value={rules}
                                onChange={(e) => setRules(e.target.value)}
                                className="w-full bg-slate-50 border border-[#dddddd] hover:border-[#bbbbbb] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold transition-all duration-200"
                            />
                        </div>

                        <div className="flex items-center space-x-3 pt-4 border-t border-[#dddddd]">
                            <input 
                                type="checkbox" 
                                id="isActive"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="rounded border-[#dddddd] text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                            />
                            <label htmlFor="isActive" className="text-xs font-semibold text-[#222222] cursor-pointer select-none">
                                Aktifkan villa (tampilkan langsung di katalog website setelah disimpan)
                            </label>
                        </div>
                    </div>

                    {/* Form Buttons */}
                    <div className="pt-6 border-t border-[#dddddd] flex items-center justify-end gap-3 flex-wrap">
                        <Link 
                            href="/admin/villas"
                            className="bg-slate-200 hover:bg-slate-300 text-[#222222] font-bold text-xs py-2.5 px-4 rounded-lg transition-all active:scale-95 text-center"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg  transition-all flex items-center space-x-1.5 disabled:opacity-50 active:scale-95 cursor-pointer"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Simpan &amp; lanjut ke foto</span>
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>

            {/* Right Column: Live Preview Panel */}
            <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-6">
                {/* Header Indicator */}
                <div className="flex items-center justify-between bg-slate-950 text-white rounded-xl px-4 py-3.5 shadow-sm">
                    <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold uppercase tracking-wider">Live Preview Halaman Villa</span>
                    </div>
                    <span className="flex items-center space-x-1 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">LIVE</span>
                    </span>
                </div>

                {/* Preview cards container */}
                <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1 pb-4 scrollbar-thin scrollbar-thumb-slate-200">
                    {/* 1. Catalog Card Preview */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b pb-1.5">Tampilan di Katalog (Card)</h4>
                        
                        <div className="max-w-[320px] mx-auto flex flex-col w-full bg-transparent">
                            <div className="relative aspect-[20/19] w-full overflow-hidden rounded-[12px] bg-[#F7F6F3] border border-[#EAEAEA]">
                                <img
                                    src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80"
                                    alt="Mockup Villa"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-transparent text-white/90"
                                >
                                    <Heart className="w-5 h-5 stroke-white stroke-[2.5px] fill-black/20" />
                                </button>
                            </div>

                            <div className="pt-3 flex flex-col space-y-0.5 bg-transparent text-left">
                                <h3 className="text-[15px] font-bold text-[#111111] leading-tight tracking-tight line-clamp-1">
                                    {name || 'Nama Villa Baru'}
                                </h3>
                                <p className="text-[13px] text-[#787774] leading-normal font-normal m-0">
                                    Villa di {location.split(',')[0].trim() || 'Nama Lokasi'} · Rp {Number(pricePerNight || 0).toLocaleString('id-ID')} / malam
                                </p>
                                {shortDesc && (
                                    <p className="text-[12px] text-[#787774] line-clamp-2 mt-0.5 leading-snug font-normal">
                                        {shortDesc}
                                    </p>
                                )}
                                <div className="flex items-center text-[13px] font-medium text-[#2563EB] leading-normal">
                                    <Star className="w-3 h-3 fill-[#2563EB] text-[#2563EB] mr-0.5 shrink-0" />
                                    <span>4.8 <span className="text-slate-400 text-xs font-normal">(Mock)</span></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Detail Page Mockup */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-5">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b pb-1.5">Tampilan Detail Halaman</h4>

                        {/* Title Section */}
                        <div className="space-y-1 text-left">
                            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-snug">
                                {name || 'Nama Villa Baru Anda'}
                            </h2>
                            <p className="text-xs text-slate-500 font-semibold flex items-center space-x-1">
                                <span>📍 {location || 'Alamat / Lokasi villa...'}</span>
                            </p>
                        </div>

                        {/* Guest Specs Section */}
                        <div className="flex items-center space-x-4 border-y border-slate-100 py-3 text-slate-700 text-xs font-semibold">
                            <div>👥 {maxGuests} Tamu</div>
                            <div className="text-slate-300">|</div>
                            <div>🛏️ {bedrooms} Kamar Tidur</div>
                            <div className="text-slate-300">|</div>
                            <div>🚿 {bathrooms} Kamar Mandi</div>
                        </div>

                        {/* Description Section */}
                        <div className="space-y-1.5 text-xs text-slate-600 text-left">
                            <h5 className="font-bold text-slate-950">Tentang properti ini</h5>
                            <p className="leading-relaxed whitespace-pre-wrap line-clamp-4">
                                {description || 'Deskripsi villa yang lengkap akan muncul di sini...'}
                            </p>
                        </div>

                        {/* Amenities Section */}
                        <div className="space-y-2.5 text-left">
                            <h5 className="text-xs font-bold text-slate-950">Fasilitas yang ditawarkan</h5>
                            {selectedAmenities.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3 text-xs text-slate-700">
                                    {selectedAmenities.slice(0, 6).map((amenity, idx) => {
                                        const IconComp = getIconComponentByKey(amenity.icon);
                                        return (
                                            <div key={idx} className="flex items-center space-x-2">
                                                <IconComp className="w-4 h-4 text-slate-600 shrink-0" strokeWidth={1.5} />
                                                <span className="truncate">{amenity.name}</span>
                                            </div>
                                        );
                                    })}
                                    {selectedAmenities.length > 6 && (
                                        <div className="text-[#2563EB] font-bold text-[10px] uppercase tracking-wider col-span-2 mt-1">
                                            +{selectedAmenities.length - 6} Fasilitas Lainnya
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-[11px] text-slate-400 font-medium italic">Belum ada fasilitas terpilih</p>
                            )}
                        </div>

                        {/* Miniature Sticky Booking Card */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)] text-left">
                            <div className="flex items-baseline justify-between">
                                <div>
                                    <span className="text-sm font-bold text-slate-950">Rp {Number(pricePerNight || 0).toLocaleString('id-ID')}</span>
                                    <span className="text-[10px] text-slate-500 font-medium"> / malam</span>
                                </div>
                                {weekendPrice && (
                                    <div className="text-[10px] text-right font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                        Weekend: Rp {Number(weekendPrice).toLocaleString('id-ID')}
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-600 font-semibold space-y-1.5">
                                <div className="flex justify-between">
                                    <span>Min. Menginap</span>
                                    <span className="text-slate-950 font-bold">{minNights} Malam</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Check-in / Check-out</span>
                                    <span className="text-slate-950 font-bold">{checkInTime} - {checkOutTime}</span>
                                </div>
                                {cleaningFee && (
                                    <div className="flex justify-between">
                                        <span>Biaya Kebersihan</span>
                                        <span className="text-slate-950 font-bold">Rp {Number(cleaningFee).toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
}
