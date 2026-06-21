'use client';

import React from 'react';
import { Calendar, ShieldCheck, Zap, Phone } from 'lucide-react';

const benefits = [
    { icon: Calendar, title: 'Kalender Real-time', desc: 'Jadwal ketersediaan diperbarui otomatis secara real-time untuk mencegah double booking.', whatsapp: false },
    { icon: ShieldCheck, title: 'Pembayaran Digital Aman', desc: 'Pembayaran via transfer bank dan QRIS yang aman, dikonfirmasi langsung oleh admin.', whatsapp: false },
    { icon: Zap, title: 'Konfirmasi Instan', desc: 'Tiket reservasi dan nota pembayaran dikirim langsung ke email setelah transaksi sukses.', whatsapp: false },
    { icon: Phone, title: 'Dukungan WhatsApp', desc: 'Koordinasi check-in dan serah terima kunci dipandu langsung oleh admin via WhatsApp.', whatsapp: true },
];

export default function WhyUsSection() {
    return (
        <section data-reveal className="bg-[#2563EB] text-white mt-20 py-24 sm:py-32 px-8 sm:px-14 lg:px-24 reveal">
            <div className="max-w-8xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                    <span className="inline-block text-[11px] font-medium text-white/40">Keunggulan</span>
                    <h2 className="text-2xl sm:text-3xl lg:text-[2rem] font-medium tracking-[-0.02em] leading-[1.2] text-white">
                        Mengapa Memilih PusatVilla.id?
                    </h2>
                    <p className="text-sm text-white/50 max-w-lg mx-auto">
                        Platform persewaan terpercaya dengan kemudahan transaksi pembayaran otomatis dan pelayanan responsif.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {benefits.map((item, i) => (
                        <div key={i} className="bg-white/[0.03] border border-white/[0.06] p-8 rounded-[12px] space-y-4 hover:bg-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                            <div className="w-9 h-9 rounded-[8px] bg-white/5 flex items-center justify-center text-white/60">
                                <item.icon className="w-4.5 h-4.5" />
                            </div>
                            <h3 className={`text-base font-medium ${item.whatsapp ? 'text-green-400' : 'text-white'}`}>{item.title}</h3>
                            <p className="text-white/45 text-sm leading-relaxed">
                                {item.whatsapp
                                    ? <>Koordinasi check-in dan serah terima kunci dipandu langsung oleh admin via <span className="text-green-400 font-semibold">WhatsApp</span>.</>
                                    : item.desc
                                }
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
