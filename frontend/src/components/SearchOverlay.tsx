'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Search, ArrowLeft, MapPin, Calendar, Users, Minus, Plus, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import axiosClient from '@/lib/axios';
import { Destination, Villa } from '@/types';
import { DayPicker, DateRange, useDayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    initialStep?: 'location' | 'dates' | 'guests';
    initialLocation?: string;
    initialCheckIn?: string;
    initialCheckOut?: string;
    initialGuests?: number;
}

type SearchStep = 'location' | 'dates' | 'guests';

export default function SearchOverlay({
    isOpen,
    onClose,
    initialStep = 'location',
    initialLocation = '',
    initialCheckIn = '',
    initialCheckOut = '',
    initialGuests = 0,
}: SearchOverlayProps) {
    const router = useRouter();
    const [step, setStep] = useState<SearchStep>(initialStep);
    const [location, setLocation] = useState(initialLocation);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [adults, setAdults] = useState(0);
    const [children, setChildren] = useState(0);
    const [infants, setInfants] = useState(0);
    const [recentSearches, setRecentSearches] = useState<any[]>([]);
    
    // Loaded destinations and villas for selection
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [villas, setVillas] = useState<Villa[]>([]);
    
    const searchInputRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Scroll content container to top when step changes
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [step]);

    // Load recent searches from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('pusatvilla_searches');
            if (saved) {
                try {
                    setRecentSearches(JSON.parse(saved).slice(0, 3));
                } catch (e) {
                    console.error(e);
                }
            }
        }
    }, []);

    // Load destinations and villas on mount
    useEffect(() => {
        const fetchSearchData = async () => {
            try {
                const [destRes, villaRes] = await Promise.all([
                    axiosClient.get('/destinations'),
                    axiosClient.get('/villas?per_page=100')
                ]);
                if (destRes.data && destRes.data.data) {
                    setDestinations(destRes.data.data);
                }
                if (villaRes.data && villaRes.data.data) {
                    setVillas(villaRes.data.data);
                }
            } catch (err) {
                console.error('Failed to fetch search overlay data:', err);
            }
        };
        fetchSearchData();
    }, []);

    // Initialize from props
    useEffect(() => {
        if (isOpen) {
            setStep(initialStep);
            setLocation(initialLocation);
            if (initialCheckIn && initialCheckOut) {
                setDateRange({
                    from: new Date(initialCheckIn),
                    to: new Date(initialCheckOut),
                });
            } else {
                setDateRange(undefined);
            }
            setAdults(initialGuests);
            setChildren(0);
            setInfants(0);
            setSearchQuery('');
        }
    }, [isOpen, initialStep, initialLocation, initialCheckIn, initialCheckOut, initialGuests]);

    // Focus search input when location step opens
    useEffect(() => {
        if (isOpen && step === 'location') {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen, step]);

    if (!isOpen) return null;

    const formatDateRange = (range: DateRange | undefined) => {
        if (!range?.from) return 'Tambahkan tanggal';
        const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const inDay = range.from.getDate();
        const inMonth = monthsShort[range.from.getMonth()];

        if (!range.to) return `${inDay} ${inMonth}`;

        const outDay = range.to.getDate();
        const outMonth = monthsShort[range.to.getMonth()];

        if (range.from.getMonth() === range.to.getMonth()) {
            return `${inDay}–${outDay} ${inMonth}`;
        }
        return `${inDay} ${inMonth} – ${outDay} ${outMonth}`;
    };

    const getGuestsLabel = () => {
        const total = adults + children;
        if (total === 0) return 'Tambahkan tamu';
        let label = `${total} tamu`;
        if (infants > 0) label += `, ${infants} balita`;
        return label;
    };

    const handleSearchSubmit = () => {
        const params = new URLSearchParams();
        if (location) params.set('location', location);
        if (dateRange?.from) params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'));
        if (dateRange?.to) params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'));
        const totalGuests = adults + children;
        if (totalGuests > 0) params.set('guests', String(totalGuests));

        // Save to recent searches
        if (location) {
            const searchEntry = {
                location,
                checkIn: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '',
                checkOut: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '',
                guestsLabel: getGuestsLabel(),
                datesLabel: formatDateRange(dateRange),
            };
            const existing = recentSearches.filter(s => s.location !== location);
            const updated = [searchEntry, ...existing].slice(0, 3);
            localStorage.setItem('pusatvilla_searches', JSON.stringify(updated));
        }

        const qs = params.toString();
        
        router.push(qs ? `/villas?${qs}` : '/villas');
        onClose();
    };

    const handleSelectRecentSearch = (search: any) => {
        setLocation(search.location);
        if (search.checkIn && search.checkOut) {
            setDateRange({
                from: new Date(search.checkIn),
                to: new Date(search.checkOut),
            });
        }
        setStep('dates');
    };

    const handleSelectLocationItem = (name: string) => {
        setLocation(name);
        setSearchQuery('');
        setStep('dates');
    };

    const handleClearAll = () => {
        setLocation('');
        setDateRange(undefined);
        setAdults(0);
        setChildren(0);
        setInfants(0);
    };

    const handleResetDates = () => {
        setDateRange(undefined);
    };

    // Date range selection handler
    const handleSelectRange = (range: DateRange | undefined) => {
        if (range?.from && range?.to) {
            let hasOverlappingDisabledDate = false;
            const start = startOfDay(range.from);
            const end = startOfDay(range.to);
            let current = start;
            while (isBefore(current, end)) {
                current = addDays(current, 1);
            }
            if (!hasOverlappingDisabledDate) {
                setDateRange(range);
            }
        } else {
            setDateRange(range);
        }
    };

    const handleNextFromDates = () => {
        if (dateRange?.from && dateRange?.to) {
            setStep('guests');
        }
    };

    // Filter destinations and villas based on search query
    const getFilteredResults = () => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
            return { filteredDests: destinations, filteredVillas: [] };
        }
        
        const filteredDests = destinations.filter(d => 
            d.name.toLowerCase().includes(query) || 
            d.city.toLowerCase().includes(query) ||
            d.query.toLowerCase().includes(query)
        );
        
        const filteredVillas = villas.filter(v => 
            v.name.toLowerCase().includes(query) || 
            v.location.toLowerCase().includes(query)
        );

        return { filteredDests, filteredVillas };
    };

    const { filteredDests, filteredVillas } = getFilteredResults();
    const canProceedFromDates = dateRange?.from != null && dateRange?.to != null;

    return (
        <div className="fixed inset-0 z-[1000] lg:hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />

            {/* Overlay Panel */}
            <div className="absolute inset-0 bg-white flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="bg-white border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center justify-between px-4 py-4">
                        {step !== 'location' ? (
                            <button
                                onClick={() => {
                                    if (step === 'guests') setStep('dates');
                                    else setStep('location');
                                }}
                                className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                                aria-label="Kembali"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-700" />
                            </button>
                        ) : (
                            <div className="w-9" />
                        )}

                        {/* Summary pills (shown sequentially to follow order) */}
                        <div className="flex-1 mx-3 min-w-0 text-center">
                            <span className="text-sm font-bold text-slate-900 block">
                                {step === 'location' && 'Pilih Lokasi'}
                                {step === 'dates' && 'Pilih Tanggal'}
                                {step === 'guests' && 'Pilih Tamu'}
                            </span>
                            {location && step !== 'location' && (
                                <span className="text-xs text-green-600 font-semibold truncate block mt-0.5">
                                    {location}
                                    {dateRange?.from && ` · ${format(dateRange.from, 'd MMM')} - ${dateRange.to ? format(dateRange.to, 'd MMM') : ''}`}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 -mr-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                            aria-label="Tutup"
                        >
                            <X className="w-5 h-5 text-slate-700" />
                        </button>
                    </div>
                </div>

                {/* Content Area (Scrolls independently) */}
                <div ref={contentRef} className="flex-1 overflow-y-auto px-5 py-5 scroll-smooth">
                    {/* ===== STEP: LOCATION ===== */}
                    {step === 'location' && (
                        <div className="space-y-6">
                            {/* Search bar */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && searchQuery.trim()) {
                                            e.preventDefault();
                                            handleSelectLocationItem(searchQuery.trim());
                                        }
                                    }}
                                    placeholder="Cari destinasi atau nama villa..."
                                    className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-full text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder-slate-400"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 transition-colors"
                                    >
                                        <X className="w-4 h-4 text-slate-400" />
                                    </button>
                                )}
                            </div>

                            {/* Recent searches */}
                            {recentSearches.length > 0 && !searchQuery && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Pencarian Terkini</p>
                                    <div className="space-y-1">
                                        {recentSearches.map((search, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSelectRecentSearch(search)}
                                                className="flex items-center gap-3 w-full p-2.5 rounded-2xl hover:bg-slate-50 transition-colors text-left cursor-pointer"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500">
                                                    <MapPin className="w-4.5 h-4.5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-800 text-sm truncate">{search.location}</p>
                                                    <p className="text-[11px] text-slate-450 truncate mt-0.5">{search.datesLabel} · {search.guestsLabel}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Suggested Destinations & Villa Results */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                                    {searchQuery ? 'Hasil Pencarian' : 'Destinasi yang Disarankan'}
                                </p>

                                <div className="space-y-1">
                                    {/* Destination items */}
                                    {filteredDests.map((dest, i) => (
                                        <button
                                            key={`dest-${i}`}
                                            onClick={() => handleSelectLocationItem(dest.name)}
                                            className="flex items-center gap-3 w-full p-2.5 rounded-2xl hover:bg-slate-50 transition-colors text-left cursor-pointer"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                                                <MapPin className="w-4.5 h-4.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-850 text-sm truncate">{dest.name}</p>
                                                <p className="text-[11px] text-slate-400 truncate mt-0.5">{dest.city || 'Destinasi Populer'}</p>
                                            </div>
                                        </button>
                                    ))}

                                    {/* Villa items (only show when searching) */}
                                    {searchQuery && filteredVillas.map((villa, i) => (
                                        <button
                                            key={`villa-${i}`}
                                            onClick={() => handleSelectLocationItem(villa.name)}
                                            className="flex items-center gap-3 w-full p-2.5 rounded-2xl hover:bg-slate-50 transition-colors text-left cursor-pointer"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                                                <Home className="w-4.5 h-4.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-850 text-sm truncate">{villa.name}</p>
                                                <p className="text-[11px] text-slate-400 truncate mt-0.5">{villa.location}</p>
                                            </div>
                                        </button>
                                    ))}

                                    {/* Empty results */}
                                    {searchQuery && filteredDests.length === 0 && filteredVillas.length === 0 && (
                                        <div className="py-8 text-center text-slate-400 text-xs font-medium">
                                            Tidak ditemukan destinasi atau villa dengan nama "{searchQuery}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== STEP: DATES ===== */}
                    {step === 'dates' && (
                        <div className="space-y-5">
                            {/* Centered styled DayPicker calendar */}
                            <div className="w-full flex justify-center py-2 bg-slate-50/50 rounded-3xl border border-slate-100">
                                <style dangerouslySetInnerHTML={{ __html: `
                                    .rdp { --rdp-cell-size: min(44px, 11vw); margin: 0; width: 100%; }
                                    .rdp-months { width: 100%; justify-content: center; }
                                    .rdp-month { width: 100%; max-width: 100%; margin: 0 auto; }
                                    .rdp-table { max-width: 100%; border-collapse: collapse; margin: 0 auto; }
                                    .rdp-cell { text-align: center; padding: 1.5px; }
                                    .rdp-head_cell { text-align: center; font-size: 13px; font-weight: 600; padding-bottom: 8px; }
                                    .rdp-day { 
                                        width: var(--rdp-cell-size) !important; 
                                        height: var(--rdp-cell-size) !important; 
                                        max-width: var(--rdp-cell-size) !important; 
                                        margin: 0 auto; 
                                        border-radius: 9999px;
                                        font-size: 14px;
                                    }
                                    
                                    @media (max-width: 768px) {
                                        .rdp { --rdp-cell-size: min(48px, 13.5vw) !important; }
                                        .rdp-cell { padding: 1.5px; }
                                        .rdp-day { font-size: 14px !important; }
                                    }
                                    @media (max-width: 400px) {
                                        .rdp-day { font-size: 13px !important; }
                                    }
                                    @media (max-width: 350px) {
                                        .rdp-day { font-size: 12px !important; }
                                    }
                                `}} />
                                <DayPicker
                                    mode="range"
                                    selected={dateRange}
                                    onSelect={handleSelectRange}
                                    disabled={[{ before: new Date() }]}
                                    numberOfMonths={1}
                                    locale={localeID}
                                    hideNavigation
                                    className="text-slate-800 w-full flex justify-center"
                                    classNames={{
                                        selected: "bg-green-600 text-white hover:bg-green-700 rounded-full",
                                        today: "text-green-600 font-black rounded-full",
                                        month_caption: "flex items-center w-full mb-4 px-3",
                                        caption_label: "flex-1 text-center text-sm font-bold text-slate-900",
                                        range_start: "bg-green-600 text-white rounded-full font-bold",
                                        range_end: "bg-green-600 text-white rounded-full font-bold",
                                    }}
                                    components={{
                                        MonthCaption: ({ calendarMonth, displayIndex, children, ...divProps }) => {
                                            const { previousMonth, nextMonth, goToMonth, dayPickerProps } = useDayPicker();
                                            const numMonths = dayPickerProps.numberOfMonths ?? 1;
                                            const isSingle = numMonths === 1;
                                            const showPrev = isSingle || displayIndex === 0;
                                            const showNext = isSingle || displayIndex === numMonths - 1;
                                            const handlePrev = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); if (previousMonth) goToMonth(previousMonth); };
                                            const handleNext = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); if (nextMonth) goToMonth(nextMonth); };
                                            return (
                                                <div {...divProps} className="flex items-center w-full mb-2">
                                                    {showPrev ? (
                                                        <button
                                                            type="button"
                                                            onClick={handlePrev}
                                                            disabled={!previousMonth}
                                                            className="p-1 hover:bg-slate-100 rounded-full text-slate-900 active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-20 flex-shrink-0"
                                                            aria-label="Bulan sebelumnya"
                                                        >
                                                            <ChevronLeft className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
                                                        </button>
                                                    ) : <div className="w-7" />}
                                                    <div className="flex-1 text-center text-sm font-bold text-slate-900">
                                                        {children}
                                                    </div>
                                                    {showNext ? (
                                                        <button
                                                            type="button"
                                                            onClick={handleNext}
                                                            disabled={!nextMonth}
                                                            className="p-1 hover:bg-slate-100 rounded-full text-slate-900 active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-20 flex-shrink-0"
                                                            aria-label="Bulan berikutnya"
                                                        >
                                                            <ChevronRight className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
                                                        </button>
                                                    ) : <div className="w-7" />}
                                                </div>
                                            );
                                        },
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* ===== STEP: GUESTS ===== */}
                    {step === 'guests' && (
                        <div className="space-y-6">
                            {/* Guest categories */}
                            <div className="space-y-0 divide-y divide-slate-100 bg-slate-50/50 border border-slate-100 rounded-3xl px-5">
                                {/* Adults */}
                                <div className="flex items-center justify-between py-5">
                                    <div>
                                        <p className="font-bold text-sm text-slate-900">Dewasa</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Usia 13 tahun ke atas</p>
                                    </div>
                                    <div className="flex items-center gap-3.5">
                                        <button
                                            onClick={() => setAdults(Math.max(0, adults - 1))}
                                            disabled={adults === 0}
                                            className="w-9 h-9 rounded-full border border-slate-350 flex items-center justify-center text-slate-650 hover:border-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-6 text-center font-bold text-sm text-slate-800">{adults}</span>
                                        <button
                                            onClick={() => setAdults(adults + 1)}
                                            className="w-9 h-9 rounded-full border border-slate-350 flex items-center justify-center text-slate-650 hover:border-slate-500 hover:text-slate-700 transition-all cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Children */}
                                <div className="flex items-center justify-between py-5">
                                    <div>
                                        <p className="font-bold text-sm text-slate-900">Anak-anak</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Usia 2–12 tahun</p>
                                    </div>
                                    <div className="flex items-center gap-3.5">
                                        <button
                                            onClick={() => setChildren(Math.max(0, children - 1))}
                                            disabled={children === 0}
                                            className="w-9 h-9 rounded-full border border-slate-350 flex items-center justify-center text-slate-650 hover:border-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-6 text-center font-bold text-sm text-slate-800">{children}</span>
                                        <button
                                            onClick={() => setChildren(children + 1)}
                                            className="w-9 h-9 rounded-full border border-slate-350 flex items-center justify-center text-slate-650 hover:border-slate-500 hover:text-slate-700 transition-all cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Infants */}
                                <div className="flex items-center justify-between py-5">
                                    <div>
                                        <p className="font-bold text-sm text-slate-900">Balita</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Di bawah 2 tahun</p>
                                    </div>
                                    <div className="flex items-center gap-3.5">
                                        <button
                                            onClick={() => setInfants(Math.max(0, infants - 1))}
                                            disabled={infants === 0}
                                            className="w-9 h-9 rounded-full border border-slate-350 flex items-center justify-center text-slate-650 hover:border-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-6 text-center font-bold text-sm text-slate-800">{infants}</span>
                                        <button
                                            onClick={() => setInfants(infants + 1)}
                                            className="w-9 h-9 rounded-full border border-slate-350 flex items-center justify-center text-slate-650 hover:border-slate-500 hover:text-slate-700 transition-all cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sticky Footer Area */}
                {step === 'dates' && (
                    <div className="bg-white border-t border-slate-100 px-5 py-4 flex items-center justify-between flex-shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                        <button
                            onClick={handleResetDates}
                            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                            Atur ulang
                        </button>
                        <button
                            onClick={handleNextFromDates}
                            disabled={!canProceedFromDates}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold text-xs py-3 px-6 rounded-full transition-all active:scale-95 cursor-pointer shadow-md shadow-green-500/10"
                        >
                            <span>Selanjutnya</span>
                        </button>
                    </div>
                )}

                {step === 'guests' && (
                    <div className="bg-white border-t border-slate-100 px-5 py-4 flex items-center justify-between flex-shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                        <button
                            onClick={handleClearAll}
                            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                            Hapus semua
                        </button>
                        <button
                            onClick={handleSearchSubmit}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-3 px-7 rounded-full transition-all active:scale-95 cursor-pointer shadow-md shadow-green-500/10"
                        >
                            <Search className="w-3.5 h-3.5" />
                            <span>Cari Villa</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
