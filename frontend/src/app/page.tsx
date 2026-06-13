'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axiosClient from '@/lib/axios';
import { Villa, Destination } from '@/types';
import {
    Star,
    ShieldCheck,
    Zap,
    Calendar,
    MapPin,
    Phone,
    ArrowRight,
    Loader2,
    Heart,
    Search,
    Waves,
    Mountain,
    Crown,
    Home as HomeIcon,
    History,
    Compass,
    Minus,
    Plus,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

const categories = [
    { id: 'all', name: 'Semua Villa', icon: HomeIcon },
    { id: 'pool', name: 'Kolam Pribadi', icon: Waves, filter: (v: Villa) => v.amenities?.includes('Kolam Renang') },
    { id: 'mountain', name: 'Pegunungan', icon: Mountain, filter: (v: Villa) => v.location?.includes('Bogor') || v.description?.includes('gunung') || v.location?.includes('Puncak') },
    { id: 'luxury', name: 'Mewah & Butler', icon: Crown, filter: (v: Villa) => v.amenities?.includes('Butler Service') || v.price_per_night > 3000000 },
    { id: 'couple', name: 'Romantis', icon: Heart, filter: (v: Villa) => v.max_guests <= 4 },
    { id: 'family', name: 'Keluarga', icon: HomeIcon, filter: (v: Villa) => v.bedrooms >= 3 },
];

const DEFAULT_DESTINATIONS: Destination[] = [
    { id: 1, name: 'Puncak, Bogor', city: 'Puncak, Bogor', query: 'Bogor', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80', count_fallback: '12+ Villa' },
    { id: 2, name: 'Ubud, Gianyar', city: 'Ubud, Gianyar', query: 'Ubud', image: 'https://images.unsplash.com/photo-1549638441-b787d2e11f14?auto=format&fit=crop&w=600&q=80', count_fallback: '8+ Villa' },
    { id: 3, name: 'Seminyak, Bali', city: 'Seminyak, Bali', query: 'Bali', image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=600&q=80', count_fallback: '15+ Villa' },
    { id: 4, name: 'Dago, Bandung', city: 'Dago, Bandung', query: 'Bandung', image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=600&q=80', count_fallback: '6+ Villa' },
    { id: 5, name: 'Batu, Malang', city: 'Batu, Malang', query: 'Malang', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80', count_fallback: '9+ Villa' },
    { id: 6, name: 'Senggigi, Lombok', city: 'Senggigi, Lombok', query: 'Lombok', image: 'https://images.unsplash.com/photo-1514995669114-6081e934b693?auto=format&fit=crop&w=600&q=80', count_fallback: '5+ Villa' },
];

interface VillaCardProps {
    villa: Villa;
    wishlist: number[];
    toggleWishlist: (id: number, e: React.MouseEvent) => void;
    searchParams: {
        checkIn: string;
        checkOut: string;
    };
}

function VillaCard({ villa, wishlist, toggleWishlist, searchParams }: VillaCardProps) {
    const mainPhoto = villa.photos && villa.photos.length > 0
        ? villa.photos[0]
        : 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80';
    const isWished = wishlist.includes(villa.id);

    const checkInParam = searchParams.checkIn;
    const checkOutParam = searchParams.checkOut;
    const detailUrl = `/villas/${villa.slug}${
        checkInParam && checkOutParam 
            ? `?checkIn=${checkInParam}&checkOut=${checkOutParam}` 
            : ''
    }`;

    // Hitung harga & label durasi
    const priceText = `Rp ${Number(villa.price_per_night).toLocaleString('id-ID')}`;
    let priceLabel = 'untuk 1 malam';
    
    if (checkInParam && checkOutParam) {
        const start = new Date(checkInParam);
        const end = new Date(checkOutParam);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (nights > 0) {
            priceLabel = `untuk ${nights} malam`;
        }
    }

    // Get average rating or generate a stable mock rating based on villa ID
    const ratingVal = villa.reviews_avg_rating 
        ? parseFloat(villa.reviews_avg_rating.toString()) 
        : 4.5 + (villa.id % 5) * 0.1; // Generates stable ratings like 4.5, 4.6, 4.7, 4.8, 4.9
    const ratingText = ratingVal.toFixed(1).replace('.', ',');

    // Extract subdistrict/city from location
    const subdistrict = villa.location.split(',')[0].trim();

    // Badge "Pilihan tamu" if rating is high
    const isGuestFavorite = ratingVal >= 4.8;

    return (
        <Link
            href={detailUrl}
            className="group cursor-pointer flex flex-col w-full bg-transparent hover:no-underline"
        >
            <div className="relative aspect-[20/19] w-full overflow-hidden rounded-[28px] bg-slate-100 shadow-xs">
                <img
                    src={mainPhoto}
                    alt={villa.name}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
                
                {isGuestFavorite && (
                    <div className="absolute top-4 left-4 z-10 bg-white/95 px-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs">
                        <span className="text-[13px] font-bold text-slate-900 tracking-tight">Pilihan tamu</span>
                    </div>
                )}

                <button
                    onClick={(e) => toggleWishlist(villa.id, e)}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-transparent text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                    <Heart
                        className={`w-6 h-6 stroke-white stroke-[2.5px] drop-shadow-md transition-colors ${
                            isWished ? 'fill-rose-500 text-rose-500' : 'fill-black/20 text-white/90'
                        }`}
                    />
                </button>
            </div>

            <div className="pt-3 flex flex-col space-y-0.5 text-slate-800 bg-transparent text-left">
                <h3 className="font-sans text-[16px] font-bold text-slate-900 leading-tight tracking-tight line-clamp-2">
                    Rumah di {subdistrict}
                </h3>
                <p className="text-[14px] text-slate-500 leading-normal font-normal m-0">
                    {priceText} {priceLabel} ·
                </p>
                <div className="flex items-center text-[14px] font-bold text-slate-800 leading-normal">
                    <Star className="w-3.5 h-3.5 fill-slate-800 text-slate-800 mr-1 shrink-0" />
                    <span>{ratingText}</span>
                </div>
            </div>
        </Link>
    );
}

export default function HomePage() {
    const [villas, setVillas] = useState<Villa[]>([]);
    const [destinations, setDestinations] = useState<Destination[]>(DEFAULT_DESTINATIONS);
    const [loading, setLoading] = useState(true);
    const [wishlist, setWishlist] = useState<number[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchParams, setSearchParams] = useState({
        location: '',
        checkIn: '',
        checkOut: '',
    });
    const [activeTab, setActiveTab] = useState<'lokasi' | 'kapan' | 'peserta' | null>(null);
    const [adults, setAdults] = useState(0);
    const [childrenCount, setChildrenCount] = useState(0);
    const [infants, setInfants] = useState(0);
    const [pets, setPets] = useState(0);
    const [selectedFlexibility, setSelectedFlexibility] = useState(0);
    const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
    const [recentSearches, setRecentSearches] = useState<{location: string, checkIn: string, checkOut: string, guestsLabel: string, datesLabel: string}[]>([]);
    const [headerSolid, setHeaderSolid] = useState(false);
    const [isHeaderSearchExpanded, setIsHeaderSearchExpanded] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('pusatvilla_searches');
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved).slice(0, 3));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    // Helper functions for date range formatting
    const formatDateRange = (checkInStr: string, checkOutStr: string) => {
        if (!checkInStr) return 'Tambahkan tanggal';
        const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const inDate = new Date(checkInStr);
        const inDay = inDate.getDate();
        const inMonth = monthsShort[inDate.getMonth()];
        
        if (!checkOutStr) {
            return `${inDay} ${inMonth}`;
        }
        
        const outDate = new Date(checkOutStr);
        const outDay = outDate.getDate();
        const outMonth = monthsShort[outDate.getMonth()];
        
        if (inDate.getMonth() === outDate.getMonth()) {
            return `${inDay}–${outDay} ${inMonth}`;
        }
        return `${inDay} ${inMonth} – ${outDay} ${outMonth}`;
    };

    const getGuestsLabel = () => {
        const total = adults + childrenCount;
        if (total === 0) return 'Tambahkan tamu';
        let label = `${total} tamu`;
        if (infants > 0) label += `, ${infants} balita`;
        if (pets > 0) label += `, ${pets} hewan`;
        return label;
    };

    const handleGuestChange = (type: 'adults' | 'children' | 'infants' | 'pets', operation: 'inc' | 'dec') => {
        if (operation === 'inc') {
            if (type === 'adults') setAdults(prev => prev + 1);
            else if (type === 'children') {
                setChildrenCount(prev => prev + 1);
                if (adults === 0) setAdults(1);
            } else if (type === 'infants') {
                setInfants(prev => prev + 1);
                if (adults === 0) setAdults(1);
            } else if (type === 'pets') {
                setPets(prev => prev + 1);
                if (adults === 0) setAdults(1);
            }
        } else {
            if (type === 'adults') {
                if (adults > 0) {
                    const hasOthers = childrenCount > 0 || infants > 0 || pets > 0;
                    if (adults === 1 && hasOthers) {
                        toast.warning('Tamu anak/balita/hewan harus didampingi minimal 1 orang dewasa.');
                        return;
                    }
                    setAdults(prev => prev - 1);
                }
            } else if (type === 'children') {
                setChildrenCount(prev => (prev > 0 ? prev - 1 : 0));
            } else if (type === 'infants') {
                setInfants(prev => (prev > 0 ? prev - 1 : 0));
            } else if (type === 'pets') {
                setPets(prev => (prev > 0 ? prev - 1 : 0));
            }
        }
    };

    // Calendar Range Picker Helpers
    const formatDateToYYYYMMDD = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const generateMonthDays = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayIndex = getFirstDayOfMonth(year, month);
        const totalDays = getDaysInMonth(year, month);
        
        const cells = [];
        for (let i = 0; i < firstDayIndex; i++) {
            cells.push(null);
        }
        for (let day = 1; day <= totalDays; day++) {
            cells.push(new Date(year, month, day));
        }
        return cells;
    };

    const getMonthNameIndonesian = (monthIndex: number): string => {
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return months[monthIndex];
    };

    const getNextMonthDate = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 1);
    };

    const isPastDate = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const nextCalendarMonth = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const prevCalendarMonth = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const renderCalendarMonth = (monthDate: Date) => {
        const monthIndex = monthDate.getMonth();
        const year = monthDate.getFullYear();
        const monthName = getMonthNameIndonesian(monthIndex);
        
        const days = generateMonthDays(monthDate);
        
        return (
            <div className="text-left select-none">
                <h5 className="text-sm font-bold text-slate-900 text-center mb-4">{monthName} {year}</h5>
                <div className="grid grid-cols-7 text-center text-[10px] font-black text-slate-400 mb-2">
                    <span>Min</span>
                    <span>Sn</span>
                    <span>Sl</span>
                    <span>R</span>
                    <span>Km</span>
                    <span>J</span>
                    <span>Sb</span>
                </div>
                <div className="grid grid-cols-7 gap-y-1 text-center">
                    {days.map((day, idx) => {
                        if (day === null) {
                            return <div key={`empty-${idx}`} className="h-9" />;
                        }
                        
                        const isPast = isPastDate(day);
                        const formatted = formatDateToYYYYMMDD(day);
                        const isSelectedStart = searchParams.checkIn === formatted;
                        const isSelectedEnd = searchParams.checkOut === formatted;
                        
                        let isInRange = false;
                        if (searchParams.checkIn && searchParams.checkOut) {
                            isInRange = formatted > searchParams.checkIn && formatted < searchParams.checkOut;
                        }
                        
                        return (
                            <div
                                key={formatted}
                                onClick={() => !isPast && handleDateSelect(day)}
                                className={`h-9 flex items-center justify-center text-xs font-semibold relative ${
                                    isPast ? 'text-slate-350 cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-slate-50 rounded-full'
                                } ${
                                    isInRange ? 'bg-rose-50/70 text-rose-800 rounded-none' : ''
                                } ${
                                    isSelectedStart ? 'rounded-l-full' : ''
                                } ${
                                    isSelectedEnd ? 'rounded-r-full' : ''
                                }`}
                            >
                                {(isSelectedStart || isSelectedEnd) && (
                                    <div className="absolute inset-0 bg-rose-500 rounded-full scale-90 z-0" />
                                )}
                                <span className={`relative z-10 ${
                                    (isSelectedStart || isSelectedEnd) ? 'text-white font-bold' : ''
                                }`}>
                                    {day.getDate()}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const handleDateSelect = (date: Date) => {
        const formatted = formatDateToYYYYMMDD(date);
        
        if (!searchParams.checkIn || (searchParams.checkIn && searchParams.checkOut)) {
            setSearchParams(prev => ({
                ...prev,
                checkIn: formatted,
                checkOut: ''
            }));
        } else {
            if (formatted > searchParams.checkIn) {
                setSearchParams(prev => ({
                    ...prev,
                    checkOut: formatted
                }));
                // Auto switch to guests tab after selecting dates range
                setTimeout(() => {
                    setActiveTab('peserta');
                }, 300);
            } else {
                setSearchParams(prev => ({
                    ...prev,
                    checkIn: formatted,
                    checkOut: ''
                }));
            }
        }
    };

    const selectDestination = (query: string) => {
        setSearchParams(prev => ({ ...prev, location: query }));
        setActiveTab('kapan');
    };

    const selectRecentSearch = (search: any) => {
        setSearchParams({
            location: search.location,
            checkIn: search.checkIn,
            checkOut: search.checkOut,
        });
        if (search.guestsLabel) {
            const guestMatch = search.guestsLabel.match(/(\d+)\s+tamu/);
            if (guestMatch) {
                setAdults(parseInt(guestMatch[1]));
            }
        }
        setActiveTab('kapan');
    };

    const saveSearchToLocal = (location: string, checkIn: string, checkOut: string) => {
        if (!location) return;
        const datesLabel = formatDateRange(checkIn, checkOut);
        const guestsLabel = getGuestsLabel();
        const newSearch = { location, checkIn, checkOut, guestsLabel, datesLabel };
        
        let current = [];
        const saved = localStorage.getItem('pusatvilla_searches');
        if (saved) {
            try {
                current = JSON.parse(saved);
            } catch (e) {}
        }
        current = current.filter((s: any) => s.location.toLowerCase() !== location.toLowerCase());
        current.unshift(newSearch);
        localStorage.setItem('pusatvilla_searches', JSON.stringify(current.slice(0, 3)));
    };

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (searchParams.location) {
            saveSearchToLocal(searchParams.location, searchParams.checkIn, searchParams.checkOut);
        }
        const totalGuests = adults + childrenCount;
        let url = `/villas?location=${searchParams.location}&checkIn=${searchParams.checkIn}&checkOut=${searchParams.checkOut}`;
        if (totalGuests > 0) {
            url += `&guests=${totalGuests}`;
        }
        window.location.href = url;
    };

    const onScroll = () => {
        const isSolid = window.scrollY > 600;
        setHeaderSolid(isSolid);
        if (!isSolid) {
            setIsHeaderSearchExpanded(false);
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const fetchDestinations = async () => {
            try {
                const response = await axiosClient.get('/destinations');
                if (response.data && response.data.data) {
                    setDestinations(response.data.data);
                }
            } catch (err) {
                console.error('Failed to fetch destinations:', err);
            }
        };
        fetchDestinations();
    }, []);

    useEffect(() => {
        const fetchVillas = async () => {
            try {
                const response = await axiosClient.get('/villas');
                setVillas(response.data.data || []);
            } catch (err) {
                console.error('Failed to fetch villas:', err);
                toast.error('Gagal memuat data villa.');
            } finally {
                setLoading(false);
            }
        };
        fetchVillas();
    }, []);

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

    const filteredByCategory = villas.filter(v => {
        const cat = categories.find(c => c.id === selectedCategory);
        if (!cat || cat.id === 'all') return true;
        return cat.filter ? cat.filter(v) : true;
    });

    const groupedByLocation = destinations
        .map(d => ({
            ...d,
            villas: filteredByCategory.filter(v =>
                v.location.toLowerCase().includes(d.query.toLowerCase())
            ),
        }))
        .filter(g => g.villas.length > 0);

    const unmatchedVillas = filteredByCategory.filter(v =>
        !destinations.some(d =>
            v.location.toLowerCase().includes(d.query.toLowerCase())
        )
    );

    return (
        <div className="flex-1 flex flex-col bg-white text-slate-900 font-sans relative">
            {/* Overlay backdrop when search bar is focused or expanded */}
            {(activeTab || isHeaderSearchExpanded) && (
                <div
                    className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] transition-all duration-300 animate-fadeIn"
                    onClick={() => {
                        setActiveTab(null);
                        setIsHeaderSearchExpanded(false);
                    }}
                />
            )}
            {/* ===== HEADER (transparent → solid on scroll, Airbnb-style) ===== */}
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-350 ${
                    headerSolid
                        ? 'bg-white shadow-sm border-b border-slate-200/60'
                        : 'bg-transparent'
                }`}
            >
                <div className={`max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 flex flex-col justify-center ${
                    headerSolid && isHeaderSearchExpanded ? 'h-36 py-4' : 'h-20'
                }`}>
                    <div className="flex items-center justify-between w-full">
                        <Link 
                            href="/" 
                            className="flex items-center space-x-2 shrink-0"
                            onClick={() => {
                                setIsHeaderSearchExpanded(false);
                                setActiveTab(null);
                            }}
                        >
                            <span className={`text-2xl font-serif font-black tracking-tight transition-colors ${
                                headerSolid ? 'text-slate-900' : 'text-white'
                            }`}>
                                PusatVilla.id
                            </span>
                        </Link>

                        {/* Compact Search Pill in the middle of header (only when scrolled and not expanded) */}
                        {headerSolid ? (
                            !isHeaderSearchExpanded ? (
                                <div 
                                    onClick={() => {
                                        setIsHeaderSearchExpanded(true);
                                        setActiveTab('lokasi');
                                    }}
                                    className="hidden md:flex items-center border border-slate-200 rounded-full py-2 pl-5 pr-2 shadow-sm hover:shadow-md cursor-pointer transition-all bg-white animate-in fade-in duration-300"
                                >
                                    <span className="text-[13px] font-bold text-slate-800 pr-4 border-r border-slate-200">
                                        {searchParams.location || 'Ke mana saja'}
                                    </span>
                                    <span className="text-[13px] font-bold text-slate-800 px-4 border-r border-slate-200">
                                        {searchParams.checkIn && searchParams.checkOut 
                                            ? formatDateRange(searchParams.checkIn, searchParams.checkOut) 
                                            : 'Kapan saja'}
                                    </span>
                                    <span className="text-[13px] font-semibold text-slate-500 pl-4 pr-1 flex items-center space-x-2">
                                        <span className="max-w-[120px] truncate">{getGuestsLabel() === 'Tambahkan tamu' ? 'Tambahkan tamu' : getGuestsLabel()}</span>
                                        <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0 ml-2 hover:bg-rose-600 transition-colors">
                                            <Search className="w-4 h-4" strokeWidth={2.5} />
                                        </div>
                                    </span>
                                </div>
                            ) : (
                                <div className="hidden md:flex items-center space-x-6 text-sm font-semibold text-slate-900 animate-in fade-in duration-300">
                                    <button 
                                        onClick={() => setActiveTab('lokasi')}
                                        className="text-slate-900 hover:text-rose-500 border-b-2 border-slate-900 pb-1"
                                    >
                                        Cari Villa
                                    </button>
                                    <Link href="/villas" className="text-slate-500 hover:text-rose-500 pb-1">
                                        Jelajahi Semua
                                    </Link>
                                </div>
                            )
                        ) : null}

                        <nav className="flex items-center space-x-6">
                            <Link
                                href="/villas"
                                className={`text-sm font-semibold transition-colors ${
                                    headerSolid ? 'text-slate-700 hover:text-rose-500' : 'text-white/90 hover:text-white'
                                }`}
                                onClick={() => {
                                    setIsHeaderSearchExpanded(false);
                                    setActiveTab(null);
                                }}
                            >
                                Cari Villa
                            </Link>
                        </nav>
                    </div>

                    {/* Row 2 (Search Panel when header expanded) */}
                    {headerSolid && isHeaderSearchExpanded && (
                        <div className="w-full mt-4 flex justify-center animate-in slide-in-from-top-4 duration-300">
                            <div className="w-full max-w-3xl rounded-full p-0.5 border bg-slate-100 border-slate-200 shadow-md flex items-center">
                                <form onSubmit={handleSearch} className="flex flex-row items-center w-full relative">
                                    {/* Lokasi Column */}
                                    <div 
                                        onClick={() => setActiveTab('lokasi')}
                                        className={`flex-[1.4] px-5 py-2 rounded-full cursor-pointer transition-all text-left flex flex-col justify-center relative min-w-0 ${
                                            activeTab === 'lokasi' 
                                                ? 'bg-white shadow-md hover:bg-white' 
                                                : 'hover:bg-slate-200/50'
                                        }`}
                                    >
                                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Lokasi</label>
                                        {activeTab === 'lokasi' ? (
                                            <input
                                                type="text"
                                                placeholder="Cari destinasi"
                                                value={searchParams.location}
                                                onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                                                className="w-full bg-transparent border-0 p-0 text-xs font-semibold text-slate-900 focus:ring-0 focus:outline-none placeholder-slate-400 h-4 mt-0.5"
                                                autoFocus
                                            />
                                        ) : (
                                            <span className="text-xs font-semibold text-slate-900 truncate h-4 block mt-0.5">
                                                {searchParams.location || 'Cari destinasi'}
                                            </span>
                                        )}

                                        {/* Lokasi Dropdown Panel */}
                                        {activeTab === 'lokasi' && (
                                            <div className="absolute top-[125%] left-0 w-[380px] bg-white rounded-2xl shadow-xl border border-slate-100 p-5 z-50 text-slate-800 text-left animate-fadeIn">
                                                {/* Recent Searches */}
                                                {recentSearches.length > 0 && (
                                                    <div className="mb-4">
                                                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Pencarian terkini</h4>
                                                        <div className="space-y-2">
                                                            {recentSearches.map((search, i) => (
                                                                <div
                                                                    key={i}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        selectRecentSearch(search);
                                                                    }}
                                                                    className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                                                                >
                                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                                                        <History className="w-4 h-4" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-bold text-slate-900 truncate">{search.location}</p>
                                                                        <p className="text-[10px] text-slate-400 truncate">
                                                                            {search.datesLabel} {search.guestsLabel ? `· ${search.guestsLabel}` : ''}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Recommended Destinations */}
                                                <div>
                                                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Destinasi yang disarankan</h4>
                                                    <div className="space-y-1">
                                                        {destinations.slice(0, 5).map((dest, idx) => (
                                                            <div
                                                                key={dest.id || idx}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    selectDestination(dest.query);
                                                                }}
                                                                className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                                                            >
                                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                                                    <Compass className="w-4 h-4" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-bold text-slate-900 truncate">{dest.name}</p>
                                                                    <p className="text-[10px] text-slate-400 truncate leading-relaxed">{dest.city}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Kapan Column */}
                                    <div 
                                        onClick={() => setActiveTab('kapan')}
                                        className={`flex-1 px-5 py-2 rounded-full cursor-pointer transition-all text-left flex flex-col justify-center relative ${
                                            activeTab === 'kapan' 
                                                ? 'bg-white shadow-md hover:bg-white' 
                                                : 'hover:bg-slate-200/50'
                                        }`}
                                    >
                                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Kapan</label>
                                        <span className="text-xs font-semibold text-slate-900 truncate h-4 block mt-0.5">
                                            {formatDateRange(searchParams.checkIn, searchParams.checkOut)}
                                        </span>

                                        {/* Calendar Dropdown Panel */}
                                        {activeTab === 'kapan' && (
                                            <div 
                                                onClick={(e) => e.stopPropagation()}
                                                className="absolute top-[125%] left-1/2 -translate-x-1/2 w-[680px] bg-white rounded-2xl shadow-xl border border-slate-100 p-5 z-50 text-slate-800 animate-fadeIn"
                                            >
                                                <div className="grid grid-cols-2 gap-6 relative">
                                                    {renderCalendarMonth(currentCalendarDate)}
                                                    {renderCalendarMonth(getNextMonthDate(currentCalendarDate))}
                                                    
                                                    <div className="absolute top-1 left-2 right-2 flex justify-between pointer-events-none z-10">
                                                        <button
                                                            type="button"
                                                            onClick={prevCalendarMonth}
                                                            className="p-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-full shadow-xs text-slate-600 pointer-events-auto active:scale-95 transition-all"
                                                        >
                                                            <ChevronLeft className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={nextCalendarMonth}
                                                            className="p-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-full shadow-xs text-slate-600 pointer-events-auto active:scale-95 transition-all"
                                                        >
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="border-t border-slate-100 mt-4 pt-3 flex justify-between items-center">
                                                    <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-1">
                                                        {[
                                                            { label: 'Tanggal pasti', value: 0 },
                                                            { label: '± 1 hari', value: 1 },
                                                            { label: '± 2 hari', value: 2 },
                                                            { label: '± 3 hari', value: 3 },
                                                        ].map((preset, i) => (
                                                            <button
                                                                key={i}
                                                                type="button"
                                                                onClick={() => setSelectedFlexibility(preset.value)}
                                                                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap active:scale-95 ${
                                                                    selectedFlexibility === preset.value
                                                                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900'
                                                                }`}
                                                            >
                                                                {preset.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSearchParams({ ...searchParams, checkIn: '', checkOut: '' });
                                                        }}
                                                        className="text-[10px] font-bold text-slate-600 hover:text-slate-900 underline shrink-0 px-2 active:scale-95"
                                                    >
                                                        Hapus tanggal
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Peserta Column */}
                                    <div 
                                        onClick={() => setActiveTab('peserta')}
                                        className={`flex-[1.2] pl-5 pr-1.5 py-2 rounded-full cursor-pointer transition-all text-left flex flex-row items-center justify-between ${
                                            activeTab === 'peserta' 
                                                ? 'bg-white shadow-md hover:bg-white' 
                                                : 'hover:bg-slate-200/50'
                                        }`}
                                    >
                                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Peserta</label>
                                            <span className="text-xs font-semibold text-slate-900 truncate h-4 block mt-0.5">
                                                {getGuestsLabel()}
                                            </span>
                                        </div>

                                        <button
                                            type="submit"
                                            className="bg-rose-500 hover:bg-rose-600 active:scale-95 text-white flex items-center justify-center font-bold rounded-full transition-all duration-300 ease-in-out cursor-pointer shadow-sm px-4 py-2 space-x-1 ml-1.5 shrink-0"
                                            title="Cari"
                                        >
                                            <Search className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />
                                            <span className="text-xs tracking-tight font-black">Cari</span>
                                        </button>

                                        {/* Guests Counter Dropdown Panel */}
                                        {activeTab === 'peserta' && (
                                            <div 
                                                onClick={(e) => e.stopPropagation()}
                                                className="absolute top-[125%] right-0 w-[360px] bg-white rounded-2xl shadow-xl border border-slate-100 p-5 z-50 text-slate-800 text-left animate-fadeIn"
                                            >
                                                <div className="space-y-4 text-xs">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h5 className="font-bold text-slate-900">Dewasa</h5>
                                                            <p className="text-[10px] text-slate-400">Usia 13 tahun ke atas</p>
                                                        </div>
                                                        <div className="flex items-center space-x-2.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleGuestChange('adults', 'dec')}
                                                                disabled={adults === 0}
                                                                className={`w-7 h-7 rounded-full border flex items-center justify-center text-slate-500 hover:border-slate-850 hover:text-slate-850 transition-all ${
                                                                    adults === 0 ? 'opacity-30 cursor-not-allowed border-slate-200' : 'border-slate-300'
                                                                }`}
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </button>
                                                            <span className="font-bold text-slate-900 w-3 text-center">{adults}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleGuestChange('adults', 'inc')}
                                                                className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:border-slate-850 hover:text-slate-850 transition-all"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    <hr className="border-slate-100" />
                                                    
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h5 className="font-bold text-slate-900">Anak-anak</h5>
                                                            <p className="text-[10px] text-slate-400">Usia 2–12</p>
                                                        </div>
                                                        <div className="flex items-center space-x-2.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleGuestChange('children', 'dec')}
                                                                disabled={childrenCount === 0}
                                                                className={`w-7 h-7 rounded-full border flex items-center justify-center text-slate-500 hover:border-slate-850 hover:text-slate-850 transition-all ${
                                                                    childrenCount === 0 ? 'opacity-30 cursor-not-allowed border-slate-200' : 'border-slate-300'
                                                                }`}
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </button>
                                                            <span className="font-bold text-slate-900 w-3 text-center">{childrenCount}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleGuestChange('children', 'inc')}
                                                                className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:border-slate-850 hover:text-slate-850 transition-all"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <hr className="border-slate-100" />
                                                    
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h5 className="font-bold text-slate-900">Balita</h5>
                                                            <p className="text-[10px] text-slate-400">Di bawah 2 tahun</p>
                                                        </div>
                                                        <div className="flex items-center space-x-2.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleGuestChange('infants', 'dec')}
                                                                disabled={infants === 0}
                                                                className={`w-7 h-7 rounded-full border flex items-center justify-center text-slate-500 hover:border-slate-850 hover:text-slate-850 transition-all ${
                                                                    infants === 0 ? 'opacity-30 cursor-not-allowed border-slate-200' : 'border-slate-300'
                                                                }`}
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </button>
                                                            <span className="font-bold text-slate-900 w-3 text-center">{infants}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleGuestChange('infants', 'inc')}
                                                                className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:border-slate-850 hover:text-slate-850 transition-all"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <hr className="border-slate-100" />
                                                    
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h5 className="font-bold text-slate-900">Hewan</h5>
                                                            <p className="text-[10px] text-slate-400">Hewan peliharaan</p>
                                                        </div>
                                                        <div className="flex items-center space-x-2.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleGuestChange('pets', 'dec')}
                                                                disabled={pets === 0}
                                                                className={`w-7 h-7 rounded-full border flex items-center justify-center text-slate-500 hover:border-slate-850 hover:text-slate-850 transition-all ${
                                                                    pets === 0 ? 'opacity-30 cursor-not-allowed border-slate-200' : 'border-slate-300'
                                                                }`}
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </button>
                                                            <span className="font-bold text-slate-900 w-3 text-center">{pets}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleGuestChange('pets', 'inc')}
                                                                className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:border-slate-850 hover:text-slate-850 transition-all"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* ===== HERO + SEARCH BAR ===== */}
            <section className="relative min-h-[220px] md:min-h-[240px] flex items-center justify-center text-white px-4">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=80"
                        alt=""
                        className="w-full h-full object-cover brightness-[0.4]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                </div>
                <div className={`max-w-4xl mx-auto text-center space-y-4 pt-16 pb-4 w-full relative transition-all duration-300 ${
                    activeTab ? 'z-45' : 'z-10'
                }`}>
                    <div>
                        <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl font-medium tracking-tight text-white leading-tight">
                            Temukan Villa <span className="text-rose-300 italic">Impian Anda</span>
                        </h1>
                    </div>
                    <div className={`max-w-4xl mx-auto rounded-full p-1 border transition-all duration-300 relative z-50 flex items-center shadow-lg ${
                        activeTab 
                            ? 'bg-slate-100/95 border-slate-200/50 shadow-xl backdrop-blur-md' 
                            : 'bg-white border-white/30 hover:border-slate-200 shadow-md'
                    }`}>
                        <form onSubmit={handleSearch} className="flex flex-row items-center w-full relative">
                            {/* Lokasi Column */}
                            <div 
                                onClick={() => setActiveTab('lokasi')}
                                className={`flex-[1.4] px-6 py-2.5 rounded-full cursor-pointer transition-all text-left flex flex-col justify-center relative min-w-0 ${
                                    activeTab === 'lokasi' 
                                        ? 'bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:bg-white' 
                                        : 'hover:bg-slate-200/50'
                                }`}
                            >
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Lokasi</label>
                                {activeTab === 'lokasi' ? (
                                    <input
                                        type="text"
                                        placeholder="Cari destinasi"
                                        value={searchParams.location}
                                        onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                                        className="w-full bg-transparent border-0 p-0 text-sm font-semibold text-slate-900 focus:ring-0 focus:outline-none placeholder-slate-400 h-5 mt-0.5"
                                        autoFocus
                                    />
                                ) : (
                                    <span className="text-sm font-semibold text-slate-900 truncate h-5 block mt-0.5">
                                        {searchParams.location || 'Cari destinasi'}
                                    </span>
                                )}

                                {/* Lokasi Dropdown Panel */}
                                {activeTab === 'lokasi' && (
                                    <div className="absolute top-[120%] left-0 w-[420px] bg-white rounded-3xl shadow-[0_16px_36px_rgba(0,0,0,0.12)] border border-slate-100/80 p-6 z-50 text-slate-800 text-left animate-fadeIn">
                                        {/* Recent Searches */}
                                        {recentSearches.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Pencarian terkini</h4>
                                                <div className="space-y-3">
                                                    {recentSearches.map((search, i) => (
                                                        <div
                                                            key={i}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                selectRecentSearch(search);
                                                            }}
                                                            className="flex items-center space-x-3 p-2 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors"
                                                        >
                                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                                                <History className="w-5 h-5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold text-slate-900 truncate">{search.location}</p>
                                                                <p className="text-xs text-slate-400 truncate">
                                                                    {search.datesLabel} {search.guestsLabel ? `· ${search.guestsLabel}` : ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Recommended Destinations */}
                                        <div>
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Destinasi yang disarankan</h4>
                                            <div className="space-y-1">
                                                {destinations.slice(0, 5).map((dest, idx) => (
                                                    <div
                                                        key={dest.id || idx}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            selectDestination(dest.query);
                                                        }}
                                                        className="flex items-center space-x-3 p-2.5 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100/80 flex items-center justify-center text-slate-500 shrink-0">
                                                            <Compass className="w-5 h-5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-slate-900 truncate">{dest.name}</p>
                                                            <p className="text-xs text-slate-400 truncate leading-relaxed">{dest.city}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Kapan Column */}
                            <div 
                                onClick={() => setActiveTab('kapan')}
                                className={`flex-1 px-6 py-2.5 rounded-full cursor-pointer transition-all text-left flex flex-col justify-center relative ${
                                    activeTab === 'kapan' 
                                        ? 'bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:bg-white' 
                                        : 'hover:bg-slate-200/50'
                                }`}
                            >
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Kapan</label>
                                <span className="text-sm font-semibold text-slate-900 truncate h-5 block mt-0.5">
                                    {formatDateRange(searchParams.checkIn, searchParams.checkOut)}
                                </span>

                                {/* Calendar Dropdown Panel */}
                                {activeTab === 'kapan' && (
                                    <div 
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute top-[120%] left-1/2 -translate-x-1/2 w-[720px] bg-white rounded-3xl shadow-[0_16px_36px_rgba(0,0,0,0.12)] border border-slate-100/80 p-6 z-50 text-slate-800 animate-fadeIn"
                                    >
                                        <div className="flex justify-center mb-6">
                                            <div className="bg-slate-100 p-1 rounded-full flex space-x-1">
                                                <button
                                                    type="button"
                                                    className="px-6 py-1.5 rounded-full text-[11px] font-bold bg-white text-slate-900 shadow-sm"
                                                >
                                                    Tanggal
                                                </button>
                                                <button
                                                    type="button"
                                                    className="px-6 py-1.5 rounded-full text-[11px] font-bold text-slate-500 hover:text-slate-900"
                                                >
                                                    Fleksibel
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-8 relative">
                                            {renderCalendarMonth(currentCalendarDate)}
                                            {renderCalendarMonth(getNextMonthDate(currentCalendarDate))}
                                            
                                            <div className="absolute top-1 left-2 right-2 flex justify-between pointer-events-none z-10">
                                                <button
                                                    type="button"
                                                    onClick={prevCalendarMonth}
                                                    className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-full shadow-xs text-slate-600 pointer-events-auto active:scale-95 transition-all"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={nextCalendarMonth}
                                                    className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-full shadow-xs text-slate-600 pointer-events-auto active:scale-95 transition-all"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-100 mt-6 pt-4 flex justify-between items-center">
                                            <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none py-1">
                                                {[
                                                    { label: 'Tanggal pasti', value: 0 },
                                                    { label: '± 1 hari', value: 1 },
                                                    { label: '± 2 hari', value: 2 },
                                                    { label: '± 3 hari', value: 3 },
                                                    { label: '± 7 hari', value: 7 },
                                                    { label: '± 14 hari', value: 14 },
                                                ].map((preset, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => setSelectedFlexibility(preset.value)}
                                                        className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border transition-all whitespace-nowrap active:scale-95 ${
                                                            selectedFlexibility === preset.value
                                                                ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900'
                                                        }`}
                                                    >
                                                        {preset.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchParams({ ...searchParams, checkIn: '', checkOut: '' });
                                                }}
                                                className="text-xs font-bold text-slate-600 hover:text-slate-900 underline shrink-0 px-2 active:scale-95"
                                            >
                                                Hapus tanggal
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Peserta Column */}
                            <div 
                                onClick={() => setActiveTab('peserta')}
                                className={`flex-[1.4] pl-6 pr-2 py-2.5 rounded-full cursor-pointer transition-all text-left flex flex-row items-center justify-between ${
                                    activeTab === 'peserta' 
                                        ? 'bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:bg-white' 
                                        : 'hover:bg-slate-200/50'
                                }`}
                            >
                                <div className="min-w-0 flex-1 flex flex-col justify-center">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Peserta</label>
                                    <span className="text-sm font-semibold text-slate-900 truncate h-5 block mt-0.5">
                                        {getGuestsLabel()}
                                    </span>
                                </div>

                                <button
                                    type="submit"
                                    onClick={(e) => {
                                        if (!activeTab) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setActiveTab('lokasi');
                                        }
                                    }}
                                    className={`bg-rose-500 hover:bg-rose-600 active:scale-95 text-white flex items-center justify-center font-bold rounded-full transition-all duration-300 ease-in-out cursor-pointer shadow-sm ${
                                        activeTab ? 'px-5 py-3 space-x-1.5 ml-2' : 'p-3.5'
                                    }`}
                                    title="Cari"
                                >
                                    <Search className="w-4 h-4 shrink-0" strokeWidth={3} />
                                    {activeTab && <span className="text-sm tracking-tight font-black animate-fadeIn">Cari</span>}
                                </button>

                                {/* Guests Counter Dropdown Panel */}
                                {activeTab === 'peserta' && (
                                    <div 
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute top-[120%] right-0 w-[400px] bg-white rounded-3xl shadow-[0_16px_36px_rgba(0,0,0,0.12)] border border-slate-100/80 p-6 z-50 text-slate-800 text-left animate-fadeIn"
                                    >
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h5 className="text-sm font-bold text-slate-900">Dewasa</h5>
                                                    <p className="text-xs text-slate-400">Usia 13 tahun ke atas</p>
                                                </div>
                                                <div className="flex items-center space-x-3.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleGuestChange('adults', 'dec')}
                                                        disabled={adults === 0}
                                                        className={`w-8 h-8 rounded-full border flex items-center justify-center text-slate-500 hover:border-slate-850 hover:text-slate-850 transition-all ${
                                                            adults === 0 ? 'opacity-30 cursor-not-allowed border-slate-200' : 'border-slate-300'
                                                        }`}
                                                    >
                                                        <Minus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <span className="text-sm font-bold text-slate-900 w-4 text-center">{adults}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleGuestChange('adults', 'inc')}
                                                        className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:border-slate-850 hover:text-slate-850 transition-all"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <hr className="border-slate-100" />
                                            
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h5 className="text-sm font-bold text-slate-900">Anak-anak</h5>
                                                    <p className="text-xs text-slate-400">Usia 2–12</p>
                                                </div>
                                                <div className="flex items-center space-x-3.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleGuestChange('children', 'dec')}
                                                        disabled={childrenCount === 0}
                                                        className={`w-8 h-8 rounded-full border flex items-center justify-center text-slate-500 hover:border-slate-850 hover:text-slate-850 transition-all ${
                                                            childrenCount === 0 ? 'opacity-30 cursor-not-allowed border-slate-200' : 'border-slate-300'
                                                        }`}
                                                    >
                                                        <Minus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <span className="text-sm font-bold text-slate-900 w-4 text-center">{childrenCount}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleGuestChange('children', 'inc')}
                                                        className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:border-slate-850 hover:text-slate-850 transition-all"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            <hr className="border-slate-100" />
                                            
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h5 className="text-sm font-bold text-slate-900">Balita</h5>
                                                    <p className="text-xs text-slate-400">Di bawah 2 tahun</p>
                                                </div>
                                                <div className="flex items-center space-x-3.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleGuestChange('infants', 'dec')}
                                                        disabled={infants === 0}
                                                        className={`w-8 h-8 rounded-full border flex items-center justify-center text-slate-500 hover:border-slate-850 hover:text-slate-850 transition-all ${
                                                            infants === 0 ? 'opacity-30 cursor-not-allowed border-slate-200' : 'border-slate-300'
                                                        }`}
                                                    >
                                                        <Minus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <span className="text-sm font-bold text-slate-900 w-4 text-center">{infants}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleGuestChange('infants', 'inc')}
                                                        className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:border-slate-850 hover:text-slate-850 transition-all"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            <hr className="border-slate-100" />
                                            
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h5 className="text-sm font-bold text-slate-900">Hewan peliharaan</h5>
                                                    <p className="text-xs text-slate-450 underline">Membawa hewan pemandu?</p>
                                                </div>
                                                <div className="flex items-center space-x-3.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleGuestChange('pets', 'dec')}
                                                        disabled={pets === 0}
                                                        className={`w-8 h-8 rounded-full border flex items-center justify-center text-slate-500 hover:border-slate-850 hover:text-slate-850 transition-all ${
                                                            pets === 0 ? 'opacity-30 cursor-not-allowed border-slate-200' : 'border-slate-300'
                                                        }`}
                                                    >
                                                        <Minus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <span className="text-sm font-bold text-slate-900 w-4 text-center">{pets}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleGuestChange('pets', 'inc')}
                                                        className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:border-slate-850 hover:text-slate-850 transition-all"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            {/* ===== INSPIRASI DESTINASI (Airbnb-style location cards) ===== */}
            <section className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
                <div className="mb-8">
                    <h2 className="text-2xl sm:text-3xl font-serif font-medium text-slate-900 tracking-tight">
                        Inspirasi untuk perjalanan berikutnya
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Pilih destinasi favorit dan temukan villa terbaik</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {destinations.map((dest, idx) => {
                        const group = groupedByLocation.find(g => g.query === dest.query);
                        const count = group?.villas.length ?? 0;
                        return (
                            <Link
                                key={dest.id || idx}
                                href={`/villas?location=${dest.query}`}
                                className="group relative aspect-[3/2] rounded-2xl overflow-hidden bg-slate-100 cursor-pointer"
                            >
                                <img
                                    src={dest.image}
                                    alt={dest.name}
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                                    <h3 className="text-white font-semibold text-sm leading-tight">{dest.name}</h3>
                                    <p className="text-white/70 text-xs mt-0.5">{count > 0 ? `${count} Villa` : (dest.count_fallback || '0 Villa')}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* ===== CATEGORIES PILLS ===== */}
            <section className="border-y border-slate-200 bg-slate-50/50">
                <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex items-center space-x-3 overflow-x-auto pb-1 scrollbar-none">
                        {categories.map((cat) => {
                            const IconComponent = cat.icon;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                                        selectedCategory === cat.id
                                            ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                                            : 'bg-white border-slate-300 text-slate-600 hover:border-slate-900 hover:text-slate-900'
                                    }`}
                                >
                                    <IconComponent className="w-4 h-4" />
                                    <span>{cat.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ===== VILLA PER LOKASI (grouped sections, Airbnb-style) ===== */}
            {loading ? (
                <section className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                </section>
            ) : (
                <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-16">
                    {groupedByLocation.map((group) => (
                        <section key={group.query}>
                            <div className="flex items-end justify-between mb-6">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-serif font-medium text-slate-900 tracking-tight">
                                        Populer di {group.city}
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-0.5">{group.villas.length} villa tersedia</p>
                                </div>
                                <Link
                                    href={`/villas?location=${group.query}`}
                                    className="hidden sm:inline-flex items-center text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors"
                                >
                                    Lihat semua <ArrowRight className="w-4 h-4 ml-1" />
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-x-4 gap-y-10">
                                {group.villas.slice(0, 7).map((villa) => (
                                    <VillaCard
                                        key={villa.id}
                                        villa={villa}
                                        wishlist={wishlist}
                                        toggleWishlist={toggleWishlist}
                                        searchParams={searchParams}
                                    />
                                ))}
                            </div>
                            <div className="mt-6 sm:hidden">
                                <Link
                                    href={`/villas?location=${group.query}`}
                                    className="inline-flex items-center text-sm font-semibold text-rose-500"
                                >
                                    Lihat semua villa di {group.query} <ArrowRight className="w-4 h-4 ml-1" />
                                </Link>
                            </div>
                        </section>
                    ))}

                    {unmatchedVillas.length > 0 && (
                        <section>
                            <div className="mb-6">
                                <h2 className="text-xl sm:text-2xl font-serif font-medium text-slate-900 tracking-tight">
                                    Villa Lainnya
                                </h2>
                                <p className="text-sm text-slate-500 mt-0.5">{unmatchedVillas.length} villa tersedia</p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-x-4 gap-y-10">
                                {unmatchedVillas.slice(0, 7).map((villa) => (
                                    <VillaCard
                                        key={villa.id}
                                        villa={villa}
                                        wishlist={wishlist}
                                        toggleWishlist={toggleWishlist}
                                        searchParams={searchParams}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {/* ===== WHY US ===== */}
            <section className="bg-slate-950 text-white py-20 px-4 mt-8">
                <div className="max-w-8xl mx-auto">
                    <div className="text-center mb-14 space-y-3">
                        <h2 className="text-2xl sm:text-3xl font-serif font-medium tracking-tight text-white">
                            Mengapa Memilih PusatVilla.id?
                        </h2>
                        <p className="text-sm text-slate-400 max-w-xl mx-auto">
                            Platform persewaan terpercaya dengan kemudahan transaksi pembayaran otomatis dan pelayanan responsif.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: Calendar, title: 'Kalender Real-time', desc: 'Jadwal ketersediaan diperbarui otomatis secara real-time untuk mencegah double booking.' },
                            { icon: ShieldCheck, title: 'Pembayaran Digital Aman', desc: 'Pembayaran digital terverifikasi otomatis via Midtrans Snap (QRIS, Transfer, E-Wallet).' },
                            { icon: Zap, title: 'Konfirmasi Instan', desc: 'Tiket reservasi dan nota pembayaran dikirim langsung ke email setelah transaksi sukses.' },
                            { icon: Phone, title: 'Dukungan WhatsApp', desc: 'Koordinasi check-in dan serah terima kunci dipandu langsung oleh admin via WhatsApp.' },
                        ].map((item, i) => (
                            <div key={i} className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400">
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <h3 className="font-serif text-base font-semibold text-white">{item.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== CTA ===== */}
            <section className="bg-rose-500 text-white py-16 px-4">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <h2 className="text-2xl sm:text-3xl font-serif font-medium">Butuh Rekomendasi atau Rencana Rombongan?</h2>
                    <p className="text-rose-100 max-w-xl mx-auto text-sm leading-relaxed">
                        Hubungi layanan admin kami via WhatsApp untuk penawaran harga khusus, pemesanan rombongan, atau bantuan teknis saat check-in.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/villas"
                            className="w-full sm:w-auto bg-white text-rose-600 font-semibold px-7 py-3.5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all text-sm"
                        >
                            Jelajahi Villa Sekarang
                        </Link>
                        <a
                            href="https://wa.me/6281234567890"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto bg-slate-950 text-white font-semibold px-7 py-3.5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all text-sm flex items-center justify-center space-x-2 cursor-pointer"
                        >
                            <Phone className="w-4 h-4" />
                            <span>Hubungi Admin</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 py-12">
                <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="space-y-3">
                        <h3 className="font-serif text-white text-lg font-semibold">PusatVilla.id</h3>
                        <p className="text-sm leading-relaxed text-slate-500">
                            Platform persewaan villa premium terbaik di Indonesia. Akomodasi berkualitas tinggi dengan reservasi modern, instan, dan aman.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-white text-xs font-semibold uppercase tracking-widest">Hubungi Kami</h3>
                        <ul className="text-sm space-y-2 text-slate-500">
                            <li>📍 Yogyakarta, Indonesia</li>
                            <li>✉️ support@pusatvilla.id</li>
                            <li>📞 +62 812 3456 7890</li>
                        </ul>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-white text-xs font-semibold uppercase tracking-widest">Navigasi</h3>
                        <ul className="text-sm space-y-2">
                            <li><Link href="/villas" className="text-slate-500 hover:text-rose-400 transition-colors">Cari Katalog Villa</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 mt-10 pt-6 text-center text-xs text-slate-600">
                    <p>© {new Date().getFullYear()} PusatVilla.id — Dibuat oleh KalanaLabs. Hak Cipta Dilindungi.</p>
                </div>
            </footer>
        </div>
    );
}
