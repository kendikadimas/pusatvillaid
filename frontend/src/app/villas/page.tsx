'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import axiosClient from '@/lib/axios';
import { Villa } from '@/types';
import { 
    Star, 
    MapPin, 
    BedDouble, 
    Bath, 
    Users, 
    ArrowRight,
    Loader2,
    SlidersHorizontal,
    Heart,
    LayoutGrid,
    Waves,
    Mountain,
    Crown,
    Home as HomeIcon,
    Trophy,
    Map as MapIcon,
    List as ListIcon
} from 'lucide-react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

// Dynamically import MapComponent to prevent SSR window reference crashes in Leaflet
const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

const categories = [
    { id: 'all', name: 'Semua Villa', icon: LayoutGrid },
    { id: 'pool', name: 'Kolam Pribadi', icon: Waves, filter: (v: Villa) => v.amenities?.includes('Kolam Renang') },
    { id: 'mountain', name: 'Pegunungan', icon: Mountain, filter: (v: Villa) => v.location?.includes('Bogor') || v.description?.includes('gunung') || v.location?.includes('Puncak') },
    { id: 'luxury', name: 'Mewah & Butler', icon: Crown, filter: (v: Villa) => v.amenities?.includes('Butler Service') || v.price_per_night > 3000000 },
    { id: 'couple', name: 'Romantis / Pasangan', icon: Heart, filter: (v: Villa) => v.max_guests <= 4 },
    { id: 'family', name: 'Keluarga Besar', icon: HomeIcon, filter: (v: Villa) => v.bedrooms >= 3 },
];

interface LatLng {
    lat: number;
    lng: number;
}

// Function to resolve villa coordinates based on maps_url or general location matching
const getCoordinates = (villa: Villa): LatLng => {
    // 1. Try parsing from Google Maps embed URL
    if (villa.maps_url) {
        const embedMatch = villa.maps_url.match(/!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/);
        if (embedMatch) {
            return { lat: parseFloat(embedMatch[2]), lng: parseFloat(embedMatch[1]) };
        }
        
        const queryMatch = villa.maps_url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (queryMatch) {
            return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]) };
        }
    }

    // 2. Predefined mock coordinates based on seeded villa slugs for absolute stability
    const fallbackCoords: Record<string, LatLng> = {
        'pulas-private-villa-prawiro-oleh-fulton': { lat: -7.8155986, lng: 110.3707788 },
        'villa-kencana-cilember': { lat: -6.685419, lng: 106.931720 },
        'puncak-vista-cabin': { lat: -6.702717, lng: 106.983944 },
        'ubud-sanctuary-pool-villa': { lat: -8.519227, lng: 115.247291 },
    };

    if (fallbackCoords[villa.slug]) {
        return fallbackCoords[villa.slug];
    }

    // 3. Stable offset resolver based on general location text
    const loc = villa.location.toLowerCase();
    
    // Stable pseudo-random generator based on villa ID so coordinates don't change on render
    const pseudoRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    const seedVal = villa.id;
    const latOffset = (pseudoRandom(seedVal) - 0.5) * 0.04;
    const lngOffset = (pseudoRandom(seedVal + 1) - 0.5) * 0.04;

    if (loc.includes('yogyakarta') || loc.includes('sleman') || loc.includes('bantul') || loc.includes('mergangsan')) {
        return { lat: -7.79558 + latOffset, lng: 110.36949 + lngOffset };
    }
    if (loc.includes('bogor') || loc.includes('cilember') || loc.includes('cisarua') || loc.includes('puncak')) {
        return { lat: -6.6888 + latOffset, lng: 106.9294 + lngOffset };
    }
    if (loc.includes('bali') || loc.includes('ubud') || loc.includes('gianyar') || loc.includes('sayan')) {
        return { lat: -8.5069 + latOffset, lng: 115.2625 + lngOffset };
    }

    // Default to central Yogyakarta area
    return { lat: -7.79558 + latOffset, lng: 110.36949 + lngOffset };
};

function VillasCatalogContent() {
    const searchParams = useSearchParams();
    const checkInParam = searchParams.get('checkIn') || '';
    const checkOutParam = searchParams.get('checkOut') || '';
    const locationParam = searchParams.get('location') || '';

    const [villas, setVillas] = useState<Villa[]>([]);
    const [loading, setLoading] = useState(true);
    const [wishlist, setWishlist] = useState<number[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    
    // Interactive syncing states
    const [hoveredVillaId, setHoveredVillaId] = useState<number | null>(null);
    const [selectedVillaId, setSelectedVillaId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list'); // mobile view mode toggler

    // Filter & Sort States
    const [locationInput, setLocationInput] = useState(locationParam);
    const [bedrooms, setBedrooms] = useState('');
    const [guests, setGuests] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const saved = localStorage.getItem('pusatvilla_wishlist');
        if (saved) {
            try {
                setWishlist(JSON.parse(saved));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    const toggleWishlist = (id: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        let updated;
        if (wishlist.includes(id)) {
            updated = wishlist.filter(item => item !== id);
            toast.success('Dihapus dari daftar keinginan');
        } else {
            updated = [...wishlist, id];
            toast.success('Disimpan ke daftar keinginan!');
        }
        setWishlist(updated);
        localStorage.setItem('pusatvilla_wishlist', JSON.stringify(updated));
    };

    const fetchVillas = async () => {
        setLoading(true);
        try {
            const params: any = {
                page: currentPage,
                sort_by: sortBy,
                sort_order: sortOrder,
            };

            if (locationInput) params.location = locationInput;
            if (bedrooms) params.bedrooms = bedrooms;
            if (guests) params.guests = guests;
            if (minPrice) params.min_price = minPrice;
            if (maxPrice) params.max_price = maxPrice;

            const response = await axiosClient.get('/villas', { params });
            setVillas(response.data.data || []);
            setTotalPages(response.data.meta?.last_page || 1);
        } catch (err) {
            console.error('Failed to fetch villas:', err);
            toast.error('Gagal memuat katalog villa.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVillas();
    }, [currentPage, sortBy, sortOrder]);

    const handleApplyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchVillas();
    };

    const handleResetFilters = () => {
        setLocationInput('');
        setBedrooms('');
        setGuests('');
        setMinPrice('');
        maxPrice && setMaxPrice('');
        setSelectedCategory('all');
        setSortBy('created_at');
        setSortOrder('desc');
        setCurrentPage(1);
        setSelectedVillaId(null);
        setTimeout(() => fetchVillas(), 0);
    };

    const handleSortChange = (value: string) => {
        if (value === 'price_asc') {
            setSortBy('price_per_night');
            setSortOrder('asc');
        } else if (value === 'price_desc') {
            setSortBy('price_per_night');
            setSortOrder('desc');
        } else if (value === 'bedrooms_desc') {
            setSortBy('bedrooms');
            setSortOrder('desc');
        } else {
            setSortBy('created_at');
            setSortOrder('desc');
        }
    };

    const filteredVillas = villas.filter(v => {
        const cat = categories.find(c => c.id === selectedCategory);
        if (!cat || cat.id === 'all') return true;
        return cat.filter ? cat.filter(v) : true;
    });

    return (
        <div className="flex-1 flex flex-col bg-white text-slate-900 font-sans h-screen overflow-hidden">
            {/* Airbnb Style Sticky Header */}
            <header className="flex-none h-20 bg-white border-b border-slate-200/80 z-50 sticky top-0">
                <div className="w-full h-full px-6 lg:px-10 flex items-center justify-between">
                    {/* Left: Brand Logo */}
                    <div className="flex-1 flex justify-start">
                        <Link href="/" className="flex items-center space-x-1.5 group">
                            {/* Custom SVG logo representing a modern home/villa in Airbnb rose color */}
                            <svg className="w-8 h-8 text-rose-500 fill-current" viewBox="0 0 32 32">
                                <path d="M16 1c-2.008 0-3.92.518-5.59 1.432A15.011 15.011 0 0 0 .91 18.066c1.196 4.398 4.73 7.828 9.098 9.098C11.954 27.674 13.914 28 16 28c2.086 0 4.046-.326 5.992-.836 4.368-1.27 7.902-4.7 9.098-9.098A15.01 15.01 0 0 0 16 1zm0 25c-1.748 0-3.388-.274-5.012-.702A12.012 12.012 0 0 1 3.702 11.23C4.898 6.832 8.432 3.4 12.8 2.13A12.01 12.01 0 0 1 16 2a11.983 11.983 0 0 1 12.298 9.23c1.196 4.398-2.336 7.828-6.702 9.098C19.966 25.666 18.066 26 16 26z"/>
                                <path d="M16 7.5L7.5 14.5h3.5v9h10v-9h3.5zM18 21.5h-4v-7.5h4z"/>
                            </svg>
                            <span className="text-xl font-sans font-black tracking-tight text-rose-500">
                                pusatvilla.id
                            </span>
                        </Link>
                    </div>

                    {/* Center: Airbnb Capsule Search Bar */}
                    <div className="hidden md:flex items-center border border-slate-200 rounded-full py-2 pl-6 pr-2 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer text-[13px] font-bold text-slate-800 bg-white">
                        <div className="pr-4 border-r border-slate-200 hover:text-rose-500 transition-colors">
                            {locationInput ? `Penginapan di ${locationInput}` : 'Kemana saja'}
                        </div>
                        <div className="px-4 border-r border-slate-200 hover:text-rose-500 transition-colors">
                            {checkInParam && checkOutParam ? `${checkInParam} - ${checkOutParam}` : 'Minggu mana saja'}
                        </div>
                        <div className="pl-4 pr-1 text-slate-500 hover:text-rose-500 transition-colors">
                            {guests ? `${guests} tamu` : 'Tambahkan tamu'}
                        </div>
                        <button className="bg-rose-500 p-2 rounded-full text-white hover:bg-rose-600 transition-colors ml-2 cursor-pointer">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>

                    {/* Right: User Menu and MITRA Controls */}
                    <div className="flex-1 flex justify-end items-center space-x-3 text-[13px] font-bold text-slate-700">
                        <span className="hidden lg:inline-block hover:bg-slate-50 px-4 py-2.5 rounded-full cursor-pointer transition-all">
                            Menjadi Mitra
                        </span>
                        <button className="p-2.5 hover:bg-slate-50 rounded-full cursor-pointer transition-all">
                            <svg className="w-4.5 h-4.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                        </button>
                        <div className="flex items-center space-x-2 border border-slate-200 hover:shadow-xs rounded-full p-1.5 pl-3 bg-white transition-all cursor-pointer">
                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center overflow-hidden border border-slate-200">
                                <svg className="w-4.5 h-4.5 text-slate-400 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Top Interactive Categories Pill Slider */}
            <div className="flex-none bg-white border-b border-slate-200 py-3.5 z-40">
                <div className="w-full px-6 lg:px-10">
                    <div className="flex items-center space-x-3 overflow-x-auto pb-1 scrollbar-none justify-start lg:justify-center">
                        {categories.map((cat) => {
                            const IconComponent = cat.icon;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-full text-xs font-bold border transition-all duration-200 whitespace-nowrap cursor-pointer active:scale-[0.98] ${
                                        selectedCategory === cat.id
                                            ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                    }`}
                                >
                                    <IconComponent className="w-3.5 h-3.5" />
                                    <span>{cat.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Split Screen Container */}
            <div className="flex-grow flex flex-row overflow-hidden relative w-full h-[calc(100vh-148px)]">
                
                {/* Left Side: Scrollable Listing */}
                <div className={`w-full lg:w-[46%] xl:w-[46%] h-full overflow-y-auto bg-white flex flex-col border-r border-slate-100 ${
                    viewMode === 'map' ? 'hidden lg:flex' : 'flex'
                }`}>
                    <main className="flex-1 px-6 lg:px-8 py-6 w-full">
                        {/* Heading & Price Tag Banner resembling Airbnb */}
                        <div className="flex flex-col space-y-3 mb-6">
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                                Lebih dari {loading ? '...' : filteredVillas.length} akomodasi di {locationInput || 'Seluruh Destinasi'}
                            </h1>
                            <div className="flex items-center space-x-2 self-start bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl">
                                <svg className="w-4.5 h-4.5 text-rose-500 fill-current" viewBox="0 0 24 24">
                                    <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8 8a2 2 0 0 0 2.828 0l7.172-7.172a2 2 0 0 0 0-2.828l-8-8zM7 9a2 2 0 1 1 2-2 2 2 0 0 1-2 2z"/>
                                </svg>
                                <span className="text-[13px] font-semibold text-slate-700">
                                    Harga sudah mencakup semua biaya
                                </span>
                            </div>
                        </div>

                        {/* Villas Listing Grid */}
                        <div className="flex-1 flex flex-col justify-between">
                            {loading ? (
                                <div className="flex justify-center items-center py-32">
                                    <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                                </div>
                            ) : filteredVillas.length === 0 ? (
                                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs w-full max-w-md mx-auto">
                                    <p className="text-slate-900 text-lg font-bold mb-2">Akomodasi Tidak Ditemukan</p>
                                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-6">Coba sesuaikan lokasi pencarian Anda.</p>
                                    <button 
                                        onClick={handleResetFilters}
                                        className="text-xs font-bold text-rose-500 border border-rose-250 rounded-xl px-5 py-3 hover:bg-rose-50/50 active:scale-[0.98] active:translate-y-[1px] transition-all cursor-pointer"
                                    >
                                        Reset Pencarian
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-10">
                                    {filteredVillas.map((villa) => {
                                        const mainPhoto = villa.photos && villa.photos.length > 0 
                                            ? villa.photos[0] 
                                            : 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80';

                                        const detailUrl = `/villas/${villa.slug}${
                                            checkInParam && checkOutParam 
                                                ? `?checkIn=${checkInParam}&checkOut=${checkOutParam}` 
                                                : ''
                                        }`;

                                        const isWished = wishlist.includes(villa.id);
                                        const isSelected = selectedVillaId === villa.id;

                                        return (
                                            <div
                                                key={villa.id}
                                                onMouseEnter={() => setHoveredVillaId(villa.id)}
                                                onMouseLeave={() => setHoveredVillaId(null)}
                                                onClick={() => setSelectedVillaId(villa.id)}
                                                className={`group flex flex-col cursor-pointer transition-all duration-300 relative ${
                                                    isSelected ? 'scale-[1.01]' : ''
                                                }`}
                                            >
                                                <Link href={detailUrl} className="flex flex-col h-full">
                                                    {/* Image view */}
                                                    <div className="relative aspect-[20/19] w-full overflow-hidden rounded-2xl bg-slate-100 shadow-xs">
                                                        <img 
                                                            src={mainPhoto} 
                                                            alt={villa.name} 
                                                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                                                        />
                                                        
                                                        {/* Wishlist Heart Icon */}
                                                        <button 
                                                            onClick={(e) => toggleWishlist(villa.id, e)}
                                                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-transparent text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                                        >
                                                            <Heart 
                                                                className={`w-6 h-6 stroke-white stroke-[2px] drop-shadow-md transition-colors ${
                                                                    isWished ? 'fill-rose-500 text-rose-500' : 'fill-black/20 text-white/90'
                                                                }`} 
                                                            />
                                                        </button>

                                                        {/* Preference tag */}
                                                        <span className="absolute top-4 left-4 z-10 inline-flex items-center text-[11px] font-bold text-slate-800 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full shadow-xs">
                                                            Pilihan tamu
                                                        </span>

                                                        {/* Slide dots indicator */}
                                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
                                                        </div>
                                                    </div>

                                                    {/* Info Block placed cleanly underneath image */}
                                                    <div className="pt-3 flex-1 flex flex-col justify-between space-y-1 bg-transparent">
                                                        <div>
                                                            {/* Type & Location on Left, Rating on Right */}
                                                            <div className="flex items-center justify-between text-[15px] text-slate-850 font-bold leading-tight">
                                                                <span className="truncate">
                                                                    Rumah di {villa.location.split(',').pop()?.trim() || villa.location}
                                                                </span>
                                                                <div className="flex items-center text-slate-800 shrink-0 font-normal">
                                                                    <Star className="w-3.5 h-3.5 fill-slate-800 text-slate-800 mr-1" />
                                                                    <span className="font-semibold text-sm">4,8</span>
                                                                    <span className="text-slate-500 text-[13px] ml-0.5">(30)</span>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Host description/Name */}
                                                            <h3 className="text-slate-500 text-[14px] line-clamp-1 leading-snug m-0 font-normal group-hover:text-rose-500 transition-colors">
                                                                {villa.name}
                                                            </h3>
                                                            
                                                            {/* Bedrooms/Beds/Bathrooms specs */}
                                                            <p className="text-slate-500 text-[14px] leading-snug m-0 font-normal">
                                                                {villa.bedrooms} kamar tidur · {villa.bedrooms} tempat tidur · {villa.bathrooms} kamar mandi
                                                            </p>

                                                            {/* Price with underline formatting */}
                                                            <div className="text-[14px] text-slate-850 font-normal pt-1.5">
                                                                <span className="font-bold underline">
                                                                    Rp {Number(villa.price_per_night).toLocaleString('id-ID')}
                                                                </span>
                                                                <span className="text-slate-700"> malam</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && !loading && (
                                <div className="flex items-center justify-center space-x-2 mt-8 border-t border-slate-200 pt-6">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-650 hover:bg-slate-50 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer"
                                    >
                                        Sebelumnya
                                    </button>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-9 h-9 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                                currentPage === i + 1
                                                    ? 'bg-slate-900 text-white shadow-xs'
                                                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-655 hover:bg-slate-55 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer"
                                    >
                                        Selanjutnya
                                    </button>
                                </div>
                            )}
                        </div>
                    </main>
                </div>

                {/* Right Side: Interactive Map */}
                <div className={`w-full lg:w-[54%] xl:w-[54%] h-full bg-slate-100 relative ${
                    viewMode === 'list' ? 'hidden lg:block' : 'block'
                }`}>
                    <MapComponent
                        villas={filteredVillas}
                        hoveredVillaId={hoveredVillaId}
                        selectedVillaId={selectedVillaId}
                        onHoverVilla={setHoveredVillaId}
                        onSelectVilla={setSelectedVillaId}
                        getCoordinates={getCoordinates}
                        wishlist={wishlist}
                        toggleWishlist={toggleWishlist}
                    />
                </div>
            </div>

            {/* Mobile View Floating Toggler Button */}
            <button
                onClick={() => setViewMode(prev => prev === 'list' ? 'map' : 'list')}
                className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md hover:bg-slate-900 active:scale-[0.97] transition-all duration-200 text-white px-5 py-3 rounded-full shadow-xl flex items-center space-x-2 text-xs font-bold uppercase tracking-wider cursor-pointer border border-white/10"
            >
                {viewMode === 'list' ? (
                    <>
                        <span>Peta</span>
                        <MapIcon className="w-4 h-4 text-rose-400 fill-rose-400/10" />
                    </>
                ) : (
                    <>
                        <span>Daftar</span>
                        <ListIcon className="w-4 h-4 text-rose-400" />
                    </>
                )}
            </button>
        </div>
    );
}

export default function VillasCatalogPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
        }>
            <VillasCatalogContent />
        </Suspense>
    );
}
