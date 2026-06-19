'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Heart, User } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 lg:hidden">
            <div className="flex items-center justify-around h-16">
                <Link
                    href="/"
                    className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                        isActive('/') ? 'text-rose-500' : 'text-slate-500'
                    }`}
                >
                    <Search className="w-6 h-6" />
                    <span className="text-xs font-medium mt-1">Telusuri</span>
                    {isActive('/') && (
                        <div className="absolute bottom-0 w-12 h-0.5 bg-rose-500 rounded-full" />
                    )}
                </Link>

                <Link
                    href="/wishlist"
                    className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                        isActive('/wishlist') ? 'text-rose-500' : 'text-slate-500'
                    }`}
                >
                    <Heart className="w-6 h-6" />
                    <span className="text-xs font-medium mt-1">Favorit</span>
                    {isActive('/wishlist') && (
                        <div className="absolute bottom-0 w-12 h-0.5 bg-rose-500 rounded-full" />
                    )}
                </Link>

                <Link
                    href="/login"
                    className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                        isActive('/login') || isActive('/profile') ? 'text-rose-500' : 'text-slate-500'
                    }`}
                >
                    <User className="w-6 h-6" />
                    <span className="text-xs font-medium mt-1">Masuk</span>
                    {(isActive('/login') || isActive('/profile')) && (
                        <div className="absolute bottom-0 w-12 h-0.5 bg-rose-500 rounded-full" />
                    )}
                </Link>
            </div>
        </nav>
    );
}
