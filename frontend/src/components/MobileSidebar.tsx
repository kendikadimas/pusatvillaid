'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Home, Search, Heart, User, LayoutDashboard, LogIn, Sparkles, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
    const { user, admin } = useAuth();
    const router = useRouter();

    // Prevent background scrolling when sidebar is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] lg:hidden">
            {/* Backdrop Blur Overlay */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
                onClick={onClose}
            />

            {/* Sidebar Container */}
            <div className="absolute top-0 right-0 h-full w-[310px] max-w-[85vw] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out animate-slideInRight">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center space-x-2">
                        <svg className="w-7 h-7 fill-current text-blue-600" viewBox="0 0 32 32">
                            <path d="M16 1c-2.008 0-3.92.518-5.59 1.432A15.011 15.011 0 0 0 .91 18.066c1.196 4.398 4.73 7.828 9.098 9.098C11.954 27.674 13.914 28 16 28c2.086 0 4.046-.326 5.992-.836 4.368-1.27 7.902-4.7 9.098-9.098A15.01 15.01 0 0 0 16 1zm0 25c-1.748 0-3.388-.274-5.012-.702A12.012 12.012 0 0 1 3.702 11.23C4.898 6.832 8.432 3.4 12.8 2.13A12.01 12.01 0 0 1 16 2a11.983 11.983 0 0 1 12.298 9.23c1.196 4.398-2.336 7.828-6.702 9.098C19.966 25.666 18.066 26 16 26z"/>
                            <path d="M16 7.5L7.5 14.5h3.5v9h10v-9h3.5zM18 21.5h-4v-7.5h4z"/>
                        </svg>
                        <span className="text-base font-black tracking-tight text-slate-800">
                            pusatvilla.id
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                        aria-label="Tutup menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Profile / Account Area */}
                <div className="px-6 py-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/20">
                    {user || admin ? (
                        <div className="flex items-center space-x-3.5">
                            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-md border-2 border-white">
                                {user ? (user.name ? user.name.substring(0, 2).toUpperCase() : 'U') : 'AD'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-900 truncate">
                                    {user ? user.name : 'Administrator'}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    {user ? user.email : 'admin@pusatvilla.id'}
                                </p>
                                <Link 
                                    href={admin ? "/admin/dashboard" : "/profile"}
                                    onClick={onClose}
                                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 underline mt-1 block"
                                >
                                    {admin ? 'Kelola Dashboard' : 'Lihat Profil'}
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center gap-1.5 text-blue-600">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-[11px] font-bold uppercase tracking-wider">Liburan Impian Anda</span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                Masuk ke akun Anda untuk pengalaman booking villa yang lebih cepat dan personal.
                            </p>
                            <Link
                                href="/login"
                                onClick={onClose}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
                            >
                                <LogIn className="w-4 h-4" />
                                <span>Masuk ke Akun</span>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Navigation Links */}
                <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                    <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Menu Utama</span>
                    
                    <Link
                        href="/"
                        onClick={onClose}
                        className="flex items-center space-x-3 px-3 py-3 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all font-semibold text-[14px]"
                    >
                        <Home className="w-4.5 h-4.5 shrink-0" />
                        <span>Beranda</span>
                    </Link>

                    <Link
                        href="/villas"
                        onClick={onClose}
                        className="flex items-center space-x-3 px-3 py-3 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all font-semibold text-[14px]"
                    >
                        <Search className="w-4.5 h-4.5 shrink-0" />
                        <span>Cari Villa</span>
                    </Link>

                    <Link
                        href="/wishlist"
                        onClick={onClose}
                        className="flex items-center space-x-3 px-3 py-3 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all font-semibold text-[14px]"
                    >
                        <Heart className="w-4.5 h-4.5 shrink-0" />
                        <span>Favorit Saya</span>
                    </Link>

                    {(user || admin) && (
                        <>
                            <div className="border-t border-slate-100 my-4 pt-4" />
                            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Akun Saya</span>

                            <Link
                                href={admin ? "/admin/dashboard" : "/profile"}
                                onClick={onClose}
                                className="flex items-center space-x-3 px-3 py-3 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all font-semibold text-[14px]"
                            >
                                {admin ? (
                                    <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
                                ) : (
                                    <User className="w-4.5 h-4.5 shrink-0" />
                                )}
                                <span>{admin ? 'Dashboard Admin' : 'Profil Saya'}</span>
                            </Link>
                        </>
                    )}
                </div>

                {/* Footer Brand info */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center space-y-1">
                    <span className="text-[11px] font-bold text-slate-800">PusatVilla.id</span>
                    <span className="text-[9px] text-slate-400">© 2026. Hak Cipta Dilindungi.</span>
                </div>
            </div>
            
            {/* Custom Animation CSS injection */}
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out forwards;
                }
                .animate-slideInRight {
                    animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
}
