'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function AdminEditVillaPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    
    const [villa, setVilla] = useState<Villa | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'photos' | 'blocked_dates' | 'advanced' | 'ical'>('info');

    // iCal Links states
    const [icalLinks, setIcalLinks] = useState<any[]>([]);
    const [loadingIcal, setLoadingIcal] = useState(false);
    const [channelName, setChannelName] = useState('airbnb');
    const [icalUrl, setIcalUrl] = useState('');
    const [externalListingId, setExternalListingId] = useState('');
    const [addingIcal, setAddingIcal] = useState(false);
    const [syncingLinkId, setSyncingLinkId] = useState<number | null>(null);

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
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    
    // Photo states
    const [photos, setPhotos] = useState<string[]>([]);
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

    const availableAmenities = [
        'Kolam Renang', 'WiFi', 'AC', 'Dapur Lengkap', 'BBQ Area', 
        'Water Heater', 'Smart TV', 'Private Jacuzzi', 'Butler Service', 
        'Spa Room', 'Floating Breakfast', 'Karaoke'
    ];

    const [submitting, setSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<any>({});

    const fetchVillaDetails = async () => {
        try {
            const response = await axiosClient.get(`/admin/villas/${id}`);
            const v = response.data;
            setVilla(v);
            
            // Set form values
            setName(v.name);
            setLocation(v.location);
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
        fetchIcalLinks();
    }, [id]);

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

    // Fetch iCal links
    const fetchIcalLinks = async () => {
        setLoadingIcal(true);
        try {
            const res = await axiosClient.get(`/admin/villas/${id}/ical-links`);
            setIcalLinks(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch iCal links:', err);
            toast.error('Gagal memuat daftar iCal feed.');
        } finally {
            setLoadingIcal(false);
        }
    };

    // Add iCal link
    const handleAddIcalLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!icalUrl.trim()) {
            toast.error('URL iCal wajib diisi.');
            return;
        }
        if (!icalUrl.startsWith('http://') && !icalUrl.startsWith('https://')) {
            toast.error('URL iCal harus berupa tautan http:// atau https://.');
            return;
        }

        setAddingIcal(true);
        try {
            await axiosClient.post(`/admin/villas/${id}/ical-links`, {
                channel_name: channelName,
                ical_url: icalUrl.trim(),
                external_listing_id: externalListingId.trim() || null
            });
            toast.success('Feed iCal berhasil ditambahkan.');
            setIcalUrl('');
            setExternalListingId('');
            setChannelName('airbnb');
            fetchIcalLinks();
        } catch (err: any) {
            console.error('Failed to add iCal link:', err);
            toast.error(err.response?.data?.message || 'Gagal menambahkan iCal feed.');
        } finally {
            setAddingIcal(false);
        }
    };

    // Delete iCal link
    const handleDeleteIcalLink = async (linkId: number) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus feed iCal ini?')) {
            return;
        }

        try {
            await axiosClient.delete(`/admin/ical-links/${linkId}`);
            toast.success('Feed iCal berhasil dihapus.');
            fetchIcalLinks();
        } catch (err: any) {
            console.error('Failed to delete iCal link:', err);
            toast.error(err.response?.data?.message || 'Gagal menghapus iCal feed.');
        }
    };

    // Manual sync iCal link
    const handleSyncIcalLink = async (linkId: number) => {
        setSyncingLinkId(linkId);
        try {
            const res = await axiosClient.post(`/admin/ical-links/${linkId}/sync`);
            toast.success(res.data.message || 'Sinkronisasi iCal selesai.');
            fetchIcalLinks();
            fetchVillaDetails(); // Refresh blocked dates list in UI
        } catch (err: any) {
            console.error('Failed to sync iCal link:', err);
            toast.error(err.response?.data?.message || 'Gagal sinkronisasi iCal feed.');
        } finally {
            setSyncingLinkId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
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
            <div className="flex border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider space-x-6">
                <button 
                    onClick={() => setActiveTab('info')}
                    className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                        activeTab === 'info' ? 'border-rose-500 text-rose-600' : 'border-transparent hover:text-slate-800'
                    }`}
                >
                    1. Info Detail
                </button>
                <button 
                    onClick={() => setActiveTab('photos')}
                    className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                        activeTab === 'photos' ? 'border-rose-500 text-rose-600' : 'border-transparent hover:text-slate-800'
                    }`}
                >
                    2. Galeri Foto ({photos.length})
                </button>
                <button 
                    onClick={() => setActiveTab('blocked_dates')}
                    className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                        activeTab === 'blocked_dates' ? 'border-rose-500 text-rose-600' : 'border-transparent hover:text-slate-800'
                    }`}
                >
                    3. Blokir Tanggal ({blockedDates.length})
                </button>
                <button 
                    onClick={() => setActiveTab('advanced')}
                    className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                        activeTab === 'advanced' ? 'border-rose-500 text-rose-600' : 'border-transparent hover:text-slate-800'
                    }`}
                >
                    4. Detail Airbnb Style
                </button>
                <button 
                    onClick={() => setActiveTab('ical')}
                    className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                        activeTab === 'ical' ? 'border-rose-500 text-rose-600' : 'border-transparent hover:text-slate-800'
                    }`}
                >
                    5. Kalender Eksternal
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
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold ${
                                        formErrors.location ? 'border-red-500' : 'border-slate-200'
                                    }`}
                                />
                                {formErrors.location && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.location}</p>}
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Google Maps Embed URL</label>
                                <input 
                                    type="text" 
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
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold ${
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
                                    value={weekendPrice}
                                    placeholder="Kosongkan jika sama dengan harga weekday"
                                    onChange={(e) => setWeekendPrice(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Amenities Checklist */}
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
                                                : 'border-slate-200 hover:bg-slate-55 text-slate-600'
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
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Aturan Tambahan Villa</label>
                            <textarea 
                                rows={3}
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
                                Aktifkan Villa (Tampilkan langsung di katalog website)
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
                    <label className="border-2 border-dashed border-slate-200 hover:border-rose-400 bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors relative">
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
                                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                                <span className="text-xs text-slate-500 font-bold">Sedang Mengunggah File...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center space-y-2 text-slate-500 text-center">
                                <Upload className="w-8 h-8 text-rose-500" />
                                <span className="text-xs font-bold text-slate-700">Klik untuk pilih berkas foto</span>
                                <span className="text-[10px] text-slate-400">Pilih satu atau beberapa file sekaligus</span>
                            </div>
                        )}
                    </label>

                    {/* Photos list grid */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Foto Terunggah ({photos.length})</h4>
                        
                        {photos.length === 0 ? (
                            <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
                                Belum ada foto yang diunggah untuk villa ini.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {photos.map((url, index) => (
                                    <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group bg-slate-50">
                                        <img src={url} alt={`Villa Photo ${index}`} className="w-full h-full object-cover" />
                                        
                                        {/* Primary marker badge */}
                                        {index === 0 && (
                                            <span className="absolute top-2 left-2 bg-rose-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-sm">
                                                UTAMA
                                            </span>
                                        )}

                                        {/* Hover Delete Action */}
                                        <button
                                            type="button"
                                            onClick={() => handleDeletePhoto(url)}
                                            className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-700 cursor-pointer"
                                            title="Hapus Foto"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 3. BLOKIR TANGGAL */}
            {activeTab === 'blocked_dates' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider mb-2">Kelola Tanggal Diblokir</h3>
                        <p className="text-slate-500 text-xs">
                            Blokir tanggal tertentu agar tidak dapat dipesan oleh tamu umum (misalnya untuk keperluan pemeliharaan/maintenance, renovasi, atau pemakaian pribadi oleh pemilik).
                        </p>
                    </div>

                    {/* Block Date Form */}
                    <form onSubmit={handleBlockDate} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Pilih Tanggal *</label>
                            <input 
                                type="date" 
                                required
                                value={blockDateInput}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setBlockDateInput(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Alasan Pemblokiran</label>
                            <input 
                                type="text" 
                                placeholder="Contoh: Perbaikan Kolam Renang"
                                value={blockReasonInput}
                                onChange={(e) => setBlockReasonInput(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={blockingDate}
                                className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                            >
                                {blockingDate ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                                <span>Blokir Tanggal Ini</span>
                            </button>
                        </div>
                    </form>

                    {/* Blocked Dates List */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Daftar Tanggal Ditutup ({blockedDates.length})</h4>
                        
                        {blockedDates.length === 0 ? (
                            <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
                                Tidak ada tanggal yang ditutup untuk villa ini saat ini.
                            </div>
                        ) : (
                            <div className="overflow-x-auto border border-slate-150 rounded-xl">
                                <table className="w-full text-xs text-left text-slate-500 border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                                            <th className="py-2.5 px-4">Tanggal ditutup</th>
                                            <th className="py-2.5 px-4">Alasan pemblokiran</th>
                                            <th className="py-2.5 px-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {blockedDates.map((item) => (
                                            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                                <td className="py-3 px-4 font-bold text-slate-900">
                                                    {format(parseISO(item.date), 'dd MMMM yyyy', { locale: localeID })}
                                                </td>
                                                <td className="py-3 px-4 font-medium text-slate-700">{item.reason || 'Maintenance'}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        onClick={() => handleUnblockDate(item.id)}
                                                        className="text-red-500 hover:text-red-750 font-bold flex items-center space-x-1 ml-auto text-xs cursor-pointer"
                                                        title="Hapus Pemblokiran"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        <span>Buka Blokir</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 4. DETAIL AIRBNB STYLE */}
            {activeTab === 'advanced' && (
                <form onSubmit={handleUpdateSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
                    {/* Tuan Rumah Info */}
                    <div className="space-y-5">
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Informasi Tuan Rumah (Host)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Nama Tuan Rumah</label>
                                <input 
                                    type="text" 
                                    value={hostName}
                                    onChange={(e) => setHostName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Lama Menjadi Host (Tahun)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={hostYears}
                                    onChange={(e) => setHostYears(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Label Angkatan/Bergabung (Joined)</label>
                                <input 
                                    type="text" 
                                    value={hostJoinedLabel}
                                    placeholder="Contoh: Mulai menerima tamu tahun 2024"
                                    onChange={(e) => setHostJoinedLabel(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-6">
                                <input 
                                    type="checkbox" 
                                    id="hostIsVerified"
                                    checked={hostIsVerified}
                                    onChange={(e) => setHostIsVerified(e.target.checked)}
                                    className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500"
                                />
                                <label htmlFor="hostIsVerified" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider cursor-pointer">Host Terverifikasi</label>
                            </div>
                            <div className="sm:col-span-4">
                                <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Avatar Tuan Rumah (URL Foto)</label>
                                <input 
                                    type="url" 
                                    value={hostAvatar}
                                    placeholder="https://images.unsplash.com/..."
                                    onChange={(e) => setHostAvatar(e.target.value)}
                                    className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                />
                            </div>
                        </div>

                        {/* Host About Points Editor */}
                        <div className="space-y-3 pt-3 border-t border-slate-100">
                            <label className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider">Tentang Tuan Rumah (Bullet Points)</label>
                            
                            {hostAboutList.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">Belum ada poin deskripsi host.</p>
                            ) : (
                                <ul className="space-y-1.5">
                                    {hostAboutList.map((item, idx) => (
                                        <li key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-150 rounded-xl p-2.5 text-xs text-slate-700">
                                            <span>{item}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => setHostAboutList(prev => prev.filter((_, i) => i !== idx))}
                                                className="text-red-500 hover:text-red-700 cursor-pointer p-1"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="flex space-x-2">
                                <input 
                                    type="text" 
                                    placeholder="Contoh: Lahir di tahun 80-an"
                                    value={hostAboutInput}
                                    onChange={(e) => setHostAboutInput(e.target.value)}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                />
                                <button 
                                    type="button"
                                    onClick={() => {
                                        if (!hostAboutInput.trim()) return;
                                        setHostAboutList(prev => [...prev, hostAboutInput.trim()]);
                                        setHostAboutInput('');
                                    }}
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-4 py-2 rounded-xl flex items-center space-x-1 cursor-pointer shrink-0"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Tambah Poin</span>
                                </button>
                            </div>
                        </div>

                        {/* Co-Hosts List Editor */}
                        <div className="space-y-3 pt-3 border-t border-slate-100">
                            <label className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider">Rekan Tuan Rumah (Co-Hosts)</label>
                            
                            {coHostsList.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">Belum ada rekan tuan rumah.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {coHostsList.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-150 rounded-xl p-2.5">
                                            <div className="flex items-center space-x-2.5">
                                                <img src={item.avatar} alt={item.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                                                <span className="text-xs font-bold text-slate-800">{item.name}</span>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => setCoHostsList(prev => prev.filter((_, i) => i !== idx))}
                                                className="text-red-500 hover:text-red-700 cursor-pointer p-1"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end bg-slate-50 p-4 border border-slate-200 rounded-xl">
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Nama Rekan Host</label>
                                    <input 
                                        type="text" 
                                        placeholder="Contoh: Lita"
                                        value={coHostNameInput}
                                        onChange={(e) => setCoHostNameInput(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">URL Foto Avatar Rekan</label>
                                    <input 
                                        type="url" 
                                        placeholder="https://images.unsplash.com/..."
                                        value={coHostAvatarInput}
                                        onChange={(e) => setCoHostAvatarInput(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
                                    />
                                </div>
                                <div className="sm:col-span-3 flex justify-end">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (!coHostNameInput.trim() || !coHostAvatarInput.trim()) {
                                                toast.error('Nama dan Avatar URL rekan wajib diisi.');
                                                return;
                                            }
                                            setCoHostsList(prev => [...prev, { name: coHostNameInput.trim(), avatar: coHostAvatarInput.trim() }]);
                                            setCoHostNameInput('');
                                            setCoHostAvatarInput('');
                                        }}
                                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Tambah Rekan</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Highlights */}
                    <div className="space-y-5">
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Sorotan Villa (Highlights)</h3>
                        
                        {/* List of current highlights */}
                        <div className="space-y-3">
                            {highlightsList.length === 0 ? (
                                <p className="text-xs text-slate-400 font-semibold italic">Belum ada sorotan villa. Gunakan form di bawah untuk menambahkan.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {highlightsList.map((hl, idx) => (
                                        <div key={idx} className="flex items-start justify-between border border-slate-150 rounded-xl p-3 bg-slate-50">
                                            <div className="flex items-start space-x-3 text-xs">
                                                <span className="p-1.5 bg-white rounded-lg border border-slate-200 text-rose-500 font-bold shrink-0">
                                                    {hl.icon}
                                                </span>
                                                <div>
                                                    <h5 className="font-bold text-slate-900">{hl.title}</h5>
                                                    <p className="text-[11px] text-slate-500 leading-normal mt-0.5">{hl.description}</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setHighlightsList(prev => prev.filter((_, i) => i !== idx))}
                                                className="text-red-500 hover:text-red-705 p-1 cursor-pointer shrink-0"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add Highlight Form Box */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Pilih Ikon</label>
                                <select 
                                    value={hlIcon}
                                    onChange={(e) => setHlIcon(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold cursor-pointer"
                                >
                                    <option value="Wind">Kipas / AC (Wind)</option>
                                    <option value="Key">Check-in Mandiri (Key)</option>
                                    <option value="Car">Parkir Gratis (Car)</option>
                                    <option value="Shield">Keamanan (Shield)</option>
                                    <option value="Waves">Kolam Renang (Waves)</option>
                                    <option value="Trophy">Terfavorit (Trophy)</option>
                                    <option value="Coffee">Sarapan (Coffee)</option>
                                    <option value="Sparkles">Estetik (Sparkles)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Judul Sorotan</label>
                                <input 
                                    type="text" 
                                    placeholder="Contoh: Dirancang agar tetap sejuk"
                                    value={hlTitle}
                                    onChange={(e) => setHlTitle(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Subteks / Deskripsi</label>
                                <input 
                                    type="text" 
                                    placeholder="Contoh: Atasi hawa panas dengan AC dan kipas."
                                    value={hlDesc}
                                    onChange={(e) => setHlDesc(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
                                />
                            </div>
                            <div className="sm:col-span-3 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!hlTitle.trim() || !hlDesc.trim()) {
                                            toast.error('Judul dan Deskripsi sorotan wajib diisi.');
                                            return;
                                        }
                                        setHighlightsList(prev => [...prev, { icon: hlIcon, title: hlTitle, description: hlDesc }]);
                                        setHlTitle('');
                                        setHlDesc('');
                                    }}
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg flex items-center space-x-1 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Tambah Sorotan</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Kamar Tidur Info */}
                    <div className="space-y-5">
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Informasi Kamar Tidur ("Kamar Anda")</h3>
                        
                        {/* List of bedrooms */}
                        <div className="space-y-3">
                            {bedroomsList.length === 0 ? (
                                <p className="text-xs text-slate-400 font-semibold italic">Belum ada rincian kamar tidur. Gunakan form di bawah untuk menambahkan.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {bedroomsList.map((br, idx) => (
                                        <div key={idx} className="border border-slate-150 rounded-xl overflow-hidden bg-slate-50 flex flex-col justify-between">
                                            <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                                                <img src={br.image} alt={br.title} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setBedroomsList(prev => prev.filter((_, i) => i !== idx))}
                                                    className="absolute top-2 right-2 bg-red-600 text-white hover:bg-red-700 p-1.5 rounded-lg shadow-sm cursor-pointer"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="p-3 text-xs">
                                                <h5 className="font-bold text-slate-905">{br.title}</h5>
                                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{br.subtext}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add Bedroom Form Box */}
                        <div className="bg-slate-55 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                            <div className="sm:col-span-3">
                                <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">URL Foto Kamar *</label>
                                <input 
                                    type="url" 
                                    placeholder="https://images.unsplash.com/photo-..."
                                    value={brImage}
                                    onChange={(e) => setBrImage(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Nama / Label Kamar</label>
                                <input 
                                    type="text" 
                                    placeholder="Contoh: Kamar tidur 1"
                                    value={brTitle}
                                    onChange={(e) => setBrTitle(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Keterangan Tempat Tidur</label>
                                <input 
                                    type="text" 
                                    placeholder="Contoh: 1 tempat tidur king"
                                    value={brSubtext}
                                    onChange={(e) => setBrSubtext(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
                                />
                            </div>
                            <div className="sm:col-span-3 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!brImage.trim() || !brTitle.trim() || !brSubtext.trim()) {
                                            toast.error('URL Foto, Judul Kamar, dan Detail tempat tidur wajib diisi.');
                                            return;
                                        }
                                        setBedroomsList(prev => [...prev, { image: brImage, title: brTitle, subtext: brSubtext }]);
                                        setBrImage('');
                                        setBrTitle('');
                                        setBrSubtext('');
                                    }}
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg flex items-center space-x-1 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Tambah Kamar</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Fitur Aksesibilitas */}
                    <div className="space-y-5">
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Fitur Aksesibilitas</h3>
                        
                        {/* List of accessibility features */}
                        <div className="space-y-3">
                            {accessList.length === 0 ? (
                                <p className="text-xs text-slate-400 font-semibold italic">Belum ada fitur aksesibilitas. Gunakan form di bawah untuk menambahkan.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {accessList.map((ac, idx) => (
                                        <div key={idx} className="border border-slate-150 rounded-xl overflow-hidden bg-slate-55 flex flex-col justify-between">
                                            <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                                                <img src={ac.image} alt={ac.title} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setAccessList(prev => prev.filter((_, i) => i !== idx))}
                                                    className="absolute top-2 right-2 bg-red-650 text-white hover:bg-red-750 p-1.5 rounded-lg shadow-sm cursor-pointer"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="p-3 text-xs">
                                                <h5 className="font-bold text-slate-900">{ac.title}</h5>
                                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{ac.subtext}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add Access Feature Form Box */}
                        <div className="bg-slate-55 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                            <div className="sm:col-span-3">
                                <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">URL Foto Fitur Aksesibilitas *</label>
                                <input 
                                    type="url" 
                                    placeholder="https://images.unsplash.com/photo-..."
                                    value={acImage}
                                    onChange={(e) => setAcImage(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Nama Fitur</label>
                                <input 
                                    type="text" 
                                    placeholder="Contoh: Pintu masuk dan parkir tamu"
                                    value={acTitle}
                                    onChange={(e) => setAcTitle(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Deskripsi Singkat Fitur</label>
                                <input 
                                    type="text" 
                                    placeholder="Contoh: Tempat parkir penyandang disabilitas"
                                    value={acSubtext}
                                    onChange={(e) => setAcSubtext(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
                                />
                            </div>
                            <div className="sm:col-span-3 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!acImage.trim() || !acTitle.trim() || !acSubtext.trim()) {
                                            toast.error('URL Foto, Judul Fitur, dan Deskripsi Fitur wajib diisi.');
                                            return;
                                        }
                                        setAccessList(prev => [...prev, { image: acImage, title: acTitle, subtext: acSubtext }]);
                                        setAcImage('');
                                        setAcTitle('');
                                        setAcSubtext('');
                                    }}
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg flex items-center space-x-1 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Tambah Fitur</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Kebijakan Pembatalan */}
                    <div className="space-y-4 pt-5 border-t border-slate-105">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Kebijakan Pembatalan</h3>
                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Keterangan Kebijakan Pembatalan</label>
                            <textarea 
                                rows={3}
                                placeholder="Contoh: Pembatalan gratis selama 24 jam. Setelahnya, biaya reservasi tidak dapat dikembalikan..."
                                value={cancellationPolicy}
                                onChange={(e) => setCancellationPolicy(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                            />
                        </div>
                    </div>

                    {/* Keselamatan & Properti */}
                    <div className="space-y-4 pt-5 border-t border-slate-105">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Keselamatan & Properti</h3>
                        
                        {safetyList.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Belum ada item keselamatan & properti.</p>
                        ) : (
                            <ul className="space-y-1.5">
                                {safetyList.map((item, idx) => (
                                    <li key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-150 rounded-xl p-2.5 text-xs text-slate-700">
                                        <span>{item}</span>
                                        <button 
                                            type="button" 
                                            onClick={() => setSafetyList(prev => prev.filter((_, i) => i !== idx))}
                                            className="text-red-500 hover:text-red-700 cursor-pointer p-1"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="flex space-x-2">
                            <input 
                                type="text" 
                                placeholder="Contoh: Alarm asap tidak dilaporkan"
                                value={safetyInput}
                                onChange={(e) => setSafetyInput(e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                            />
                            <button 
                                type="button"
                                onClick={() => {
                                    if (!safetyInput.trim()) return;
                                    setSafetyList(prev => [...prev, safetyInput.trim()]);
                                    setSafetyInput('');
                                }}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-4 py-2 rounded-xl flex items-center space-x-1 cursor-pointer shrink-0"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Tambah Item</span>
                            </button>
                        </div>
                    </div>

                    {/* Deskripsi Lingkungan */}
                    <div className="space-y-4 pt-5 border-t border-slate-105">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Deskripsi Lingkungan & Kegiatan Menarik</h3>
                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Hal menarik di lingkungan tinggal</label>
                            <textarea 
                                rows={3}
                                placeholder="Contoh: Terletak di pusat distrik pariwisata Yogyakarta, di mana Anda bisa berjalan-jalan untuk menemukan restoran lokal..."
                                value={neighborhoodDesc}
                                onChange={(e) => setNeighborhoodDesc(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                            />
                        </div>
                    </div>

                    {/* Submit Buttons */}
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
                                    <span>Simpan Perubahan</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}

            {/* TAB CONTENT: 5. KALENDER EKSTERNAL */}
            {activeTab === 'ical' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8 animate-in fade-in duration-200">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider mb-2">Sinkronisasi Kalender Eksternal (iCal)</h3>
                        <p className="text-slate-500 text-xs">
                            Hubungkan kalender villa Anda dengan platform eksternal seperti Airbnb, Booking.com, Agoda, dll. Tanggal yang terpesan di platform luar akan otomatis diblokir di website ini secara real-time.
                        </p>
                    </div>

                    {/* Info Alert Box */}
                    <div className="bg-blue-50/70 border border-blue-150 rounded-2xl p-4 flex items-start space-x-3 text-xs text-blue-900 leading-relaxed">
                        <span className="text-base shrink-0">💡</span>
                        <div>
                            <span className="font-bold block mb-1">Cara mendapatkan iCal URL:</span>
                            <ul className="list-disc list-inside space-y-1 ml-1 font-semibold text-blue-800">
                                <li>Airbnb: Kalender listing &rarr; Export Kalender &rarr; salin tautan .ics</li>
                                <li>Booking.com: Properti &rarr; Kalender &rarr; iCal &rarr; Export</li>
                                <li>Kalender akan disinkronisasi otomatis setiap 15 menit.</li>
                                <li>Booking yang dibatalkan di platform lain otomatis akan dibuka kembali.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Connected Feeds List */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Feed Terhubung ({icalLinks.length})</h4>
                        
                        {loadingIcal ? (
                            <div className="flex justify-center items-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                            </div>
                        ) : icalLinks.length === 0 ? (
                            <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
                                Belum ada kalender eksternal yang dihubungkan untuk villa ini.
                            </div>
                        ) : (
                            <div className="overflow-x-auto border border-slate-150 rounded-xl">
                                <table className="w-full text-xs text-left text-slate-500 border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                                            <th className="py-2.5 px-4">Platform</th>
                                            <th className="py-2.5 px-4">iCal URL</th>
                                            <th className="py-2.5 px-4">Listing ID</th>
                                            <th className="py-2.5 px-4">Status</th>
                                            <th className="py-2.5 px-4">Last Synced</th>
                                            <th className="py-2.5 px-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {icalLinks.map((item) => {
                                            const isAirbnb = item.channel_name === 'airbnb';
                                            const isBooking = item.channel_name === 'booking_com' || item.channel_name === 'booking.com';
                                            
                                            let badgeStyle = "bg-slate-50 text-slate-700 border-slate-200";
                                            let badgeText = item.channel_name;
                                            
                                            if (isAirbnb) {
                                                badgeStyle = "bg-rose-50 text-rose-750 border-rose-200 text-rose-700";
                                                badgeText = "Airbnb";
                                            } else if (isBooking) {
                                                badgeStyle = "bg-blue-50 text-blue-750 border-blue-200 text-blue-700";
                                                badgeText = "Booking.com";
                                            } else if (item.channel_name === 'vrbo') {
                                                badgeStyle = "bg-indigo-50 text-indigo-750 border-indigo-200 text-indigo-700";
                                                badgeText = "VRBO";
                                            } else if (item.channel_name === 'agoda') {
                                                badgeStyle = "bg-purple-50 text-purple-750 border-purple-200 text-purple-700";
                                                badgeText = "Agoda";
                                            }
                                            
                                            let statusStyle = "bg-slate-50 text-slate-700 border-slate-200";
                                            if (item.sync_status === 'active') {
                                                statusStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
                                            } else if (item.sync_status === 'error') {
                                                statusStyle = "bg-red-50 text-red-700 border-red-200";
                                            } else if (item.sync_status === 'paused') {
                                                statusStyle = "bg-amber-50 text-amber-700 border-amber-200";
                                            }

                                            return (
                                                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-55">
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${badgeStyle}`}>
                                                            {badgeText}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-slate-800 max-w-[200px] truncate" title={item.ical_url}>
                                                        {item.ical_url}
                                                    </td>
                                                    <td className="py-3 px-4 font-medium text-slate-400">
                                                        {item.external_listing_id || '-'}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${statusStyle}`} title={item.last_error || undefined}>
                                                            {item.sync_status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-medium text-slate-500">
                                                        {item.last_synced_at 
                                                            ? format(parseISO(item.last_synced_at), 'dd MMM yyyy HH:mm') 
                                                            : 'Belum pernah'}
                                                    </td>
                                                    <td className="py-3 px-4 text-right flex items-center justify-end space-x-3">
                                                        <button
                                                            disabled={syncingLinkId !== null}
                                                            onClick={() => handleSyncIcalLink(item.id)}
                                                            className="text-rose-600 hover:text-rose-750 font-bold flex items-center space-x-1 text-xs cursor-pointer disabled:opacity-50"
                                                            title="Sinkronisasi sekarang"
                                                        >
                                                            {syncingLinkId === item.id ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <RefreshCw className="w-3.5 h-3.5" />
                                                            )}
                                                            <span>Sync Sekarang</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteIcalLink(item.id)}
                                                            className="text-red-500 hover:text-red-700 font-bold flex items-center space-x-1 text-xs cursor-pointer"
                                                            title="Hapus feed"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            <span>Hapus</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Add Feed Form */}
                    <div className="pt-6 border-t border-slate-200">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Hubungkan Kalender Baru</h4>
                        
                        <form onSubmit={handleAddIcalLink} className="bg-slate-55 border border-slate-200 rounded-2xl p-5 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Platform *</label>
                                    <select 
                                        value={channelName}
                                        onChange={(e) => setChannelName(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold cursor-pointer"
                                    >
                                        <option value="airbnb">Airbnb</option>
                                        <option value="booking_com">Booking.com</option>
                                        <option value="vrbo">VRBO</option>
                                        <option value="agoda">Agoda</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">iCal URL Feed *</label>
                                    <input 
                                        type="url" 
                                        required
                                        placeholder="https://www.airbnb.com/calendar/ical/..."
                                        value={icalUrl}
                                        onChange={(e) => setIcalUrl(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                    />
                                </div>

                                <div className="sm:col-span-3">
                                    <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">ID Listing Eksternal (Opsional)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Misalnya Airbnb Listing ID atau Booking.com Hotel ID"
                                        value={externalListingId}
                                        onChange={(e) => setExternalListingId(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={addingIcal}
                                    className="bg-slate-900 hover:bg-black text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md transition-colors flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    {addingIcal ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Menambahkan Feed...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            <span>Hubungkan Feed Kalender</span>
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
