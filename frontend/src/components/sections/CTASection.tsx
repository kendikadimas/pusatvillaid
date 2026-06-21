'use client';

import React from 'react';
import Link from 'next/link';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '6281234567890';

export default function CTASection() {
    return (
        <section data-reveal className="mt-20 mb-20 px-4 sm:px-8 lg:px-16 reveal reveal-delay-1">
            <div className="max-w-6xl mx-auto">
                {/* Full-bleed dark band, no glow blobs, no grid texture */}
                <div className="bg-[#111] rounded-2xl px-8 sm:px-12 lg:px-16 py-14 sm:py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 items-end">

                        {/* Left: copy */}
                        <div className="space-y-5">
                            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-[1.1] max-w-lg">
                                Butuh rekomendasi villa
                                atau rencana rombongan?
                            </h2>
                            <p className="text-[15px] text-white/50 leading-relaxed max-w-md">
                                Hubungi admin langsung via{' '}
                                <span className="text-[#25D366] font-medium">WhatsApp</span>
                                {' '}untuk penawaran harga khusus, pemesanan grup, atau bantuan saat check-in.
                            </p>
                        </div>

                        {/* Right: CTAs stacked */}
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-52">
                            <a
                                href={`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=Halo%2C%20saya%20ingin%20bertanya%20tentang%20villa`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center space-x-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors duration-150 active:scale-[0.97] cursor-pointer"
                            >
                                <WhatsAppIcon className="w-4 h-4 flex-shrink-0" />
                                <span>Chat WhatsApp</span>
                            </a>

                            <Link
                                href="/villas"
                                className="flex items-center justify-center border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-medium px-6 py-3 rounded-lg text-sm transition-colors duration-150 active:scale-[0.97] cursor-pointer"
                            >
                                Jelajahi Villa
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
