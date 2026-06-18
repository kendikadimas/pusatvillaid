'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosClient from '@/lib/axios';
import { Villa, Review } from '@/types';
import { useBookingStore } from '@/store/bookingStore';
import { getPhotoUrl } from '@/lib/villaUtils';
import { DayPicker, DateRange, useDayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, parseISO, addDays, isBefore, startOfDay } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { 
    Star, 
    MapPin, 
    BedDouble, 
    Bath, 
    Users, 
    Calendar,
    ArrowRight,
    Loader2,
    Shield,
    X,
    Check,
    ChevronLeft,
    ChevronRight,
    Key,
    Waves,
    Trophy,
    Share2,
    Heart,
    Globe,
    Wind,
    Car,
    Coffee,
    Sparkles,
    Search,
    Tv,
    Wifi,
    Flame,
    Utensils,
    Briefcase,
    Thermometer,
    ShieldCheck,
    Languages
} from 'lucide-react';
import { toast } from 'sonner';
import PublicHeader from '@/components/PublicHeader';

interface PageProps {
    params: Promise<{ slug: string }>;
}

// Icon mappings for property highlights
const highlightIconMap: Record<string, React.ComponentType<any>> = {
    Wind: Wind,
    Key: Key,
    Car: Car,
    Shield: Shield,
    Waves: Waves,
    Trophy: Trophy,
    Coffee: Coffee,
    Sparkles: Sparkles,
    Wifi: Wifi
};

// Icon mappings for amenities
const amenityIconMap: Record<string, React.ComponentType<any>> = {
    'Kolam Renang': Waves,
    'WiFi': Wifi,
    'AC': Wind,
    'Dapur Lengkap': Utensils,
    'Dapur': Utensils,
    'BBQ Area': Flame,
    'Water Heater': Bath,
    'Smart TV': Tv,
    'TV': Tv,
    'Bak mandi': Bath,
    'Private Jacuzzi': Waves,
    'Butler Service': Users,
    'Spa Room': Heart,
    'Floating Breakfast': Coffee,
    'Karaoke': Trophy,
    'Diizinkan menitipkan bawaan': Briefcase,
    'Kamera keamanan di bagian luar di properti': Shield,
    'Alarm karbon monoksida': Shield,
    'Alarm asap': Shield,
    'Sampo': Sparkles,
    'Sabun mandi': Sparkles,
    'Air panas': Thermometer,
    'Sabun mandi cair': Sparkles
};

// Icon mappings for host details
const getHostAboutIcon = (text: string, index: number) => {
    const textLower = text.toLowerCase();
    if (textLower.includes('lahir') || textLower.includes('tahun')) return Sparkles;
    if (textLower.includes('sekolah') || textLower.includes('kuliah') || textLower.includes('universitas') || textLower.includes('rmit') || textLower.includes('kerja')) return Briefcase;
    if (textLower.includes('bahasa')) return Languages;
    if (textLower.includes('hobi') || textLower.includes('suka') || textLower.includes('cinta')) return Heart;
    return index % 2 === 0 ? Sparkles : Globe;
};

export default function VillaDetailPageClient({ params }: PageProps) {
    const { slug: paramSlug } = use(params);
    // Read slug from URL for static export fallback (when .htaccess rewrites to placeholder page)
    const slug = typeof window !== 'undefined'
        ? window.location.pathname.split('/villas/')[1]?.replace(/\/$/, '') || paramSlug
        : paramSlug;
    const router = useRouter();
    const searchParams = useSearchParams();
    const checkInQuery = searchParams.get('checkIn');
    const checkOutQuery = searchParams.get('checkOut');

    const [villa, setVilla] = useState<Villa | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [avgRating, setAvgRating] = useState(0);
    const [disabledDates, setDisabledDates] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Lightbox & Modal states
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isAmenitiesModalOpen, setIsAmenitiesModalOpen] = useState(false);
    
    // Reviews Modal & Search/Filter states
    const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
    const [reviewSearchQuery, setReviewSearchQuery] = useState('');
    const [selectedReviewTag, setSelectedReviewTag] = useState<string | null>(null);
    const [reviewSortOrder, setReviewSortOrder] = useState('relevance');

    // Neighborhood desc collapse
    const [isNeighborhoodExpanded, setIsNeighborhoodExpanded] = useState(false);

    // Scroll states
    const [showSearchPill, setShowSearchPill] = useState(false);
    const [activeSection, setActiveSection] = useState('foto');

    // Wishlist state
    const [wishlist, setWishlist] = useState<number[]>([]);

    // Responsive calendar state
    const [isMobile, setIsMobile] = useState(false);

    // Zustand Booking Store Actions
    const { 
        setVilla: setStoreVilla, 
        setDates: setStoreDates, 
        setNumGuests,
        checkIn: storeCheckIn, 
        checkOut: storeCheckOut,
        numGuests: storeNumGuests,
        totalNights, 
        totalAmount,
        priceBreakdown,
        isRefundable,
        setRefundable
    } = useBookingStore();

    // Date Picker Local State
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    // Reviews Dynamic Helper Actions
    const getKeywordTagCounts = () => {
        const tags = [
            { label: 'Kolam renang', keywords: ['kolam', 'renang', 'pool'] },
            { label: 'Lokasi', keywords: ['lokasi', 'location', 'tempat'] },
            { label: 'AC', keywords: ['ac', 'pendingin'] },
            { label: 'Area terdekat', keywords: ['dekat', 'sekitar', 'terdekat'] },
            { label: 'Kenyamanan', keywords: ['nyaman', 'comfort', 'tenang'] },
            { label: 'Kebersihan', keywords: ['bersih', 'clean', 'segar'] },
            { label: 'Keramahtamahan', keywords: ['ramah', 'host', 'bobby', 'pelayanan'] }
        ];

        return tags.map(tag => {
            const count = reviews.filter(r => {
                const commentLower = (r.comment || '').toLowerCase();
                const nameLower = (r.guest_name || '').toLowerCase();
                return tag.keywords.some(kw => commentLower.includes(kw) || nameLower.includes(kw));
            }).length;
            return { label: tag.label, count };
        }).filter(t => t.count > 0);
    };

    const getFilteredAndSortedReviews = () => {
        let list = [...reviews];

        // Apply Tag Filter
        if (selectedReviewTag) {
            const tagMap: Record<string, string[]> = {
                'Kolam renang': ['kolam', 'renang', 'pool'],
                'Lokasi': ['lokasi', 'location', 'tempat'],
                'AC': ['ac', 'pendingin'],
                'Area terdekat': ['dekat', 'sekitar', 'terdekat'],
                'Kenyamanan': ['nyaman', 'comfort', 'tenang'],
                'Kebersihan': ['bersih', 'clean', 'segar'],
                'Keramahtamahan': ['ramah', 'host', 'bobby', 'pelayanan']
            };
            const kws = tagMap[selectedReviewTag] || [];
            list = list.filter(r => {
                const commentLower = (r.comment || '').toLowerCase();
                return kws.some(kw => commentLower.includes(kw));
            });
        }

        // Apply Search Filter
        if (reviewSearchQuery.trim()) {
            const q = reviewSearchQuery.toLowerCase();
            list = list.filter(r => {
                const commentLower = (r.comment || '').toLowerCase();
                const guestNameLower = (r.guest_name || '').toLowerCase();
                return commentLower.includes(q) || guestNameLower.includes(q);
            });
        }

        // Apply Sort Order
        if (reviewSortOrder === 'newest') {
            list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else if (reviewSortOrder === 'highest') {
            list.sort((a, b) => b.rating - a.rating);
        } else if (reviewSortOrder === 'lowest') {
            list.sort((a, b) => a.rating - b.rating);
        }
        
        return list;
    };

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setShowSearchPill(window.scrollY > 400);

            // Determine active section for scroll-spy sub-navbar
            const sections = ['foto', 'fasilitas', 'ulasan', 'lokasi'];
            for (const section of sections) {
                const el = document.getElementById(`${section}-section`);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (rect.top <= 160 && rect.bottom >= 160) {
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem('pusatvilla_wishlist');
        if (saved) {
            try {
                setWishlist(JSON.parse(saved));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    useEffect(() => {
        const fetchVillaDetails = async () => {
            try {
                // Fetch details + reviews
                const res = await axiosClient.get(`/villas/${slug}`);
                setVilla(res.data.villa);
                setReviews(res.data.reviews || []);
                setAvgRating(res.data.stats?.rating_avg || 0);
                setStoreVilla(res.data.villa);

                // Fetch disabled dates
                const availRes = await axiosClient.get(`/villas/${slug}/availability`);
                setDisabledDates(availRes.data.disabled_dates || []);

                // Check for URL query params to initialize dates
                if (checkInQuery && checkOutQuery) {
                    setDateRange({
                        from: parseISO(checkInQuery),
                        to: parseISO(checkOutQuery)
                    });
                    setStoreDates(checkInQuery, checkOutQuery);
                } else if (storeCheckIn && storeCheckOut) {
                    setDateRange({
                        from: parseISO(storeCheckIn),
                        to: parseISO(storeCheckOut)
                    });
                }
            } catch (err) {
                console.error('Failed to fetch details:', err);
                toast.error('Gagal memuat detail villa.');
            } finally {
                setLoading(false);
            }
        };

        fetchVillaDetails();
    }, [slug]);

    // Refetch availability silently (for real-time calendar updates)
    const refetchAvailability = useCallback(async () => {
        if (!slug) return;
        try {
            const availRes = await axiosClient.get(`/villas/${slug}/availability`);
            setDisabledDates(availRes.data.disabled_dates || []);
        } catch (err) {
            console.warn('Availability refetch failed:', err);
        }
    }, [slug]);

    // Auto-refresh availability when user returns to this tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                refetchAvailability();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [refetchAvailability]);

    // Handle calendar date range selections
    const handleSelectRange = (range: DateRange | undefined) => {
        setDateRange(range);
        
        if (range?.from && range?.to) {
            // Check if any date in between is disabled
            let hasOverlappingDisabledDate = false;
            const checkInStr = format(range.from, 'yyyy-MM-dd');
            const checkOutStr = format(range.to, 'yyyy-MM-dd');

            const start = startOfDay(range.from);
            const end = startOfDay(range.to);

            let current = start;
            while (isBefore(current, end)) {
                const curStr = format(current, 'yyyy-MM-dd');
                if (disabledDates.includes(curStr)) {
                    hasOverlappingDisabledDate = true;
                    break;
                }
                current = addDays(current, 1);
            }

            if (hasOverlappingDisabledDate) {
                toast.error('Gagal memilih tanggal: Terdapat tanggal yang sudah dipesan di dalam rentang Anda.');
                setDateRange({ from: range.from, to: undefined });
                setStoreDates(null, null);
                return;
            }

            setStoreDates(checkInStr, checkOutStr);
        } else if (range?.from) {
            setStoreDates(format(range.from, 'yyyy-MM-dd'), null);
        } else {
            setStoreDates(null, null);
        }
    };

    const handleBookingSubmit = () => {
        if (!storeCheckIn || !storeCheckOut) {
            scrollToSection('calendar');
            toast.error('Silakan tentukan tanggal check-in dan check-out Anda.');
            return;
        }
        router.push('/booking/confirm');
    };

    const toggleWishlist = (id: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        let updated;
        if (wishlist.includes(id)) {
            updated = wishlist.filter(item => item !== id);
            toast.success('Villa dihapus dari favorit.');
        } else {
            updated = [...wishlist, id];
            toast.success('Villa disimpan ke favorit.');
        }
        setWishlist(updated);
        localStorage.setItem('pusatvilla_wishlist', JSON.stringify(updated));
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Tautan berhasil disalin ke papan klip!');
    };

    const scrollToSection = (id: string) => {
        const el = document.getElementById(`${id}-section`);
        if (el) {
            const offset = 140; // account for sticky header & sticky sub-navbar
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = el.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-64 min-h-screen bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!villa) {
        return (
            <div className="text-center py-64 min-h-screen bg-slate-50 flex flex-col justify-center items-center">
                <p className="text-slate-600 text-base mb-4 font-bold">Villa tidak ditemukan atau telah dinonaktifkan.</p>
                <Link href="/villas" className="text-blue-600 font-bold hover:underline active:scale-95 transition-transform">
                    Kembali ke Katalog Villa
                </Link>
            </div>
        );
    }

    // Process Photos
    const photos = villa.photos && villa.photos.length > 0 
        ? villa.photos 
        : ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80'];

    const mainPhoto = photos[0];
    const thumbPhotos = photos.slice(1, 5); // display up to 4 thumbnails

    // Parse Disabled Date objects for react-day-picker
    const disabledDays = disabledDates.map(d => parseISO(d));

    // Dynamic Host Data Fallback
    const hostName = villa.host_name || 'Bobby';
    const hostYears = villa.host_years || 2;
    const hostAvatar = villa.host_avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80';
    const hostJoinedLabel = villa.host_joined_label || 'Mulai menerima tamu tahun 2024';
    const hostIsVerified = villa.host_is_verified !== false;
    const hostAboutList = villa.host_about || ['Lahir di tahun 80-an', 'Tempat saya bersekolah: RMIT University'];
    const coHosts = villa.co_hosts || [];
    const cancellationPolicy = villa.cancellation_policy || 'Pembatalan gratis selama 24 jam. Setelahnya, biaya reservasi tidak dapat dikembalikan. Baca kebijakan lengkap tuan rumah untuk rincian selengkapnya.';
    const safetyList = villa.safety_property || [
        'Alarm karbon monoksida tidak dilaporkan',
        'Alarm asap tidak dilaporkan',
        'Kamera keamanan di bagian luar properti'
    ];
    const neighborhoodDesc = villa.neighborhood_desc || 'Terletak di pusat distrik pariwisata Yogyakarta, di mana Anda bisa berjalan-jalan untuk menemukan restoran lokal, Asia, dan Barat serta berbelanja di butik-butik yang menyenangkan.';

    // Dynamic Highlights Fallback
    const highlights = villa.highlights && villa.highlights.length > 0
        ? villa.highlights
        : [
            { icon: 'Wind', title: 'AC & kipas angin', description: 'Villa dilengkapi pendingin ruangan untuk kenyamanan Anda.' },
            { icon: 'Key', title: 'Check-in mandiri', description: 'Check-in fleksibel dengan akses mandiri menggunakan smart lock atau kode pintu.' },
            { icon: 'Car', title: 'Parkir gratis', description: 'Tersedia area parkir gratis untuk kendaraan Anda selama menginap.' },
            { icon: 'Wifi', title: 'WiFi gratis', description: 'Nikmati akses internet WiFi berkecepatan tinggi selama menginap.' }
        ];

    // Dynamic Bedrooms Info Fallback
    const bedroomsInfo = villa.bedrooms_info && villa.bedrooms_info.length > 0
        ? villa.bedrooms_info
        : [...Array(villa.bedrooms)].map((_, i) => ({
            image: i % 2 === 0 
                ? 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80'
                : 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80',
            title: `Kamar tidur ${i + 1}`,
            subtext: '1 tempat tidur king'
        }));

    // Dynamic Accessibility Features Fallback
    const accessibilityFeatures = villa.accessibility_features && villa.accessibility_features.length > 0
        ? villa.accessibility_features
        : [
            { image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80', title: 'Pintu masuk dan parkir tamu', subtext: 'Tempat parkir penyandang disabilitas' },
            { image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80', title: 'Kamar mandi lengkap', subtext: 'Pegangan tetap untuk shower' }
        ];

    const isSaved = wishlist.includes(villa.id);

    // Cancel Date computation (Check-in date minus 1 day)
    const getCancellationDateLabel = () => {
        if (storeCheckIn) {
            const checkInDate = parseISO(storeCheckIn);
            const refundLimitDate = addDays(checkInDate, -1);
            return `Pembatalan gratis sebelum ${format(refundLimitDate, 'd MMMM', { locale: localeID })}`;
        }
        return 'Pembatalan gratis 24 jam sebelum check-in';
    };

    const getRefundableCancellationDateLabel = () => {
        const freeDays = villa.cancellation_free_days || 5;
        if (storeCheckIn) {
            const checkInDate = parseISO(storeCheckIn);
            const refundLimitDate = addDays(checkInDate, -freeDays);
            return 'Pembatalan gratis sebelum ' + format(refundLimitDate, 'd MMMM', { locale: localeID });
        }
        return 'Pembatalan gratis hingga ' + freeDays + ' hari sebelum check-in';
    };

    return (
        <div className="flex-1 flex flex-col bg-white text-slate-900 font-sans antialiased">
            {/* Header (unified with homepage) */}
            <PublicHeader
                showBackButton
                onBackClick={() => router.push('/villas')}
            />

            <main className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 w-full flex-1 pb-24 lg:pb-16" id="foto-section">
                {/* Villa Title, Share, Save */}
                <div className="mb-4 mt-10">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <h1 className="font-serif text-2xl md:text-[32px] md:leading-[36px] font-semibold text-slate-900 tracking-tight leading-snug flex items-center gap-2.5">
                            {/* <Languages className="w-7 h-7 text-slate-800 shrink-0" strokeWidth={1.5} /> */}
                            <span>{villa.name}</span>
                        </h1>
                        <div className="flex items-center space-x-5 flex-shrink-0 text-[14px] font-bold text-slate-800">
                            <button 
                                onClick={handleShare}
                                className="flex items-center space-x-2 hover:bg-slate-100 py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer"
                            >
                                <Share2 className="w-4 h-4 text-slate-800" strokeWidth={2} />
                                <span className="underline">Bagikan</span>
                            </button>
                            <button 
                                onClick={(e) => toggleWishlist(villa.id, e)}
                                className="flex items-center space-x-2 hover:bg-slate-100 py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer"
                            >
                                <Heart 
                                    className={`w-4 h-4 transition-colors ${
                                        isSaved ? 'fill-blue-600 text-blue-600' : 'text-slate-800'
                                    }`} 
                                    strokeWidth={2} 
                                />
                                <span className="underline">{isSaved ? 'Disimpan' : 'Simpan'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Image Gallery Grid */}
                <div className="relative mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-2xl overflow-hidden bg-white">
                        {/* Main Large Image */}
                        <div 
                            onClick={() => { setCurrentImageIndex(0); setIsLightboxOpen(true); }}
                            className="md:col-span-2 aspect-[4/3] md:aspect-auto overflow-hidden rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none cursor-pointer relative group"
                        >
                            <img 
                                src={getPhotoUrl(mainPhoto)} 
                                alt={villa.name} 
                                className="w-full h-full object-cover group-hover:brightness-90 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                        </div>

                        {/* Thumbnails grid */}
                        <div className="md:col-span-2 grid grid-cols-2 gap-1.5 md:gap-2">
                            {thumbPhotos.map((photo, i) => {
                                // Determine round corner styling based on thumbnail position
                                let cornerClass = "";
                                if (i === 1) cornerClass = "md:rounded-tr-2xl";
                                if (i === 3) cornerClass = "md:rounded-br-2xl";

                                return (
                                        <div 
                                            key={i}
                                            onClick={() => { setCurrentImageIndex(i + 1); setIsLightboxOpen(true); }}
                                            className={`aspect-[4/3] overflow-hidden cursor-pointer relative group ${cornerClass}`}
                                    >
                                        <img 
                                            src={getPhotoUrl(photo)} 
                                            alt={`Thumbnail ${i}`} 
                                            className="w-full h-full object-cover group-hover:brightness-90 transition duration-300"
                                        />
                                        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                                    </div>
                                );
                            })}
                            {/* Fill placeholder blocks if photo count < 5 */}
                            {[...Array(Math.max(0, 4 - thumbPhotos.length))].map((_, idx) => (
                                <div 
                                    key={`empty-${idx}`}
                                    className="bg-slate-50 border border-dashed border-slate-200 aspect-[4/3] flex items-center justify-center"
                                >
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">PusatVilla.id</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* View All Photos Button */}
                    <button 
                        onClick={() => { setCurrentImageIndex(0); setIsLightboxOpen(true); }}
                        className="absolute bottom-5 right-5 bg-white hover:bg-slate-50 text-slate-900 text-[13px] font-semibold px-4 py-2 rounded-xl border border-slate-200 shadow-md transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
                    >
                        <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" className="w-3.5 h-3.5 fill-slate-900"><path d="M5 2a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3H5zm0 1h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM4 6.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm5 3.707a1 1 0 0 1-1.414 0L6 8.621l-2.086 2.086A1 1 0 0 1 2.5 10v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9.5l-3.5.707zm-1.5-1.5L9 7.207a1 1 0 0 1-1.414 0L13 9.793V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2.793l2.5-2.5a1 1 0 0 1 1.414 0z"></path></svg>
                        <span>Tampilkan semua foto</span>
                    </button>
                </div>

                {/* Grid Split Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16 mt-4">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Summary Details */}
                        <div className="space-y-1">
                            <h2 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight leading-snug">
                                Seluruh rumah di {villa.location.split(',')[0]}
                            </h2>
                            <p className="text-[15px] text-slate-800 font-normal leading-relaxed">
                                {villa.max_guests} tamu · {villa.bedrooms} kamar tidur · {villa.beds || villa.bedrooms_info?.length || villa.bedrooms} tempat tidur · {villa.bathrooms} kamar mandi
                                {villa.min_nights > 1 && (
                                    <span> · Min. {villa.min_nights} malam</span>
                                )}
                            </p>
                            <div className="flex items-center text-[15px] font-bold text-slate-900 pt-1">
                                <Star className="w-4 h-4 fill-slate-900 text-slate-900 mr-1 shrink-0" />
                                <span>{avgRating > 0 ? avgRating.toFixed(1).replace('.', ',') : '5,0'}</span>
                                <span className="mx-1.5 text-slate-400 font-normal">·</span>
                                <button onClick={() => scrollToSection('ulasan')} className="underline hover:text-blue-600 transition-colors">
                                    {reviews.length} ulasan
                                </button>
                            </div>
                        </div>

                        {/* Host Profile Info */}
                        <div className="border-t border-slate-200/80 py-5">
                            <h3 className="text-base font-bold text-slate-900 mb-3">Dipandu oleh {hostName}</h3>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="relative">
                                        <img 
                                            src={hostAvatar} 
                                            alt={hostName} 
                                            className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-100"
                                        />
                                        {hostIsVerified && (
                                            <div className="absolute -bottom-0.5 -right-0.5 bg-blue-600 text-white p-0.5 rounded-full border border-white shadow-sm">
                                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-bold text-slate-900">{hostName}</span>
                                        </div>
                                        <p className="text-xs text-slate-400">{hostJoinedLabel}</p>
                                    </div>
                                </div>
                                <button className="bg-slate-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors active:scale-95 duration-150 shrink-0">
                                    Hubungi Tuan Rumah
                                </button>
                            </div>
                        </div>

                        {/* Property Highlights */}
                        <div className="space-y-6 pb-6 border-b border-slate-200/80">
                            {highlights.map((hl, idx) => {
                                const IconComponent = highlightIconMap[hl.icon] || Key;
                                return (
                                    <div key={idx} className="flex items-start space-x-5">
                                        <IconComponent className="w-6 h-6 text-slate-800 shrink-0 mt-0.5" strokeWidth={1.5} />
                                        <div>
                                            <h4 className="text-[15px] font-bold text-slate-900 leading-snug">{hl.title}</h4>
                                            <p className="text-[13px] text-slate-500 font-normal leading-normal mt-0.5">{hl.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* About/Description Section */}
                        <div className="space-y-4 pb-6 border-b border-slate-200/80">
                            <p className="text-slate-800 leading-relaxed whitespace-pre-line text-[15px] font-normal">
                                {villa.description || 'Tidak ada deskripsi yang tersedia untuk villa ini.'}
                            </p>
                        </div>

                        {/* Bedrooms Gallery */}
                        <div className="pb-6 border-b border-slate-200/80">
                            <div className="space-y-5">
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Kamar Anda</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {bedroomsInfo.map((br, idx) => (
                                        <div key={idx} className="rounded-2xl flex flex-col space-y-3">
                                            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100">
                                                <img src={br.image} alt={br.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <h4 className="text-[14px] font-bold text-slate-900">{br.title}</h4>
                                                <p className="text-[12px] text-slate-500 mt-0.5 font-normal">{br.subtext}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Amenities section */}
                        <div id="fasilitas-section" className="pb-6 border-b border-slate-200/80">
                            <div className="space-y-5">
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Fasilitas yang ditawarkan</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(villa.amenities || []).slice(0, 8).map((amenity, idx) => {
                                        const IconComponent = amenityIconMap[amenity.name] || Check;
                                        return (
                                            <div key={idx} className="flex items-center space-x-3 text-[15px] text-slate-800 font-normal">
                                                <IconComponent className="w-5 h-5 text-slate-700 shrink-0" strokeWidth={1.5} />
                                                <span>{amenity.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                {villa.amenities && villa.amenities.length > 8 && (
                                    <button 
                                        onClick={() => setIsAmenitiesModalOpen(true)}
                                        className="border border-slate-900 hover:bg-slate-50 text-slate-900 text-[15px] font-bold px-5 py-3 rounded-xl transition-all cursor-pointer inline-block mt-4"
                                    >
                                        Tampilkan ke-{villa.amenities.length} fasilitas
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Accessibility Features */}
                        <div className="pb-6 border-b border-slate-200/80">
                            <div className="space-y-5">
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Fitur aksesibilitas</h3>
                                    <p className="text-[13px] text-slate-500 mt-0.5 font-normal">Info ini diberikan oleh Tuan Rumah dan sudah ditinjau oleh PusatVilla.id</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {accessibilityFeatures.map((ac, idx) => (
                                        <div key={idx} className="rounded-2xl flex flex-col space-y-3">
                                            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100">
                                                <img src={ac.image} alt={ac.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <h4 className="text-[14px] font-bold text-slate-900">{ac.title}</h4>
                                                <p className="text-[12px] text-slate-500 mt-0.5 font-normal">{ac.subtext}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Interactive Calendar Select */}
                        <div id="calendar-section" className="space-y-5 pb-6 border-b border-slate-200/80 scroll-mt-32">
                            <div>
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Cek Ketersediaan Menginap</h3>
                                <p className="text-slate-500 text-[13px] mt-1 font-semibold">
                                    Pilih tanggal check-in dan check-out untuk menghitung rincian sewa. Tanggal redup tidak dapat dipesan.
                                </p>
                            </div>
                            <div>
                                <DayPicker
                                    mode="range"
                                    selected={dateRange}
                                    onSelect={handleSelectRange}
                                    disabled={[{ before: new Date() }, ...disabledDays]}
                                    numberOfMonths={isMobile ? 1 : 2}
                                    locale={localeID}
                                    hideNavigation
                                    className="text-slate-800 max-w-full overflow-auto"
                                    classNames={{
                                        selected: "bg-blue-600 text-white hover:bg-blue-700 rounded-full",
                                        today: "text-blue-600 font-black border border-blue-200 rounded-full",
                                        month_caption: "flex items-center w-full",
                                        caption_label: "flex-1 text-center text-sm font-bold text-slate-900",
                                        button_previous: "p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-slate-600 cursor-pointer active:scale-95 transition-all shadow-sm flex-shrink-0",
                                        button_next: "p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-slate-600 cursor-pointer active:scale-95 transition-all shadow-sm flex-shrink-0",
                                    }}
                                    components={{
                                        MonthCaption: ({ calendarMonth, displayIndex, children, ...divProps }) => {
                                            const { components: comps, classNames, labels: { labelPrevious, labelNext }, previousMonth, nextMonth, goToMonth, dayPickerProps } = useDayPicker();
                                            const numMonths = dayPickerProps.numberOfMonths ?? 1;
                                            const isSingle = numMonths === 1;
                                            const showPrev = isSingle || displayIndex === 0;
                                            const showNext = isSingle || displayIndex === numMonths - 1;
                                            const handlePrev = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); if (previousMonth) goToMonth(previousMonth); };
                                            const handleNext = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); if (nextMonth) goToMonth(nextMonth); };
                                            return (
                                                <div {...divProps} className="flex items-center w-full">
                                                    {showPrev ? (
                                                        <comps.PreviousMonthButton
                                                            type="button"
                                                            tabIndex={previousMonth ? undefined : -1}
                                                            aria-disabled={previousMonth ? undefined : 'true' as any}
                                                            aria-label={labelPrevious(previousMonth)}
                                                            onClick={handlePrev}
                                                        />
                                                    ) : <div className="w-9 flex-shrink-0" />}
                                                    <div className="flex-1 text-center text-sm font-bold text-slate-900">
                                                        {children}
                                                    </div>
                                                    {showNext ? (
                                                        <comps.NextMonthButton
                                                            type="button"
                                                            tabIndex={nextMonth ? undefined : -1}
                                                            aria-disabled={nextMonth ? undefined : 'true' as any}
                                                            aria-label={labelNext(nextMonth)}
                                                            onClick={handleNext}
                                                        />
                                                    ) : <div className="w-9 flex-shrink-0" />}
                                                </div>
                                            );
                                        },
                                    }}
                                />
                            </div>
                        </div>

                        {/* Villa Location Map */}
                        {villa.maps_url && (
                            <div id="location-section" className="space-y-6 pb-8 border-b border-slate-200/80 scroll-mt-32">
                                <h3 className="text-xl font-bold text-slate-900">Lokasi Properti</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                    {/* Left Column: Neighborhood Description & Details */}
                                    <div className="space-y-4">
                                        <h4 className="text-base font-bold text-slate-850 flex items-center gap-2">
                                            <MapPin className="w-5 h-5 text-blue-600" />
                                            <span>{villa.location}</span>
                                        </h4>
                                        <div className="text-slate-600 text-sm font-medium leading-relaxed">
                                            <p className={isNeighborhoodExpanded ? '' : 'line-clamp-4'}>
                                                {neighborhoodDesc}
                                            </p>
                                            {neighborhoodDesc.length > 180 && (
                                                <button 
                                                    onClick={() => setIsNeighborhoodExpanded(!isNeighborhoodExpanded)}
                                                    className="text-slate-900 hover:text-blue-600 font-bold underline mt-2 flex items-center gap-1 cursor-pointer active:scale-95 transition-all text-xs"
                                                >
                                                    <span>{isNeighborhoodExpanded ? 'Sembunyikan' : 'Baca selengkapnya'}</span>
                                                    <ArrowRight className={`w-3.5 h-3.5 transform transition-transform ${isNeighborhoodExpanded ? '-rotate-90' : ''}`} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Column: Map Frame */}
                                    <div className="aspect-[4/3] sm:aspect-[16/10] md:aspect-square lg:aspect-[4/3] w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                                        <iframe 
                                            src={villa.maps_url} 
                                            width="100%" 
                                            height="100%" 
                                            style={{ border: 0 }} 
                                            allowFullScreen={false} 
                                            loading="lazy" 
                                            referrerPolicy="no-referrer-when-downgrade"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Things to Know */}
                        <div className="space-y-6 py-8 border-b border-slate-200/80">
                            <h3 className="text-xl font-bold text-slate-900">Hal yang perlu diketahui</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-[14px]">
                                {/* Column 1: Aturan Rumah */}
                                <div className="space-y-3">
                                    <h4 className="font-bold text-slate-900">Aturan rumah</h4>
                                    <div className="space-y-2.5 text-slate-600 font-medium leading-relaxed">
                                        {villa.rules ? (
                                            villa.rules.split('\n').map((rule: string, idx: number) => (
                                                <div key={idx} className="flex items-start space-x-2">
                                                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span>{rule}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <>
                                                <div className="flex items-start space-x-2">
                                                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span>Check-in setelah pukul {villa.check_in_time || '14:00'}</span>
                                                </div>
                                                <div className="flex items-start space-x-2">
                                                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span>Check-out sebelum pukul {villa.check_out_time || '12:00'}</span>
                                                </div>
                                                <div className="flex items-start space-x-2">
                                                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span>Maks. {villa.max_guests} tamu</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Column 2: Keamanan & Properti */}
                                <div className="space-y-3">
                                    <h4 className="font-bold text-slate-900">Keamanan & properti</h4>
                                    <div className="space-y-2.5 text-slate-600 font-medium leading-relaxed">
                                        {safetyList.map((safety: string, idx: number) => {
                                            const isNotReported = safety.toLowerCase().includes('tidak dilaporkan') || safety.toLowerCase().includes('tidak ada');
                                            return (
                                                <div key={idx} className="flex items-start space-x-2">
                                                    {isNotReported ? (
                                                        <X className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                                    ) : (
                                                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                    )}
                                                    <span>{safety}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Column 3: Kebijakan Pembatalan */}
                                <div className="space-y-3">
                                    <h4 className="font-bold text-slate-900">Kebijakan pembatalan</h4>
                                    <p className="text-slate-600 font-medium leading-relaxed">
                                        {cancellationPolicy}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div id="ulasan-section" className="space-y-6 scroll-mt-32">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                                    Ulasan Tamu
                                </h3>
                                <div className="flex items-center text-[15px] font-bold text-slate-900">
                                    <Star className="w-4 h-4 fill-slate-900 text-slate-900 mr-1 shrink-0" />
                                    <span>{avgRating > 0 ? avgRating.toFixed(1).replace('.', ',') : '5,0'}</span>
                                    <span className="mx-1.5 text-slate-400 font-normal">·</span>
                                    <span className="text-slate-500 font-medium">{reviews.length} ulasan</span>
                                </div>
                            </div>
                            
                            {/* Ratings Breakdown Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                                {[
                                    { label: 'Kebersihan', score: 4.9 },
                                    { label: 'Akurasi', score: 5.0 },
                                    { label: 'Komunikasi', score: 4.9 },
                                    { label: 'Check-in', score: 5.0 },
                                    { label: 'Lokasi', score: 4.8 },
                                    { label: 'Nilai Harga', score: 4.7 }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-[13px] font-bold">
                                        <span className="text-slate-600 font-semibold">{item.label}</span>
                                        <div className="flex items-center space-x-3 w-1/2">
                                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(item.score / 5) * 100}%` }} />
                                            </div>
                                            <span className="text-slate-800 text-[11px] w-6 text-right font-sans">{item.score.toFixed(1)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Keyword Tags pills */}
                            {reviews.length > 0 && (
                                <div className="space-y-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Kategori Ulasan</span>
                                    <div className="flex flex-wrap gap-2 py-1">
                                        {getKeywordTagCounts().map((tag, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setSelectedReviewTag(tag.label);
                                                    setIsReviewsModalOpen(true);
                                                }}
                                                className="bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold py-1.5 px-3 rounded-full border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
                                            >
                                                <span>{tag.label}</span>
                                                <span className="text-[10px] text-slate-400 font-normal">({tag.count})</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {reviews.length === 0 ? (
                                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center text-sm font-semibold text-slate-500">
                                    Belum ada ulasan untuk villa ini. Jadilah tamu pertama yang memberikan ulasan!
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                        {reviews.slice(0, 6).map((review) => (
                                            <div key={review.id} className="flex flex-col justify-between">
                                                <div className="space-y-2.5">
                                                    <div className="flex items-center space-x-3.5">
                                                        {review.guest_avatar ? (
                                                            <img 
                                                                src={review.guest_avatar} 
                                                                alt={review.guest_name} 
                                                                className="w-10 h-10 rounded-full object-cover shadow-xs"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs shadow-xs">
                                                                {review.guest_name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 text-[15px] leading-snug">{review.guest_name}</h4>
                                                            <p className="text-[12px] text-slate-500 font-normal mt-0.5">
                                                                {review.guest_subtitle || `Menginap pada ${format(parseISO(review.created_at), 'MMMM yyyy', { locale: localeID })}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center text-slate-900 text-[11px] font-bold space-x-1.5 pl-0.5">
                                                        <div className="flex items-center text-amber-500 space-x-0.5">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star 
                                                                    key={i} 
                                                                    className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-slate-400 font-normal">·</span>
                                                        <span>{format(parseISO(review.created_at), 'dd MMM yyyy', { locale: localeID })}</span>
                                                    </div>
                                                    
                                                    <p className="text-slate-700 text-[14px] leading-relaxed line-clamp-3 pl-0.5 font-normal">
                                                        {review.comment}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {reviews.length > 6 && (
                                        <button
                                            onClick={() => {
                                                setSelectedReviewTag(null);
                                                setIsReviewsModalOpen(true);
                                            }}
                                            className="border border-slate-900 hover:bg-slate-50 text-slate-900 text-[15px] font-bold px-6 py-3 rounded-xl transition-all cursor-pointer mt-4 active:scale-95 duration-100 inline-block"
                                        >
                                            Tampilkan ke-{reviews.length} ulasan
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Right Column (Sticky Booking Widget) */}
                    <aside className="lg:col-span-1">
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl sticky top-28 space-y-5">
                            {/* Pricing header details */}
                            <div>
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                    <span className="text-[22px] font-bold text-slate-900 font-sans tracking-tight">
                                        Rp {totalNights > 0 ? totalAmount.toLocaleString('id-ID') : Number(villa.price_per_night).toLocaleString('id-ID')}
                                    </span>
                                    <span className="text-sm text-slate-500 font-normal">
                                        {totalNights > 0 ? `untuk ${totalNights} malam` : 'untuk 1 malam'}
                                    </span>
                                </div>
                            </div>

                            {/* Date & Guest Input Form Box */}
                            <div className="border border-slate-300 rounded-2xl overflow-hidden divide-y divide-slate-200">
                                <div className="grid grid-cols-2 divide-x divide-slate-200">
                                    <div 
                                        onClick={() => scrollToSection('calendar')}
                                        className="p-3 hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        <label className="text-[9px] font-black text-slate-700 block tracking-wider">CHECK-IN</label>
                                        <span className="text-xs font-semibold text-slate-900">
                                            {storeCheckIn ? format(parseISO(storeCheckIn), 'd/M/yyyy') : 'Tambah tanggal'}
                                        </span>
                                    </div>
                                    <div 
                                        onClick={() => scrollToSection('calendar')}
                                        className="p-3 hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        <label className="text-[9px] font-black text-slate-700 block tracking-wider">CHECK-OUT</label>
                                        <span className="text-xs font-semibold text-slate-900">
                                            {storeCheckOut ? format(parseISO(storeCheckOut), 'd/M/yyyy') : 'Tambah tanggal'}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 hover:bg-slate-50 transition-colors">
                                    <label className="text-[9px] font-black text-slate-700 block tracking-wider">TAMU</label>
                                    <select 
                                        value={storeNumGuests}
                                        onChange={(e) => setNumGuests(Number(e.target.value))}
                                        className="w-full bg-transparent border-0 p-0 text-xs font-bold text-slate-800 focus:ring-0 focus:outline-none mt-0.5 cursor-pointer"
                                    >
                                        {[...Array(villa.max_guests)].map((_, i) => (
                                            <option key={i} value={i + 1}>{i + 1} tamu</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {villa.min_nights > 1 && (
                                <div className="text-[11px] text-slate-500 font-medium text-center -mt-1">
                                    Minimum menginap {villa.min_nights} malam
                                </div>
                            )}

                            {/* Submit booking button */}
                            <button
                                onClick={handleBookingSubmit}
                                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] active:translate-y-[1px] text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 text-base font-semibold cursor-pointer"
                            >
                                <span>Pesan</span>
                            </button>

                            {/* Price Breakdown Calculations */}
                            {totalNights > 0 && (
                                <div className="border-t border-slate-100 pt-4 space-y-3 text-xs font-bold">
                                    <div className="flex justify-between text-slate-500 font-semibold">
                                        <span className="underline">Weekday sewa (Rp {priceBreakdown.weekdays.price.toLocaleString('id-ID')} x {priceBreakdown.weekdays.count} malam)</span>
                                        <span className="font-sans">Rp {priceBreakdown.weekdays.total.toLocaleString('id-ID')}</span>
                                    </div>
                                    {priceBreakdown.weekends.count > 0 && (
                                        <div className="flex justify-between text-slate-500 font-semibold">
                                            <span className="underline">Weekend sewa (Rp {priceBreakdown.weekends.price.toLocaleString('id-ID')} x {priceBreakdown.weekends.count} malam)</span>
                                            <span className="font-sans">Rp {priceBreakdown.weekends.total.toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                    {isRefundable && (
                                        <div className="flex justify-between text-slate-500 font-semibold">
                                            <span className="underline">Pilihan tarif (Bisa dikembalikan +{((villa.refundable_surcharge_rate || 0.1111) * 100).toFixed(1)}%)</span>
                                            <span className="font-sans text-blue-600">+Rp {Math.round((priceBreakdown.weekdays.total + priceBreakdown.weekends.total) * (villa.refundable_surcharge_rate || 0.1111)).toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-slate-500 font-semibold">
                                        <span className="underline">Biaya Kebersihan</span>
                                        {villa.cleaning_fee && villa.cleaning_fee > 0 ? (
                                            <span className="font-sans">Rp {villa.cleaning_fee.toLocaleString('id-ID')}</span>
                                        ) : (
                                            <span className="text-emerald-600">Gratis</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between text-slate-500 font-semibold">
                                        <span className="underline">Biaya Pelayanan</span>
                                        <span className="text-emerald-600">Gratis</span>
                                    </div>
                                    <div className="flex justify-between font-black text-slate-900 border-t border-slate-100 pt-4 text-sm">
                                        <span>Total sebelum pajak</span>
                                        <span className="text-blue-600 font-sans">Rp {totalAmount.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </main>

            {/* Sticky Mobile Booking Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-45 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 flex items-center justify-between lg:hidden shadow-2xl">
                <div>
                    <div className="text-xs font-black text-slate-900 font-sans">
                        <span className="text-base text-slate-900 font-black block">
                            Rp {totalAmount.toLocaleString('id-ID')}
                            <span className="text-[10px] text-slate-500 font-normal ml-1">total</span>
                        </span>
                        <span className="text-[9px] text-blue-600 font-extrabold uppercase tracking-wider block mt-0.5">
                            {isRefundable ? 'Bisa dikembalikan' : 'Tanpa pengembalian dana'}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleBookingSubmit}
                    className="bg-blue-600 hover:bg-blue-700 active:scale-[0.98] active:translate-y-[1px] text-white font-bold px-6 py-3 rounded-xl shadow-md text-sm transition-all cursor-pointer"
                >
                    Pesan
                </button>
            </div>

            {/* Photo Lightbox Modal */}
            {isLightboxOpen && (
                <div className="fixed inset-0 z-55 bg-black/95 flex flex-col justify-between p-4 sm:p-8 animate-fadeIn">
                    <div className="flex items-center justify-between text-white">
                        <span className="text-xs font-bold uppercase tracking-wider">
                            Foto {currentImageIndex + 1} dari {photos.length}
                        </span>
                        <button 
                            onClick={() => setIsLightboxOpen(false)}
                            className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors text-white cursor-pointer active:scale-90"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 flex items-center justify-center py-4">
                        <img 
                            src={getPhotoUrl(photos[currentImageIndex])} 
                            alt="Lightbox view" 
                            className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
                        />
                    </div>

                    {/* Lightbox thumbnails */}
                    <div className="flex justify-center space-x-2 overflow-x-auto max-w-2xl mx-auto pb-4 scrollbar-none">
                        {photos.map((ph, idx) => (
                            <img 
                                key={idx}
                                src={getPhotoUrl(ph)}
                                alt="Thumb"
                                onClick={() => setCurrentImageIndex(idx)}
                                className={`w-16 h-12 object-cover rounded-lg cursor-pointer border-2 transition-all ${
                                    idx === currentImageIndex ? 'border-blue-600 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-85'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Amenities Full Modal */}
            {isAmenitiesModalOpen && (
                <div className="fixed inset-0 z-55 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-8 animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 animate-scaleIn">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900">Fasilitas yang ditawarkan</h3>
                            <button 
                                onClick={() => setIsAmenitiesModalOpen(false)}
                                className="bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors text-slate-700 cursor-pointer active:scale-90"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-2">
                            {(villa.amenities || []).map((amenity, idx) => {
                                const IconComponent = amenityIconMap[amenity.name] || Check;
                                return (
                                    <div key={idx} className="flex items-center space-x-3.5 text-[15px] text-slate-800 font-normal border-b border-slate-100 pb-3">
                                        <IconComponent className="w-5 h-5 text-slate-700 shrink-0" strokeWidth={1.5} />
                                        <span>{amenity.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Reviews Full Modal */}
            {isReviewsModalOpen && (
                <div className="fixed inset-0 z-55 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
                    <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 p-6">
                            <div className="flex items-center space-x-2 text-slate-900">
                                <Star className="w-5 h-5 fill-slate-950 text-slate-950" />
                                <span className="text-lg font-bold">
                                    {avgRating > 0 ? avgRating.toFixed(1).replace('.', ',') : '5,0'} · {reviews.length} ulasan
                                </span>
                            </div>
                            <button 
                                onClick={() => {
                                    setIsReviewsModalOpen(false);
                                    setReviewSearchQuery('');
                                    setSelectedReviewTag(null);
                                }}
                                className="bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors text-slate-700 cursor-pointer active:scale-90"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body Grid split */}
                        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3">
                            {/* Left Side: Search, Filters & Sorting */}
                            <div className="lg:col-span-1 border-r border-slate-100 p-6 space-y-6 overflow-y-auto bg-slate-50/50">
                                {/* Search Bar */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Cari ulasan</label>
                                    <div className="relative">
                                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                        <input 
                                            type="text"
                                            placeholder="Cari kata kunci (misal: bersih, ac)"
                                            value={reviewSearchQuery}
                                            onChange={(e) => setReviewSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none text-slate-800 bg-white"
                                        />
                                        {reviewSearchQuery && (
                                            <button 
                                                onClick={() => setReviewSearchQuery('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Category Pills */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Kategori Terpopuler</label>
                                    <div className="flex flex-wrap gap-2">
                                        {getKeywordTagCounts().map((tag, idx) => {
                                            const isSelected = selectedReviewTag === tag.label;
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedReviewTag(isSelected ? null : tag.label)}
                                                    className={`text-xs font-semibold py-1.5 px-3 rounded-full border transition-all cursor-pointer ${
                                                        isSelected 
                                                            ? 'bg-slate-900 border-slate-900 text-white' 
                                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {tag.label} ({tag.count})
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Sorting selector */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Urutkan Berdasarkan</label>
                                    <select
                                        value={reviewSortOrder}
                                        onChange={(e) => setReviewSortOrder(e.target.value)}
                                        className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-sm font-semibold text-slate-800 focus:ring-1 focus:ring-blue-600 focus:outline-none cursor-pointer"
                                    >
                                        <option value="relevance">Relevansi</option>
                                        <option value="newest">Terbaru</option>
                                        <option value="highest">Peringkat Tertinggi</option>
                                        <option value="lowest">Peringkat Terendah</option>
                                    </select>
                                </div>
                            </div>

                            {/* Right Side: Scrollable Reviews List */}
                            <div className="lg:col-span-2 p-6 overflow-y-auto space-y-6">
                                {getFilteredAndSortedReviews().length === 0 ? (
                                    <div className="text-center py-20 text-slate-400 font-semibold text-sm">
                                        Tidak ada ulasan yang cocok dengan pencarian Anda.
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {getFilteredAndSortedReviews().map((review) => (
                                            <div key={review.id} className="border-b border-slate-100 pb-6 last:border-0">
                                                <div className="flex items-center space-x-3.5 mb-3">
                                                    {review.guest_avatar ? (
                                                        <img 
                                                            src={review.guest_avatar} 
                                                            alt={review.guest_name} 
                                                            className="w-10 h-10 rounded-full object-cover shadow-xs"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs shadow-xs">
                                                            {review.guest_name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-[15px] leading-snug">{review.guest_name}</h4>
                                                        <p className="text-[12px] text-slate-500 font-normal mt-0.5">
                                                            {review.guest_subtitle || `Menginap pada ${format(parseISO(review.created_at), 'MMMM yyyy', { locale: localeID })}`}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center text-slate-900 text-[11px] font-bold space-x-1.5 pl-0.5 mb-2.5">
                                                    <div className="flex items-center text-amber-500 space-x-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star 
                                                                key={i} 
                                                                className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-slate-400 font-normal">·</span>
                                                    <span>{format(parseISO(review.created_at), 'dd MMMM yyyy', { locale: localeID })}</span>
                                                </div>

                                                <p className="text-slate-700 text-sm leading-relaxed pl-0.5 font-normal whitespace-pre-line">
                                                    {review.comment}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
