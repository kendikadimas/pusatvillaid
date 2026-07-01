'use client';

import React, { useEffect, useState, useRef } from 'react';
import axiosClient from '@/lib/axios';
import { Villa, Destination } from '@/types';
import { toast } from 'sonner';

import { categories } from '@/components/CategoryFilter';
import PublicFooter from '@/components/PublicFooter';
import { initScrollReveal } from '@/lib/useScrollReveal';
import { useWishlist } from '@/hooks/useWishlist';

import HomeHeader from '@/components/sections/HomeHeader';
import HeroSection from '@/components/sections/HeroSection';
import DestinationGrid from '@/components/sections/DestinationGrid';
import VillaSection from '@/components/sections/VillaSection';
import WhyUsSection from '@/components/sections/WhyUsSection';
import CTASection from '@/components/sections/CTASection';

// New mobile components
import BottomNav from '@/components/BottomNav';
import SearchOverlay from '@/components/SearchOverlay';
import ContinueSearchCard from '@/components/ContinueSearchCard';
import MobilePropertyCard from '@/components/MobilePropertyCard';
import { Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';

const DEFAULT_DESTINATIONS: Destination[] = [
    { id: 1, name: 'Puncak, Bogor', city: 'Puncak, Bogor', query: 'Bogor', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80', count_fallback: '12+ Villa' },
    { id: 2, name: 'Ubud, Gianyar', city: 'Ubud, Gianyar', query: 'Ubud', image: 'https://images.unsplash.com/photo-1549638441-b787d2e11f14?auto=format&fit=crop&w=600&q=80', count_fallback: '8+ Villa' },
    { id: 3, name: 'Seminyak, Bali', city: 'Seminyak, Bali', query: 'Bali', image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=600&q=80', count_fallback: '15+ Villa' },
    { id: 4, name: 'Dago, Bandung', city: 'Dago, Bandung', query: 'Bandung', image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=600&q=80', count_fallback: '6+ Villa' },
    { id: 5, name: 'Batu, Malang', city: 'Batu, Malang', query: 'Malang', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80', count_fallback: '9+ Villa' },
    { id: 6, name: 'Senggigi, Lombok', city: 'Senggigi, Lombok', query: 'Lombok', image: 'https://images.unsplash.com/photo-1514995669114-6081e934b693?auto=format&fit=crop&w=600&q=80', count_fallback: '5+ Villa' },
];

export default function HomePage() {
    const router = useRouter();
    const { settings } = useSettings();
    const [villas, setVillas] = useState<Villa[]>([]);
    const [destinations, setDestinations] = useState<Destination[]>(DEFAULT_DESTINATIONS);
    const [loading, setLoading] = useState(true);
    const { wishlist, toggleWishlist } = useWishlist();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchParams, setSearchParams] = useState({
        location: '',
        checkIn: '',
        checkOut: '',
    });
    const [activeTab, setActiveTab] = useState<'lokasi' | 'kapan' | 'tamu' | null>(null);
    const [adults, setAdults] = useState(0);
    const [childrenCount, setChildrenCount] = useState(0);
    const [infants, setInfants] = useState(0);
    const [pets, setPets] = useState(0);
    const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
    const [recentSearches, setRecentSearches] = useState<{location: string, checkIn: string, checkOut: string, guestsLabel: string, datesLabel: string}[]>([]);
    const [headerSolid, setHeaderSolid] = useState(false);
    
    // Mobile search overlay state
    const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);

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
                <div className="grid grid-cols-7 text-center text-[10px] font-medium text-slate-400 mb-2">
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
                                    isInRange ? 'bg-blue-50/70 text-blue-800 rounded-none' : ''
                                } ${
                                    isSelectedStart ? 'rounded-l-full' : ''
                                } ${
                                    isSelectedEnd ? 'rounded-r-full' : ''
                                }`}
                            >
                                {(isSelectedStart || isSelectedEnd) && (
                                    <div className="absolute inset-0 bg-blue-500 rounded-full scale-90 z-0" />
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
        router.push(url);
    };

    const onScroll = () => {
        const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
        const isSolid = scrollPosition > 10;
        setHeaderSolid(isSolid);
    };

    useEffect(() => {
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const fetchHomepageData = async () => {
            try {
                const [villaRes, destRes] = await Promise.all([
                    axiosClient.get('/villas', { params: { per_page: 200, fields: 'slim' } }),
                    axiosClient.get('/destinations'),
                ]);
                if (villaRes.data?.data) setVillas(villaRes.data.data);
                if (destRes.data?.data) setDestinations(destRes.data.data);
            } catch (err) {
                console.error('Failed to fetch homepage data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchHomepageData();
    }, []);

    // Gentle re-fetch only if data is stale (>5 min since mount)
    const lastFetchRef = useRef(Date.now());
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible' && Date.now() - lastFetchRef.current > 300000) {
                lastFetchRef.current = Date.now();
                axiosClient.get('/villas', { params: { per_page: 200, fields: 'slim' } })
                    .then(res => setVillas(res.data.data || []))
                    .catch(() => {});
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);

    initScrollReveal([loading]);

    const safeVillas = villas || [];
    const safeDestinations = destinations || [];

    const filteredByCategory = safeVillas.filter(v => {
        const cat = categories.find(c => c.id === selectedCategory);
        if (!cat || cat.id === 'all') return true;
        return cat.filter ? cat.filter(v) : true;
    });

    const groupedByLocation = safeDestinations
        .map(d => ({
            ...d,
            villas: filteredByCategory.filter(v =>
                v.destination_id === d.id ||
                (v.location && v.location.toLowerCase().includes(d.query.toLowerCase()))
            ),
        }))
        .filter(g => g.villas.length > 0);

    const unmatchedVillas = filteredByCategory.filter(v =>
        !safeDestinations.some(d =>
            v.destination_id === d.id ||
            (v.location && v.location.toLowerCase().includes(d.query.toLowerCase()))
        )
    );

    return (
        <div className="flex-1 flex flex-col bg-white text-slate-900 font-sans relative">
            {activeTab && (
                <div
                    className="fixed inset-0 z-40 bg-[#111111]/25 backdrop-blur-[1px] transition-all duration-300 animate-fadeIn"
                    onClick={() => setActiveTab(null)}
                />
            )}

            <div className="hidden lg:block">
                <HomeHeader
                    headerSolid={headerSolid}
                    searchParams={searchParams}
                    setSearchParams={setSearchParams}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    handleSearch={handleSearch}
                    recentSearches={recentSearches}
                    selectRecentSearch={selectRecentSearch}
                    destinations={destinations}
                    selectDestination={selectDestination}
                    formatDateRange={formatDateRange}
                    renderCalendarMonth={renderCalendarMonth}
                    currentCalendarDate={currentCalendarDate}
                    getNextMonthDate={getNextMonthDate}
                    prevCalendarMonth={prevCalendarMonth}
                    nextCalendarMonth={nextCalendarMonth}
                    adults={adults}
                    childrenCount={childrenCount}
                    infants={infants}
                    pets={pets}
                    handleGuestChange={handleGuestChange}
                    getGuestsLabel={getGuestsLabel}
                />

                <HeroSection
                    headerSolid={headerSolid}
                    searchParams={searchParams}
                    setSearchParams={setSearchParams}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    handleSearch={handleSearch}
                    recentSearches={recentSearches}
                    selectRecentSearch={selectRecentSearch}
                    destinations={destinations}
                    selectDestination={selectDestination}
                    formatDateRange={formatDateRange}
                    renderCalendarMonth={renderCalendarMonth}
                    currentCalendarDate={currentCalendarDate}
                    getNextMonthDate={getNextMonthDate}
                    prevCalendarMonth={prevCalendarMonth}
                    nextCalendarMonth={nextCalendarMonth}
                    adults={adults}
                    childrenCount={childrenCount}
                    infants={infants}
                    pets={pets}
                    handleGuestChange={handleGuestChange}
                    getGuestsLabel={getGuestsLabel}
                />

                <DestinationGrid
                    destinations={destinations}
                    groupedByLocation={groupedByLocation}
                />

                <VillaSection
                    loading={loading}
                    groupedByLocation={groupedByLocation}
                    unmatchedVillas={unmatchedVillas}
                    wishlist={wishlist}
                    toggleWishlist={toggleWishlist}
                    searchParams={searchParams}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                />

                <CTASection />

                <div className="pb-20 lg:pb-0">
                    <PublicFooter />
                </div>
            </div>

            {/* ===== MOBILE LAYOUT ===== */}
            <div className="lg:hidden pb-20">
                {/* Mobile Header */}
                <div className={`sticky top-0 z-40 transition-all duration-300 ${headerSolid ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'}`}>
                    <div className="flex items-center gap-3 px-4 py-3">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
                            <svg className="w-7 h-7 fill-current text-blue-500" viewBox="0 0 32 32">
                                <path d="M16 1c-2.008 0-3.92.518-5.59 1.432A15.011 15.011 0 0 0 .91 18.066c1.196 4.398 4.73 7.828 9.098 9.098C11.954 27.674 13.914 28 16 28c2.086 0 4.046-.326 5.992-.836 4.368-1.27 7.902-4.7 9.098-9.098A15.01 15.01 0 0 0 16 1zm0 25c-1.748 0-3.388-.274-5.012-.702A12.012 12.012 0 0 1 3.702 11.23C4.898 6.832 8.432 3.4 12.8 2.13A12.01 12.01 0 0 1 16 2a11.983 11.983 0 0 1 12.298 9.23c1.196 4.398-2.336 7.828-6.702 9.098C19.966 25.666 18.066 26 16 26z"/>
                                <path d="M16 7.5L7.5 14.5h3.5v9h10v-9h3.5zM18 21.5h-4v-7.5h4z"/>
                            </svg>
                            <span className="text-base font-sans font-black tracking-tight text-blue-500">{settings.settings_prop_name}</span>
                        </Link>

                        {/* Search pill */}
                        <button
                            onClick={() => setIsSearchOverlayOpen(true)}
                            className="flex-1 flex items-center gap-3 bg-white border-2 border-slate-200 rounded-full py-2.5 px-4 shadow-sm hover:shadow-md transition-all"
                        >
                            <Search className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-400 font-medium">Mulai pencarian</span>
                        </button>
                    </div>

                    {/* Category cards — hidden */}
                    {/* <CategoryCards ... /> */}
                </div>

                {/* Continue search card */}
                {recentSearches.length > 0 && (
                    <div className="px-4 py-4">
                        <ContinueSearchCard
                            location={recentSearches[0].location}
                            checkIn={recentSearches[0].checkIn}
                            checkOut={recentSearches[0].checkOut}
                            guests={adults + childrenCount}
                            onClick={() => setIsSearchOverlayOpen(true)}
                        />
                    </div>
                )}

                {/* Recommendations section */}
                {recentSearches.length > 0 && (
                    <div className="px-4 py-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-900">
                                Berdasarkan pencarian Anda di {recentSearches[0].location}
                            </h2>
                            <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                <ArrowRight className="w-4 h-4 text-slate-600" />
                            </button>
                        </div>

                        {/* Horizontal scroll property cards */}
                        <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 snap-x snap-mandatory scroll-pl-4">
                            {villas.slice(0, 6).map((villa) => (
                                <div key={villa.id} className="flex-shrink-0 w-[240px] snap-start">
                                    <MobilePropertyCard villa={villa} />
                                </div>
                            ))}
                            <div className="w-[1px] flex-shrink-0" />
                        </div>
                    </div>
                )}

                {/* Price bar — hidden */}
                {/* <div className="px-4 py-4"><PriceBar /></div> */}

                {/* Mobile: Destination Grid */}
                {!loading && destinations.length > 0 && (
                    <div className="border-t border-slate-100">
                        <DestinationGrid
                            destinations={destinations}
                            groupedByLocation={groupedByLocation}
                        />
                    </div>
                )}

                {/* Mobile: location-grouped carousels */}
                {!loading && groupedByLocation.map((group) => (
                    <div key={group.query} className="px-4 py-5">
                        <div className="flex items-end justify-between mb-3">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Villa di {group.city}
                                </h2>
                            </div>
                            <Link
                                href={`/villas?location=${group.query}`}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                Lihat semua
                                <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 snap-x snap-mandatory scroll-pl-4">
                            {group.villas.map((villa) => (
                                <div key={villa.id} className="flex-shrink-0 w-[220px] snap-start">
                                    <MobilePropertyCard villa={villa} />
                                </div>
                            ))}
                            <div className="w-[1px] flex-shrink-0" />
                        </div>
                    </div>
                ))}

                {/* Unmatched villas */}
                {!loading && unmatchedVillas.length > 0 && (
                    <div className="px-4 py-5 pb-20">
                        <h2 className="text-lg font-bold text-slate-900 mb-3">Villa Lainnya</h2>
                        <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 snap-x snap-mandatory scroll-pl-4">
                            {unmatchedVillas.map((villa) => (
                                <div key={villa.id} className="flex-shrink-0 w-[220px] snap-start">
                                    <MobilePropertyCard villa={villa} />
                                </div>
                            ))}
                            <div className="w-[1px] flex-shrink-0" />
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                )}
            </div>

            {/* Mobile Bottom Navigation */}
            <BottomNav />

            {/* Mobile Search Overlay */}
            <SearchOverlay
                isOpen={isSearchOverlayOpen}
                onClose={() => setIsSearchOverlayOpen(false)}
                initialLocation={searchParams.location}
                initialCheckIn={searchParams.checkIn}
                initialCheckOut={searchParams.checkOut}
                initialGuests={adults + childrenCount}
            />
        </div>
    );
}
