'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosClient from '@/lib/axios';
import { Villa, BlockedDate } from '@/types';
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { 
    ArrowLeft, 
    Home, 
    Save, 
    Loader2,
    Image as ImageIcon,
    Upload,
    Trash2,
    Calendar,
    Plus,
    X,
    Check,
    RefreshCw,
    ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { iconCatalog, getIconComponentByKey } from '@/lib/villaIcons';
import { getPhotoUrl, getPhotoDesc } from '@/lib/villaUtils';

function AdminEditVillaContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id') || '';
    const tab = searchParams.get('tab');
    const router = useRouter();
    
    const [villa, setVilla] = useState<Villa | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'photos' | 'blocked_dates'>('info');

    useEffect(() => {
        if (tab === 'photos') {
            setActiveTab('photos');
        } else if (tab === 'blocked_dates') {
            setActiveTab('blocked_dates');
        }
    }, [tab]);

    // General Info states
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

    useEffect(() => {
        const fetchDestinations = async () => {
            try {
                const response = await axiosClient.get('/admin/destinations');
                setDestinations(response.data);
            } catch (err) {
                console.error('Failed to load destinations:', err);
            }
        };
        fetchDestinations();
    }, []);

    const [selectedAmenities, setSelectedAmenities] = useState<Array<{ name: string; icon: string }>>([]);
    const [newAmenityName, setNewAmenityName] = useState('');
    const [newAmenityIcon, setNewAmenityIcon] = useState('Check');
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    
    // Photo states
    const [photos, setPhotos] = useState<Array<string | { url: string; description: string }>>([]);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    
    // Blocked Dates states
    const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
    const [blockDateInput, setBlockDateInput] = useState('');
    const [blockReasonInput, setBlockReasonInput] = useState('');
    const [blockingDate, setBlockingDate] = useState(false);

    // Advanced Layout (Airbnb Style) states
    const [hostName, setHostName] = useState('Admin');
    const [hostYears, setHostYears] = useState(1);
    const [hostAvatar, setHostAvatar] = useState('');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [hostJoinedLabel, setHostJoinedLabel] = useState('');
    const [hostIsVerified, setHostIsVerified] = useState(true);
    
    const [hostAboutList, setHostAboutList] = useState<string[]>([]);
    const [hostAboutInput, setHostAboutInput] = useState('');

    const [coHostsList, setCoHostsList] = useState<Array<{ name: string; avatar: string }>>([]);
    const [coHostNameInput, setCoHostNameInput] = useState('');
    const [coHostAvatarInput, setCoHostAvatarInput] = useState('');

    const [cancellationPolicy, setCancellationPolicy] = useState('');
    const [safetyList, setSafetyList] = useState<string[]>([]);
    const [safetyInput, setSafetyInput] = useState('');
    const [neighborhoodDesc, setNeighborhoodDesc] = useState('');
    
    const [highlightsList, setHighlightsList] = useState<Array<{ icon: string; title: string; description: string }>>([]);
    const [hlIcon, setHlIcon] = useState('Wind');
    const [hlTitle, setHlTitle] = useState('');
    const [hlDesc, setHlDesc] = useState('');

    const [bedroomsList, setBedroomsList] = useState<Array<{ image: string; title: string; subtext: string }>>([]);
    const [brImage, setBrImage] = useState('');
    const [brTitle, setBrTitle] = useState('');
    const [brSubtext, setBrSubtext] = useState('');

    const [accessList, setAccessList] = useState<Array<{ image: string; title: string; subtext: string }>>([]);
    const [acImage, setAcImage] = useState('');
    const [acTitle, setAcTitle] = useState('');
    const [acSubtext, setAcSubtext] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<any>({});

    const fetchVillaDetails = async () => {
        try {
            const response = await axiosClient.get(`/admin/villas/${id}`);
            const v = response.data;
            setVilla(v);
            
            setName(v.name);
            setLocation(v.location);
            setDestinationId(v.destination_id ? String(v.destination_id) : '');
            setPricePerNight(String(Number(v.price_per_night)));
            setWeekendPrice(v.weekend_price ? String(Number(v.weekend_price)) : '');
            setMinNights(String(v.min_nights));
            setBedrooms(String(v.bedrooms));
            setBathrooms(String(v.bathrooms));
            setMaxGuests(String(v.max_guests));
            setCheckInTime(v.check_in_time.substring(0, 5));
            setCheckOutTime(v.check_out_time.substring(0, 5));
            setDescription(v.description || '');
            setShortDesc(v.short_desc || '');
            setMapsUrl(v.maps_url || '');
            setRules(v.rules || '');
            setIsActive(v.is_active);
            setSelectedAmenities(v.amenities || []);
            setPhotos(v.photos || []);

            // Set blocked dates list
            setBlockedDates(v.blocked_dates || []);

            // Set advanced layouts
            setHostName(v.host_name || 'Admin');
            setHostYears(v.host_years || 1);
            setHostAvatar(v.host_avatar || '');
            setHostJoinedLabel(v.host_joined_label || '');
            setHostIsVerified(v.host_is_verified !== false);
            setHostAboutList(v.host_about || []);
            setCoHostsList(v.co_hosts || []);
            setCancellationPolicy(v.cancellation_policy || '');
            setSafetyList(v.safety_property || []);
            setNeighborhoodDesc(v.neighborhood_desc || '');
            
            setHighlightsList(v.highlights || []);
            setBedroomsList(v.bedrooms_info || []);
            setAccessList(v.accessibility_features || []);
        } catch (err) {
            console.error('Failed to load villa:', err);
            toast.error('Gagal memuat data detail villa.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVillaDetails();
    }, [id]);

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

    const handleUpdateSubmit = async (e: React.FormEvent) => {
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
                // Advanced Layout Details
                host_name: hostName,
                host_years: Number(hostYears),
                host_avatar: hostAvatar || null,
                host_joined_label: hostJoinedLabel || null,
                host_is_verified: hostIsVerified,
                host_about: hostAboutList,
                co_hosts: coHostsList,
                cancellation_policy: cancellationPolicy || null,
                safety_property: safetyList,
                neighborhood_desc: neighborhoodDesc || null,
                highlights: highlightsList,
                bedrooms_info: bedroomsList,
                accessibility_features: accessList
            };

            await axiosClient.put(`/admin/villas/${id}`, payload);
            toast.success('Detail villa berhasil diperbarui!');
            fetchVillaDetails();

        } catch (err: any) {
            console.error('Failed to update villa:', err);
            const errMsg = err.response?.data?.message || 'Gagal memperbarui data villa.';
            toast.error(errMsg);
            if (err.response?.data?.errors) {
                setFormErrors(err.response.data.errors);
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Upload files handler
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingPhotos(true);
        const formData = new FormData();
        
        for (let i = 0; i < files.length; i++) {
            formData.append('photos[]', files[i]);
        }

        try {
            const response = await axiosClient.post(`/admin/villas/${id}/photos`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setPhotos(response.data.photos || []);
            toast.success('Foto villa berhasil diunggah.');
        } catch (err: any) {
            console.error('Upload photos failed:', err);
            toast.error(err.response?.data?.message || 'Gagal mengunggah foto.');
        } finally {
            setUploadingPhotos(false);
        }
    };

    // Upload host avatar handler
    const handleHostAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await axiosClient.post(`/admin/villas/${id}/host-avatar`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setHostAvatar(response.data.host_avatar);
            toast.success('Avatar tuan rumah berhasil diunggah.');
        } catch (err: any) {
            console.error('Upload avatar failed:', err);
            toast.error(err.response?.data?.message || 'Gagal mengunggah avatar.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    // Delete photo handler
    const handleDeletePhoto = async (photoUrl: string) => {
        try {
            const response = await axiosClient.delete(`/admin/villas/${id}/photos`, {
                data: { photo_url: photoUrl }
            });
            setPhotos(response.data.photos || []);
            toast.success('Foto villa berhasil dihapus.');
        } catch (err: any) {
            console.error('Delete photo failed:', err);
            toast.error(err.response?.data?.message || 'Gagal menghapus foto.');
        }
    };

    const [savingPhotos, setSavingPhotos] = useState(false);

    const handlePhotoDescriptionChange = (index: number, newDesc: string) => {
        setPhotos(prev => {
            const updated = [...prev];
            const item = updated[index];
            if (typeof item === 'string') {
                updated[index] = { url: item, description: newDesc };
            } else {
                updated[index] = { ...item, description: newDesc };
            }
            return updated;
        });
    };

    const savePhotoGallery = async () => {
        setSavingPhotos(true);
        try {
            const normalizedPhotos = photos.map(photo => {
                if (typeof photo === 'string') {
                    return { url: photo, description: '' };
                }
                return { url: photo.url, description: photo.description || '' };
            });

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
                is_active: isActive,
                photos: normalizedPhotos,
                host_name: hostName,
                host_years: Number(hostYears),
                host_avatar: hostAvatar || null,
                host_joined_label: hostJoinedLabel || null,
                host_is_verified: hostIsVerified,
                host_about: hostAboutList,
                co_hosts: coHostsList,
                cancellation_policy: cancellationPolicy || null,
                safety_property: safetyList,
                neighborhood_desc: neighborhoodDesc || null,
                highlights: highlightsList,
                bedrooms_info: bedroomsList,
                accessibility_features: accessList
            };

            await axiosClient.put(`/admin/villas/${id}`, payload);
            toast.success('Deskripsi foto berhasil disimpan!');
            fetchVillaDetails();
        } catch (err: any) {
            console.error('Failed to update photos:', err);
            toast.error(err.response?.data?.message || 'Gagal menyimpan deskripsi foto.');
        } finally {
            setSavingPhotos(false);
        }
    };

    // Block Date handler
    const handleBlockDate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!blockDateInput) {
            toast.error('Silakan tentukan tanggal pemblokiran.');
            return;
        }

        setBlockingDate(true);
        try {
            const response = await axiosClient.post('/admin/blocked-dates', {
                villa_id: id,
                date: blockDateInput,
                reason: blockReasonInput || 'Maintenance / Pemeliharaan'
            });

            toast.success(response.data.message || 'Tanggal berhasil diblokir.');
            setBlockDateInput('');
            setBlockReasonInput('');
            
            // Refresh list
            fetchVillaDetails();
        } catch (err: any) {
            console.error('Failed to block date:', err);
            toast.error(err.response?.data?.message || 'Gagal memblokir tanggal.');
        } finally {
            setBlockingDate(false);
        }
    };

    // Unblock Date handler
    const handleUnblockDate = async (blockedDateId: number) => {
        try {
            await axiosClient.delete(`/admin/blocked-dates/${blockedDateId}`);
            toast.success('Pemblokiran tanggal berhasil dibatalkan.');
            
            // Refresh list
            fetchVillaDetails();
        } catch (err: any) {
            console.error('Failed to unblock date:', err);
            toast.error(err.response?.data?.message || 'Gagal membatalkan pemblokiran.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center space-x-3">
                <Link href="/admin/villas" className="text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Edit Villa: {name}</h1>
                    <p className="text-slate-500 text-xs mt-0.5">Ubah spesifikasi villa, unggah foto galeri, atau kelola pemblokiran jadwal.</p>
                </div>
            </div>

            {/* Tabs Selector segment */}
            <div className="flex border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider space-x-6 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('info')}
                    className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                        activeTab === 'info' ? 'border-blue-500 text-blue-600' : 'border-transparent hover:text-slate-800'
                    }`}
                >
                    1. Info Detail
                </button>
                <button 
                    onClick={() => setActiveTab('photos')}
                    className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                        activeTab === 'photos' ? 'border-blue-500 text-blue-600' : 'border-transparent hover:text-slate-800'
                    }`}
                >
                    2. Galeri Foto ({photos.length})
                </button>
                <button 
                    onClick={() => setActiveTab('blocked_dates')}
                    className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                        activeTab === 'blocked_dates' ? 'border-blue-500 text-blue-600' : 'border-transparent hover:text-slate-800'
                    }`}
                >
                    3. Blokir Tanggal ({blockedDates.length})
                </button>
            </div>

            {/* TAB CONTENT: 1. INFO DETAIL */}
            {activeTab === 'info' && (
                <form onSubmit={handleUpdateSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
                    
                    {/* General Info */}
                    <div className="space-y-5">
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Informasi Dasar</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Nama Villa *</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold ${
                                        formErrors.name ? 'border-red-500' : 'border-slate-200'
                                    }`}
                                />
                                {formErrors.name && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.name}</p>}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Deskripsi Singkat Card (Max 150 Karakter) *</label>
                                <input 
                                    type="text" 
                                    value={shortDesc}
                                    onChange={(e) => setShortDesc(e.target.value)}
                                    maxLength={150}
                                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold ${
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
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold ${
                                        formErrors.location ? 'border-red-500' : 'border-slate-200'
                                    }`}
                                />
                                {formErrors.location && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.location}</p>}
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Destinasi Wilayah *</label>
                                <select 
                                    value={destinationId}
                                    onChange={(e) => setDestinationId(e.target.value)}
                                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold transition-all duration-200 cursor-pointer ${
                                        formErrors.destination_id ? 'border-red-500' : 'border-slate-200'
                                    }`}
                                >
                                    <option value="">-- Pilih Destinasi --</option>
                                    {destinations.map((dest) => (
                                        <option key={dest.id} value={dest.id}>{dest.name} ({dest.city})</option>
                                    ))}
                                </select>
                                {formErrors.destination_id && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.destination_id}</p>}
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Google Maps Embed URL</label>
                                <input 
                                    type="text" 
                                    value={mapsUrl}
                                    onChange={(e) => setMapsUrl(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Deskripsi Lengkap Villa *</label>
                            <textarea 
                                rows={5}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold ${
                                    formErrors.description ? 'border-red-500' : 'border-slate-200'
                                }`}
                            />
                            {formErrors.description && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.description}</p>}
                        </div>
                    </div>

                    {/* Specs and Time */}
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
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Kamar Mandi</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={bathrooms}
                                    onChange={(e) => setBathrooms(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Kapasitas Tamu</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={maxGuests}
                                    onChange={(e) => setMaxGuests(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Min Menginap (Malam)</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={minNights}
                                    onChange={(e) => setMinNights(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Default Jam Check-in</label>
                                <input 
                                    type="time" 
                                    value={checkInTime}
                                    onChange={(e) => setCheckInTime(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Default Jam Check-out</label>
                                <input 
                                    type="time" 
                                    value={checkOutTime}
                                    onChange={(e) => setCheckOutTime(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-5">
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Tarif Sewa (IDR)</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Harga Weekday per Malam *</label>
                                <input 
                                    type="number" 
                                    value={pricePerNight}
                                    onChange={(e) => setPricePerNight(e.target.value)}
                                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold ${
                                        formErrors.price_per_night ? 'border-red-500' : 'border-slate-200'
                                    }`}
                                />
                                {formErrors.price_per_night && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.price_per_night}</p>}
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Harga Weekend per Malam (Opsional)</label>
                                <input 
                                    type="number" 
                                    value={weekendPrice}
                                    placeholder="Kosongkan jika sama dengan harga weekday"
                                    onChange={(e) => setWeekendPrice(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Amenities Dynamic List Editor */}
                    <div className="space-y-5">
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Fasilitas Villa</h3>
                        
                        {/* Current amenities list */}
                        {selectedAmenities.length > 0 && (
                            <div className="space-y-2">
                                {selectedAmenities.map((amenity, idx) => {
                                    const IconComp = getIconComponentByKey(amenity.icon);
                                    return (
                                        <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
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
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                            <label className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider">Tambah Fasilitas Baru</label>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
                                <div>
                                    <label className="text-[9px] font-semibold text-slate-500 block mb-1">Nama Fasilitas</label>
                                    <input 
                                        type="text" 
                                        value={newAmenityName}
                                        onChange={(e) => setNewAmenityName(e.target.value)}
                                        placeholder="Contoh: Kolam Renang Infinity"
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                                    />
                                </div>
                                
                                <div className="relative">
                                    <label className="text-[9px] font-semibold text-slate-500 block mb-1">Ikon</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
                                        className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer min-w-[140px] flex items-center justify-between"
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
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer whitespace-nowrap"
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
                                        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
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
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Kebijakan & Status</h3>
                        
                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Aturan Tambahan Villa</label>
                            <textarea 
                                rows={3}
                                value={rules}
                                onChange={(e) => setRules(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                            />
                        </div>

                        <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
                            <input 
                                type="checkbox" 
                                id="isActive"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                            />
                            <label htmlFor="isActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                                Aktifkan Villa (Tampilkan langsung di katalog website)
                            </label>
                        </div>
                    </div>

                    {/* Tuan Rumah */}
                    <div className="space-y-5">
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Tuan Rumah</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Nama</label>
                                <input type="text" value={hostName} onChange={(e) => setHostName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Tahun Jadi Host</label>
                                <input type="number" min="0" value={hostYears} onChange={(e) => setHostYears(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Joined Label</label>
                                <input type="text" value={hostJoinedLabel} placeholder="Mulai menerima tamu 2024" onChange={(e) => setHostJoinedLabel(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold" />
                            </div>
                            <div className="flex items-center space-x-2 pt-6">
                                <input type="checkbox" id="hostIsVerified" checked={hostIsVerified} onChange={(e) => setHostIsVerified(e.target.checked)} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                                <label htmlFor="hostIsVerified" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider cursor-pointer">Host Terverifikasi</label>
                            </div>
                            <div className="sm:col-span-4 space-y-2">
                                <label className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider">Avatar Tuan Rumah</label>
                                <div className="flex items-center space-x-4">
                                    <div className="relative w-16 h-16 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                        {hostAvatar ? (
                                            <img src={hostAvatar} alt="Host Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider text-center p-1">Kosong</span>
                                        )}
                                        {uploadingAvatar && (
                                            <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center space-x-2">
                                            <label className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors">
                                                <Upload className="w-3.5 h-3.5" />
                                                <span>Unggah Foto</span>
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    onChange={handleHostAvatarUpload} 
                                                    className="hidden" 
                                                    disabled={uploadingAvatar} 
                                                />
                                            </label>
                                            {hostAvatar && (
                                                <button
                                                    type="button"
                                                    onClick={() => setHostAvatar('')}
                                                    className="border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 text-slate-600 font-bold text-[10px] px-3 py-2 rounded-xl transition-colors cursor-pointer"
                                                >
                                                    Hapus
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-[9px] text-slate-400">Rekomendasi rasio 1:1, maks 2MB (JPG, PNG, WebP).</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100">
                            <label className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider mb-3">Tentang Tuan Rumah (Bullet Points)</label>
                            {hostAboutList.length > 0 && (
                                <ul className="space-y-1.5 mb-3">
                                    {hostAboutList.map((item, idx) => (
                                        <li key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800">
                                            <span>{item}</span>
                                            <button type="button" onClick={() => setHostAboutList(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 cursor-pointer p-1"><X className="w-3.5 h-3.5" /></button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="flex space-x-2">
                                <input type="text" placeholder="Contoh: Lahir di tahun 80-an" value={hostAboutInput} onChange={(e) => setHostAboutInput(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold" />
                                <button type="button" onClick={() => { if (!hostAboutInput.trim()) return; setHostAboutList(prev => [...prev, hostAboutInput.trim()]); setHostAboutInput(''); }} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-4 py-2 rounded-xl flex items-center space-x-1 cursor-pointer shrink-0"><Plus className="w-3.5 h-3.5" /><span>Tambah</span></button>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100">
                            <label className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider mb-3">Co-Hosts</label>
                            {coHostsList.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                    {coHostsList.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                                            <div className="flex items-center space-x-2.5">
                                                <img src={item.avatar} alt={item.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                                                <span className="text-xs font-bold text-slate-800">{item.name}</span>
                                            </div>
                                            <button type="button" onClick={() => setCoHostsList(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 cursor-pointer p-1"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end bg-slate-50 p-4 border border-slate-200 rounded-xl">
                                <div>
                                    <label className="text-[9px] font-bold text-slate-600 block mb-1 uppercase tracking-wider">Nama</label>
                                    <input type="text" placeholder="Lita" value={coHostNameInput} onChange={(e) => setCoHostNameInput(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-[9px] font-bold text-slate-600 block mb-1 uppercase tracking-wider">Avatar URL</label>
                                    <input type="url" placeholder="https://..." value={coHostAvatarInput} onChange={(e) => setCoHostAvatarInput(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold" />
                                </div>
                                <div className="sm:col-span-3 flex justify-end">
                                    <button type="button" onClick={() => { if (!coHostNameInput.trim() || !coHostAvatarInput.trim()) { toast.error('Nama dan Avatar URL wajib diisi.'); return; } setCoHostsList(prev => [...prev, { name: coHostNameInput.trim(), avatar: coHostAvatarInput.trim() }]); setCoHostNameInput(''); setCoHostAvatarInput(''); }} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl flex items-center space-x-1 cursor-pointer"><Plus className="w-3.5 h-3.5" /><span>Tambah Co-Host</span></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Highlights */}
                    <div className="space-y-5">
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Sorotan Villa</h3>
                        {highlightsList.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {highlightsList.map((hl, idx) => (
                                    <div key={idx} className="flex items-start justify-between border border-slate-200 rounded-xl p-3 bg-slate-50">
                                        <div className="flex items-start space-x-3 text-xs">
                                            <span className="p-1.5 bg-white rounded-lg border border-slate-200 text-blue-500 font-bold shrink-0">{hl.icon}</span>
                                            <div><h5 className="font-bold text-slate-800">{hl.title}</h5><p className="text-[11px] text-slate-500 mt-0.5">{hl.description}</p></div>
                                        </div>
                                        <button type="button" onClick={() => setHighlightsList(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 p-1 cursor-pointer shrink-0"><X className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                            <div>
                                <label className="text-[9px] font-bold text-slate-600 block mb-1 uppercase tracking-wider">Ikon</label>
                                <select value={hlIcon} onChange={(e) => setHlIcon(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold cursor-pointer">
                                    <option value="Wind">Kipas/AC</option><option value="Key">Check-in</option><option value="Car">Parkir</option><option value="Shield">Keamanan</option><option value="Waves">Kolam</option><option value="Trophy">Favorit</option><option value="Coffee">Sarapan</option><option value="Sparkles">Estetik</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-600 block mb-1 uppercase tracking-wider">Judul</label>
                                <input type="text" placeholder="Dirancang agar sejuk" value={hlTitle} onChange={(e) => setHlTitle(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold" />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-600 block mb-1 uppercase tracking-wider">Deskripsi</label>
                                <input type="text" placeholder="Atasi panas dengan AC..." value={hlDesc} onChange={(e) => setHlDesc(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold" />
                            </div>
                            <div className="sm:col-span-3 flex justify-end">
                                <button type="button" onClick={() => { if (!hlTitle.trim() || !hlDesc.trim()) { toast.error('Judul dan Deskripsi wajib diisi.'); return; } setHighlightsList(prev => [...prev, { icon: hlIcon, title: hlTitle, description: hlDesc }]); setHlTitle(''); setHlDesc(''); }} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] py-1.5 px-3 rounded-xl flex items-center space-x-1 cursor-pointer"><Plus className="w-3.5 h-3.5" /><span>Tambah</span></button>
                            </div>
                        </div>
                    </div>

                    {/* Kamar Tidur */}
                    <div className="space-y-5">
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Kamar Tidur</h3>
                        {bedroomsList.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {bedroomsList.map((br, idx) => (
                                    <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                                        <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                                            <img src={br.image} alt={br.title} className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => setBedroomsList(prev => prev.filter((_, i) => i !== idx))} className="absolute top-2 right-2 bg-red-600 text-white hover:bg-red-700 p-1.5 rounded-lg cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                        <div className="p-3 text-xs"><h5 className="font-bold text-slate-800">{br.title}</h5><p className="text-[10px] text-slate-500 mt-0.5">{br.subtext}</p></div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                            <div className="sm:col-span-3">
                                <label className="text-[9px] font-bold text-slate-600 block mb-1 uppercase tracking-wider">URL Foto Kamar</label>
                                <input type="url" placeholder="https://..." value={brImage} onChange={(e) => setBrImage(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold" />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-600 block mb-1 uppercase tracking-wider">Nama Kamar</label>
                                <input type="text" placeholder="Kamar tidur 1" value={brTitle} onChange={(e) => setBrTitle(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-[9px] font-bold text-slate-600 block mb-1 uppercase tracking-wider">Keterangan Tempat Tidur</label>
                                <input type="text" placeholder="1 tempat tidur king" value={brSubtext} onChange={(e) => setBrSubtext(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold" />
                            </div>
                            <div className="sm:col-span-3 flex justify-end">
                                <button type="button" onClick={() => { if (!brImage.trim() || !brTitle.trim() || !brSubtext.trim()) { toast.error('Semua field Kamar wajib diisi.'); return; } setBedroomsList(prev => [...prev, { image: brImage, title: brTitle, subtext: brSubtext }]); setBrImage(''); setBrTitle(''); setBrSubtext(''); }} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] py-1.5 px-3 rounded-xl flex items-center space-x-1 cursor-pointer"><Plus className="w-3.5 h-3.5" /><span>Tambah</span></button>
                            </div>
                        </div>
                    </div>

                    {/* Aksesibilitas */}
                    <div className="space-y-5">
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Fitur Aksesibilitas</h3>
                        {accessList.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {accessList.map((ac, idx) => (
                                    <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                                        <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                                            <img src={ac.image} alt={ac.title} className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => setAccessList(prev => prev.filter((_, i) => i !== idx))} className="absolute top-2 right-2 bg-red-600 text-white hover:bg-red-700 p-1.5 rounded-lg cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                        <div className="p-3 text-xs"><h5 className="font-bold text-slate-800">{ac.title}</h5><p className="text-[10px] text-slate-500 mt-0.5">{ac.subtext}</p></div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                            <div className="sm:col-span-3">
                                <label className="text-[9px] font-bold text-slate-600 block mb-1 uppercase tracking-wider">URL Foto Fitur</label>
                                <input type="url" placeholder="https://..." value={acImage} onChange={(e) => setAcImage(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold" />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-600 block mb-1 uppercase tracking-wider">Nama Fitur</label>
                                <input type="text" placeholder="Pintu masuk" value={acTitle} onChange={(e) => setAcTitle(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-[9px] font-bold text-slate-600 block mb-1 uppercase tracking-wider">Deskripsi</label>
                                <input type="text" placeholder="Tempat parkir disabilitas" value={acSubtext} onChange={(e) => setAcSubtext(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold" />
                            </div>
                            <div className="sm:col-span-3 flex justify-end">
                                <button type="button" onClick={() => { if (!acImage.trim() || !acTitle.trim() || !acSubtext.trim()) { toast.error('Semua field Fitur wajib diisi.'); return; } setAccessList(prev => [...prev, { image: acImage, title: acTitle, subtext: acSubtext }]); setAcImage(''); setAcTitle(''); setAcSubtext(''); }} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] py-1.5 px-3 rounded-xl flex items-center space-x-1 cursor-pointer"><Plus className="w-3.5 h-3.5" /><span>Tambah</span></button>
                            </div>
                        </div>
                    </div>

                    {/* Kebijakan & Lingkungan */}
                    <div className="space-y-5">
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Kebijakan & Lingkungan</h3>
                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Kebijakan Pembatalan</label>
                            <textarea rows={2} placeholder="Pembatalan gratis selama 24 jam..." value={cancellationPolicy} onChange={(e) => setCancellationPolicy(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Keselamatan & Properti</label>
                            {safetyList.length > 0 && (
                                <ul className="space-y-1.5 mb-3">
                                    {safetyList.map((item, idx) => (
                                        <li key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800">
                                            <span>{item}</span>
                                            <button type="button" onClick={() => setSafetyList(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 cursor-pointer p-1"><X className="w-3.5 h-3.5" /></button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="flex space-x-2">
                                <input type="text" placeholder="Alarm asap tidak dilaporkan" value={safetyInput} onChange={(e) => setSafetyInput(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold" />
                                <button type="button" onClick={() => { if (!safetyInput.trim()) return; setSafetyList(prev => [...prev, safetyInput.trim()]); setSafetyInput(''); }} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-4 py-2 rounded-xl flex items-center space-x-1 cursor-pointer shrink-0"><Plus className="w-3.5 h-3.5" /><span>Tambah</span></button>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Deskripsi Lingkungan</label>
                            <textarea rows={2} placeholder="Hal menarik di lingkungan sekitar..." value={neighborhoodDesc} onChange={(e) => setNeighborhoodDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold" />
                        </div>
                    </div>

                    {/* Form Buttons */}
                    <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3 flex-wrap">
                        <Link 
                            href="/admin/villas"
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-colors text-center"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-colors flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Simpan Perubahan</span>
                                </>
                            )}
                        </button>
                    </div>

                </form>
            )}

            {/* TAB CONTENT: 2. GALERI FOTO */}
            {activeTab === 'photos' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider mb-2">Unggah Foto Villa</h3>
                        <p className="text-slate-500 text-xs">
                            Unggah foto properti (JPG, PNG, atau WEBP, Maksimal 5MB per file). Foto pertama di urutan galeri akan otomatis dijadikan foto utama di katalog.
                        </p>
                    </div>

                    {/* Uploader drag-drop board */}
                    <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors relative">
                        <input 
                            type="file" 
                            multiple
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={uploadingPhotos}
                            className="hidden"
                        />
                        {uploadingPhotos ? (
                            <div className="flex flex-col items-center space-y-2">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                <span className="text-xs text-slate-500 font-bold">Sedang Mengunggah File...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center space-y-2 text-slate-500 text-center">
                                <Upload className="w-8 h-8 text-blue-500" />
                                <span className="text-xs font-bold text-slate-700">Klik untuk pilih berkas foto</span>
                                <span className="text-[10px] text-slate-400">Pilih satu atau beberapa file sekaligus</span>
                            </div>
                        )}
                    </label>

                    {/* Photos list grid */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Foto Terunggah ({photos.length})</h4>
                            {photos.length > 0 && (
                                <button
                                    type="button"
                                    onClick={savePhotoGallery}
                                    disabled={savingPhotos}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-sm transition-colors flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    {savingPhotos ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-3.5 h-3.5" />
                                            <span>Simpan Deskripsi Foto</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                        
                        {photos.length === 0 ? (
                            <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
                                Belum ada foto yang diunggah untuk villa ini.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {photos.map((photo, index) => {
                                    const photoUrl = getPhotoUrl(photo);
                                    return (
                                        <div key={index} className="flex flex-col border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow group">
                                            <div className="relative aspect-video bg-slate-50 overflow-hidden">
                                                <img src={photoUrl} alt={`Villa Photo ${index}`} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                                                
                                                {/* Primary marker badge */}
                                                {index === 0 && (
                                                    <span className="absolute top-2.5 left-2.5 bg-blue-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md shadow-sm z-10">
                                                        UTAMA
                                                    </span>
                                                )}
          
                                                {/* Delete Action */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeletePhoto(photoUrl)}
                                                    className="absolute top-2.5 right-2.5 bg-red-600 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-700 cursor-pointer z-10"
                                                    title="Hapus Foto"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            
                                            {/* Photo Caption Field */}
                                            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex flex-col space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deskripsi / Caption Foto</label>
                                                <input 
                                                    type="text"
                                                    value={getPhotoDesc(photo)}
                                                    onChange={(e) => handlePhotoDescriptionChange(index, e.target.value)}
                                                    placeholder="Contoh: Kamar tidur utama dengan kasur king size..."
                                                    className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {photos.length > 0 && (
                            <div className="flex justify-end pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={savePhotoGallery}
                                    disabled={savingPhotos}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md transition-colors flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    {savingPhotos ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Simpan Deskripsi Foto</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}

export default function AdminEditVillaPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center py-32"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
            <AdminEditVillaContent />
        </Suspense>
    );
}
