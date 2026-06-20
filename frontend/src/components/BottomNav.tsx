'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Heart, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function BottomNav() {
    const pathname = usePathname();
    const { user, admin } = useAuth();

    const isActive = (path: string) => pathname === path;

    // Decide link and label for account tab dynamically
    const getAccountLink = () => {
        if (admin) return '/admin/dashboard';
        if (user) return '/profile';
        return '/login';
    };

    const getAccountLabel = () => {
        if (admin) return 'Admin';
        if (user) return 'Profil';
        return 'Masuk';
    };

    const isAccountActive = () => {
        return isActive('/login') || isActive('/profile') || pathname.startsWith('/admin');
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[999] bg-gradient-to-b from-blue-800 to-blue-950 border-t border-blue-700/50 lg:hidden pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(30,58,138,0.3)]">
            <div className="flex items-center justify-around h-16">
                <Link
                    href="/"
                    className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
                        isActive('/') ? 'text-white font-bold' : 'text-blue-200/70 hover:text-blue-100'
                    }`}
                >
                    <Search className="w-5.5 h-5.5" />
                    <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Telusuri</span>
                    {isActive('/') && (
                        <div className="absolute top-0 w-12 h-1 bg-blue-300 rounded-b-full" />
                    )}
                </Link>

                <Link
                    href="/wishlist"
                    className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
                        isActive('/wishlist') ? 'text-white font-bold' : 'text-blue-200/70 hover:text-blue-100'
                    }`}
                >
                    <Heart className="w-5.5 h-5.5" />
                    <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Favorit</span>
                    {isActive('/wishlist') && (
                        <div className="absolute top-0 w-12 h-1 bg-blue-300 rounded-b-full" />
                    )}
                </Link>

                <Link
                    href={getAccountLink()}
                    className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
                        isAccountActive() ? 'text-white font-bold' : 'text-blue-200/70 hover:text-blue-100'
                    }`}
                >
                    {admin ? (
                        <LayoutDashboard className="w-5.5 h-5.5" />
                    ) : (
                        <User className="w-5.5 h-5.5" />
                    )}
                    <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">{getAccountLabel()}</span>
                    {isAccountActive() && (
                        <div className="absolute top-0 w-12 h-1 bg-blue-300 rounded-b-full" />
                    )}
                </Link>
            </div>
        </nav>
    );
}
