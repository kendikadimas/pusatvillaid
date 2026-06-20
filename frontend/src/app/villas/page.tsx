'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axiosClient from '@/lib/axios';
import { Villa } from '@/types';
import { 
    SlidersHorizontal,
    Map as MapIcon,
    List as ListIcon
} from 'lucide-react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

import PublicHeader from '@/components/PublicHeader';
import CategoryFilter, { categories } from '@/components/CategoryFilter';
import VillaCard from '@/components/VillaCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';

// New mobile components
import BottomNav from '@/components/BottomNav';
import SearchOverlay from '@/components/SearchOverlay';
import MobileSearchPill from '@/components/MobileSearchPill';
import MobilePropertyCard from '@/components/MobilePropertyCard';

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
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [showFilters, setShowFilters] = useState(false);
    
    // Mobile search overlay state
    const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);

    // Filter & Sort States
    const [locationInput, setLocationInput] = useState(locationParam);
    const [bedrooms, setBedrooms] = useState('');
    const [guests, setGuests] = useState(searchParams.get('guests') || '');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalVillas, setTotalVillas] = useState(0);

    // Sync input states when query parameters change (overlay search submit)
    useEffect(() => {
        const loc = searchParams.get('location') || '';
        const gst = searchParams.get('guests') || '';
        setLocationInput(loc);
        setGuests(gst);
        setCurrentPage(1);
    }, [searchParams]);

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
            setTotalVillas(response.data.meta?.total || 0);
        } catch (err) {
            console.error('Failed to fetch villas:', err);
            toast.error('Gagal memuat katalog villa.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVillas();
    }, [currentPage, sortBy, sortOrder, locationInput, guests]);

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
            {/* Mobile Search Pill Header */}
            <MobileSearchPill
                location={locationInput}
                checkIn={checkInParam}
                checkOut={checkOutParam}
                guests={Number(guests) || 0}
                onEditClick={() => setIsSearchOverlayOpen(true)}
                showBackButton
                onBackClick={() => window.history.back()}
            />

            {/* Airbnb Style Sticky Header (Desktop) */}
            <div className="hidden lg:block">
                <PublicHeader>
                {/* Center: Airbnb Capsule Search Bar */}
                <div className="hidden md:flex items-center border border-slate-200 rounded-full py-2 pl-6 pr-2 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer text-[13px] font-bold text-slate-800 bg-white">
                    <div className="pr-4 border-r border-slate-200 hover:text-blue-500 transition-colors">
                        {locationInput ? `Unit Villa di ${locationInput}` : 'Kemana saja'}
                    </div>
                    <div className="px-4 border-r border-slate-200 hover:text-blue-500 transition-colors">
                        {checkInParam && checkOutParam ? `${checkInParam} - ${checkOutParam}` : 'Minggu mana saja'}
                    </div>
                    <div className="pl-4 pr-1 text-slate-500 hover:text-blue-500 transition-colors">
                        {guests ? `${guests} tamu` : 'Tambahkan tamu'}
                    </div>
                    <button className="bg-blue-500 p-2 rounded-full text-white hover:bg-blue-600 transition-colors ml-2 cursor-pointer">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                </div>
            </PublicHeader>
            </div>



            {/* Filter & Sort Bar */}
            <div className="flex-none bg-white border-b border-slate-100 px-4 lg:px-8 py-2 z-30">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                                showFilters || bedrooms || minPrice || maxPrice
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                            }`}
                        >
                            <SlidersHorizontal className="w-3 h-3" />
                            <span>Filter</span>
                            {(bedrooms || minPrice || maxPrice) && (
                                <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center">
                                    {[bedrooms, minPrice, maxPrice].filter(Boolean).length}
                                </span>
                            )}
                        </button>
                        
                        {/* Sort Dropdown */}
                        <select
                            value={`${sortBy}_${sortOrder}`}
                            onChange={(e) => handleSortChange(e.target.value)}
                            className="bg-white border border-slate-200 rounded-full px-3 py-2 sm:py-1.5 text-[11px] font-bold text-slate-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-slate-400 transition-colors"
                        >
                            <option value="created_at_desc">Terbaru</option>
                            <option value="price_asc">Harga: Rendah ke Tinggi</option>
                            <option value="price_desc">Harga: Tinggi ke Rendah</option>
                            <option value="bedrooms_desc">Kamar Terbanyak</option>
                        </select>

                        {totalVillas > 0 && (
                            <span className="text-[11px] text-slate-400 font-medium ml-1">
                                {totalVillas} unit villa
                            </span>
                        )}
                    </div>

                    {(bedrooms || minPrice || maxPrice) && (
                        <button
                            onClick={handleResetFilters}
                            className="text-[11px] font-bold text-red-500 hover:text-red-700 underline cursor-pointer active:scale-95 transition-transform"
                        >
                            Reset filter
                        </button>
                    )}
                </div>

                {/* Expandable Filter Panel */}
                {showFilters && (
                    <form onSubmit={handleApplyFilters} className="mt-3 pt-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] sm:text-[9px] font-bold text-slate-400 uppercase block">Kamar Tidur</label>
                                <select
                                    value={bedrooms}
                                    onChange={(e) => setBedrooms(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                                >
                                    <option value="">Semua</option>
                                    <option value="1">1+</option>
                                    <option value="2">2+</option>
                                    <option value="3">3+</option>
                                    <option value="4">4+</option>
                                    <option value="5">5+</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] sm:text-[9px] font-bold text-slate-400 uppercase block">Tamu (Max)</label>
                                <select
                                    value={guests}
                                    onChange={(e) => setGuests(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                                >
                                    <option value="">Semua</option>
                                    <option value="2">2+</option>
                                    <option value="4">4+</option>
                                    <option value="6">6+</option>
                                    <option value="8">8+</option>
                                    <option value="12">12+</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] sm:text-[9px] font-bold text-slate-400 uppercase block">Harga Min (Rp)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] sm:text-[9px] font-bold text-slate-400 uppercase block">Harga Max (Rp)</label>
                                <input
                                    type="number"
                                    placeholder="tak terbatas"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold py-1.5 rounded-lg transition-all cursor-pointer active:scale-95"
                                >
                                    Terapkan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowFilters(false)}
                                    className="px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200 hover:border-slate-400 cursor-pointer active:scale-95 transition-all"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>

            {/* Main Split Screen Container */}
            <div className={`flex-grow flex flex-row overflow-hidden relative w-full ${showFilters ? 'h-[calc(100vh-240px)]' : 'h-[calc(100vh-180px)]'}`}>
                
                {/* Left Side: Scrollable Listing (Desktop Only) */}
                <div className="hidden lg:flex w-[46%] xl:w-[46%] h-full overflow-y-auto bg-white flex-col border-r border-slate-100">
                    <main className="flex-1 px-4 lg:px-8 py-6 w-full">
                        {/* Heading & Price Tag Banner resembling Airbnb */}
                        <div className="flex flex-col space-y-3 mb-6">
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                                Menampilkan {loading ? '...' : filteredVillas.length} Unit Villa di {locationInput || 'Seluruh Destinasi'}
                            </h1>
                            <div className="flex items-center space-x-2 self-start bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl">
                                <svg className="w-4.5 h-4.5 text-blue-500 fill-current" viewBox="0 0 24 24">
                                    <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8 8a2 2 0 0 0 2.828 0l7.172-7.172a2 2 0 0 0 0-2.828l-8-8zM7 9a2 2 0 1 1 2-2 2 2 0 0 1-2 2z"/>
                                </svg>
                                <span className="text-[13px] font-semibold text-slate-700">
                                    Harga sudah mencakup semua biaya
                                </span>
                            </div>
                        </div>

                        {/* Villas Listing Grid */}
                        <div className="flex-1 flex flex-col justify-between pl-2">
                            {loading ? (
                                <LoadingSpinner fullPage={false} message="Memuat villa..." />
                            ) : filteredVillas.length === 0 ? (
                                <EmptyState
                                    title="Unit Villa Tidak Ditemukan"
                                    description="Coba sesuaikan lokasi pencarian Anda."
                                    action={{ label: 'Reset Pencarian', onClick: handleResetFilters }}
                                />
                            ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-6 gap-y-10">
                                    {filteredVillas.map((villa) => (
                                        <VillaCard
                                            key={villa.id}
                                            villa={villa}
                                            wishlist={wishlist}
                                            toggleWishlist={toggleWishlist}
                                            searchParams={{ checkIn: checkInParam, checkOut: checkOutParam }}
                                            variant="catalog"
                                            onMouseEnter={() => setHoveredVillaId(villa.id)}
                                            onMouseLeave={() => setHoveredVillaId(null)}
                                            onClick={() => setSelectedVillaId(villa.id)}
                                            isSelected={selectedVillaId === villa.id}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && !loading && (
                                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                            )}
                        </div>
                    </main>
                </div>

                {/* Right Side: Interactive Map (Desktop & Mobile) */}
                <div className="w-full lg:w-[54%] xl:w-[54%] h-full bg-slate-100 relative">
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

                {/* Mobile Bottom Sheet Overlay (Scrollable to expand) */}
                <div className="lg:hidden absolute inset-0 z-30 overflow-y-auto snap-y snap-proximity scrollbar-hide pointer-events-none">
                    {/* Transparent spacer to let the map show through and be interactive */}
                    <div className="h-[45%] w-full shrink-0 snap-start" />
                    
                    {/* The expanding white bottom sheet */}
                    <div className="min-h-full pointer-events-auto bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] flex flex-col relative snap-start">
                        {/* Header & Grabber */}
                        <div className="sticky top-0 bg-white rounded-t-3xl pt-3 pb-4 flex justify-center z-10 border-b border-slate-50">
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                        </div>

                        {/* Scrollable Cards */}
                        <div className="px-4 pb-24 pt-2 space-y-6">
                        {loading ? (
                            <LoadingSpinner fullPage={false} message="Memuat villa..." />
                        ) : filteredVillas.length === 0 ? (
                            <EmptyState
                                title="Unit Villa Tidak Ditemukan"
                                description="Coba sesuaikan lokasi pencarian Anda."
                                action={{ label: 'Reset Pencarian', onClick: handleResetFilters }}
                            />
                        ) : (
                            filteredVillas.map((villa) => (
                                <MobilePropertyCard
                                    key={villa.id}
                                    villa={villa}
                                    searchParams={{ checkIn: checkInParam, checkOut: checkOutParam }}
                                />
                            ))
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && !loading && (
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                        )}
                    </div>
                </div>
            </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <BottomNav />

            {/* Mobile Search Overlay */}
            <SearchOverlay
                isOpen={isSearchOverlayOpen}
                onClose={() => setIsSearchOverlayOpen(false)}
                initialLocation={locationInput}
                initialCheckIn={checkInParam}
                initialCheckOut={checkOutParam}
                initialGuests={Number(guests) || 0}
            />


        </div>
    );
}

export default function VillasCatalogPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <VillasCatalogContent />
        </Suspense>
    );
}
