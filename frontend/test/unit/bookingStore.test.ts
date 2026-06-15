import { describe, it, expect, beforeEach } from 'vitest';
import { useBookingStore } from '@/store/bookingStore';
import type { Villa } from '@/types';

const mockVilla: Villa = {
    id: 1,
    name: 'Villa Test',
    slug: 'villa-test',
    description: 'Deskripsi villa test',
    short_desc: 'Villa test singkat',
    location: 'Yogyakarta',
    maps_url: null,
    bedrooms: 3,
    bathrooms: 2,
    max_guests: 6,
    price_per_night: 1000000,
    weekend_price: 1500000,
    min_nights: 1,
    amenities: [
        { name: 'WiFi', icon: 'Wifi' },
        { name: 'Pool', icon: 'Waves' }
    ],
    photos: ['https://example.com/photo.jpg'],
    rules: 'No smoking',
    check_in_time: '14:00',
    check_out_time: '12:00',
    is_active: true,
    host_name: 'Test Host',
    host_years: 5,
    refundable_surcharge_rate: 0.11111,
};

describe('Booking Store', () => {
    beforeEach(() => {
        useBookingStore.getState().resetStore();
    });

    it('should have initial state with null selectedVilla', () => {
        const state = useBookingStore.getState();
        expect(state.selectedVilla).toBeNull();
        expect(state.checkIn).toBeNull();
        expect(state.checkOut).toBeNull();
        expect(state.numGuests).toBe(1);
        expect(state.notes).toBe('');
        expect(state.totalNights).toBe(0);
        expect(state.totalAmount).toBe(0);
        expect(state.isRefundable).toBe(false);
    });

    it('should set villa and calculate pricing when setting villa with dates', () => {
        const store = useBookingStore.getState();

        store.setDates('2026-07-01', '2026-07-04');
        store.setVilla(mockVilla);

        const state = useBookingStore.getState();
        expect(state.selectedVilla).toEqual(mockVilla);
        expect(state.totalNights).toBe(3);
    });

    it('should calculate pricing for weekday-only stay', () => {
        const store = useBookingStore.getState();

        // Wed 2026-07-01 to Sat 2026-07-04 = 3 nights: Wed, Thu, Fri
        // Fri is weekend, so 2 weekdays + 1 weekend
        store.setVilla(mockVilla);
        store.setDates('2026-07-01', '2026-07-04');

        const state = useBookingStore.getState();
        expect(state.totalNights).toBe(3);
        expect(state.priceBreakdown.weekdays.count).toBe(2);
        expect(state.priceBreakdown.weekends.count).toBe(1);
    });

    it('should calculate pricing for weekend-only stay (Fri-Sun)', () => {
        const store = useBookingStore.getState();

        // Fri to Sun = 2 nights: Fri, Sat (both weekend)
        store.setVilla(mockVilla);
        store.setDates('2026-07-03', '2026-07-05');

        const state = useBookingStore.getState();
        expect(state.totalNights).toBe(2);
        expect(state.priceBreakdown.weekdays.count).toBe(0);
        expect(state.priceBreakdown.weekends.count).toBe(2);
        expect(state.totalAmount).toBe(1500000 * 2);
    });

    it('should calculate total amount correctly for mixed weekdays/weekends', () => {
        const store = useBookingStore.getState();

        store.setVilla(mockVilla);
        store.setDates('2026-07-01', '2026-07-04');

        const state = useBookingStore.getState();
        // 2 weekdays * 1M + 1 weekend * 1.5M = 3.5M
        expect(state.totalAmount).toBe(2000000 + 1500000);
    });

    it('should add refundable surcharge ~11.11%', () => {
        const store = useBookingStore.getState();

        store.setVilla(mockVilla);
        store.setDates('2026-07-01', '2026-07-04');
        store.setRefundable(true);

        const state = useBookingStore.getState();
        const baseAmount = 3500000;
        const expectedRefundable = Math.round(baseAmount * 1.11111);
        expect(state.totalAmount).toBe(expectedRefundable);
    });

    it('should treat all nights as weekdays when weekend_price is null', () => {
        const villaWithoutWeekend: Villa = {
            ...mockVilla,
            weekend_price: null,
        };

        const store = useBookingStore.getState();
        store.setVilla(villaWithoutWeekend);
        store.setDates('2026-07-03', '2026-07-05');

        const state = useBookingStore.getState();
        // When weekend_price is null, ALL nights fall into "else" (weekday) branch
        expect(state.priceBreakdown.weekdays.count).toBe(2);
        expect(state.priceBreakdown.weekends.count).toBe(0);
        expect(state.priceBreakdown.weekdays.price).toBe(1000000);
        expect(state.totalAmount).toBe(2000000);
    });

    it('should reset to zero when checkIn > checkOut', () => {
        const store = useBookingStore.getState();

        store.setVilla(mockVilla);
        store.setDates('2026-07-04', '2026-07-01');

        const state = useBookingStore.getState();
        expect(state.totalNights).toBe(0);
        expect(state.totalAmount).toBe(0);
    });

    it('should reset to zero when dates are same day', () => {
        const store = useBookingStore.getState();

        store.setVilla(mockVilla);
        store.setDates('2026-07-01', '2026-07-01');

        const state = useBookingStore.getState();
        expect(state.totalNights).toBe(0);
        expect(state.totalAmount).toBe(0);
    });

    it('should clear pricing when villa is null', () => {
        const store = useBookingStore.getState();

        store.setVilla(mockVilla);
        store.setDates('2026-07-01', '2026-07-04');
        store.setVilla(null);

        const state = useBookingStore.getState();
        expect(state.totalAmount).toBe(0);
        expect(state.selectedVilla).toBeNull();
    });

    it('should reset store completely', () => {
        const store = useBookingStore.getState();

        store.setVilla(mockVilla);
        store.setDates('2026-07-01', '2026-07-04');
        store.setNumGuests(4);
        store.setNotes('Test notes');
        store.setRefundable(true);
        store.resetStore();

        const state = useBookingStore.getState();
        expect(state.selectedVilla).toBeNull();
        expect(state.checkIn).toBeNull();
        expect(state.checkOut).toBeNull();
        expect(state.numGuests).toBe(1);
        expect(state.notes).toBe('');
        expect(state.totalNights).toBe(0);
        expect(state.totalAmount).toBe(0);
        expect(state.isRefundable).toBe(false);
    });

    it('should set numGuests correctly', () => {
        useBookingStore.getState().setNumGuests(4);
        expect(useBookingStore.getState().numGuests).toBe(4);
    });

    it('should set notes correctly', () => {
        useBookingStore.getState().setNotes('Catatan test');
        expect(useBookingStore.getState().notes).toBe('Catatan test');
    });

    it('should handle 14-night stay across two weekends', () => {
        const store = useBookingStore.getState();
        store.setVilla(mockVilla);
        // Two weeks: Mon to Mon = 14 nights
        store.setDates('2026-07-06', '2026-07-20');

        const state = useBookingStore.getState();
        expect(state.totalNights).toBe(14);
        // Two weekends: 2 Fridays + 2 Saturdays = 4 weekend nights, 10 weekdays
        expect(state.priceBreakdown.weekends.count).toBe(4);
        expect(state.priceBreakdown.weekdays.count).toBe(10);
    });
});
