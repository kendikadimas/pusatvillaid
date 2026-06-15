'use client';

import React from 'react';
import Link from 'next/link';
import { Phone } from 'lucide-react';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '6281234567890';

export default function CTASection() {
    return (
        <section data-reveal className=" mt-20 py-6 sm:py-6 px-8 sm:px-14 lg:px-24 reveal reveal-delay-1">
            <div className='bg-black p-5 py-10 text-white max-w-4xl mx-auto rounded-2xl'>
            <div className="max-w-4xl mx-auto text-center space-y-3">
                <h2 className="text-2xl sm:text-3xl lg:text-[2rem] font-bold text-white tracking-[-0.02em] leading-[1.2]">
                    Butuh Rekomendasi atau Rencana Rombongan?
                </h2>
                <p className="text-sm text-[#787774] max-w-lg mx-auto">
                    Hubungi layanan admin kami via WhatsApp untuk penawaran harga khusus, pemesanan rombongan, atau bantuan teknis saat check-in.
                </p>
            </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6">
                    <Link
                        href="/villas"
                        className="w-full sm:w-auto bg-[#2563EB] text-white font-medium px-7 py-3.5 rounded-[8px] hover:bg-[#1D4ED8] active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] text-sm"
                    >
                        Jelajahi Villa Sekarang
                    </Link>
                    <a
                        href={`https://wa.me/${WHATSAPP_NUMBER}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto border border-[#EAEAEA] text-[#2563EB] font-medium px-7 py-3.5 rounded-[8px] hover:bg-[#F7F6F3] active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] text-sm flex items-center justify-center space-x-2 cursor-pointer"
                    >
                        <Phone className="w-4 h-4" />
                        <span>Hubungi Admin</span>
                    </a>
                </div>
            </div>
        </section>
    );
}
