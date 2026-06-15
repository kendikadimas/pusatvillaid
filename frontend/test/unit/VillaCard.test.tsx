import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import VillaCard from '@/components/VillaCard';
import type { Villa } from '@/types';

const mockVilla: Villa = {
    id: 1,
    name: 'Villa Mewah Puncak',
    slug: 'villa-mewah-puncak',
    description: 'Villa mewah dengan pemandangan',
    short_desc: 'Villa mewah',
    location: 'Puncak, Bogor, Cisarua',
    maps_url: null,
    bedrooms: 3,
    bathrooms: 2,
    max_guests: 6,
    price_per_night: 1500000,
    weekend_price: 2000000,
    min_nights: 1,
    amenities: [
        { name: 'WiFi', icon: 'Wifi' },
        { name: 'Pool', icon: 'Waves' },
        { name: 'AC', icon: 'Wind' }
    ],
    photos: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'],
    rules: null,
    check_in_time: '14:00',
    check_out_time: '12:00',
    is_active: true,
    reviews_avg_rating: '4.7',
    reviews_count: 25,
};

describe('VillaCard Component', () => {
    const toggleWishlist = vi.fn();
    const searchParams = {};

    beforeEach(() => {
        toggleWishlist.mockClear();
    });

    it('should render villa name', () => {
        render(
            <VillaCard
                villa={mockVilla}
                wishlist={[]}
                toggleWishlist={toggleWishlist}
                searchParams={searchParams}
                variant="home"
            />
        );

        // Villa name is in alt text and h3 heading
        const img = screen.getByAltText('Villa Mewah Puncak');
        expect(img).toBeInTheDocument();
    });

    it('should not render location', () => {
        render(
            <VillaCard
                villa={mockVilla}
                wishlist={[]}
                toggleWishlist={toggleWishlist}
                searchParams={searchParams}
                variant="home"
            />
        );

        expect(screen.queryByText(/Cisarua/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Bogor/)).not.toBeInTheDocument();
    });

    it('should render price correctly', () => {
        render(
            <VillaCard
                villa={mockVilla}
                wishlist={[]}
                toggleWishlist={toggleWishlist}
                searchParams={searchParams}
                variant="home"
            />
        );

        expect(screen.getByText(/Rp 1\.500\.000/)).toBeInTheDocument();
    });

    it('should not render rating average or count', () => {
        render(
            <VillaCard
                villa={mockVilla}
                wishlist={[]}
                toggleWishlist={toggleWishlist}
                searchParams={searchParams}
                variant="catalog"
            />
        );

        expect(screen.queryByText('4,7')).not.toBeInTheDocument();
        expect(screen.queryByText('(25)')).not.toBeInTheDocument();
    });

    it('should not render review count when no reviews exist', () => {
        const villaNoReviews: Villa = {
            ...mockVilla,
            reviews_avg_rating: null,
            reviews_count: 0,
        };

        render(
            <VillaCard
                villa={villaNoReviews}
                wishlist={[]}
                toggleWishlist={toggleWishlist}
                searchParams={searchParams}
                variant="catalog"
            />
        );

        expect(screen.queryByText(/(25)/)).not.toBeInTheDocument();
    });

    it('should render catalog variant name and price', () => {
        render(
            <VillaCard
                villa={mockVilla}
                wishlist={[]}
                toggleWishlist={toggleWishlist}
                searchParams={searchParams}
                variant="catalog"
            />
        );

        expect(screen.getByText('Villa Mewah Puncak')).toBeInTheDocument();
        expect(screen.getByText(/Rp 1\.500\.000/)).toBeInTheDocument();
    });

    it('should render home variant name and price', () => {
        render(
            <VillaCard
                villa={mockVilla}
                wishlist={[]}
                toggleWishlist={toggleWishlist}
                searchParams={searchParams}
                variant="home"
            />
        );

        expect(screen.getByText('Villa Mewah Puncak')).toBeInTheDocument();
        expect(screen.getByText(/Rp 1\.500\.000/)).toBeInTheDocument();
    });

    it('should link to villa detail', () => {
        render(
            <VillaCard
                villa={mockVilla}
                wishlist={[]}
                toggleWishlist={toggleWishlist}
                searchParams={searchParams}
                variant="home"
            />
        );

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/villas/villa-mewah-puncak');
    });

    it('should include search params in link when dates provided', () => {
        render(
            <VillaCard
                villa={mockVilla}
                wishlist={[]}
                toggleWishlist={toggleWishlist}
                searchParams={{ checkIn: '2026-07-01', checkOut: '2026-07-05' }}
                variant="home"
            />
        );

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute(
            'href',
            '/villas/villa-mewah-puncak?checkIn=2026-07-01&checkOut=2026-07-05'
        );
    });

    it('should show heart icon for wishlist', () => {
        render(
            <VillaCard
                villa={mockVilla}
                wishlist={[]}
                toggleWishlist={toggleWishlist}
                searchParams={searchParams}
                variant="home"
            />
        );

        const heartButton = screen.getByRole('button');
        fireEvent.click(heartButton);
        expect(toggleWishlist).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should show filled heart when villa is in wishlist', () => {
        const { container } = render(
            <VillaCard
                villa={mockVilla}
                wishlist={[1]}
                toggleWishlist={toggleWishlist}
                searchParams={searchParams}
                variant="home"
            />
        );

        const heartSvgs = container.querySelectorAll('svg');
        const filledHeart = Array.from(heartSvgs).find(svg =>
            svg.classList.contains('fill-red-500')
        );
        expect(filledHeart).toBeTruthy();
    });
});
