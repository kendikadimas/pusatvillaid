import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import axiosClient from '@/lib/axios';
import MockAdapter from 'axios-mock-adapter';
import AdminAnalyticsPage from '@/app/admin/analytics/page';

const mockAxios = new MockAdapter(axiosClient);

describe('AdminAnalyticsPage Component', () => {
    beforeEach(() => {
        mockAxios.reset();
        vi.stubGlobal('localStorage', {
            getItem: vi.fn().mockReturnValue('mock-token'),
            setItem: vi.fn(),
            clear: vi.fn()
        });
    });

    it('should render page title and loading state, then load charts correctly', async () => {
        mockAxios.onGet('/admin/analytics').reply(200, {
            period: { from: '2025-01-01', to: '2025-01-31' },
            daily_revenue: [{ date: '2025-01-01', revenue: '5000000' }],
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

        render(<AdminAnalyticsPage />);

        // Check if page header is rendered
        expect(screen.getByText('Analisis & pendapatan')).toBeInTheDocument();

        // Check that stats load after loading spinner disappears
        await waitFor(() => {
            expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
        });

        // Verify total revenue card displays the correct value (5,000,000)
        expect(screen.getByText(/Rp 5\.000\.000/)).toBeInTheDocument();

        // Verify total bookings displays the correct value (5 total: Confirmed (3) + Completed (2))
        const bookingsCard = screen.getByText('Total reservasi aktif').closest('div');
        expect(bookingsCard).toHaveTextContent(/5\s*booking/i);
    });
});
