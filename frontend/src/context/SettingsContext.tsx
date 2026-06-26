'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axiosClient from '@/lib/axios';

interface Settings {
    settings_prop_name: string;
    settings_website: string;
    settings_wa: string;
    settings_email: string;
    settings_address: string;
    settings_checkin: string;
    settings_checkout: string;
    tax_percentage: number;
}

const DEFAULT_SETTINGS: Settings = {
    settings_prop_name: 'PusatVilla.id',
    settings_website: 'https://pusatvillaid.com',
    settings_wa: '081234567890',
    settings_email: 'noreply@pusatvilla.id',
    settings_address: 'Cisarua, Puncak, Bogor, Jawa Barat',
    settings_checkin: '14:00',
    settings_checkout: '12:00',
    tax_percentage: 0,
};

interface SettingsContextType {
    settings: Settings;
    loading: boolean;
    whatsappNumber: string;
    refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    const refreshSettings = async () => {
        try {
            const response = await axiosClient.get('/settings/public');
            setSettings(response.data);
        } catch {
        }
    };

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            await refreshSettings();
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const waRaw = settings.settings_wa || '081234567890';
    const whatsappNumber = waRaw.startsWith('0') ? '62' + waRaw.substring(1) : waRaw;

    return (
        <SettingsContext.Provider value={{ settings, loading, whatsappNumber, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
