import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface PublicHeaderProps {
    headerSolid?: boolean;
    fixed?: boolean;
    onLogoClick?: () => void;
    showBackButton?: boolean;
    onBackClick?: () => void;
    children?: React.ReactNode;
}

export default function PublicHeader({
    headerSolid = true,
    fixed = false,
    onLogoClick,
    showBackButton = false,
    onBackClick,
    children
}: PublicHeaderProps) {
    const { user, admin } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const positionClass = fixed ? 'fixed top-0 left-0 right-0' : 'sticky top-0';
    
    return (
        <header className={`${positionClass} z-50 transition-all duration-300 ${
            headerSolid 
                ? 'bg-white border-b border-slate-200/80 shadow-xs py-4' 
                : 'bg-gradient-to-b from-black/50 to-transparent py-6'
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex items-center justify-between">
                {/* Left: Brand Logo & Optional Back Button */}
                <div className="flex items-center space-x-3 shrink-0">
                    {showBackButton && (
                        <button 
                            onClick={onBackClick} 
                            type="button"
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-655 rounded-full transition-all cursor-pointer active:scale-90"
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
                </div>
 
                {/* Middle slot */}
                <div className="hidden md:block flex-1 max-w-md mx-4">
                    {children}
                </div>
 
                {/* Desktop Right: User Menu */}
                <nav className="hidden md:flex items-center space-x-6">
                    <Link
                        href="/villas"
                        className={`text-sm font-semibold transition-colors ${
                            headerSolid ? 'text-slate-700 hover:text-blue-500' : 'text-white/90 hover:text-white'
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
                                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm'
                                    : 'bg-white text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            Masuk
                        </Link>
                    )}
                </nav>

                {/* Mobile Hamburger */}
                <button
                    onClick={() => setMobileOpen(true)}
                    className={`md:hidden p-2 rounded-full transition-colors ${
                        headerSolid ? 'text-slate-700 hover:bg-slate-100' : 'text-white/90 hover:bg-white/10'
                    }`}
                    aria-label="Buka menu"
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            {/* Mobile Drawer Overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
                    <div className="absolute top-0 right-0 h-full w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                            <span className="text-sm font-bold text-slate-900">Menu</span>
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
                                aria-label="Tutup menu"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 px-5 py-6 space-y-4">
                            <Link
                                href="/villas"
                                onClick={() => setMobileOpen(false)}
                                className="block py-3 text-base font-semibold text-slate-900 hover:text-blue-500 border-b border-slate-100"
                            >
                                Cari Villa
                            </Link>
                            {user || admin ? (
                                <Link
                                    href={admin ? "/admin/dashboard" : "/profile"}
                                    onClick={() => setMobileOpen(false)}
                                    className="block py-3 text-base font-semibold text-slate-900 hover:text-blue-500 border-b border-slate-100"
                                >
                                    {admin ? 'Dashboard Admin' : 'Profil Saya'}
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setMobileOpen(false)}
                                    className="block py-3 text-base font-semibold text-blue-600 hover:text-blue-700"
                                >
                                    Masuk
                                </Link>
                            )}
                            {children && (
                                <div className="pt-4 border-t border-slate-100">
                                    {children}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
