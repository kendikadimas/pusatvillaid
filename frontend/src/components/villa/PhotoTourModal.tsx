'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Share2, Heart, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPhotoUrl, getPhotoCategory, getPhotoDesc } from '@/lib/villaUtils';

interface PhotoTourModalProps {
    isOpen: boolean;
    onClose: () => void;
    photos: Array<string | { url: string; description: string; category?: string }>;
    villaName: string;
    isSaved?: boolean;
    onShare?: () => void;
    onToggleSave?: () => void;
    initialPhotoIndex?: number;
}

// Canonical category order
const CATEGORY_ORDER = [
    'Ruang tamu',
    'Kamar tidur',
    'Kamar mandi',
    'Dapur',
    'Kolam renang',
    'Luar ruangan',
    'Lainnya',
];

function groupPhotosByCategory(
    photos: Array<string | { url: string; description: string; category?: string }>
): Array<{ category: string; photos: Array<{ item: typeof photos[number]; globalIndex: number }> }> {
    const map = new Map<string, Array<{ item: typeof photos[number]; globalIndex: number }>>();

    photos.forEach((ph, index) => {
        const cat = getPhotoCategory(ph);
        if (!map.has(cat)) map.set(cat, []);
        map.get(cat)!.push({ item: ph, globalIndex: index });
    });

    // Sort by canonical order, then alphabetically for unknowns
    const sorted = [...map.entries()].sort(([a], [b]) => {
        const ai = CATEGORY_ORDER.indexOf(a);
        const bi = CATEGORY_ORDER.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
    });

    return sorted.map(([category, photos]) => ({ category, photos }));
}

export default function PhotoTourModal({
    isOpen,
    onClose,
    photos,
    villaName,
    isSaved = false,
    onShare,
    onToggleSave,
    initialPhotoIndex = 0,
}: PhotoTourModalProps) {
    const [activeCategory, setActiveCategory] = useState<string>('');
    const [mounted, setMounted] = useState(false);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
    const galleryRef = useRef<HTMLDivElement>(null);
    const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
    const thumbnailRefs = useRef<Map<number, HTMLImageElement>>(new Map());

    const groups = groupPhotosByCategory(photos);

    useEffect(() => setMounted(true), []);

    // Keyboard navigation for lightbox
    useEffect(() => {
        if (selectedPhotoIndex === null) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                setSelectedPhotoIndex((prev) => (prev !== null ? (prev + 1) % photos.length : null));
            } else if (e.key === 'ArrowLeft') {
                setSelectedPhotoIndex((prev) => (prev !== null ? (prev - 1 + photos.length) % photos.length : null));
            } else if (e.key === 'Escape') {
                e.stopPropagation(); // prevent closing the main tour modal
                setSelectedPhotoIndex(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [selectedPhotoIndex, photos.length]);

    // Lock body scroll when open
    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [isOpen]);

    // Set initial category and scroll on open
    useEffect(() => {
        if (isOpen && groups.length > 0) {
            const initialPhoto = photos[initialPhotoIndex];
            const initialCategory = initialPhoto ? getPhotoCategory(initialPhoto) : groups[0].category;
            setActiveCategory(initialCategory);

            // Wait for DOM layout to complete and register refs
            const timer = setTimeout(() => {
                const el = sectionRefs.current.get(initialCategory);
                if (el && galleryRef.current) {
                    el.scrollIntoView({ block: 'start' });
                }
            }, 60);
            return () => clearTimeout(timer);
        }
    }, [isOpen, initialPhotoIndex, photos, groups.length]);

    // Keyboard close for main PhotoTourModal
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedPhotoIndex === null) onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, selectedPhotoIndex, onClose]);

    // IntersectionObserver: update active category as user scrolls
    useEffect(() => {
        if (!isOpen || !galleryRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                let best: IntersectionObserverEntry | null = null;
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        if (!best || entry.intersectionRatio > best.intersectionRatio) {
                            best = entry;
                        }
                    }
                });
                if (best) {
                    const cat = (best as IntersectionObserverEntry).target.getAttribute('data-category');
                    if (cat) setActiveCategory(cat);
                }
            },
            {
                root: galleryRef.current,
                threshold: [0.1, 0.25, 0.5],
                rootMargin: '-10% 0px -50% 0px',
            }
        );

        sectionRefs.current.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [isOpen, groups.length]);

    // Auto-scroll active thumbnail into view inside lightbox
    useEffect(() => {
        if (selectedPhotoIndex === null) return;
        const activeEl = thumbnailRefs.current.get(selectedPhotoIndex);
        if (activeEl) {
            activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [selectedPhotoIndex]);

    const scrollToCategory = useCallback((category: string) => {
        const el = sectionRefs.current.get(category);
        if (el && galleryRef.current) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label={`Tur foto ${villaName}`}
            className="fixed inset-0 z-[100] bg-white flex flex-col animate-fadeIn"
        >
            {/* ── Header ─────────────────────────────────────────────── */}
            <header className="flex-shrink-0 sticky top-0 z-10 bg-white border-b border-slate-100 px-5 h-[60px] flex items-center justify-between">
                <button
                    onClick={onClose}
                    aria-label="Tutup tur foto"
                    className="flex items-center space-x-2 text-slate-900 hover:text-slate-600 transition-colors cursor-pointer p-1 -ml-1 rounded-lg hover:bg-slate-100 active:scale-95"
                >
                    <ArrowLeft className="w-5 h-5" strokeWidth={2} />
                </button>

                <div className="flex items-center space-x-1">
                    {onShare && (
                        <button
                            onClick={onShare}
                            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer active:scale-95"
                        >
                            <Share2 className="w-4 h-4" strokeWidth={2} />
                            <span className="hidden sm:inline">Bagikan</span>
                        </button>
                    )}
                    {onToggleSave && (
                        <button
                            onClick={onToggleSave}
                            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer active:scale-95"
                        >
                            <Heart
                                className={`w-4 h-4 transition-colors ${
                                    isSaved ? 'fill-green-600 text-green-600' : 'text-slate-800'
                                }`}
                                strokeWidth={2}
                            />
                            <span className="hidden sm:inline">{isSaved ? 'Disimpan' : 'Simpan'}</span>
                        </button>
                    )}
                </div>
            </header>

            {/* ── Body: 2-column layout ──────────────────────────────── */}
            <div className="flex flex-1 min-h-0">
                {/* LEFT: Sticky nav (hidden on mobile) */}
                <nav
                    aria-label="Navigasi kategori foto"
                    className="hidden lg:flex flex-col flex-shrink-0 w-[280px] xl:w-[320px] sticky top-[60px] h-[calc(100vh-60px)] overflow-y-auto border-r border-slate-100 pt-10 pb-10 px-8"
                >
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">Tur Foto</p>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug mb-8 line-clamp-3">
                        {villaName}
                    </h1>

                    <ul className="space-y-1">
                        {groups.map(({ category, photos: catPhotos }) => (
                            <li key={category}>
                                <button
                                    onClick={() => scrollToCategory(category)}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
                                        activeCategory === category
                                            ? 'font-bold text-slate-900 bg-slate-100'
                                            : 'font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                    }`}
                                >
                                    <span>{category}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                        activeCategory === category ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-500 font-medium'
                                    }`}>
                                        {catPhotos.length}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* RIGHT: Scrollable photo grid */}
                <div
                    ref={galleryRef}
                    className="flex-1 overflow-y-auto bg-slate-50/50"
                >
                    {/* Mobile-only category chips */}
                    <div className="lg:hidden sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
                        {groups.map(({ category }) => (
                            <button
                                key={category}
                                onClick={() => scrollToCategory(category)}
                                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer active:scale-95 ${
                                    activeCategory === category
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Category thumbnail strip (top row, desktop only) */}
                    <div className="hidden lg:flex gap-4 px-10 pt-10 pb-2 overflow-x-auto scrollbar-hide">
                        {groups.map(({ category, photos: catPhotos }) => (
                            <button
                                key={category}
                                onClick={() => scrollToCategory(category)}
                                className="flex-shrink-0 flex flex-col items-start gap-1.5 cursor-pointer group"
                            >
                                <div className="w-28 h-16 overflow-hidden bg-slate-100 rounded-xl border border-slate-200 shadow-xs">
                                    <img
                                        src={getPhotoUrl(catPhotos[0].item)}
                                        alt={category}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                                <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 transition-colors">
                                    {category}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Photo sections */}
                    <div className="px-4 sm:px-8 lg:px-10 pb-20 pt-4 lg:pt-8 space-y-16">
                        {groups.map(({ category, photos: catPhotos }, groupIdx) => (
                            <section
                                key={category}
                                data-category={category}
                                ref={(el) => {
                                    if (el) sectionRefs.current.set(category, el);
                                    else sectionRefs.current.delete(category);
                                }}
                            >
                                {/* Section heading */}
                                <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 mb-4">{category}</h2>

                                {/* Grid display */}
                                {groupIdx === groups.length - 1 && catPhotos.length >= 2 ? (
                                    <AsymmetricGrid photos={catPhotos} category={category} onPhotoClick={setSelectedPhotoIndex} />
                                ) : (
                                    <StandardGrid photos={catPhotos} category={category} onPhotoClick={setSelectedPhotoIndex} />
                                )}
                            </section>
                        ))}
                    </div>
                </div>
            </div>

            {/* Lightbox Modal (pure solid dark overlay, z-[110] covers entire screen) */}
            {selectedPhotoIndex !== null && (
                <div 
                    className="fixed inset-0 z-[110] bg-slate-950 flex flex-col justify-between p-4 sm:p-8 animate-fadeIn text-white select-none"
                >
                    {/* Lightbox Header */}
                    <div className="flex items-center justify-between flex-shrink-0">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Foto {selectedPhotoIndex + 1} dari {photos.length}
                        </span>
                        <button
                            onClick={() => setSelectedPhotoIndex(null)}
                            className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors text-white cursor-pointer active:scale-90"
                            aria-label="Tutup detail foto"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Lightbox Main Section (Image + Navigation) */}
                    <div className="flex-1 flex items-center justify-between py-4 relative group min-h-0">
                        {/* Navigation: Left */}
                        <button
                            onClick={() => setSelectedPhotoIndex((prev) => (prev !== null ? (prev - 1 + photos.length) % photos.length : null))}
                            className="absolute left-2 sm:left-4 z-10 bg-black/40 hover:bg-black/60 p-3 rounded-full text-white/80 hover:text-white transition-all cursor-pointer active:scale-95 border border-white/5 backdrop-blur-sm"
                            aria-label="Foto sebelumnya"
                        >
                            <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
                        </button>

                        {/* Image + Description Container */}
                        <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-12 h-full min-h-0">
                            <div className="relative max-h-[62vh] sm:max-h-[66vh] max-w-full flex items-center justify-center rounded-xl overflow-hidden shadow-2xl bg-black/10">
                                <img
                                    src={getPhotoUrl(photos[selectedPhotoIndex])}
                                    alt={getPhotoDesc(photos[selectedPhotoIndex]) || "Lightbox"}
                                    className="max-h-[62vh] sm:max-h-[66vh] max-w-full object-contain animate-fadeIn duration-200"
                                />
                            </div>

                            {/* Description block */}
                            {getPhotoDesc(photos[selectedPhotoIndex]) && (
                                <p className="text-white text-xs sm:text-sm bg-black/50 border border-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl text-center max-w-xl font-semibold leading-relaxed shadow-xl animate-fadeInUp">
                                    {getPhotoDesc(photos[selectedPhotoIndex])}
                                </p>
                            )}
                        </div>

                        {/* Navigation: Right */}
                        <button
                            onClick={() => setSelectedPhotoIndex((prev) => (prev !== null ? (prev + 1) % photos.length : null))}
                            className="absolute right-2 sm:right-4 z-10 bg-black/40 hover:bg-black/60 p-3 rounded-full text-white/80 hover:text-white transition-all cursor-pointer active:scale-95 border border-white/5 backdrop-blur-sm"
                            aria-label="Foto berikutnya"
                        >
                            <ChevronRight className="w-6 h-6" strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Bottom Thumbnail Strip */}
                    <div className="flex-shrink-0 flex justify-center space-x-2 overflow-x-auto max-w-3xl mx-auto pb-4 scrollbar-none w-full px-4">
                        {photos.map((ph, idx) => (
                            <img
                                key={idx}
                                ref={(el) => {
                                    if (el) thumbnailRefs.current.set(idx, el);
                                    else thumbnailRefs.current.delete(idx);
                                }}
                                src={getPhotoUrl(ph)}
                                alt="Thumb"
                                onClick={() => setSelectedPhotoIndex(idx)}
                                className={`w-16 h-12 sm:w-20 sm:h-14 object-cover rounded-lg cursor-pointer border-2 transition-all flex-shrink-0 ${
                                    idx === selectedPhotoIndex
                                        ? 'border-green-500 scale-105 shadow-md brightness-100'
                                        : 'border-transparent opacity-60 hover:opacity-85 brightness-90'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
}

// ── Standard grid: 1 full-width + pairs of 2 below ────────────────────────────
function StandardGrid({
    photos,
    category,
    onPhotoClick,
}: {
    photos: Array<{ item: string | { url: string; description: string; category?: string }; globalIndex: number }>;
    category: string;
    onPhotoClick: (index: number) => void;
}) {
    const featured = photos[0];
    const rest = photos.slice(1);

    type Photo = typeof photos[number];
    const pairs: Photo[][] = [];
    for (let i = 0; i < rest.length; i += 2) {
        pairs.push(rest.slice(i, i + 2));
    }

    return (
        <div className="space-y-[8px]">
            {/* Featured full-width */}
            <div
                onClick={() => onPhotoClick(featured.globalIndex)}
                className="w-full overflow-hidden bg-slate-100 cursor-pointer relative group rounded-xl border border-slate-200/50"
            >
                <img
                    src={getPhotoUrl(featured.item)}
                    alt={category}
                    className="w-full aspect-video sm:aspect-[16/7] object-cover transition duration-300 group-hover:scale-[1.01] group-hover:brightness-95"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <span className="bg-white/90 text-slate-900 text-xs font-bold px-4 py-2 rounded-full shadow-md backdrop-blur-sm flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition duration-300">
                        Lihat Detail
                    </span>
                </div>
            </div>

            {/* Pairs */}
            {pairs.map((pair, i) => (
                <div key={i} className="grid grid-cols-2 gap-[8px]">
                    {pair.map((ph, j) => (
                        <div
                            key={j}
                            onClick={() => onPhotoClick(ph.globalIndex)}
                            className="overflow-hidden bg-slate-100 cursor-pointer relative group rounded-xl border border-slate-200/50"
                        >
                            <img
                                src={getPhotoUrl(ph.item)}
                                alt={category}
                                className="w-full aspect-[4/3] object-cover transition duration-300 group-hover:scale-[1.02] group-hover:brightness-95"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <span className="bg-white/90 text-slate-900 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm transform translate-y-2 group-hover:translate-y-0 transition duration-300">
                                    Lihat Detail
                                </span>
                            </div>
                        </div>
                    ))}
                    {pair.length === 1 && <div className="bg-slate-50 border border-slate-150 rounded-xl" />}
                </div>
            ))}
        </div>
    );
}

// ── Asymmetric grid: 1 tall left + stack of 3 right ───────────────────────────
function AsymmetricGrid({
    photos,
    category,
    onPhotoClick,
}: {
    photos: Array<{ item: string | { url: string; description: string; category?: string }; globalIndex: number }>;
    category: string;
    onPhotoClick: (index: number) => void;
}) {
    if (photos.length < 2) {
        return <StandardGrid photos={photos} category={category} onPhotoClick={onPhotoClick} />;
    }

    const leftPhoto = photos[0];
    const rightPhotos = photos.slice(1, 4); // up to 3 stacked
    const overflow = photos.slice(4);

    return (
        <div className="space-y-[8px]">
            <div className="flex gap-[8px]">
                {/* Left: tall portrait */}
                <div
                    onClick={() => onPhotoClick(leftPhoto.globalIndex)}
                    className="flex-[1.6] overflow-hidden bg-slate-100 cursor-pointer relative group rounded-xl border border-slate-200/50"
                >
                    <img
                        src={getPhotoUrl(leftPhoto.item)}
                        alt={category}
                        className="w-full h-full object-cover min-h-[300px] sm:min-h-[420px] transition duration-305 group-hover:scale-[1.01] group-hover:brightness-95"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <span className="bg-white/90 text-slate-900 text-xs font-bold px-4 py-2 rounded-full shadow-md backdrop-blur-sm transform translate-y-2 group-hover:translate-y-0 transition duration-300">
                            Lihat Detail
                        </span>
                    </div>
                </div>

                {/* Right: stack */}
                <div className="flex-1 flex flex-col gap-[8px]">
                    {rightPhotos.map((ph, i) => (
                        <div
                            key={i}
                            onClick={() => onPhotoClick(ph.globalIndex)}
                            className="flex-1 overflow-hidden bg-slate-100 cursor-pointer relative group rounded-xl border border-slate-200/50"
                        >
                            <img
                                src={getPhotoUrl(ph.item)}
                                alt={category}
                                className="w-full h-full object-cover transition duration-305 group-hover:scale-[1.01] group-hover:brightness-95"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <span className="bg-white/90 text-slate-900 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm transform translate-y-2 group-hover:translate-y-0 transition duration-300">
                                    Lihat Detail
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Overflow: standard pairs */}
            {overflow.length > 0 && (
                <StandardGrid photos={overflow} category={category} onPhotoClick={onPhotoClick} />
            )}
        </div>
    );
}
