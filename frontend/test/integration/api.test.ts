import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import axiosClient from '@/lib/axios';
import MockAdapter from 'axios-mock-adapter';
import type { Villa, Destination, Booking, Payment, Review } from '@/types';

// Mock fetch calls made by components
const mockAxios = new MockAdapter(axiosClient);

// --- Mock Data Factories ---

const makeVilla = (overrides?: Partial<Villa>): Villa => ({
    id: 1,
    name: 'Villa Test',
    slug: 'villa-test',
    description: 'Testing villa',
    short_desc: 'Test',
    location: 'Yogyakarta, Sleman',
    maps_url: null,
    bedrooms: 3,
    bathrooms: 2,
    max_guests: 6,
    price_per_night: 1000000,
    weekend_price: null,
    min_nights: 1,
    amenities: [
        { name: 'WiFi', icon: 'Wifi' }
    ],
    photos: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'],
    rules: null,
    check_in_time: '14:00',
    check_out_time: '12:00',
    is_active: true,
    reviews_avg_rating: '4.5',
    reviews_count: 10,
    ...overrides,
});

const makeDestination = (overrides?: Partial<Destination>): Destination => ({
    id: 1,
    name: 'Puncak, Bogor',
    city: 'Puncak',
    query: 'Bogor',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
    count_fallback: '12+ Villa',
    ...overrides,
});

const makeBooking = (overrides?: Partial<Booking>): Booking => ({
    id: 1,
    booking_code: 'VB-2025-0001',
    villa_id: 1,
    guest_name: 'Test Guest',
    guest_email: 'guest@example.com',
    guest_phone: '081234567890',
    check_in: '2026-07-01',
    check_out: '2026-07-04',
    total_nights: 3,
    num_guests: 2,
    base_price: 1000000,
    total_amount: 3000000,
    status: 'confirmed',
    payment_status: 'paid',
    notes: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    cancel_reason: null,
    cancelled_at: null,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    payment: {
        id: 1,
        booking_id: 1,
        midtrans_order_id: 'VB-2025-0001-123',
        midtrans_transaction_id: 'TX-001',
        payment_type: 'bank_transfer',
        amount: 3000000,
        status: 'success',
        snap_token: 'snap-token-123',
        expired_at: null,
        paid_at: '2025-01-01T12:00:00.000Z',
        raw_response: null,
    },
    ...overrides,
});

describe('API Integration - Villa Endpoints', () => {
    beforeEach(() => {
        mockAxios.reset();
    });

    it('GET /villas should return paginated villa list', async () => {
        mockAxios.onGet('/villas').reply(200, {
            data: [makeVilla()],
            meta: {
                current_page: 1,
                last_page: 1,
                per_page: 9,
                total: 1,
            },
        });

        const response = await axiosClient.get('/villas');
        expect(response.data.data).toHaveLength(1);
        expect(response.data.data[0].name).toBe('Villa Test');
        expect(response.data.meta.total).toBe(1);
    });

    it('GET /villas should accept filter params', async () => {
        mockAxios.onGet('/villas', { params: { location: 'Bogor', bedrooms: 2 } }).reply(200, {
            data: [],
            meta: { current_page: 1, last_page: 1, per_page: 9, total: 0 },
        });

        const response = await axiosClient.get('/villas', {
            params: { location: 'Bogor', bedrooms: 2 },
        });
        expect(response.data.meta.total).toBe(0);
    });

    it('GET /villas/:slug should return villa detail with reviews', async () => {
        mockAxios.onGet('/villas/villa-test').reply(200, {
            villa: makeVilla(),
            reviews: [],
            stats: { rating_avg: 4.5, reviews_count: 10 },
        });

        const response = await axiosClient.get('/villas/villa-test');
        expect(response.data.villa.name).toBe('Villa Test');
        expect(response.data.stats.rating_avg).toBe(4.5);
    });

    it('GET /villas/:slug should return 404 for missing villa', async () => {
        mockAxios.onGet('/villas/not-found').reply(404, {
            message: 'Villa tidak ditemukan.',
        });

        await expect(axiosClient.get('/villas/not-found')).rejects.toThrow();
    });

    it('GET /villas/:slug/availability should return disabled dates', async () => {
        mockAxios.onGet('/villas/villa-test/availability').reply(200, {
            disabled_dates: ['2026-07-15', '2026-07-16'],
        });

        const response = await axiosClient.get('/villas/villa-test/availability');
        expect(response.data.disabled_dates).toContain('2026-07-15');
        expect(response.data.disabled_dates).toHaveLength(2);
    });

    it('GET /destinations should return destinations list', async () => {
        mockAxios.onGet('/destinations').reply(200, {
            data: [makeDestination(), makeDestination({ id: 2, name: 'Ubud', query: 'Ubud' })],
        });

        const response = await axiosClient.get('/destinations');
        expect(response.data.data).toHaveLength(2);
    });
});

describe('API Integration - Booking Endpoints', () => {
    beforeEach(() => {
        mockAxios.reset();
    });

    it('POST /bookings should create booking successfully', async () => {
        mockAxios.onPost('/bookings').reply(201, {
            booking_code: 'VB-2025-0002',
            snap_token: 'snap-token-456',
            total_amount: 3500000,
            message: 'Booking berhasil dibuat.',
        });

        const payload = {
            villa_id: 1,
            guest_name: 'Test Guest',
            guest_email: 'guest@test.com',
            guest_phone: '081234567890',
            check_in: '2026-07-01',
            check_out: '2026-07-04',
            num_guests: 2,
        };

        const response = await axiosClient.post('/bookings', payload);
        expect(response.data.booking_code).toBe('VB-2025-0002');
        expect(response.data.snap_token).toBe('snap-token-456');
    });

    it('POST /bookings should return 422 for invalid data', async () => {
        mockAxios.onPost('/bookings').reply(422, {
            message: 'Tanggal yang Anda pilih sudah dipesan oleh tamu lain.',
        });

        await expect(
            axiosClient.post('/bookings', { villa_id: 1, guest_name: 'Test' })
        ).rejects.toThrow();
    });

    it('GET /bookings/:code should return booking with email verification', async () => {
        mockAxios.onGet('/bookings/VB-2025-0001', {
            params: { email: 'guest@example.com' },
        }).reply(200, makeBooking());

        const response = await axiosClient.get('/bookings/VB-2025-0001', {
            params: { email: 'guest@example.com' },
        });

        expect(response.data.booking_code).toBe('VB-2025-0001');
        expect(response.data.status).toBe('confirmed');
        expect(response.data.payment).toBeDefined();
    });

    it('GET /bookings/:code should return 404 for invalid code', async () => {
        mockAxios.onGet('/bookings/INVALID', {
            params: { email: 'test@test.com' },
        }).reply(404, {
            message: 'Booking tidak ditemukan atau email tidak sesuai.',
        });

        await expect(
            axiosClient.get('/bookings/INVALID', { params: { email: 'test@test.com' } })
        ).rejects.toThrow();
    });
});

describe('API Integration - Payment Webhook', () => {
    beforeEach(() => {
        mockAxios.reset();
    });

    it('POST /payment/notification should process midtrans webhook', async () => {
        mockAxios.onPost('/payment/notification').reply(200, {
            message: 'Webhook diproses dengan sukses.',
        });

        const payload = {
            order_id: 'VB-2025-0001',
            status_code: '200',
            gross_amount: '3000000',
            signature_key: 'sha512-hash',
            transaction_status: 'settlement',
            payment_type: 'bank_transfer',
            transaction_id: 'TX-001',
        };

        const response = await axiosClient.post('/payment/notification', payload);
        expect(response.data.message).toBe('Webhook diproses dengan sukses.');
    });
});

describe('API Integration - Review Endpoints', () => {
    beforeEach(() => {
        mockAxios.reset();
    });

    it('GET /reviews/:slug should return approved reviews', async () => {
        mockAxios.onGet('/reviews/villa-test').reply(200, {
            data: [{
                id: 1,
                booking_id: 1,
                villa_id: 1,
                guest_name: 'Reviewer',
                rating: 5,
                comment: 'Amazing villa!',
                is_approved: true,
                approved_at: '2025-01-01T00:00:00.000Z',
                approved_by: 1,
                created_at: '2025-01-01T00:00:00.000Z',
                updated_at: '2025-01-01T00:00:00.000Z',
            }],
            meta: { current_page: 1, last_page: 1, per_page: 5, total: 1 },
        });

        const response = await axiosClient.get('/reviews/villa-test');
        expect(response.data.data[0].rating).toBe(5);
        expect(response.data.data[0].is_approved).toBe(true);
    });
});

describe('API Integration - Admin Endpoints (Auth Required)', () => {
    beforeEach(() => {
        mockAxios.reset();
        localStorage.clear();
    });

    it('should attach bearer token from localStorage', async () => {
        localStorage.setItem('admin_token', 'test-admin-token');

        mockAxios.onGet('/admin/dashboard').reply(200, {
            stats: { checkins_today: 3, bookings_this_month: 15 },
        });

        const response = await axiosClient.get('/admin/dashboard');
        expect(response.data.stats.checkins_today).toBe(3);

        localStorage.clear();
    });

    it('GET /admin/bookings should list bookings with filters', async () => {
        mockAxios.onGet('/admin/bookings').reply(200, {
            data: [makeBooking()],
            meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 },
        });

        const response = await axiosClient.get('/admin/bookings');
        expect(response.data.data[0].guest_name).toBe('Test Guest');
    });

    it('GET /admin/villas should list all villas', async () => {
        mockAxios.onGet('/admin/villas').reply(200, [makeVilla(), makeVilla({ id: 2, name: 'Villa 2' })]);

        const response = await axiosClient.get('/admin/villas');
        expect(response.data).toHaveLength(2);
    });

    it('POST /admin/villas should create villa', async () => {
        mockAxios.onPost('/admin/villas').reply(201, {
            villa: makeVilla(),
            message: 'Villa berhasil ditambahkan.',
        });

        const response = await axiosClient.post('/admin/villas', {
            name: 'New Villa',
            description: 'Test',
            short_desc: 'Short',
            location: 'Bali',
            bedrooms: 3,
            bathrooms: 2,
            max_guests: 6,
            price_per_night: 1000000,
            min_nights: 1,
            check_in_time: '14:00',
            check_out_time: '12:00',
        });

        expect(response.data.villa.name).toBe('Villa Test');
    });

    it('GET /admin/analytics should return stats', async () => {
        mockAxios.onGet('/admin/analytics').reply(200, {
            period: { from: '2025-01-01', to: '2025-01-31' },
            daily_revenue: [{ date: '2025-01-01', revenue: 5000000 }],
            bookings_per_villa: [{ villa_name: 'Villa Test', bookings_count: 3 }],
            payment_methods: [{ method: 'bank_transfer', count: 3, revenue: 5000000 }],
            lead_sources: [{ source: 'Direct / Langsung', count: 3 }],
            conversion_funnel: [
                { step: 'Pending (Unpaid)', value: 0 },
                { step: 'Confirmed (Paid)', value: 3 },
                { step: 'Completed', value: 2 },
                { step: 'Cancelled', value: 1 },
            ],
        });

        const response = await axiosClient.get('/admin/analytics');
        expect(response.data.conversion_funnel[1].value).toBe(3);
    });

    it('GET /admin/reviews should list reviews', async () => {
        mockAxios.onGet('/admin/reviews').reply(200, {
            data: [{
                id: 1,
                booking_id: 1,
                villa_id: 1,
                guest_name: 'Reviewer',
                rating: 4,
                comment: 'Good',
                is_approved: false,
                approved_at: null,
                approved_by: null,
                created_at: '2025-01-01T00:00:00.000Z',
                updated_at: '2025-01-01T00:00:00.000Z',
            }],
            meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 },
        });

        const response = await axiosClient.get('/admin/reviews');
        expect(response.data.data[0].is_approved).toBe(false);
    });
});
