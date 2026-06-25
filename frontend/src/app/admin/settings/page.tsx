'use client';

import React, { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import { formatPrice } from '@/lib/format';
import { 
    Settings, 
    Save, 
    Loader2, 
    Globe, 
    Phone, 
    Mail, 
    MapPin, 
    Clock, 
    CreditCard,
    Building,
    Smartphone,
    SlidersHorizontal,
    Plus,
    Trash2,
    Edit,
    Upload,
    X,
    Check,
    ToggleRight,
    ToggleLeft,
    Percent
} from 'lucide-react';
import { toast } from 'sonner';
import axiosClient from '@/lib/axios';
import { PaymentMethod } from '@/types';
import { useSettings } from '@/context/SettingsContext';

export default function AdminSettingsPage() {
    const { refreshSettings } = useSettings();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'identity' | 'policies' | 'tax_fees' | 'payment' | 'payment_methods'>('identity');

    const [propertyName, setPropertyName] = useState('PusatVilla.id');
    const [whatsappNumber, setWhatsappNumber] = useState('+62 812-3456-7890');
    const [propertyEmail, setPropertyEmail] = useState('support@pusatvilla.id');
    const [address, setAddress] = useState('Cisarua, Puncak, Bogor, Jawa Barat');
    const [checkInTime, setCheckInTime] = useState('14:00');
    const [checkOutTime, setCheckOutTime] = useState('12:00');
    const [midtransMode, setMidtransMode] = useState('sandbox');
    const [taxPercentage, setTaxPercentage] = useState<number>(0);

    // Payment Methods CRUD state
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [adminFee, setAdminFee] = useState<number>(0);
    const [loadingMethods, setLoadingMethods] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
    const [methodName, setMethodName] = useState('');
    const [methodCode, setMethodCode] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [methodIsActive, setMethodIsActive] = useState(true);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const fetchPaymentMethods = async () => {
        setLoadingMethods(true);
        try {
            const response = await axiosClient.get('/admin/payment-methods');
            setPaymentMethods(response.data);
        } catch (err) {
            console.error('Failed to fetch payment methods:', err);
            toast.error('Gagal memuat metode pembayaran.');
        } finally {
            setLoadingMethods(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'payment_methods') {
            fetchPaymentMethods();
        }
    }, [activeTab]);

    const handleAddMethod = () => {
        setEditingMethod(null);
        setMethodName('');
        setMethodCode('');
        setAccountNumber('');
        setAccountName('');
        setLogoUrl('');
        setAdminFee(0);
        setMethodIsActive(true);
        setIsModalOpen(true);
    };

    const handleEditMethod = (method: PaymentMethod) => {
        setEditingMethod(method);
        setMethodName(method.name);
        setMethodCode(method.code);
        setAccountNumber(method.account_number);
        setAccountName(method.account_name);
        setLogoUrl(method.logo_url || '');
        setAdminFee(method.admin_fee || 0);
        setMethodIsActive(method.is_active);
        setIsModalOpen(true);
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        const formData = new FormData();
        formData.append('logo', file);

        try {
            const response = await axiosClient.post('/admin/payment-methods/upload-logo', formData);
            setLogoUrl(response.data.logo_url);
            toast.success('Logo berhasil diunggah.');
        } catch (err: any) {
            console.error('Failed to upload logo:', err);
            toast.error(err.response?.data?.message || 'Gagal mengunggah logo.');
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleSaveMethodSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const isQris = methodCode.trim().toLowerCase() === 'qris';
        if (!methodName.trim() || !methodCode.trim() || !accountName.trim()) {
            toast.error('Semua kolom wajib diisi.');
            return;
        }
        if (!isQris && !accountNumber.trim()) {
            toast.error('Nomor rekening wajib diisi.');
            return;
        }

        const payload = {
            name: methodName.trim(),
            code: methodCode.trim().toLowerCase(),
            account_number: accountNumber.trim(),
            account_name: accountName.trim(),
            logo_url: logoUrl || null,
            admin_fee: adminFee,
            is_active: methodIsActive
        };

        try {
            if (editingMethod) {
                await axiosClient.put(`/admin/payment-methods/${editingMethod.id}`, payload);
                toast.success('Metode pembayaran berhasil diperbarui.');
            } else {
                await axiosClient.post('/admin/payment-methods', payload);
                toast.success('Metode pembayaran berhasil ditambahkan.');
            }
            setIsModalOpen(false);
            fetchPaymentMethods();
        } catch (err: any) {
            console.error('Failed to save payment method:', err);
            toast.error(err.response?.data?.message || 'Gagal menyimpan metode pembayaran.');
        }
    };

    const handleDeleteMethod = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus metode pembayaran ini?')) return;

        try {
            await axiosClient.delete(`/admin/payment-methods/${id}`);
            toast.success('Metode pembayaran berhasil dihapus.');
            fetchPaymentMethods();
        } catch (err: any) {
            console.error('Failed to delete payment method:', err);
            toast.error(err.response?.data?.message || 'Gagal menghapus metode pembayaran.');
        }
    };

    const handleToggleMethodStatus = async (method: PaymentMethod) => {
        try {
            await axiosClient.put(`/admin/payment-methods/${method.id}`, {
                name: method.name,
                code: method.code,
                account_number: method.account_number,
                account_name: method.account_name,
                logo_url: method.logo_url || null,
                is_active: !method.is_active,
            });
            toast.success(`Metode "${method.name}" sekarang ${method.is_active ? 'nonaktif' : 'aktif'}.`);
            fetchPaymentMethods();
        } catch (err: any) {
            console.error('Failed to toggle method status:', err);
            toast.error('Gagal mengubah status metode pembayaran.');
        }
    };

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const response = await axiosClient.get('/admin/settings');
                const data = response.data;
                if (data.settings_prop_name) setPropertyName(data.settings_prop_name);
                if (data.settings_wa) setWhatsappNumber(data.settings_wa);
                if (data.settings_email) setPropertyEmail(data.settings_email);
                if (data.settings_address) setAddress(data.settings_address);
                if (data.settings_checkin) setCheckInTime(data.settings_checkin);
                if (data.settings_checkout) setCheckOutTime(data.settings_checkout);
                // ARCHIVED: if (data.settings_midtrans) setMidtransMode(data.settings_midtrans);
                if (data.tax_percentage !== undefined) setTaxPercentage(data.tax_percentage);
            } catch (err) {
                console.error('Failed to fetch settings from API, using localStorage fallback:', err);
                if (typeof window !== 'undefined') {
                    const savedName = localStorage.getItem('settings_prop_name');
                    const savedWA = localStorage.getItem('settings_wa');
                    const savedEmail = localStorage.getItem('settings_email');
                    const savedAddr = localStorage.getItem('settings_address');
                    const savedCheckIn = localStorage.getItem('settings_checkin');
                    const savedCheckOut = localStorage.getItem('settings_checkout');
                    // ARCHIVED: const savedMidtrans = localStorage.getItem('settings_midtrans');
                    const savedTax = localStorage.getItem('tax_percentage');

                    if (savedName) setPropertyName(savedName);
                    if (savedWA) setWhatsappNumber(savedWA);
                    if (savedEmail) setPropertyEmail(savedEmail);
                    if (savedAddr) setAddress(savedAddr);
                    if (savedCheckIn) setCheckInTime(savedCheckIn);
                    if (savedCheckOut) setCheckOutTime(savedCheckOut);
                    // ARCHIVED: if (savedMidtrans) setMidtransMode(savedMidtrans);
                    if (savedTax) setTaxPercentage(Number(savedTax));
                }
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            await axiosClient.post('/admin/settings', {
                settings_prop_name: propertyName,
                settings_wa: whatsappNumber,
                settings_email: propertyEmail,
                settings_address: address,
                settings_checkin: checkInTime,
                settings_checkout: checkOutTime,
                // ARCHIVED: settings_midtrans: midtransMode,
                tax_percentage: taxPercentage
            });

            if (typeof window !== 'undefined') {
                localStorage.setItem('settings_prop_name', propertyName);
                localStorage.setItem('settings_wa', whatsappNumber);
                localStorage.setItem('settings_email', propertyEmail);
                localStorage.setItem('settings_address', address);
                localStorage.setItem('settings_checkin', checkInTime);
                localStorage.setItem('settings_checkout', checkOutTime);
                // ARCHIVED: localStorage.setItem('settings_midtrans', midtransMode);
                localStorage.setItem('tax_percentage', String(taxPercentage));
            }
            
            toast.success('Pengaturan sistem berhasil disimpan!');
            refreshSettings();
        } catch (err: any) {
            console.error('Failed to save settings:', err);
            toast.error(err.response?.data?.message || 'Gagal menyimpan pengaturan.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center py-40 space-y-4">
                <Loader2 className="w-9 h-9 animate-spin text-blue-500" />
                <p className="text-[#6a6a6a] text-xs font-semibold animate-pulse">Memuat pengaturan...</p>
            </div>
        );
    }

    const tabs = [
        { id: 'identity', name: 'Identitas properti', icon: Globe, desc: 'Nama brand, WhatsApp, email, dan alamat fisik.' },
        { id: 'policies', name: 'Kebijakan waktu', icon: Clock, desc: 'Jam default check-in & check-out villa.' },
        { id: 'tax_fees', name: 'Biaya & Pajak', icon: Percent, desc: 'Kelola pajak persenan dan biaya layanan.' },
        { id: 'payment', name: 'Gateway Pembayaran', icon: CreditCard, desc: 'Integrasi Midtrans sandbox & production.' },
        { id: 'payment_methods', name: 'Metode Pembayaran', icon: SlidersHorizontal, desc: 'Kelola rekening transfer bank manual.' }
    ] as const;

    return (
        <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center space-x-3.5 pb-2">
                <div className="w-10 h-10 rounded-[14px] bg-white border border-[#dddddd] flex items-center justify-center text-[#222222]">
                    <Settings className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-[#222222] tracking-tight">Pengaturan sistem</h1>
                    <p className="text-slate-500 text-xs mt-1 font-medium">Konfigurasi profil, kebijakan check-in/out, dan environment pembayaran.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
                
                {/* Left Side: Navigation Tabs */}
                <div className="md:col-span-1 overflow-x-auto md:overflow-visible scrollbar-hide">
                    <div className="flex md:flex-col gap-1.5 md:space-y-1.5 w-max md:w-auto pb-1 md:pb-0 min-w-0">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isSelected = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-auto md:w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-[8px] transition-colors group relative flex items-center md:flex-col md:items-start cursor-pointer flex-shrink-0 gap-2 md:gap-0 ${
                                        isSelected 
                                            ? 'bg-blue-50 text-blue-600 font-bold' 
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-[#222222]'
                                    }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isSelected ? 'text-blue-500' : 'text-slate-500 group-hover:text-[#222222]'}`} />
                                        <span className="text-xs font-semibold tracking-tight whitespace-nowrap">{tab.name}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-medium mt-1 leading-snug transition-colors hidden md:block">{tab.desc}</span>
                                    {isSelected && (
                                        <span className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-lg bg-blue-500" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Side: Active Settings Panel */}
                <div className="md:col-span-3 bg-white border border-[#dddddd] rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-6 sm:p-8 transition-all duration-300 min-h-[420px]">
                    
                    {activeTab !== 'payment_methods' ? (
                        <form onSubmit={handleSaveSettings} className="flex flex-col justify-between h-full min-h-[380px]">
                            <div>
                                {activeTab === 'identity' && (
                                    <div className="space-y-6 animate-in fade-in duration-200">
                                        <div className="px-4 py-3 -mx-4 border-b border-[#dddddd] mb-4 flex items-center space-x-2">
                                            <Building className="w-4.5 h-4.5 text-blue-500" />
                                            <h3 className="text-sm font-bold text-[#222222]">Identitas properti</h3>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Nama properti / brand</label>
                                                <input 
                                                    type="text"
                                                    required
                                                    value={propertyName}
                                                    onChange={(e) => setPropertyName(e.target.value)}
                                                    className="w-full bg-slate-50/50 hover:bg-slate-50 border border-[#dddddd] rounded-[8px] px-3.5 py-2.5 text-xs font-semibold text-[#222222] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Nomor WhatsApp admin</label>
                                                <input 
                                                    type="text"
                                                    required
                                                    value={whatsappNumber}
                                                    onChange={(e) => setWhatsappNumber(e.target.value)}
                                                    className="w-full bg-slate-50/50 hover:bg-slate-50 border border-[#dddddd] rounded-[8px] px-3.5 py-2.5 text-xs font-semibold text-[#222222] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 font-mono tabular-nums"
                                                />
                                            </div>

                                            <div className="sm:col-span-2">
                                                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Email properti</label>
                                                <input 
                                                    type="email"
                                                    required
                                                    value={propertyEmail}
                                                    onChange={(e) => setPropertyEmail(e.target.value)}
                                                    className="w-full bg-slate-50/50 hover:bg-slate-50 border border-[#dddddd] rounded-[8px] px-3.5 py-2.5 text-xs font-semibold text-[#222222] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                                />
                                            </div>

                                            <div className="sm:col-span-2">
                                                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Alamat properti</label>
                                                <textarea 
                                                    rows={3}
                                                    required
                                                    value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                    className="w-full bg-slate-50/50 hover:bg-slate-50 border border-[#dddddd] rounded-[8px] px-3.5 py-2.5 text-xs font-semibold text-[#222222] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'policies' && (
                                    <div className="space-y-6 animate-in fade-in duration-200">
                                        <div className="px-4 py-3 -mx-4 border-b border-[#dddddd] mb-4 flex items-center space-x-2">
                                            <Clock className="w-4.5 h-4.5 text-blue-500" />
                                            <h3 className="text-sm font-bold text-[#222222]">Kebijakan waktu</h3>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                                            <div>
                                                <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Jam check-in default</label>
                                                <input 
                                                    type="time"
                                                    required
                                                    value={checkInTime}
                                                    onChange={(e) => setCheckInTime(e.target.value)}
                                                    className="w-full bg-slate-50/50 hover:bg-slate-50 border border-[#dddddd] rounded-[8px] px-3.5 py-2.5 text-xs font-semibold text-[#222222] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 font-mono tabular-nums"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-[#6a6a6a] mb-1.5">Jam check-out default</label>
                                                <input 
                                                    type="time"
                                                    required
                                                    value={checkOutTime}
                                                    onChange={(e) => setCheckOutTime(e.target.value)}
                                                    className="w-full bg-slate-50/50 hover:bg-slate-50 border border-[#dddddd] rounded-[8px] px-3.5 py-2.5 text-xs font-semibold text-[#222222] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 font-mono tabular-nums"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'tax_fees' && (
                                    <div className="space-y-6 animate-in fade-in duration-200">
                                        <div className="px-4 py-3 -mx-4 border-b border-[#dddddd] mb-4 flex items-center space-x-2">
                                            <Percent className="w-4.5 h-4.5 text-blue-500" />
                                            <h3 className="text-sm font-bold text-[#222222]">Biaya & Pajak</h3>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Persentase Pajak (%)</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number"
                                                        required
                                                        min="0"
                                                        max="100"
                                                        value={taxPercentage}
                                                        onChange={(e) => setTaxPercentage(Number(e.target.value))}
                                                        className="w-full bg-slate-50/50 hover:bg-slate-50 border border-[#dddddd] rounded-[8px] pl-3.5 pr-8 py-2.5 text-xs font-semibold text-[#222222] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 font-mono"
                                                    />
                                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-1.5 font-normal">Pajak ini akan dikalkulasikan secara otomatis dari harga sewa dasar villa saat checkout tamu.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ARCHIVED: Midtrans payment gateway settings (belum diaktifkan) */}
                                {activeTab === 'payment' && (
                                    <div className="space-y-6 animate-in fade-in duration-200">
                                        <div className="px-4 py-3 -mx-4 border-b border-[#dddddd] mb-4 flex items-center space-x-2">
                                            <CreditCard className="w-4.5 h-4.5 text-blue-500" />
                                            <h3 className="text-sm font-bold text-[#222222]">Gateway Pembayaran</h3>
                                        </div>
                                        <div className="bg-amber-50 border border-amber-200 rounded-[8px] p-4 text-xs text-amber-800 font-medium">
                                            Integrasi payment gateway (Midtrans) belum diaktifkan. Saat ini platform menggunakan transfer manual dan QRIS.
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer - Save settings */}
                            <div className="pt-8 border-t border-[#dddddd] flex items-center justify-end mt-12">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-5 rounded-[8px] transition-all duration-200 flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Menyimpan pengaturan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Simpan pengaturan</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="px-4 py-3 -mx-4 border-b border-[#dddddd] mb-4 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <SlidersHorizontal className="w-4.5 h-4.5 text-blue-500" />
                                    <h3 className="text-sm font-bold text-[#222222]">Metode Pembayaran Manual</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddMethod}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs p-2 sm:px-3 sm:py-1.5 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer shrink-0"
                                    title="Tambah Rekening"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Tambah Rekening</span>
                                </button>
                            </div>

                            {loadingMethods ? (
                                <div className="flex justify-center items-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                </div>
                            ) : paymentMethods.length === 0 ? (
                                <div className="text-center py-20 border border-dashed border-slate-200 rounded-[14px]">
                                    <p className="text-slate-500 text-xs font-semibold">Belum ada metode pembayaran manual yang diatur.</p>
                                    <p className="text-slate-500 text-[10px] mt-1">Klik tombol di atas untuk menambahkan rekening bank baru.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {paymentMethods.map((method) => (
                                        <div key={method.id} className="border border-slate-200 rounded-[14px] p-4 bg-white hover:shadow-sm transition-all flex items-start justify-between">
                                            <div className="flex items-start space-x-3.5">
                                                <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0">
                                                    {method.logo_url ? (
                                                        <img src={method.logo_url} alt={method.name} className="w-full h-full object-contain" />
                                                    ) : method.code === 'qris' ? (
                                                        <Smartphone className="w-6 h-6 text-slate-400" />
                                                    ) : (
                                                        <Building className="w-6 h-6 text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="text-xs space-y-1">
                                                    <h4 className="font-extrabold text-[#222222]">{method.name}</h4>
                                                    {method.code === 'qris' ? (
                                                        <>
                                                            <p className="text-slate-500 text-[11px] font-semibold">QRIS — {method.account_name}</p>
                                                            <div className="text-[10px] text-slate-405 mt-1 font-semibold">Biaya Admin: <span className="font-bold text-slate-700">{formatPrice(method.admin_fee || 0)}</span></div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="text-slate-500 font-mono text-[11px] font-semibold">{method.account_number}</p>
                                                            <p className="text-slate-500 text-[10px] font-medium">a.n. <span className="font-bold text-slate-800">{method.account_name}</span></p>
                                                            <div className="text-[10px] text-slate-405 mt-1 font-semibold">Biaya Admin: <span className="font-bold text-slate-700">{formatPrice(method.admin_fee || 0)}</span></div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col items-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleMethodStatus(method)}
                                                    className="focus:outline-none cursor-pointer active:scale-90 transition-transform duration-200"
                                                    title={method.is_active ? 'Klik untuk Nonaktifkan' : 'Klik untuk Aktifkan'}
                                                >
                                                    {method.is_active ? (
                                                        <ToggleRight className="w-9 h-6 text-blue-600" />
                                                    ) : (
                                                        <ToggleLeft className="w-9 h-6 text-slate-300" />
                                                    )}
                                                </button>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEditMethod(method)}
                                                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Edit Rekening"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteMethod(method.id)}
                                                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Hapus Rekening"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* React Modal Overlay for Payment Methods CRUD */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white border border-[#dddddd] rounded-[14px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                            
                            {/* Modal Header */}
                            <div className="px-4 sm:px-6 py-4 border-b border-[#dddddd] flex items-center justify-between">
                                <h3 className="text-sm font-bold text-[#222222] uppercase tracking-wide">
                                    {editingMethod 
                                        ? `Ubah ${methodCode === 'qris' ? 'Metode' : 'Rekening'} Pembayaran`
                                        : `Tambah ${methodCode === 'qris' ? 'Metode' : 'Rekening'} Pembayaran`}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
                                >
                                    <X className="w-4.5 h-4.5" />
                                </button>
                            </div>

                            {/* Modal Form */}
                            <form onSubmit={handleSaveMethodSubmit} className="p-4 sm:p-6 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                                    
                                    <div className="sm:col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Metode / Bank *</label>
                                        <input 
                                            type="text"
                                            required
                                            value={methodName}
                                            onChange={(e) => setMethodName(e.target.value)}
                                            placeholder="Contoh: Bank Central Asia (BCA)"
                                            className="w-full bg-slate-50/50 hover:bg-slate-50 border border-[#dddddd] rounded-lg px-3 py-2 text-xs font-semibold text-[#222222] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kode Unik (Slug) *</label>
                                        <input 
                                            type="text"
                                            required
                                            value={methodCode}
                                            onChange={(e) => setMethodCode(e.target.value)}
                                            placeholder="bca"
                                            className="w-full bg-slate-50/50 hover:bg-slate-50 border border-[#dddddd] rounded-lg px-3 py-2 text-xs font-semibold text-[#222222] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                                        />
                                    </div>

                                    {methodCode.trim().toLowerCase() !== 'qris' && (
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nomor Rekening *</label>
                                            <input 
                                                type="text"
                                                required
                                                value={accountNumber}
                                                onChange={(e) => setAccountNumber(e.target.value)}
                                                placeholder="8019208392"
                                                className="w-full bg-slate-50/50 hover:bg-slate-50 border border-[#dddddd] rounded-lg px-3 py-2 text-xs font-semibold text-[#222222] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                                            />
                                        </div>
                                    )}

                                    <div className="sm:col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                            {methodCode.trim().toLowerCase() === 'qris' ? 'Nama Merchant *' : 'Atas Nama (Account Holder) *'}
                                        </label>
                                        <input 
                                            type="text"
                                            required
                                            value={accountName}
                                            onChange={(e) => setAccountName(e.target.value)}
                                            placeholder={methodCode.trim().toLowerCase() === 'qris' ? 'MERCHANT NAMA' : 'PT PUSAT VILLA INDONESIA'}
                                            className="w-full bg-slate-50/50 hover:bg-slate-50 border border-[#dddddd] rounded-lg px-3 py-2 text-xs font-semibold text-[#222222] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Biaya Admin (Rupiah) *</label>
                                        <input 
                                            type="number"
                                            required
                                            min="0"
                                            value={adminFee}
                                            onChange={(e) => setAdminFee(Number(e.target.value))}
                                            placeholder="Contoh: 2500"
                                            className="w-full bg-slate-50/50 hover:bg-slate-50 border border-[#dddddd] rounded-lg px-3 py-2 text-xs font-semibold text-[#222222] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                                        />
                                    </div>

                                    {/* Logo Upload — only for QRIS */}
                                    {methodCode.trim().toLowerCase() === 'qris' && (
                                    <div className="sm:col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                            Upload QR Code
                                        </label>
                                        <div className="flex items-center space-x-4">
                                            <div className="w-14 h-14 border border-slate-200 rounded-lg bg-slate-50 overflow-hidden flex items-center justify-center p-2 relative flex-shrink-0">
                                                {logoUrl ? (
                                                    <img src={logoUrl} alt="QR Code" className="w-full h-full object-contain" />
                                                ) : (
                                                    <Smartphone className="w-6 h-6 text-slate-300" />
                                                )}
                                                {uploadingLogo && (
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="space-y-1.5 flex-1 font-semibold">
                                                <label className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-3 py-2 rounded-lg inline-flex items-center space-x-1 cursor-pointer transition-colors">
                                                    <Upload className="w-3.5 h-3.5" />
                                                    <span>Unggah QR Code</span>
                                                    <input 
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleLogoUpload}
                                                        className="hidden"
                                                        disabled={uploadingLogo}
                                                    />
                                                </label>
                                                {logoUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setLogoUrl('')}
                                                        className="text-[10px] text-red-500 hover:text-red-700 font-bold ml-2.5 transition-colors cursor-pointer font-semibold"
                                                    >
                                                        Hapus
                                                    </button>
                                                )}
                                                <p className="text-[9px] text-slate-400 font-normal">Upload gambar QR Code (PNG/JPG).</p>
                                            </div>
                                        </div>
                                    </div>
                                    )}

                                    {/* Is Active */}
                                    <div className="sm:col-span-2 flex items-center space-x-2 pt-2">
                                        <input 
                                            type="checkbox"
                                            id="methodIsActive"
                                            checked={methodIsActive}
                                            onChange={(e) => setMethodIsActive(e.target.checked)}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                        />
                                        <label htmlFor="methodIsActive" className="text-xs font-semibold text-[#222222] select-none cursor-pointer">
                                            Aktifkan Metode (Tampilkan langsung sebagai opsi checkout tamu)
                                        </label>
                                    </div>
                                </div>

                                {/* Modal Actions */}
                                <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md transition-all cursor-pointer"
                                    >
                                        {editingMethod ? 'Simpan Rekening' : 'Tambah Rekening'}
                                    </button>
                                </div>
                            </form>

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
