'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, History, Compass, ChevronLeft, ChevronRight, ArrowRight, MapPin, Calendar, Users, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Destination } from '@/types';

interface RecentSearch {
    location: string;
    checkIn: string;
    checkOut: string;
    guestsLabel: string;
    datesLabel: string;
}

interface FlexPreset {
    label: string;
    value: number;
}

const flexibilityPresets: FlexPreset[] = [
    { label: 'Tanggal pasti', value: 0 },
    { label: '± 1 hari', value: 1 },
    { label: '± 2 hari', value: 2 },
    { label: '± 3 hari', value: 3 },
];

interface HomeHeaderProps {
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
    selectedFlexibility: number;
    setSelectedFlexibility: (value: number) => void;
    adults: number;
    childrenCount: number;
    infants: number;
    pets: number;
    handleGuestChange: (type: 'adults' | 'children' | 'infants' | 'pets', operation: 'inc' | 'dec') => void;
    getGuestsLabel: () => string;
}

export default function HomeHeader({
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
    selectedFlexibility,
    setSelectedFlexibility,
    adults,
    childrenCount,
    infants,
    pets,
    handleGuestChange,
    getGuestsLabel,
}: HomeHeaderProps) {
    const { user, admin } = useAuth();

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 ${
                headerSolid
                    ? 'bg-white shadow-sm border-b border-slate-200/60'
                    : 'bg-transparent'
            }`}
        >
            <div className={`max-w-8xl mx-auto px-4 sm:px-14 lg:px-24 flex flex-col justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                headerSolid ? 'h-[108px] py-4' : 'h-20'
            }`}>
                <div className="flex items-center justify-between w-full">
                    <Link
                        href="/"
                        className="flex items-center space-x-1.5 group shrink-0"
                        onClick={() => setActiveTab(null)}
                    >
                        <svg className={`w-7 sm:w-8 h-7 sm:h-8 fill-current transition-colors ${
                            headerSolid ? 'text-blue-500' : 'text-white'
                        }`} viewBox="0 0 32 32">
                            <path d="M16 1c-2.008 0-3.92.518-5.59 1.432A15.011 15.011 0 0 0 .91 18.066c1.196 4.398 4.73 7.828 9.098 9.098C11.954 27.674 13.914 28 16 28c2.086 0 4.046-.326 5.992-.836 4.368-1.27 7.902-4.7 9.098-9.098A15.01 15.01 0 0 0 16 1zm0 25c-1.748 0-3.388-.274-5.012-.702A12.012 12.012 0 0 1 3.702 11.23C4.898 6.832 8.432 3.4 12.8 2.13A12.01 12.01 0 0 1 16 2a11.983 11.983 0 0 1 12.298 9.23c1.196 4.398-2.336 7.828-6.702 9.098C19.966 25.666 18.066 26 16 26z"/>
                            <path d="M16 7.5L7.5 14.5h3.5v9h10v-9h3.5zM18 21.5h-4v-7.5h4z"/>
                        </svg>
                        <span className={`text-lg sm:text-xl font-sans font-black tracking-tight transition-colors ${
                            headerSolid ? 'text-blue-500' : 'text-white'
                        }`}>
                            pusatvilla.id
                        </span>
                    </Link>

                    <div className={`hidden md:flex flex-1 max-w-2xl mx-6 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                        headerSolid
                            ? 'translate-y-0 scale-100 opacity-100 visible pointer-events-auto'
                            : 'translate-y-8 scale-90 opacity-0 invisible pointer-events-none'
                    }`}>
                        <div className="w-full rounded-full border border-[#EAEAEA] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-1 flex items-center">
                                <form onSubmit={handleSearch} className="flex flex-row items-center w-full relative">
                                    <div
                                        onClick={() => setActiveTab('lokasi')}
                                        className={`flex-1 px-5 py-2.5 rounded-full cursor-pointer transition-all text-left flex flex-row items-center space-x-2 relative min-w-0 ${
                                            activeTab === 'lokasi'
                                                ? 'bg-[#F7F6F3]'
                                                : 'hover:bg-[#F7F6F3]'
                                        }`}
                                    >
                                        <MapPin className="w-3.5 h-3.5 text-[#787774] shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            {activeTab === 'lokasi' ? (
                                                <input
                                                    type="text"
                                                    placeholder="Cari destinasi"
                                                    value={searchParams.location}
                                                    onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                                                    className="w-full bg-transparent border-0 p-0 text-xs font-medium text-[#111111] focus:ring-0 focus:outline-none placeholder-[#787774] h-4"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="text-xs font-medium text-[#111111] truncate h-4 block">
                                                    {searchParams.location || 'Cari destinasi'}
                                                </span>
                                            )}
                                        </div>

                                        {activeTab === 'lokasi' && (
                                            <div className="absolute top-[125%] left-0 w-[380px] bg-white rounded-[12px] border border-[#EAEAEA] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-5 z-50 text-[#111111] text-left animate-fadeIn">
                                                {recentSearches.length > 0 && (
                                                    <div className="mb-4">
                                                        <h4 className="text-[9px] font-medium text-[#787774] mb-2">Pencarian terkini</h4>
                                                        <div className="space-y-2">
                                                            {recentSearches.map((search, i) => (
                                                                <div
                                                                    key={i}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        selectRecentSearch(search);
                                                                    }}
                                                                    className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-[#F7F6F3] cursor-pointer transition-colors"
                                                                >
                                                                    <div className="w-8 h-8 rounded-lg bg-[#F7F6F3] flex items-center justify-center text-[#787774] shrink-0">
                                                                        <History className="w-4 h-4" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-medium text-[#111111] truncate">{search.location}</p>
                                                                        <p className="text-[10px] text-[#787774] truncate">
                                                                            {search.datesLabel} {search.guestsLabel ? '· ' + search.guestsLabel : ''}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="text-[9px] font-medium text-[#787774] mb-2">Destinasi yang disarankan</h4>
                                                    <div className="space-y-1">
                                                        {destinations.slice(0, 5).map((dest, idx) => (
                                                            <div
                                                                key={dest.id || idx}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    selectDestination(dest.query);
                                                                }}
                                                                className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-[#F7F6F3] cursor-pointer transition-colors"
                                                            >
                                                                <div className="w-8 h-8 rounded-lg bg-[#F7F6F3] flex items-center justify-center text-[#787774] shrink-0">
                                                                    <Compass className="w-4 h-4" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-medium text-[#111111] truncate">{dest.name}</p>
                                                                    <p className="text-[10px] text-[#787774] truncate">{dest.city}</p>
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
                                        className={`flex-1 px-5 py-2.5 rounded-full cursor-pointer transition-all text-left flex flex-row items-center space-x-2 relative ${
                                            activeTab === 'kapan'
                                                ? 'bg-[#F7F6F3]'
                                                : 'hover:bg-[#F7F6F3]'
                                        }`}
                                    >
                                        <Calendar className="w-3.5 h-3.5 text-[#787774] shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-medium text-[#111111] truncate h-4 block">
                                                {formatDateRange(searchParams.checkIn, searchParams.checkOut)}
                                            </span>
                                        </div>

                                        {activeTab === 'kapan' && (
                                            <div onClick={(e) => e.stopPropagation()} className="absolute top-[125%] left-1/2 -translate-x-1/2 w-[680px] bg-white rounded-[12px] border border-[#EAEAEA] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-5 z-50 text-[#111111] animate-fadeIn">
                                                <div className="grid grid-cols-2 gap-6 relative">
                                                    {renderCalendarMonth(currentCalendarDate)}
                                                    {renderCalendarMonth(getNextMonthDate(currentCalendarDate))}
                                                    <div className="absolute top-1 left-2 right-2 flex justify-between pointer-events-none z-10">
                                                        <button type="button" onClick={prevCalendarMonth} className="p-1 bg-white hover:bg-[#F7F6F3] border border-[#EAEAEA] rounded-full text-[#787774] pointer-events-auto active:scale-95 transition-all">
                                                            <ChevronLeft className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button type="button" onClick={nextCalendarMonth} className="p-1 bg-white hover:bg-[#F7F6F3] border border-[#EAEAEA] rounded-full text-[#787774] pointer-events-auto active:scale-95 transition-all">
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="border-t border-[#EAEAEA] mt-4 pt-3 flex justify-between items-center">
                                                    <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-1">
                                                        {flexibilityPresets.map((preset, i) => (
                                                            <button key={i} type="button" onClick={() => setSelectedFlexibility(preset.value)} className={`px-3 py-1 rounded-full text-[10px] font-medium border transition-all whitespace-nowrap active:scale-95 ${
                                                                selectedFlexibility === preset.value
                                                                    ? 'bg-[#111111] border-[#111111] text-white'
                                                                    : 'bg-white border-[#EAEAEA] text-[#787774] hover:border-[#111111] hover:text-[#111111]'
                                                            }`}>
                                                                {preset.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button type="button" onClick={() => setSearchParams({ ...searchParams, checkIn: '', checkOut: '' })} className="text-[10px] font-medium text-[#787774] hover:text-[#111111] underline shrink-0 px-2 active:scale-95">
                                                        Hapus tanggal
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        onClick={() => setActiveTab('tamu')}
                                        className={`flex-1 px-5 py-2.5 rounded-full cursor-pointer transition-all text-left flex flex-row items-center space-x-2 relative ${
                                            activeTab === 'tamu'
                                                ? 'bg-[#F7F6F3]'
                                                : 'hover:bg-[#F7F6F3]'
                                        }`}
                                    >
                                        <Users className="w-3.5 h-3.5 text-[#787774] shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-medium text-[#111111] truncate h-4 block">
                                                {getGuestsLabel()}
                                            </span>
                                        </div>
                                        {activeTab === 'tamu' && (
                                            <div onClick={(e) => e.stopPropagation()} className="absolute top-[125%] right-0 w-[280px] bg-white rounded-[12px] border border-[#EAEAEA] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-5 z-50 text-[#111111] animate-fadeIn">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[13px] font-bold text-[#111111]">Dewasa</p>
                                                            <p className="text-[10px] text-[#787774]">Usia 13 tahun ke atas</p>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleGuestChange('adults', 'dec')}
                                                                className="w-7 h-7 rounded-full border border-[#787774] text-[#787774] flex items-center justify-center text-sm hover:border-[#111111] hover:text-[#111111] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all"
                                                                disabled={adults === 0}
                                                            >−</button>
                                                            <span className="text-[13px] font-bold w-4 text-center">{adults}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleGuestChange('adults', 'inc')}
                                                                className="w-7 h-7 rounded-full border border-[#787774] text-[#787774] flex items-center justify-center text-sm hover:border-[#111111] hover:text-[#111111] cursor-pointer active:scale-95 transition-all"
                                                            >+</button>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[13px] font-bold text-[#111111]">Anak-anak</p>
                                                            <p className="text-[10px] text-[#787774]">Usia 2–12 tahun</p>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleGuestChange('children', 'dec')}
                                                                className="w-7 h-7 rounded-full border border-[#787774] text-[#787774] flex items-center justify-center text-sm hover:border-[#111111] hover:text-[#111111] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all"
                                                                disabled={childrenCount === 0}
                                                            >−</button>
                                                            <span className="text-[13px] font-bold w-4 text-center">{childrenCount}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleGuestChange('children', 'inc')}
                                                                className="w-7 h-7 rounded-full border border-[#787774] text-[#787774] flex items-center justify-center text-sm hover:border-[#111111] hover:text-[#111111] cursor-pointer active:scale-95 transition-all"
                                                            >+</button>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[13px] font-bold text-[#111111]">Balita</p>
                                                            <p className="text-[10px] text-[#787774]">Di bawah 2 tahun</p>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleGuestChange('infants', 'dec')}
                                                                className="w-7 h-7 rounded-full border border-[#787774] text-[#787774] flex items-center justify-center text-sm hover:border-[#111111] hover:text-[#111111] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all"
                                                                disabled={infants === 0}
                                                            >−</button>
                                                            <span className="text-[13px] font-bold w-4 text-center">{infants}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleGuestChange('infants', 'inc')}
                                                                className="w-7 h-7 rounded-full border border-[#787774] text-[#787774] flex items-center justify-center text-sm hover:border-[#111111] hover:text-[#111111] cursor-pointer active:scale-95 transition-all"
                                                            >+</button>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[13px] font-bold text-[#111111]">Hewan</p>
                                                            <p className="text-[10px] text-[#787774]">Hewan peliharaan</p>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleGuestChange('pets', 'dec')}
                                                                className="w-7 h-7 rounded-full border border-[#787774] text-[#787774] flex items-center justify-center text-sm hover:border-[#111111] hover:text-[#111111] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all"
                                                                disabled={pets === 0}
                                                            >−</button>
                                                            <span className="text-[13px] font-bold w-4 text-center">{pets}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleGuestChange('pets', 'inc')}
                                                                className="w-7 h-7 rounded-full border border-[#787774] text-[#787774] flex items-center justify-center text-sm hover:border-[#111111] hover:text-[#111111] cursor-pointer active:scale-95 transition-all"
                                                            >+</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button type="submit" className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white flex items-center justify-center font-bold rounded-full transition-all duration-300 cursor-pointer p-2.5 shrink-0 ml-2" title="Cari">
                                        <Search className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />
                                    </button>
                                </form>
                            </div>
                        </div>

                    <nav className="hidden md:flex items-center space-x-6">
                        <Link
                            href="/villas"
                            className={`text-sm font-semibold transition-colors ${
                                headerSolid ? 'text-slate-700 hover:text-blue-500' : 'text-white/90 hover:text-white'
                            }`}
                            onClick={() => setActiveTab(null)}
                        >
                            Cari Villa
                        </Link>
                        {user || admin ? (
                            <Link
                                href={admin ? "/admin/dashboard" : "/profile"}
                                className={`text-xs font-bold px-4.5 py-2 rounded-full transition-all duration-300 active:scale-95 ${
                                    headerSolid
                                        ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                                        : 'bg-white text-slate-900 hover:bg-slate-100'
                                }`}
                                onClick={() => setActiveTab(null)}
                            >
                                {admin ? 'Dashboard Admin' : 'Profil Saya'}
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className={`text-xs font-bold px-4.5 py-2 rounded-full transition-all duration-300 active:scale-95 ${
                                    headerSolid
                                        ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm'
                                        : 'bg-white text-slate-900 hover:bg-slate-100'
                                }`}
                                onClick={() => setActiveTab(null)}
                            >
                                Masuk
                            </Link>
                        )}
                    </nav>

                </div>
            </div>
        </header>
    );
}
