'use client';

import React, { useEffect, useState } from 'react';
import { 
    Settings, 
    Save, 
    Loader2, 
    Globe, 
    Phone, 
    Mail, 
    MapPin, 
    Clock, 
    CreditCard 
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Settings States
    const [propertyName, setPropertyName] = useState('PusatVilla.id');
    const [whatsappNumber, setWhatsappNumber] = useState('+62 812-3456-7890');
    const [propertyEmail, setPropertyEmail] = useState('support@pusatvilla.id');
    const [address, setAddress] = useState('Cisarua, Puncak, Bogor, Jawa Barat');
    const [checkInTime, setCheckInTime] = useState('14:00');
    const [checkOutTime, setCheckOutTime] = useState('12:00');
    const [midtransMode, setMidtransMode] = useState('sandbox');

    useEffect(() => {
        // Load settings from local storage as a graceful decoupled fallback
        if (typeof window !== 'undefined') {
            const savedName = localStorage.getItem('settings_prop_name');
            const savedWA = localStorage.getItem('settings_wa');
            const savedEmail = localStorage.getItem('settings_email');
            const savedAddr = localStorage.getItem('settings_address');
            const savedCheckIn = localStorage.getItem('settings_checkin');
            const savedCheckOut = localStorage.getItem('settings_checkout');
            const savedMidtrans = localStorage.getItem('settings_midtrans');

            if (savedName) setPropertyName(savedName);
            if (savedWA) setWhatsappNumber(savedWA);
            if (savedEmail) setPropertyEmail(savedEmail);
            if (savedAddr) setAddress(savedAddr);
            if (savedCheckIn) setCheckInTime(savedCheckIn);
            if (savedCheckOut) setCheckOutTime(savedCheckOut);
            if (savedMidtrans) setMidtransMode(savedMidtrans);
        }
        setLoading(false);
    }, []);

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem('settings_prop_name', propertyName);
                localStorage.setItem('settings_wa', whatsappNumber);
                localStorage.setItem('settings_email', propertyEmail);
                localStorage.setItem('settings_address', address);
                localStorage.setItem('settings_checkin', checkInTime);
                localStorage.setItem('settings_checkout', checkOutTime);
                localStorage.setItem('settings_midtrans', midtransMode);
            }
            
            toast.success('Pengaturan sistem berhasil disimpan!');
        } catch (err) {
            console.error('Failed to save settings:', err);
            toast.error('Gagal menyimpan pengaturan.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 border-b border-slate-200 pb-5">
                <Settings className="w-8 h-8 text-slate-800" />
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pengaturan Sistem</h1>
                    <p className="text-slate-500 text-sm mt-1">Konfigurasi info identitas properti, default jam check-in/out, dan status Midtrans.</p>
                </div>
            </div>

            <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
                
                {/* 1. Property Identity */}
                <div className="space-y-5">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider flex items-center space-x-1.5">
                        <Globe className="w-4 h-4 text-rose-500" />
                        <span>Identitas Properti</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider font-bold">Nama Properti / Brand</label>
                            <input 
                                type="text"
                                required
                                value={propertyName}
                                onChange={(e) => setPropertyName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider font-bold">Nomor WhatsApp Admin</label>
                            <input 
                                type="text"
                                required
                                value={whatsappNumber}
                                onChange={(e) => setWhatsappNumber(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider font-bold">Email Properti</label>
                            <input 
                                type="email"
                                required
                                value={propertyEmail}
                                onChange={(e) => setPropertyEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider font-bold">Alamat Properti</label>
                            <textarea 
                                rows={3}
                                required
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Check in / out defaults */}
                <div className="space-y-5">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider flex items-center space-x-1.5">
                        <Clock className="w-4 h-4 text-rose-500" />
                        <span>Kebijakan Waktu</span>
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Jam Check-in Default</label>
                            <input 
                                type="time"
                                required
                                value={checkInTime}
                                onChange={(e) => setCheckInTime(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Jam Check-out Default</label>
                            <input 
                                type="time"
                                required
                                value={checkOutTime}
                                onChange={(e) => setCheckOutTime(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Midtrans Integration configs */}
                <div className="space-y-5">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider flex items-center space-x-1.5">
                        <CreditCard className="w-4 h-4 text-rose-500" />
                        <span>Integrasi Pembayaran (Midtrans)</span>
                    </h3>
                    
                    <div className="text-xs">
                        <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Mode Gateway</label>
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2 cursor-pointer font-semibold">
                                <input 
                                    type="radio" 
                                    name="midtransMode"
                                    value="sandbox"
                                    checked={midtransMode === 'sandbox'}
                                    onChange={(e) => setMidtransMode(e.target.value)}
                                    className="text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                                />
                                <span>Sandbox (Pengujian / Simulasi UAT)</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer font-semibold">
                                <input 
                                    type="radio" 
                                    name="midtransMode"
                                    value="production"
                                    checked={midtransMode === 'production'}
                                    onChange={(e) => setMidtransMode(e.target.value)}
                                    className="text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                                />
                                <span>Production (Live Transaksi Riil)</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Save button */}
                <div className="pt-6 border-t border-slate-200 flex items-center justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-colors flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Menyimpan...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                <span>Simpan Pengaturan</span>
                            </>
                        )}
                    </button>
                </div>

            </form>
        </div>
    );
}
