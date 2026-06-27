'use client';

import React from 'react';
import { Search, History, Compass, ChevronLeft, ChevronRight, MapPin, Calendar, Users } from 'lucide-react';
import { Destination } from '@/types';

interface RecentSearch {
    location: string;
    checkIn: string;
    checkOut: string;
    guestsLabel: string;
    datesLabel: string;
}

interface HeroSectionProps {
    headerSolid: boolean;
    searchParams: { location: string; checkIn: string; checkOut: string };
    setSearchParams: (params: { location: string; checkIn: string; checkOut: string }) => void;
    activeTab: 'lokasi' | 'kapan' | 'tamu' | null;
    setActiveTab: (tab: 'lokasi' | 'kapan' | 'tamu' | null) => void;
    handleSearch: (e?: React.FormEvent) => void;
    recentSearches: RecentSearch[];
    selectRecentSearch: (search: RecentSearch) => void;
    destinations: Destination[];
    selectDestination: (query: string) => void;
    formatDateRange: (checkIn: string, checkOut: string) => string;
    renderCalendarMonth: (date: Date) => React.ReactNode;
    currentCalendarDate: Date;
    getNextMonthDate: (date: Date) => Date;
    prevCalendarMonth: (e: React.MouseEvent) => void;
    nextCalendarMonth: (e: React.MouseEvent) => void;
    adults: number;
    childrenCount: number;
    infants: number;
    pets: number;
    handleGuestChange: (type: 'adults' | 'children' | 'infants' | 'pets', operation: 'inc' | 'dec') => void;
    getGuestsLabel: () => string;
}

export default function HeroSection({
    headerSolid,
    searchParams,
    setSearchParams,
    activeTab,
    setActiveTab,
    handleSearch,
    recentSearches,
    selectRecentSearch,
    destinations,
    selectDestination,
    formatDateRange,
    renderCalendarMonth,
    currentCalendarDate,
    getNextMonthDate,
    prevCalendarMonth,
    nextCalendarMonth,
    adults,
    childrenCount,
    infants,
    pets,
    handleGuestChange,
    getGuestsLabel,
}: HeroSectionProps) {
    return (
        <section className="relative min-h-[280px] md:min-h-[320px] lg:min-h-[360px] flex items-center justify-center text-white px-4 sm:px-8 lg:px-24">
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=80"
                    alt=""
                    className="w-full h-full object-cover brightness-[0.45]"
                />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/60 via-transparent to-[#111111]/20" />
            </div>
            <div className={`max-w-4xl mx-auto text-center space-y-6 pt-20 pb-8 w-full relative ${
                activeTab ? 'z-45' : 'z-10'
            }`}>
                <div className={`transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    headerSolid
                        ? 'opacity-0 -translate-y-6 pointer-events-none'
                        : 'opacity-100 translate-y-0'
                }`}>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-wide text-white leading-[1.15]">
                        Temukan Villa <span className="">Impian Anda</span>
                    </h1>
                    <p className="text-white/70 text-sm sm:text-base mt-3 max-w-lg mx-auto">
                        Dari pegunungan hingga pantai, temukan tempat menginap terbaik untuk liburan Anda hanya disini
                    </p>
                </div>
                {/* Search bar morph: shrinks upward into navbar on scroll */}
                <div className={`max-w-4xl mx-auto rounded-full p-1 border relative z-50 flex items-center shadow-lg transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    activeTab && !headerSolid
                        ? 'bg-slate-100/95 border-slate-200/50 shadow-xl backdrop-blur-md'
                        : headerSolid
                            ? '-translate-y-24 scale-75 opacity-0 pointer-events-none invisible'
                            : 'translate-y-0 scale-100 opacity-100 bg-white border-white/30 hover:border-slate-200 shadow-md'
                }`}>
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-stretch md:items-center w-full relative gap-2 md:gap-0">
                        <div
                            onClick={() => setActiveTab('lokasi')}
                            className={`flex-1 px-4 sm:px-6 py-2.5 rounded-full cursor-pointer transition-all text-left flex flex-row items-center space-x-2.5 relative min-w-0 ${
                                activeTab === 'lokasi'
                                    ? 'bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:bg-white'
                                    : 'hover:bg-slate-200/50'
                            }`}
                        >
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                                {activeTab === 'lokasi' ? (
                                    <input
                                        type="text"
                                        placeholder="Cari destinasi"
                                        value={searchParams.location}
                                        onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                                        className="w-full bg-transparent border-0 p-0 text-sm font-semibold text-slate-900 focus:ring-0 focus:outline-none placeholder-slate-400 h-5"
                                        autoFocus
                                    />
                                ) : (
                                    <span className="text-sm font-semibold text-slate-900 truncate h-5 block">
                                        {searchParams.location || 'Cari destinasi'}
                                    </span>
                                )}
                            </div>

                            {activeTab === 'lokasi' && (
                                <div className="absolute top-[120%] left-0 w-full sm:w-[420px] bg-white rounded-3xl shadow-[0_16px_36px_rgba(0,0,0,0.12)] border border-slate-100/80 p-6 z-50 text-slate-800 text-left animate-fadeIn">
                                    {recentSearches.length > 0 && (
                                        <div className="mb-6">
                                            <h4 className="text-[10px] font-medium text-slate-400 mb-3">Pencarian terkini</h4>
                                            <div className="space-y-3">
                                                {(recentSearches || []).map((search, i) => (
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

                                    <div>
                                        <h4 className="text-[10px] font-medium text-slate-400 mb-3">Destinasi yang disarankan</h4>
                                        <div className="space-y-1">
                                            {(destinations || []).slice(0, 5).map((dest, idx) => (
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

                        <div
                            onClick={() => setActiveTab('kapan')}
                            className={`flex-1 px-4 sm:px-6 py-2.5 rounded-full cursor-pointer transition-all text-left flex flex-row items-center space-x-2.5 relative ${
                                activeTab === 'kapan'
                                    ? 'bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:bg-white'
                                    : 'hover:bg-slate-200/50'
                            }`}
                        >
                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <span className="text-sm font-semibold text-slate-900 truncate h-5 block">
                                    {formatDateRange(searchParams.checkIn, searchParams.checkOut)}
                                </span>
                            </div>

                            {activeTab === 'kapan' && (
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute top-[120%] left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] sm:w-[720px] max-w-[720px] bg-white rounded-3xl shadow-[0_16px_36px_rgba(0,0,0,0.12)] border border-slate-100/80 p-6 z-50 text-slate-800 animate-fadeIn"
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

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative">
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
                                </div>
                            )}
                        </div>

                        <div
                            onClick={() => setActiveTab('tamu')}
                            className={`flex-1 px-4 sm:px-6 py-2.5 rounded-full cursor-pointer transition-all text-left flex flex-row items-center space-x-2.5 relative ${
                                activeTab === 'tamu'
                                    ? 'bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:bg-white'
                                    : 'hover:bg-slate-200/50'
                            }`}
                        >
                            <Users className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <span className="text-sm font-semibold text-slate-900 truncate h-5 block">
                                    {getGuestsLabel()}
                                </span>
                            </div>
                            {activeTab === 'tamu' && (
                                <div onClick={(e) => e.stopPropagation()} className="absolute top-[120%] right-0 w-full sm:w-[300px] bg-white rounded-3xl shadow-[0_16px_36px_rgba(0,0,0,0.12)] border border-slate-100/80 p-6 z-50 text-slate-800 animate-fadeIn">
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">Dewasa</p>
                                                <p className="text-[11px] text-slate-400">Usia 13 tahun ke atas</p>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <button type="button" onClick={() => handleGuestChange('adults', 'dec')} className="w-8 h-8 rounded-full border border-slate-300 text-slate-500 flex items-center justify-center hover:border-slate-900 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all" disabled={adults === 0}>−</button>
                                                <span className="text-sm font-bold w-4 text-center">{adults}</span>
                                                <button type="button" onClick={() => handleGuestChange('adults', 'inc')} className="w-8 h-8 rounded-full border border-slate-300 text-slate-500 flex items-center justify-center hover:border-slate-900 hover:text-slate-900 cursor-pointer active:scale-95 transition-all">+</button>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">Anak-anak</p>
                                                <p className="text-[11px] text-slate-400">Usia 2–12 tahun</p>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <button type="button" onClick={() => handleGuestChange('children', 'dec')} className="w-8 h-8 rounded-full border border-slate-300 text-slate-500 flex items-center justify-center hover:border-slate-900 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all" disabled={childrenCount === 0}>−</button>
                                                <span className="text-sm font-bold w-4 text-center">{childrenCount}</span>
                                                <button type="button" onClick={() => handleGuestChange('children', 'inc')} className="w-8 h-8 rounded-full border border-slate-300 text-slate-500 flex items-center justify-center hover:border-slate-900 hover:text-slate-900 cursor-pointer active:scale-95 transition-all">+</button>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">Balita</p>
                                                <p className="text-[11px] text-slate-400">Di bawah 2 tahun</p>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <button type="button" onClick={() => handleGuestChange('infants', 'dec')} className="w-8 h-8 rounded-full border border-slate-300 text-slate-500 flex items-center justify-center hover:border-slate-900 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all" disabled={infants === 0}>−</button>
                                                <span className="text-sm font-bold w-4 text-center">{infants}</span>
                                                <button type="button" onClick={() => handleGuestChange('infants', 'inc')} className="w-8 h-8 rounded-full border border-slate-300 text-slate-500 flex items-center justify-center hover:border-slate-900 hover:text-slate-900 cursor-pointer active:scale-95 transition-all">+</button>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">Hewan</p>
                                                <p className="text-[11px] text-slate-400">Hewan peliharaan</p>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <button type="button" onClick={() => handleGuestChange('pets', 'dec')} className="w-8 h-8 rounded-full border border-slate-300 text-slate-500 flex items-center justify-center hover:border-slate-900 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all" disabled={pets === 0}>−</button>
                                                <span className="text-sm font-bold w-4 text-center">{pets}</span>
                                                <button type="button" onClick={() => handleGuestChange('pets', 'inc')} className="w-8 h-8 rounded-full border border-slate-300 text-slate-500 flex items-center justify-center hover:border-slate-900 hover:text-slate-900 cursor-pointer active:scale-95 transition-all">+</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
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
                            className={`bg-blue-500 hover:bg-blue-600 active:scale-95 text-white flex items-center justify-center font-bold rounded-full transition-all duration-300 ease-in-out cursor-pointer shadow-sm ${
                                activeTab ? 'px-5 py-3 space-x-1.5 ml-2' : 'p-3.5'
                            }`}
                            title="Cari"
                        >
                            <Search className="w-4 h-4 shrink-0" strokeWidth={3} />
                            {activeTab && <span className="text-sm tracking-tight font-black animate-fadeIn">Cari</span>}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
