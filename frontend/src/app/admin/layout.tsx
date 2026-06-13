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

    // Skip wrapping on login page
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
        );
    }

    if (!admin) {
        return null; // Handled by AuthContext route protection redirect
    }

    const navigation = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Pemesanan', href: '/admin/bookings', icon: BookOpen },
        { name: 'Katalog Villa', href: '/admin/villas', icon: Home },
        { name: 'Destinasi Wisata', href: '/admin/destinations', icon: MapPin },
        { name: 'Kalender Jadwal', href: '/admin/calendar', icon: CalendarDays },
        { name: 'Ulasan Tamu', href: '/admin/reviews', icon: Star },
        { name: 'Analisis Keuangan', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Pengaturan', href: '/admin/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans antialiased">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex md:w-64 md:flex-col bg-white text-slate-800 border-r border-slate-200/80 shadow-xs">
                <div className="h-20 flex items-center px-6 border-b border-slate-100 bg-slate-50/30">
                    <span className="text-lg font-serif font-black tracking-tight bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 bg-clip-text text-transparent flex flex-col">
                        <span>PusatVilla.id</span>
                        <span className="text-[9px] font-sans font-black text-slate-400 uppercase tracking-widest leading-none mt-0.5">Admin Portal</span>
                    </span>
                </div>
                <div className="flex-1 flex flex-col justify-between py-6 overflow-y-auto">
                    <nav className="px-4 space-y-1.5">
                        {navigation.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                                        isActive 
                                            ? 'bg-rose-50 text-rose-600 shadow-xs' 
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                >
                                    <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
                                        isActive ? 'text-rose-500' : 'text-slate-400 group-hover:text-slate-600'
                                    }`} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
 
                    <div className="px-4 border-t border-slate-100 pt-6 space-y-4">
                        <div className="flex items-center space-x-3 px-4 text-xs font-semibold text-slate-500">
                            <User className="w-4 h-4 text-rose-500" />
                            <div className="truncate">
                                <p className="text-slate-800 truncate font-bold">{admin.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{admin.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50/50 transition-colors cursor-pointer"
                        >
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>
 
            {/* Mobile Sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 flex md:hidden bg-slate-900/40 backdrop-blur-xs">
                    <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white text-slate-800 shadow-2xl">
                        <div className="absolute top-0 right-0 -mr-12 pt-4">
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-slate-900/80"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                        <div className="h-20 flex items-center px-6 border-b border-slate-100 bg-slate-50/30">
                            <span className="text-lg font-serif font-black tracking-tight bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 bg-clip-text text-transparent flex flex-col">
                                <span>PusatVilla.id</span>
                                <span className="text-[9px] font-sans font-black text-slate-400 uppercase tracking-widest leading-none mt-0.5">Admin Portal</span>
                            </span>
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-6 overflow-y-auto">
                            <nav className="px-4 space-y-1.5">
                                {navigation.map((item) => {
                                    const isActive = pathname.startsWith(item.href);
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                                                isActive 
                                                    ? 'bg-rose-50 text-rose-600 shadow-xs' 
                                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                        >
                                            <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
                                                isActive ? 'text-rose-500' : 'text-slate-400 group-hover:text-slate-600'
                                            }`} />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="px-4 border-t border-slate-100 pt-6 space-y-4">
                                <div className="flex items-center space-x-3 px-4 text-xs font-semibold text-slate-500">
                                    <User className="w-4 h-4 text-rose-500" />
                                    <div className="truncate">
                                        <p className="text-slate-800 truncate font-bold">{admin.name}</p>
                                        <p className="text-[10px] text-slate-400 truncate">{admin.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setSidebarOpen(false); logout(); }}
                                    className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50/50 transition-colors cursor-pointer"
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
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Topbar */}
                <header className="flex md:hidden h-16 bg-white border-b border-slate-200 px-4 items-center justify-between">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="text-lg font-serif font-black bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
                        PusatVilla.id
                    </span>
                    <div className="w-6" /> {/* Placeholder for alignment */}
                </header>
 
                <div className="flex-1 overflow-y-auto focus:outline-none p-4 sm:p-8 bg-slate-50/50">
                    {children}
                </div>
            </div>
        </div>
    );
}
