'use client';

import React, { useEffect, useState } from 'react';
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

const DEFAULT_DESTINATIONS: Destination[] = [
    { id: 1, name: 'Puncak, Bogor', city: 'Puncak, Bogor', query: 'Bogor', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80', count_fallback: '12+ Villa' },
    { id: 2, name: 'Ubud, Gianyar', city: 'Ubud, Gianyar', query: 'Ubud', image: 'https://images.unsplash.com/photo-1549638441-b787d2e11f14?auto=format&fit=crop&w=600&q=80', count_fallback: '8+ Villa' },
    { id: 3, name: 'Seminyak, Bali', city: 'Seminyak, Bali', query: 'Bali', image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=600&q=80', count_fallback: '15+ Villa' },
    { id: 4, name: 'Dago, Bandung', city: 'Dago, Bandung', query: 'Bandung', image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=600&q=80', count_fallback: '6+ Villa' },
    { id: 5, name: 'Batu, Malang', city: 'Batu, Malang', query: 'Malang', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80', count_fallback: '9+ Villa' },
    { id: 6, name: 'Senggigi, Lombok', city: 'Senggigi, Lombok', query: 'Lombok', image: 'https://images.unsplash.com/photo-1514995669114-6081e934b693?auto=format&fit=crop&w=600&q=80', count_fallback: '5+ Villa' },
];

export default function HomePage() {
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
    const [selectedFlexibility, setSelectedFlexibility] = useState(0);
    const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
    const [recentSearches, setRecentSearches] = useState<{location: string, checkIn: string, checkOut: string, guestsLabel: string, datesLabel: string}[]>([]);
    const [headerSolid, setHeaderSolid] = useState(false);

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
        window.location.href = url;
    };

    const onScroll = () => {
        const isSolid = window.scrollY > 10;
        setHeaderSolid(isSolid);
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
                const response = await axiosClient.get('/villas?per_page=50');
                setVillas(response.data.data || []);
            } catch (err) {
                console.error('Failed to fetch villas:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchVillas();
    }, []);

    initScrollReveal([loading]);

    const filteredByCategory = villas.filter(v => {
        const cat = categories.find(c => c.id === selectedCategory);
        if (!cat || cat.id === 'all') return true;
        return cat.filter ? cat.filter(v) : true;
    });

    const groupedByLocation = destinations
        .map(d => ({
            ...d,
            villas: filteredByCategory.filter(v =>
                v.destination_id === d.id ||
                (v.location && v.location.toLowerCase().includes(d.query.toLowerCase()))
            ),
        }))
        .filter(g => g.villas.length > 0);

    const unmatchedVillas = filteredByCategory.filter(v =>
        !destinations.some(d =>
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
                selectedFlexibility={selectedFlexibility}
                setSelectedFlexibility={setSelectedFlexibility}
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
                selectedFlexibility={selectedFlexibility}
                setSelectedFlexibility={setSelectedFlexibility}
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

            {/* <WhyUsSection /> */}

            <CTASection />

            <PublicFooter />
        </div>
    );
}
