import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

vi.mock('@/context/SettingsContext', () => ({
    useSettings: () => ({
        whatsappNumber: '6281234567890',
        loading: false,
        settings: {
            settings_prop_name: 'pusatvilla.id',
            settings_email: 'support@pusatvilla.id',
            settings_address: 'Yogyakarta, Indonesia',
        },
    }),
}));

import PublicFooter from '@/components/PublicFooter';
import CTASection from '@/components/sections/CTASection';

describe('PublicFooter Component', () => {
    it('should render company name', () => {
        render(<PublicFooter />);
        expect(screen.getByText('pusatvilla.id')).toBeInTheDocument();
    });

    it('should render contact email', () => {
        render(<PublicFooter />);
        expect(screen.getByText('support@pusatvilla.id')).toBeInTheDocument();
    });

    it('should render location', () => {
        render(<PublicFooter />);
        expect(screen.getByText('Yogyakarta, Indonesia')).toBeInTheDocument();
    });

    it('should render WhatsApp link with proper href', () => {
        render(<PublicFooter />);
        const waLink = screen.getByRole('link', { name: /\+62/ });
        expect(waLink).toHaveAttribute('href', expect.stringContaining('whatsapp.com/send'));
    });

    it('should render navigation link to villas', () => {
        render(<PublicFooter />);
        const navLink = screen.getByRole('link', { name: /Cari Villa/i });
        expect(navLink).toHaveAttribute('href', '/villas');
    });

    it('should render copyright year', () => {
        render(<PublicFooter />);
        const year = new Date().getFullYear().toString();
        expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
    });
});

describe('CTASection Component', () => {
    it('should render CTA headline', () => {
        render(<CTASection />);
        expect(
            screen.getByText(/Butuh rekomendasi villa/i)
        ).toBeInTheDocument();
    });

    it('should render jelajahi villa button', () => {
        render(<CTASection />);
        const button = screen.getByRole('link', { name: /Jelajahi Villa/i });
        expect(button).toHaveAttribute('href', '/villas');
    });

    it('should render WhatsApp hubungi admin button', () => {
        render(<CTASection />);
        const waLink = screen.getByRole('link', { name: /Chat WhatsApp/i });
        expect(waLink).toHaveAttribute('href', expect.stringContaining('whatsapp.com/send'));
    });

    it('should render description text', () => {
        render(<CTASection />);
        expect(
            screen.getByText(/Hubungi admin langsung via/i)
        ).toBeInTheDocument();
    });
});
