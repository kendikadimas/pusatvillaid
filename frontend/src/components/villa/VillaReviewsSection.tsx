'use client';

import React from 'react';
import { Star, Search, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import type { Review } from '@/types';

interface VillaReviewsSectionProps {
    reviews: Review[];
    avgRating: number;
}

export default function VillaReviewsSection({ reviews, avgRating }: VillaReviewsSectionProps) {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
    const [sortOrder, setSortOrder] = React.useState('relevance');

    const getKeywordTagCounts = () => {
        const tags = [
            { label: 'Kolam renang', keywords: ['kolam', 'renang', 'pool'] },
            { label: 'Lokasi', keywords: ['lokasi', 'location', 'tempat'] },
            { label: 'AC', keywords: ['ac', 'pendingin'] },
            { label: 'Area terdekat', keywords: ['dekat', 'sekitar', 'terdekat'] },
            { label: 'Kenyamanan', keywords: ['nyaman', 'comfort', 'tenang'] },
            { label: 'Kebersihan', keywords: ['bersih', 'clean', 'segar'] },
            { label: 'Keramahtamahan', keywords: ['ramah', 'host', 'bobby', 'pelayanan'] },
        ];
        return tags.map(tag => ({
            label: tag.label,
            count: reviews.filter(r => tag.keywords.some(kw => (r.comment || '').toLowerCase().includes(kw))).length,
        })).filter(t => t.count > 0);
    };

    const getFilteredReviews = () => {
        let list = [...reviews];

        if (selectedTag) {
            const tagMap: Record<string, string[]> = {
                'Kolam renang': ['kolam', 'renang', 'pool'],
                'Lokasi': ['lokasi', 'location', 'tempat'],
                'AC': ['ac', 'pendingin'],
                'Area terdekat': ['dekat', 'sekitar', 'terdekat'],
                'Kenyamanan': ['nyaman', 'comfort', 'tenang'],
                'Kebersihan': ['bersih', 'clean', 'segar'],
                'Keramahtamahan': ['ramah', 'host', 'bobby', 'pelayanan'],
            };
            const kws = tagMap[selectedTag] || [];
            list = list.filter(r => kws.some(kw => (r.comment || '').toLowerCase().includes(kw)));
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(r => (r.comment || '').toLowerCase().includes(q) || (r.guest_name || '').toLowerCase().includes(q));
        }

        if (sortOrder === 'newest') list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        else if (sortOrder === 'highest') list.sort((a, b) => b.rating - a.rating);
        else if (sortOrder === 'lowest') list.sort((a, b) => a.rating - b.rating);

        return list;
    };

    const displayReviews = getFilteredReviews().slice(0, 6);

    return (
        <>
            <div id="ulasan-section" className="space-y-6 pb-6 border-b border-slate-200/80 scroll-mt-32">
                {reviews.length > 0 ? (
                    <div className="space-y-6">
                        <div className="flex items-center space-x-2">
                            <Star className="w-5 h-5 fill-slate-950 text-slate-950" />
                            <h3 className="text-lg md:text-xl font-bold text-slate-900">{avgRating > 0 ? avgRating.toFixed(1).replace('.', ',') : '5,0'} · {reviews.length} ulasan</h3>
                        </div>

                        <div className="space-y-6">
                            {displayReviews.map((review) => (
                                <div key={review.id} className="border-b border-slate-100 pb-6 last:border-0">
                                    <div className="flex items-start space-x-3">
                                        <img src={review.guest_avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(review.guest_name)} alt={review.guest_name} className="w-10 h-10 rounded-full object-cover border border-slate-100" />
                                        <div className="flex-1 space-y-1.5">
                                            <div>
                                                <h5 className="text-[14px] font-bold text-slate-900">{review.guest_name}</h5>
                                                {review.guest_subtitle && <p className="text-[12px] text-slate-500 font-normal mt-0.5">{review.guest_subtitle}</p>}
                                            </div>
                                            <div className="flex items-center text-slate-900 text-[11px] font-bold space-x-1.5">
                                                <div className="flex items-center text-amber-500 space-x-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                                    ))}
                                                </div>
                                                <span className="text-slate-400 font-normal">·</span>
                                                <span>{format(parseISO(review.created_at), 'dd MMM yyyy', { locale: localeID })}</span>
                                            </div>
                                            <p className="text-slate-700 text-[14px] leading-relaxed line-clamp-3 font-normal">{review.comment}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {reviews.length > 6 && (
                            <button onClick={() => { setSelectedTag(null); setIsModalOpen(true); }} className="border border-slate-900 hover:bg-slate-50 text-slate-900 text-[15px] font-bold px-6 py-3 rounded-xl transition-all cursor-pointer mt-4 active:scale-95">
                                Tampilkan ke-{reviews.length} ulasan
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-slate-500 text-sm font-medium">Belum ada ulasan untuk villa ini. Jadilah tamu pertama yang memberikan ulasan!</p>
                    </div>
                )}
            </div>

            {/* Reviews Full Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-55 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
                    <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-100 p-6">
                            <div className="flex items-center space-x-2 text-slate-900">
                                <Star className="w-5 h-5 fill-slate-950 text-slate-950" />
                                <span className="text-lg font-bold">{avgRating > 0 ? avgRating.toFixed(1).replace('.', ',') : '5,0'} · {reviews.length} ulasan</span>
                            </div>
                            <button onClick={() => { setIsModalOpen(false); setSearchQuery(''); setSelectedTag(null); }} className="bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors text-slate-700 cursor-pointer active:scale-90">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3">
                            <div className="lg:col-span-1 border-r border-slate-100 p-6 space-y-6 overflow-y-auto bg-slate-50/50">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Cari ulasan</label>
                                    <div className="relative">
                                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                        <input type="text" placeholder="Cari kata kunci" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 bg-white" />
                                        {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Kategori Terpopuler</label>
                                    <div className="flex flex-wrap gap-2">
                                        {getKeywordTagCounts().map((tag) => {
                                            const isSelected = selectedTag === tag.label;
                                            return (
                                                <button key={tag.label} onClick={() => setSelectedTag(isSelected ? null : tag.label)} className={`text-xs font-semibold py-1.5 px-3 rounded-full border transition-all cursor-pointer ${isSelected ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                                                    {tag.label} ({tag.count})
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Urutkan</label>
                                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-sm font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer">
                                        <option value="relevance">Relevansi</option>
                                        <option value="newest">Terbaru</option>
                                        <option value="highest">Peringkat Tertinggi</option>
                                        <option value="lowest">Peringkat Terendah</option>
                                    </select>
                                </div>
                            </div>
                            <div className="lg:col-span-2 p-6 overflow-y-auto space-y-6">
                                {getFilteredReviews().map((review) => (
                                    <div key={review.id} className="border-b border-slate-100 pb-6 last:border-0">
                                        <div className="flex items-start space-x-3">
                                            <img src={review.guest_avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(review.guest_name)} alt={review.guest_name} className="w-10 h-10 rounded-full object-cover border border-slate-100" />
                                            <div className="flex-1 space-y-1.5">
                                                <h5 className="text-[14px] font-bold text-slate-900">{review.guest_name}</h5>
                                                <div className="flex items-center text-amber-500 space-x-0.5">
                                                    {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}
                                                    <span className="text-slate-400 text-xs ml-1">{format(parseISO(review.created_at), 'dd MMM yyyy', { locale: localeID })}</span>
                                                </div>
                                                <p className="text-slate-700 text-[14px] leading-relaxed font-normal">{review.comment}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
