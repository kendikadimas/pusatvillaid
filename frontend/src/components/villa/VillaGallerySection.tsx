'use client';

import React from 'react';
import { X } from 'lucide-react';
import { getPhotoUrl, getPhotoDesc } from '@/lib/villaUtils';

interface VillaGallerySectionProps {
    photos: Array<string | { url: string; description: string; category?: string }>;
    villaName: string;
}

export default function VillaGallerySection({ photos, villaName }: VillaGallerySectionProps) {
    const mainPhoto = getPhotoUrl(photos[0]);
    const thumbPhotos = photos.slice(1, 5);
    const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

    return (
        <>
            <div className="relative mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-2xl overflow-hidden bg-white">
                    <div 
                        onClick={() => { setCurrentImageIndex(0); setIsLightboxOpen(true); }}
                        className="md:col-span-2 aspect-[4/3] overflow-hidden rounded-l-2xl cursor-pointer relative group"
                    >
                        <img src={mainPhoto} alt={villaName} className="w-full h-full object-cover group-hover:brightness-90 transition duration-300" />
                        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                    </div>

                    <div className="md:col-span-2 grid grid-cols-2 gap-3 h-full" style={{ gridTemplateRows: 'repeat(2, minmax(0, 1fr))' }}>
                        {thumbPhotos.map((photo, i) => {
                            let cornerClass = "";
                            if (i === 1) cornerClass = "md:rounded-tr-2xl";
                            if (i === 3) cornerClass = "md:rounded-br-2xl";
                            return (
                                <div key={i} onClick={() => { setCurrentImageIndex(i + 1); setIsLightboxOpen(true); }} className={`overflow-hidden cursor-pointer relative group min-h-0 ${cornerClass}`}>
                                    <img src={getPhotoUrl(photo)} alt={getPhotoDesc(photo) || `Thumbnail ${i}`} className="w-full h-full object-cover group-hover:brightness-90 transition duration-300" />
                                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                                </div>
                            );
                        })}
                        {[...Array(Math.max(0, 4 - thumbPhotos.length))].map((_, idx) => (
                            <div key={`empty-${idx}`} className="bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center min-h-0">
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">PusatVilla.id</span>
                            </div>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={() => { setCurrentImageIndex(0); setIsLightboxOpen(true); }}
                    className="absolute bottom-5 right-5 bg-white hover:bg-slate-50 text-slate-900 text-[13px] font-semibold px-4 py-2 rounded-xl border border-slate-200 shadow-md transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
                >
                    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-3.5 h-3.5 fill-slate-900"><path d="M5 2a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3H5zm0 1h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM4 6.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm5 3.707a1 1 0 0 1-1.414 0L6 8.621l-2.086 2.086A1 1 0 0 1 2.5 10v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9.5l-3.5.707zm-1.5-1.5L9 7.207a1 1 0 0 1-1.414 0L13 9.793V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2.793l2.5-2.5a1 1 0 0 1 1.414 0z"></path></svg>
                    <span>Tampilkan semua foto</span>
                </button>
            </div>

            {/* Photo Lightbox Modal */}
            {isLightboxOpen && (
                <div className="fixed inset-0 z-55 bg-black/95 flex flex-col justify-between p-4 sm:p-8 animate-fadeIn">
                    <div className="flex items-center justify-between text-white">
                        <span className="text-xs font-bold uppercase tracking-wider">Foto {currentImageIndex + 1} dari {photos.length}</span>
                        <button onClick={() => setIsLightboxOpen(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors text-white cursor-pointer active:scale-90">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center py-4 space-y-4">
                        <img src={getPhotoUrl(photos[currentImageIndex])} alt={getPhotoDesc(photos[currentImageIndex]) || "Lightbox"} className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl" />
                        {getPhotoDesc(photos[currentImageIndex]) && (
                            <p className="text-white text-xs sm:text-sm bg-black/50 border border-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl text-center max-w-xl font-semibold leading-relaxed shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                                {getPhotoDesc(photos[currentImageIndex])}
                            </p>
                        )}
                    </div>
                    <div className="flex justify-center space-x-2 overflow-x-auto max-w-2xl mx-auto pb-4 scrollbar-none">
                        {photos.map((ph, idx) => (
                            <img key={idx} src={getPhotoUrl(ph)} alt="Thumb" onClick={() => setCurrentImageIndex(idx)} className={`w-16 h-12 object-cover rounded-lg cursor-pointer border-2 transition-all ${idx === currentImageIndex ? 'border-blue-500 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-85'}`} />
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
