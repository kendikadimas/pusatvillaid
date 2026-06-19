'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Search, ArrowLeft, MapPin, Navigation, Calendar, Users, Minus, Plus } from 'lucide-react';
import axiosClient from '@/lib/axios';
import { Destination } from '@/types';
import { DayPicker, DateRange } from 'react-day-picker';
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

const SUGGESTED_DESTINATIONS = [
    { name: 'Yogyakarta, Yogyakarta', desc: 'Jawa Tengah' },
    { name: 'Semarang, Jawa Tengah', desc: 'Jawa Tengah' },
    { name: 'Lembang, Jawa Barat', desc: 'Jawa Barat' },
    { name: 'Batu, Jawa Timur', desc: 'Jawa Timur' },
    { name: 'Malang, Jawa Timur', desc: 'Jawa Timur' },
    { name: 'Bogor, Jawa Barat', desc: 'Jawa Barat' },
    { name: 'Bandung, Jawa Barat', desc: 'Jawa Barat' },
    { name: 'Ubud, Bali', desc: 'Bali' },
    { name: 'Seminyak, Bali', desc: 'Bali' },
    { name: 'Puncak, Bogor', desc: 'Jawa Barat' },
];

const FLEXIBILITY_PRESETS = [
    { label: 'Tanggal pasti', value: 0 },
    { label: '± 1 hari', value: 1 },
    { label: '± 2 hari', value: 2 },
    { label: '± 3 hari', value: 3 },
    { label: '± 7 hari', value: 7 },
];

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
    const [selectedFlexibility, setSelectedFlexibility] = useState(0);
    const [recentSearches, setRecentSearches] = useState<any[]>([]);
    const searchInputRef = useRef<HTMLInputElement>(null);

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
            }
            setAdults(initialGuests);
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

    const handleSelectDestination = (name: string) => {
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
        setSelectedFlexibility(0);
    };

    const handleResetDates = () => {
        setDateRange(undefined);
        setSelectedFlexibility(0);
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
        if (dateRange?.from) {
            setStep('guests');
        }
    };

    // Filter destinations based on search query
    const filteredDestinations = searchQuery.trim()
        ? SUGGESTED_DESTINATIONS.filter(d =>
            d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.desc.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    const canProceedFromDates = dateRange?.from != null;

    return (
        <div className="fixed inset-0 z-[60] lg:hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />

            {/* Overlay Panel */}
            <div className="absolute inset-x-0 top-0 bottom-0 bg-white overflow-y-auto animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="sticky top-0 bg-white z-10 border-b border-slate-100">
                    <div className="flex items-center justify-between px-4 py-3">
                        {step !== 'location' ? (
                            <button
                                onClick={() => {
                                    if (step === 'guests') setStep('dates');
                                    else setStep('location');
                                }}
                                className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        ) : (
                            <div className="w-9" />
                        )}

                        {/* Summary pills (shown when not on location step) */}
                        {step !== 'location' && (
                            <div className="flex-1 mx-2 space-y-0.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-slate-900">Lokasi</span>
                                    <span className="font-bold text-slate-900">{location || 'Mana saja'}</span>
                                </div>
                                {step === 'guests' && (
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-900">Tanggal perjalanan</span>
                                        <span className="font-bold text-slate-900">{formatDateRange(dateRange)}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            className="p-2 -mr-2 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-4 pb-32">
                    {/* ===== STEP: LOCATION ===== */}
                    {step === 'location' && (
                        <div className="space-y-6 pt-4">
                            <h2 className="text-2xl font-bold text-slate-900">Lokasi</h2>

                            {/* Search bar */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari destinasi"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
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
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pencarian terkini</p>
                                    {recentSearches.map((search, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSelectRecentSearch(search)}
                                            className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-slate-50 transition-colors text-left"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                <MapPin className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-900 text-sm">{search.location}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{search.datesLabel} · {search.guestsLabel}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Suggested destinations */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {searchQuery ? 'Hasil pencarian' : 'Destinasi yang disarankan'}
                                </p>

                                {!searchQuery && (
                                    <button
                                        onClick={() => {
                                            if (navigator.geolocation) {
                                                navigator.geolocation.getCurrentPosition(
                                                    () => setLocation('Di dekat lokasi Anda'),
                                                    () => {}
                                                );
                                            }
                                        }}
                                        className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-slate-50 transition-colors text-left"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                                            <Navigation className="w-5 h-5 text-rose-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-900 text-sm">Di dekat lokasi Anda</p>
                                        </div>
                                    </button>
                                )}

                                {(searchQuery ? filteredDestinations : SUGGESTED_DESTINATIONS.slice(0, 6)).map((dest, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSelectDestination(dest.name)}
                                        className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-slate-50 transition-colors text-left"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-900 text-sm">{dest.name}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{dest.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Bottom filters & buttons */}
                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => setStep('dates')}
                                    className="flex items-center justify-between w-full p-4 bg-slate-50 rounded-2xl border border-slate-200"
                                >
                                    <span className="font-bold text-sm text-slate-900">Tanggal perjalanan</span>
                                    <span className="text-sm text-slate-400">{formatDateRange(dateRange)}</span>
                                </button>
                                <button
                                    onClick={() => setStep('guests')}
                                    className="flex items-center justify-between w-full p-4 bg-slate-50 rounded-2xl border border-slate-200"
                                >
                                    <span className="font-bold text-sm text-slate-900">Peserta</span>
                                    <span className="text-sm text-slate-400">{getGuestsLabel()}</span>
                                </button>

                                <div className="flex items-center justify-between pt-4">
                                    <button
                                        onClick={handleClearAll}
                                        className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        Hapus semua
                                    </button>
                                    <button
                                        onClick={handleSearchSubmit}
                                        className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm px-6 py-3 rounded-full transition-all active:scale-95"
                                    >
                                        <Search className="w-4 h-4" />
                                        <span>Cari</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== STEP: DATES ===== */}
                    {step === 'dates' && (
                        <div className="space-y-6 pt-4">
                            <h2 className="text-2xl font-bold text-slate-900">Tanggal perjalanan</h2>

                            {/* Calendar */}
                            <div className="overflow-x-auto">
                                <DayPicker
                                    mode="range"
                                    selected={dateRange}
                                    onSelect={handleSelectRange}
                                    disabled={[{ before: new Date() }]}
                                    numberOfMonths={1}
                                    locale={localeID}
                                    hideNavigation
                                    className="text-slate-800 max-w-full"
                                    classNames={{
                                        selected: "bg-slate-900 text-white hover:bg-slate-800 rounded-full",
                                        today: "text-rose-500 font-black rounded-full",
                                        month_caption: "flex items-center w-full",
                                        caption_label: "flex-1 text-center text-sm font-bold text-slate-900",
                                        button_previous: "hidden",
                                        button_next: "hidden",
                                        day: "w-10 h-10 text-sm font-medium relative",
                                        range_start: "bg-slate-900 text-white rounded-full",
                                        range_end: "bg-slate-900 text-white rounded-full",
                                    }}
                                />
                            </div>

                            {/* Flexibility presets */}
                            <div className="flex flex-wrap gap-2">
                                {FLEXIBILITY_PRESETS.map((preset) => (
                                    <button
                                        key={preset.value}
                                        onClick={() => setSelectedFlexibility(preset.value)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                                            selectedFlexibility === preset.value
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            {/* Bottom buttons */}
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <button
                                    onClick={handleResetDates}
                                    className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Atur ulang
                                </button>
                                <button
                                    onClick={handleNextFromDates}
                                    disabled={!canProceedFromDates}
                                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-sm px-6 py-3 rounded-full transition-all active:scale-95"
                                >
                                    <span>Selanjutnya</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ===== STEP: GUESTS ===== */}
                    {step === 'guests' && (
                        <div className="space-y-6 pt-4">
                            <h2 className="text-2xl font-bold text-slate-900">Peserta</h2>

                            {/* Guest categories */}
                            <div className="space-y-0 divide-y divide-slate-100">
                                {/* Adults */}
                                <div className="flex items-center justify-between py-5">
                                    <div>
                                        <p className="font-bold text-sm text-slate-900">Dewasa</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Usia 13 tahun ke atas</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setAdults(Math.max(0, adults - 1))}
                                            disabled={adults === 0}
                                            className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 hover:border-slate-500 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-6 text-center font-bold text-sm">{adults}</span>
                                        <button
                                            onClick={() => setAdults(adults + 1)}
                                            className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 hover:border-slate-500 hover:text-slate-600 transition-all"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Children */}
                                <div className="flex items-center justify-between py-5">
                                    <div>
                                        <p className="font-bold text-sm text-slate-900">Anak-anak</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Usia 2–12</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setChildren(Math.max(0, children - 1))}
                                            disabled={children === 0}
                                            className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 hover:border-slate-500 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-6 text-center font-bold text-sm">{children}</span>
                                        <button
                                            onClick={() => setChildren(children + 1)}
                                            className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 hover:border-slate-500 hover:text-slate-600 transition-all"
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
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setInfants(Math.max(0, infants - 1))}
                                            disabled={infants === 0}
                                            className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 hover:border-slate-500 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-6 text-center font-bold text-sm">{infants}</span>
                                        <button
                                            onClick={() => setInfants(infants + 1)}
                                            className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 hover:border-slate-500 hover:text-slate-600 transition-all"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom buttons */}
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <button
                                    onClick={handleClearAll}
                                    className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Hapus semua
                                </button>
                                <button
                                    onClick={handleSearchSubmit}
                                    className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm px-6 py-3 rounded-full transition-all active:scale-95"
                                >
                                    <Search className="w-4 h-4" />
                                    <span>Cari</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
