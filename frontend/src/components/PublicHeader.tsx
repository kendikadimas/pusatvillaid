'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, X, Search, MapPin, Calendar, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';

interface PublicHeaderProps {
    headerSolid?: boolean;
    fixed?: boolean;
    onLogoClick?: () => void;
    showBackButton?: boolean;
    onBackClick?: () => void;
    showSearchPill?: boolean;
    children?: React.ReactNode;
}

export default function PublicHeader({
    headerSolid = true,
    fixed = false,
    onLogoClick,
    showBackButton = false,
    onBackClick,
    showSearchPill = true,
    children
}: PublicHeaderProps) {
    const { user, admin } = useAuth();
    const { settings } = useSettings();
    const router = useRouter();
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchLocation, setSearchLocation] = useState('');
    const [searchCheckIn, setSearchCheckIn] = useState('');
    const [searchCheckOut, setSearchCheckOut] = useState('');
    const [searchGuests, setSearchGuests] = useState(1);
    const searchRef = useRef<HTMLDivElement>(null);
    const positionClass = fixed ? 'fixed top-0 left-0 right-0' : 'sticky top-0';

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchLocation) params.set('location', searchLocation);
        if (searchCheckIn) params.set('checkIn', searchCheckIn);
        if (searchCheckOut) params.set('checkOut', searchCheckOut);
        if (searchGuests > 0) params.set('guests', String(searchGuests));
        const qs = params.toString();
        router.push(qs ? `/villas?${qs}` : '/villas');
        setSearchOpen(false);
    };

    return (
        <header className={`${positionClass} z-50 ${
            headerSolid
                ? 'bg-white shadow-sm border-b border-slate-200/60'
                : 'bg-transparent'
        }`}>
            <div className={`max-w-8xl mx-auto px-4 sm:px-14 lg:px-24 flex flex-col justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                headerSolid ? 'h-16 md:h-[72px]' : 'h-20'
            }`}>
                <div className="flex items-center justify-between w-full">
                    {/* Left: Brand Logo & Optional Back Button */}
                    <div className="flex items-center space-x-3 shrink-0">
                        {showBackButton && (
                            <button
                                onClick={onBackClick}
                                type="button"
                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-all cursor-pointer active:scale-90"
                                aria-label="Kembali"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        )}
                        <Link
                            href="/"
                            className="flex items-center space-x-1.5 group"
                            onClick={onLogoClick}
                        >
                            <svg className={`w-7 sm:w-8 h-7 sm:h-8 fill-current transition-colors ${
                                headerSolid ? 'text-green-500' : 'text-white'
                            }`} viewBox="0 0 32 32">
                                <path d="M16 1c-2.008 0-3.92.518-5.59 1.432A15.011 15.011 0 0 0 .91 18.066c1.196 4.398 4.73 7.828 9.098 9.098C11.954 27.674 13.914 28 16 28c2.086 0 4.046-.326 5.992-.836 4.368-1.27 7.902-4.7 9.098-9.098A15.01 15.01 0 0 0 16 1zm0 25c-1.748 0-3.388-.274-5.012-.702A12.012 12.012 0 0 1 3.702 11.23C4.898 6.832 8.432 3.4 12.8 2.13A12.01 12.01 0 0 1 16 2a11.983 11.983 0 0 1 12.298 9.23c1.196 4.398-2.336 7.828-6.702 9.098C19.966 25.666 18.066 26 16 26z"/>
                                <path d="M16 7.5L7.5 14.5h3.5v9h10v-9h3.5zM18 21.5h-4v-7.5h4z"/>
                            </svg>
                            <span className={`text-lg sm:text-xl font-sans font-black tracking-tight transition-colors ${
                                headerSolid ? 'text-green-500' : 'text-white'
                            }`}>
                                {settings.settings_prop_name}
                            </span>
                        </Link>
                    </div>

                    {/* Middle: Custom children OR static search pill (matches HomeHeader solid) */}
                    <div className="hidden md:flex flex-1 max-w-md mx-6 px-2.5 py-1.5 relative" ref={searchRef}>
                        {children ? (
                            <div className="w-full">{children}</div>
                        ) : showSearchPill && headerSolid ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setSearchOpen(!searchOpen)}
                                    className="w-full rounded-full border border-[#EAEAEA] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-1 flex items-center hover:shadow-md transition-shadow cursor-pointer"
                                >
                                    <span className="flex-1 px-5 text-xs font-medium text-[#787774] text-left">
                                        Kemana aja?
                                    </span>
                                    <span className="flex-1 px-5 text-xs font-medium text-[#787774] text-left border-l border-r border-[#EAEAEA]">
                                        Kapan aja?
                                    </span>
                                    <span className="flex-1 px-5 text-xs font-medium text-[#787774] text-left">
                                        Banyak tamu
                                    </span>
                                    <span className="bg-green-500 hover:bg-green-600 text-white flex items-center justify-center font-bold rounded-full transition-all p-2.5 shrink-0 ml-2">
                                        <Search className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />
                                    </span>
                                </button>

                                {searchOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl p-5 z-50 animate-fadeIn">
                                        <form onSubmit={handleSearchSubmit} className="space-y-4">
                                            <div>
                                                <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Lokasi</label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        value={searchLocation}
                                                        onChange={(e) => setSearchLocation(e.target.value)}
                                                        placeholder="Cari destinasi..."
                                                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Check-in</label>
                                                    <input
                                                        type="date"
                                                        value={searchCheckIn}
                                                        onChange={(e) => setSearchCheckIn(e.target.value)}
                                                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Check-out</label>
                                                    <input
                                                        type="date"
                                                        value={searchCheckOut}
                                                        onChange={(e) => setSearchCheckOut(e.target.value)}
                                                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Jumlah Tamu</label>
                                                <div className="relative">
                                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <div className="flex items-center gap-3 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSearchGuests(Math.max(1, searchGuests - 1))}
                                                            className="w-7 h-7 rounded-full border border-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="flex-1 text-center text-sm font-medium text-slate-800">{searchGuests} tamu</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSearchGuests(Math.min(20, searchGuests + 1))}
                                                            className="w-7 h-7 rounded-full border border-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                type="submit"
                                                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold text-sm py-3 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                                            >
                                                Cari Villa
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>

                    {/* Desktop Right: User Menu */}
                    <nav className="hidden md:flex items-center space-x-6">
                        <Link
                            href="/villas"
                            className={`text-sm font-semibold transition-colors ${
                                headerSolid ? 'text-slate-700 hover:text-green-500' : 'text-white/90 hover:text-white'
                            }`}
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
                            >
                                {admin ? 'Dashboard Admin' : 'Profil Saya'}
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className={`text-xs font-bold px-4.5 py-2 rounded-full transition-all duration-300 active:scale-95 ${
                                    headerSolid
                                        ? 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
                                        : 'bg-white text-slate-900 hover:bg-slate-100'
                                }`}
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
