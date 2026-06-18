'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
    LayoutDashboard, 
    CalendarDays, 
    Home, 
    BookOpen, 
    Star, 
    BarChart3, 
    Settings,
    LogOut,
    Menu,
    X,
    User,
    Loader2,
    MapPin
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { admin, loading, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-[#f7f7f7]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!admin) {
        return null;
    }

    const navigation = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Pemesanan', href: '/admin/bookings', icon: BookOpen },
        { name: 'Katalog villa', href: '/admin/villas', icon: Home },
        { name: 'Destinasi wisata', href: '/admin/destinations', icon: MapPin },
        { name: 'Kalender jadwal', href: '/admin/calendar', icon: CalendarDays },
        { name: 'Ulasan tamu', href: '/admin/reviews', icon: Star },
        { name: 'Analisis keuangan', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Pengaturan', href: '/admin/settings', icon: Settings },
    ];

    return (
        <div className="h-screen flex bg-[#f7f7f7] text-[#222222] font-sans antialiased selection:bg-blue-100 selection:text-blue-700">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-[#f7f7f7] text-[#222222] border-r border-[#dddddd]">
                <div className="h-20 flex items-center px-6 border-b border-[#dddddd] shrink-0">
                    <Link href="/admin/dashboard" className="flex items-center space-x-1.5 group">
                        <svg className="w-8 h-8 text-blue-500 fill-current" viewBox="0 0 32 32">
                            <path d="M16 1c-2.008 0-3.92.518-5.59 1.432A15.011 15.011 0 0 0 .91 18.066c1.196 4.398 4.73 7.828 9.098 9.098C11.954 27.674 13.914 28 16 28c2.086 0 4.046-.326 5.992-.836 4.368-1.27 7.902-4.7 9.098-9.098A15.01 15.01 0 0 0 16 1zm0 25c-1.748 0-3.388-.274-5.012-.702A12.012 12.012 0 0 1 3.702 11.23C4.898 6.832 8.432 3.4 12.8 2.13A12.01 12.01 0 0 1 16 2a11.983 11.983 0 0 1 12.298 9.23c1.196 4.398-2.336 7.828-6.702 9.098C19.966 25.666 18.066 26 16 26z"/>
                            <path d="M16 7.5L7.5 14.5h3.5v9h10v-9h3.5zM18 21.5h-4v-7.5h4z"/>
                        </svg>
                        <div className="flex flex-col">
                            <span className="text-lg font-sans font-black tracking-tight text-blue-500 leading-none">
                                pusatvilla.id
                            </span>
                            <span className="text-[8px] font-sans font-black text-[#6a6a6a] uppercase tracking-widest leading-none mt-1">Admin Portal</span>
                        </div>
                    </Link>
                </div>
                <div className="flex-1 flex flex-col justify-between py-6 overflow-y-auto">
                    <nav className="px-3 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`relative flex items-center space-x-3 px-4 py-2.5 rounded-[14px] text-xs sm:text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] group ${
                                        isActive 
                                            ? 'bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] text-blue-600' 
                                            : 'text-[#6a6a6a] hover:bg-white hover:shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] hover:text-[#222222] hover:translate-x-0.5'
                                    }`}
                                >
                                    <item.icon className={`w-5 h-5 flex-shrink-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                                        isActive ? 'text-blue-500 scale-105' : 'text-[#6a6a6a] group-hover:text-[#222222]'
                                    }`} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
 
                    <div className="px-3 border-t border-[#dddddd] pt-5 mt-2 space-y-3">
                        <div className="flex items-center space-x-3 px-4 py-2.5 rounded-[14px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)]">
                            <div className="w-8 h-8 rounded-[8px] bg-blue-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                                {admin.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate">
                                <p className="text-xs font-bold text-[#222222] truncate leading-none">{admin.name}</p>
                                <p className="text-[10px] text-[#6a6a6a] truncate mt-1 leading-none">{admin.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-[8px] text-xs sm:text-sm font-semibold text-blue-600 hover:bg-blue-50 active:scale-[0.97] transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>
 
            {/* Mobile Sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 flex md:hidden bg-[#222222]/40">
                    <div className="relative flex w-full max-w-xs flex-1 flex-col bg-[#f7f7f7] text-[#222222] border-r border-[#dddddd]">
                        <div className="absolute top-0 right-0 -mr-12 pt-4">
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="ml-1 flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white bg-[#222222]/80 active:scale-95 transition-all"
                                aria-label="Tutup menu navigasi"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                        <div className="h-20 flex items-center px-6 border-b border-[#dddddd]">
                            <Link href="/admin/dashboard" className="flex items-center space-x-1.5 group">
                                <svg className="w-8 h-8 text-blue-500 fill-current" viewBox="0 0 32 32">
                                    <path d="M16 1c-2.008 0-3.92.518-5.59 1.432A15.011 15.011 0 0 0 .91 18.066c1.196 4.398 4.73 7.828 9.098 9.098C11.954 27.674 13.914 28 16 28c2.086 0 4.046-.326 5.992-.836 4.368-1.27 7.902-4.7 9.098-9.098A15.01 15.01 0 0 0 16 1zm0 25c-1.748 0-3.388-.274-5.012-.702A12.012 12.012 0 0 1 3.702 11.23C4.898 6.832 8.432 3.4 12.8 2.13A12.01 12.01 0 0 1 16 2a11.983 11.983 0 0 1 12.298 9.23c1.196 4.398-2.336 7.828-6.702 9.098C19.966 25.666 18.066 26 16 26z"/>
                                    <path d="M16 7.5L7.5 14.5h3.5v9h10v-9h3.5zM18 21.5h-4v-7.5h4z"/>
                                </svg>
                                <div className="flex flex-col">
                                    <span className="text-lg font-sans font-black tracking-tight text-blue-500 leading-none">
                                        pusatvilla.id
                                    </span>
                                    <span className="text-[8px] font-sans font-black text-[#6a6a6a] uppercase tracking-widest leading-none mt-1">Admin Portal</span>
                                </div>
                            </Link>
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-6 overflow-y-auto">
                            <nav className="px-3 space-y-1">
                                {navigation.map((item) => {
                                    const isActive = pathname.startsWith(item.href);
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`relative flex items-center space-x-3 px-4 py-2.5 rounded-[14px] text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] group ${
                                                isActive 
                                                    ? 'bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] text-blue-600' 
                                                    : 'text-[#6a6a6a] hover:bg-white hover:shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] hover:text-[#222222] hover:translate-x-0.5'
                                            }`}
                                        >
                                            <item.icon className={`w-5 h-5 flex-shrink-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                                                isActive ? 'text-blue-500 scale-105' : 'text-[#6a6a6a] group-hover:text-[#222222]'
                                            }`} />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="px-3 border-t border-[#dddddd] pt-5 mt-2 space-y-3">
                                <div className="flex items-center space-x-3 px-4 text-xs font-semibold text-[#6a6a6a]">
                                    <User className="w-4 h-4 text-blue-500" />
                                    <div className="truncate">
                                        <p className="text-[#222222] truncate font-bold">{admin.name}</p>
                                        <p className="text-[10px] text-[#6a6a6a] truncate">{admin.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setSidebarOpen(false); logout(); }}
                                    className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-[8px] text-sm font-semibold text-blue-600 hover:bg-blue-50 active:scale-[0.97] transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                    <LogOut className="w-5 h-5 flex-shrink-0" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
 
            {/* Main Content Pane */}
            <div className="flex-1 flex flex-col min-w-0 md:pl-64">
                {/* Mobile Topbar */}
                <header className="flex md:hidden h-16 bg-white border-b border-[#dddddd] px-4 items-center justify-between sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="w-11 h-11 flex items-center justify-center rounded-[8px] text-[#6a6a6a] hover:bg-blue-50 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label="Buka menu navigasi"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <Link href="/admin/dashboard" className="flex items-center space-x-1.5 group">
                        <svg className="w-6 h-6 text-blue-500 fill-current" viewBox="0 0 32 32">
                            <path d="M16 1c-2.008 0-3.92.518-5.59 1.432A15.011 15.011 0 0 0 .91 18.066c1.196 4.398 4.73 7.828 9.098 9.098C11.954 27.674 13.914 28 16 28c2.086 0 4.046-.326 5.992-.836 4.368-1.27 7.902-4.7 9.098-9.098A15.01 15.01 0 0 0 16 1zm0 25c-1.748 0-3.388-.274-5.012-.702A12.012 12.012 0 0 1 3.702 11.23C4.898 6.832 8.432 3.4 12.8 2.13A12.01 12.01 0 0 1 16 2a11.983 11.983 0 0 1 12.298 9.23c1.196 4.398-2.336 7.828-6.702 9.098C19.966 25.666 18.066 26 16 26z"/>
                            <path d="M16 7.5L7.5 14.5h3.5v9h10v-9h3.5zM18 21.5h-4v-7.5h4z"/>
                        </svg>
                        <span className="text-md font-sans font-black tracking-tight text-blue-500">
                            pusatvilla.id
                        </span>
                    </Link>
                    <div className="w-6" />
                </header>
 
                <div className="flex-1 overflow-y-auto focus:outline-none p-4 sm:p-8 bg-[#f7f7f7] h-full">
                    {children}
                </div>
            </div>
        </div>
    );
}
