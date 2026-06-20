import React from 'react';
import Link from 'next/link';
import { MapPin, Mail, Phone, Heart } from 'lucide-react';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '6281234567890';

const formatWhatsAppDisplay = (num: string): string => {
    if (num.length >= 12) {
        return `+${num.slice(0, 2)} ${num.slice(2, 5)} ${num.slice(5, 9)} ${num.slice(9)}`;
    }
    return `+${num}`;
};

export default function PublicFooter() {
    const whatsappDisplay = formatWhatsAppDisplay(WHATSAPP_NUMBER);
    
    return (
        <footer className="bg-gradient-to-b from-blue-800 to-blue-950 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-16 sm:py-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center space-x-2">
                            <svg className="w-9 h-9 fill-current text-blue-300" viewBox="0 0 32 32">
                                <path d="M16 1c-2.008 0-3.92.518-5.59 1.432A15.011 15.011 0 0 0 .91 18.066c1.196 4.398 4.73 7.828 9.098 9.098C11.954 27.674 13.914 28 16 28c2.086 0 4.046-.326 5.992-.836 4.368-1.27 7.902-4.7 9.098-9.098A15.01 15.01 0 0 0 16 1zm0 25c-1.748 0-3.388-.274-5.012-.702A12.012 12.012 0 0 1 3.702 11.23C4.898 6.832 8.432 3.4 12.8 2.13A12.01 12.01 0 0 1 16 2a11.983 11.983 0 0 1 12.298 9.23c1.196 4.398-2.336 7.828-6.702 9.098C19.966 25.666 18.066 26 16 26z"/>
                                <path d="M16 7.5L7.5 14.5h3.5v9h10v-9h3.5zM18 21.5h-4v-7.5h4z"/>
                            </svg>
                            <span className="text-xl font-sans font-black tracking-tight text-white">
                                pusatvilla.id
                            </span>
                        </Link>
                        <p className="text-sm leading-relaxed text-blue-200/80 max-w-xs">
                            Platform persewaan villa premium terpercaya di Indonesia. Akomodasi berkualitas dengan reservasi modern, instan, dan aman.
                        </p>
                    </div>

                    {/* Jelajahi */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider">Jelajahi</h3>
                        <ul className="space-y-2.5">
                            <li><Link href="/villas" className="text-sm text-blue-200/80 hover:text-white transition-colors">Cari Villa</Link></li>
                            <li><Link href="/villas?location=Bogor" className="text-sm text-blue-200/80 hover:text-white transition-colors">Villa di Puncak</Link></li>
                            <li><Link href="/villas?location=Bandung" className="text-sm text-blue-200/80 hover:text-white transition-colors">Villa di Bandung</Link></li>
                            <li><Link href="/villas?location=Yogyakarta" className="text-sm text-blue-200/80 hover:text-white transition-colors">Villa di Yogyakarta</Link></li>
                            <li><Link href="/villas?location=Bali" className="text-sm text-blue-200/80 hover:text-white transition-colors">Villa di Bali</Link></li>
                        </ul>
                    </div>

                    {/* Panduan */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider">Panduan</h3>
                        <ul className="space-y-2.5">
                            <li><Link href="/villas" className="text-sm text-blue-200/80 hover:text-white transition-colors">Cara Memesan</Link></li>
                            <li><Link href="/villas" className="text-sm text-blue-200/80 hover:text-white transition-colors">Syarat & Ketentuan</Link></li>
                            <li><Link href="/villas" className="text-sm text-blue-200/80 hover:text-white transition-colors">Kebijakan Privasi</Link></li>
                            <li><Link href="/villas" className="text-sm text-blue-200/80 hover:text-white transition-colors">Kebijakan Pembatalan</Link></li>
                            <li><Link href="/villas" className="text-sm text-blue-200/80 hover:text-white transition-colors">Pusat Bantuan</Link></li>
                        </ul>
                    </div>

                    {/* Kontak */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider">Hubungi Kami</h3>
                        <ul className="space-y-3 text-sm text-blue-200/80">
                            <li className="flex items-start space-x-2.5">
                                <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                <span>Yogyakarta, Indonesia</span>
                            </li>
                            <li className="flex items-start space-x-2.5">
                                <Mail className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                <span>support@pusatvilla.id</span>
                            </li>
                            <li className="flex items-start space-x-2.5">
                                <Phone className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
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
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-blue-700/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <p className="text-blue-300">
                        &copy; {new Date().getFullYear()} PusatVilla.id &mdash; Semua hak cipta dilindungi.
                    </p>
                    <p className="text-blue-400 flex items-center gap-1">
                        Dibuat dengan <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" /> oleh KalanaLabs
                    </p>
                </div>
            </div>
        </footer>
    );
}
