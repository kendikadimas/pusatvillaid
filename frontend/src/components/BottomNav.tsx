'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Heart, User } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[999] bg-blue-600 border-t border-blue-500 lg:hidden pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-around h-16">
                <Link
                    href="/"
                    className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                        isActive('/') ? 'text-white' : 'text-blue-200 hover:text-white'
                    }`}
                >
                    <Search className="w-6 h-6" />
                    <span className="text-xs font-medium mt-1">Telusuri</span>
                    {isActive('/') && (
                        <div className="absolute top-0 w-12 h-1 bg-white rounded-b-full" />
                    )}
                </Link>

                <Link
                    href="/wishlist"
                    className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                        isActive('/wishlist') ? 'text-white' : 'text-blue-200 hover:text-white'
                    }`}
                >
                    <Heart className="w-6 h-6" />
                    <span className="text-xs font-medium mt-1">Favorit</span>
                    {isActive('/wishlist') && (
                        <div className="absolute top-0 w-12 h-1 bg-white rounded-b-full" />
                    )}
                </Link>

                <Link
                    href="/login"
                    className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                        isActive('/login') || isActive('/profile') ? 'text-white' : 'text-blue-200 hover:text-white'
                    }`}
                >
                    <User className="w-6 h-6" />
                    <span className="text-xs font-medium mt-1">Masuk</span>
                    {(isActive('/login') || isActive('/profile')) && (
                        <div className="absolute top-0 w-12 h-1 bg-white rounded-b-full" />
                    )}
                </Link>
            </div>
        </nav>
    );
}
