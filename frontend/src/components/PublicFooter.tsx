import React from 'react';
import Link from 'next/link';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '6281234567890';

// Format WhatsApp number for display (e.g., "6281234567890" -> "+62 812 3456 7890")
const formatWhatsAppDisplay = (num: string): string => {
    if (num.length >= 12) {
        return `+${num.slice(0, 2)} ${num.slice(2, 5)} ${num.slice(5, 9)} ${num.slice(9)}`;
    }
    return `+${num}`;
};

export default function PublicFooter() {
    const whatsappDisplay = formatWhatsAppDisplay(WHATSAPP_NUMBER);
    
    return (
        <footer className="bg-gradient-to-b from-blue-800 to-blue-950 text-white py-16 sm:py-20">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="space-y-3">
                    <h3 className="text-base font-medium text-blue-300 tracking-tight">pusatvilla.id</h3>
                    <p className="text-sm leading-relaxed text-blue-200/80 max-w-xs">
                        Platform persewaan villa premium terbaik di Indonesia. Akomodasi berkualitas tinggi dengan reservasi modern, instan, dan aman.
                    </p>
                </div>
                <div className="space-y-3">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-300">Hubungi Kami</h3>
                    <ul className="text-sm space-y-2 text-blue-200/80">
                        <li className="flex items-center space-x-2">
                            <span>Yogyakarta, Indonesia</span>
                        </li>
                        <li className="flex items-center space-x-2">
                            <span>support@pusatvilla.id</span>
                        </li>
                        <li className="flex items-center space-x-2">
                            <a
                                href={`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=Halo%2C%20saya%20ingin%20bertanya%20tentang%20villa`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-white transition-colors"
                            >
                                {whatsappDisplay}
                            </a>
                        </li>
                    </ul>
                </div>
                <div className="space-y-3">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-300">Navigasi</h3>
                    <ul className="text-sm space-y-2">
                        <li><Link href="/villas" className="text-blue-200/80 hover:text-white transition-colors duration-200">Cari Katalog Villa</Link></li>
                    </ul>
                </div>
            </div>
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-blue-700/50 mt-12 pt-6 text-center text-xs text-blue-300">
                <p>&copy; {new Date().getFullYear()} pusatvilla.id &mdash; Dibuat oleh KalanaLabs.</p>
            </div>
        </footer>
    );
}
