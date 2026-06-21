'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Villa } from '@/types';
import Link from 'next/link';
import { getMainPhoto } from '@/lib/villaUtils';
import { formatPrice } from '@/lib/format';

// CartoDB Voyager tiles (clean, light, modern style matching Airbnb aesthetic)
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

interface MapComponentProps {
    villas: Villa[];
    hoveredVillaId: number | null;
    selectedVillaId: number | null;
    onHoverVilla: (id: number | null) => void;
    onSelectVilla: (id: number | null) => void;
    getCoordinates: (villa: Villa) => { lat: number; lng: number };
    wishlist: number[];
    toggleWishlist: (id: number, e: React.MouseEvent) => void;
}

// Function to generate the custom price icon
const createPriceIcon = (price: number, isActive: boolean) => {
    return L.divIcon({
        className: 'custom-map-price-icon',
        html: `
            <div class="px-2.5 py-1.5 rounded-lg text-[13px] font-bold shadow-md transition-all duration-200 cursor-pointer whitespace-nowrap text-center ${
                isActive 
                    ? 'bg-slate-900 border border-slate-900 text-white scale-105 shadow-lg z-50' 
                    : 'bg-white border border-slate-200/80 text-slate-900 hover:bg-slate-50'
            }">
                ${formatPrice(price)}
            </div>
        `,
        iconSize: [110, 32],
        iconAnchor: [55, 16]
    });
};

export default function MapComponent({
    villas,
    hoveredVillaId,
    selectedVillaId,
    onHoverVilla,
    onSelectVilla,
    getCoordinates,
    wishlist,
    toggleWishlist
}: MapComponentProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<Record<number, L.Marker>>({});
    
    // State to trigger re-renders when the map moves or zooms, so the React popup overlay moves with the map
    const [mapUpdateKey, setMapUpdateKey] = useState(0);

    // 1. Initialize Map Instance
    useEffect(() => {
        if (!mapContainerRef.current) return;

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView([-7.79558, 110.36949], 10);

        // Custom position for Zoom control
        L.control.zoom({
            position: 'bottomright'
        }).addTo(map);

        L.tileLayer(TILE_URL, {
            maxZoom: 20,
        }).addTo(map);

        // Map event listeners to update position key of the React overlay
        map.on('move zoom viewreset drag', () => {
            setMapUpdateKey(prev => prev + 1);
        });

        // Close selected villa card when clicking on the map background
        map.on('click', () => {
            onSelectVilla(null);
        });

        mapRef.current = map;

        // Force a map redraw on load to ensure containers are sized correctly
        setTimeout(() => {
            map.invalidateSize();
        }, 300);

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // 2. Sync Markers when Villas change
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        // Clear existing markers
        Object.values(markersRef.current).forEach(marker => marker.remove());
        markersRef.current = {};

        const markersList: L.Marker[] = [];

        villas.forEach(villa => {
            const { lat, lng } = getCoordinates(villa);
            
            const isCurrentActive = hoveredVillaId === villa.id || selectedVillaId === villa.id;
            const marker = L.marker([lat, lng], {
                icon: createPriceIcon(villa.price_per_night, isCurrentActive)
            });

            // Interaction listeners (No Leaflet popup binds, using custom React overlay instead)
            marker.on('mouseover', () => {
                onHoverVilla(villa.id);
            });
            
            marker.on('mouseout', () => {
                onHoverVilla(null);
            });

            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e); // Prevent map click event (which closes popup) from firing
                onSelectVilla(villa.id);
                map.setView([lat, lng], Math.max(map.getZoom(), 13));
            });

            marker.addTo(map);
            markersRef.current[villa.id] = marker;
            markersList.push(marker);
        });

        // Set bounds to show all markers beautifully
        if (markersList.length === 1) {
            map.setView(markersList[0].getLatLng(), 13);
        } else if (markersList.length > 0) {
            const bounds = L.latLngBounds(markersList.map(m => m.getLatLng()));
            map.fitBounds(bounds, { 
                padding: [50, 50],
                maxZoom: 14 
            });
        }
    }, [villas]);

    // 3. Highlight selected/hovered markers
    useEffect(() => {
        Object.entries(markersRef.current).forEach(([idStr, marker]) => {
            const id = parseInt(idStr);
            const villa = villas.find(v => v.id === id);
            if (!villa) return;

            const isHovered = hoveredVillaId === id;
            const isSelected = selectedVillaId === id;
            const isActive = isHovered || isSelected;

            marker.setIcon(createPriceIcon(villa.price_per_night, isActive));
            
            if (isActive) {
                marker.setZIndexOffset(1000);
            } else {
                marker.setZIndexOffset(0);
            }
        });
        
        // Force a re-render to update the overlay position on list click selection
        setMapUpdateKey(prev => prev + 1);
    }, [hoveredVillaId, selectedVillaId, villas]);

    // Calculate dynamic overlay card positioning
    const getCardStyle = (villa: Villa) => {
        const map = mapRef.current;
        if (!map || !mapContainerRef.current) return { display: 'none' };

        const { lat, lng } = getCoordinates(villa);
        
        // Convert LatLng to container point pixels
        const point = map.latLngToContainerPoint([lat, lng]);
        
        const cardWidth = 270;
        const cardHeight = 310;

        // Position horizontally centered
        let left = point.x - cardWidth / 2;
        
        // Position vertically above by default
        let top = point.y - cardHeight - 20;

        const containerWidth = mapContainerRef.current.clientWidth;
        const containerHeight = mapContainerRef.current.clientHeight;

        // 1. Keep card within left and right boundaries (with 10px margin)
        left = Math.max(10, Math.min(left, containerWidth - cardWidth - 10));

        // 2. If card top hits the upper boundary (near header), position it below the marker instead
        if (top < 15) {
            top = point.y + 20; // 20px below marker
        }

        return {
            position: 'absolute' as const,
            top: `${top}px`,
            left: `${left}px`,
            width: `${cardWidth}px`,
            zIndex: 1000,
            pointerEvents: 'auto' as const
        };
    };

    const selectedVilla = villas.find(v => v.id === selectedVillaId);

    return (
        <div className="w-full h-full relative overflow-hidden select-none">
            <div ref={mapContainerRef} className="w-full h-full z-0" />
            
            {/* Custom React Floating Card Overlay */}
            {selectedVilla && (
                <div 
                    style={getCardStyle(selectedVilla)}
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the card
                    className="bg-white rounded-[20px] shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col pointer-events-auto"
                >
                    {/* Image Area */}
                    <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-100 flex-none">
                        <img 
                            src={getMainPhoto(selectedVilla)} 
                            alt={selectedVilla.name} 
                            className="w-full h-full object-cover"
                        />
                        
                        {/* Close button */}
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSelectVilla(null);
                            }}
                            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 text-slate-700 shadow-md hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer z-20 flex items-center justify-center border border-slate-100"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Wishlist Heart Icon button side-by-side with close button */}
                        <button 
                            onClick={(e) => toggleWishlist(selectedVilla.id, e)}
                            className="absolute top-3 right-12 p-1.5 rounded-full bg-white/90 text-slate-700 shadow-md hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer z-20 flex items-center justify-center border border-slate-100"
                        >
                            <svg 
                                className={`w-3.5 h-3.5 transition-colors ${
                                    wishlist.includes(selectedVilla.id) ? 'text-rose-500 fill-rose-500' : 'text-slate-500 fill-none'
                                }`} 
                                viewBox="0 0 24 24" 
                                stroke="currentColor" 
                                strokeWidth="2.5"
                            >
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </button>

                        {/* Slider dots indicator */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1 z-10">
                            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
                        </div>
                    </div>

                    {/* Details Link Area */}
                    <Link 
                        href={`/villas/${selectedVilla.slug}`}
                        className="p-4 bg-white text-slate-800 space-y-1 flex-1 flex flex-col justify-between hover:no-underline"
                    >
                        <div className="space-y-1">
                            {/* Line 1: Type/Location + Rating */}
                            <div className="flex items-center justify-between text-[14px] text-slate-800 font-bold leading-tight">
                                <span className="truncate">
                                    Villa di {selectedVilla.location.split(',').pop()?.trim() || selectedVilla.location}
                                </span>
                                {selectedVilla.reviews_avg_rating && (
                                    <div className="flex items-center text-slate-800 shrink-0 font-normal">
                                        <svg className="w-3.5 h-3.5 fill-slate-800 text-slate-800 mr-1" viewBox="0 0 24 24">
                                            <path d="M12 .587l3.668 7.431 8.2 1.191-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.209l8.2-1.191L12 .587z"/>
                                        </svg>
                                        <span className="font-semibold text-sm">
                                            {parseFloat(selectedVilla.reviews_avg_rating.toString()).toFixed(1).replace('.', ',')}
                                        </span>
                                        {selectedVilla.reviews_count && selectedVilla.reviews_count > 0 && (
                                            <span className="text-slate-500 text-[12px] ml-0.5">({selectedVilla.reviews_count})</span>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* Line 2: Name/title */}
                            <h4 className="text-slate-500 text-[13.5px] line-clamp-1 leading-normal font-normal m-0">
                                {selectedVilla.name}
                            </h4>
                            
                            {/* Line 3: Rooms / Beds / Baths specs */}
                            <div className="text-[13.5px] text-slate-500 font-normal truncate">
                                {selectedVilla.bedrooms} kamar tidur · {selectedVilla.bedrooms} tempat tidur · {selectedVilla.bathrooms} kamar mandi
                            </div>
                            
                            {/* Line 4: Price formatted with underline */}
                            <div className="text-[13.5px] text-slate-800 font-normal pt-0.5">
                                <span className="font-bold underline">
                                    {formatPrice(selectedVilla.price_per_night)}
                                </span>
                                <span className="text-slate-700"> untuk 1 malam</span>
                            </div>
                            
                            {/* Line 5: Policy */}
                            <div className="text-slate-500 text-[12.5px] font-normal leading-snug pt-0.5">
                                Pembatalan gratis
                            </div>
                        </div>
                    </Link>
                </div>
            )}
        </div>
    );
}
