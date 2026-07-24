'use client';

import React, { useEffect, useState } from 'react';
import axiosClient from '@/lib/axios';
import { Voucher } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatPrice } from '@/lib/format';
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import {
    Plus,
    Tag,
    Percent,
    Loader2,
    Edit,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Copy,
    Check,
    Search,
    X,
    Calendar,
    Infinity,
    AlertTriangle,
    Gift,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminVouchersPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formCode, setFormCode] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [formDiscountValue, setFormDiscountValue] = useState('');
    const [formMaxDiscount, setFormMaxDiscount] = useState('');
    const [formMinBooking, setFormMinBooking] = useState('');
    const [formUsageLimit, setFormUsageLimit] = useState('');
    const [formValidFrom, setFormValidFrom] = useState('');
    const [formValidUntil, setFormValidUntil] = useState('');
    const [formIsActive, setFormIsActive] = useState(true);
    const [formErrors, setFormErrors] = useState<any>({});

    const fetchVouchers = async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get('/admin/vouchers');
            setVouchers(response.data || []);
        } catch (err) {
            console.error('Failed to load vouchers:', err);
            toast.error('Gagal memuat daftar voucher.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, []);

    const resetForm = () => {
        setFormCode('');
        setFormDescription('');
        setFormDiscountType('percentage');
        setFormDiscountValue('');
        setFormMaxDiscount('');
        setFormMinBooking('');
        setFormUsageLimit('');
        setFormValidFrom('');
        setFormValidUntil('');
        setFormIsActive(true);
        setFormErrors({});
        setEditingVoucher(null);
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (voucher: Voucher) => {
        setEditingVoucher(voucher);
        setFormCode(voucher.code);
        setFormDescription(voucher.description || '');
        setFormDiscountType(voucher.discount_type);
        setFormDiscountValue(String(voucher.discount_value));
        setFormMaxDiscount(voucher.max_discount ? String(voucher.max_discount) : '');
        setFormMinBooking(voucher.min_booking_amount ? String(voucher.min_booking_amount) : '');
        setFormUsageLimit(voucher.usage_limit ? String(voucher.usage_limit) : '');
        setFormValidFrom(voucher.valid_from ? format(parseISO(voucher.valid_from), "yyyy-MM-dd'T'HH:mm") : '');
        setFormValidUntil(voucher.valid_until ? format(parseISO(voucher.valid_until), "yyyy-MM-dd'T'HH:mm") : '');
        setFormIsActive(voucher.is_active);
        setFormErrors({});
        setShowModal(true);
    };

    const handleSave = async () => {
        const errors: any = {};
        if (!formCode.trim()) errors.code = 'Kode voucher wajib diisi.';
        if (!formDiscountValue.trim() || Number(formDiscountValue) < 1) errors.discount_value = 'Nilai diskon wajib diisi dan minimal 1.';
        if (formDiscountType === 'percentage' && Number(formDiscountValue) > 100) errors.discount_value = 'Diskon persentase maksimal 100%.';
        if (formMaxDiscount && Number(formMaxDiscount) < 0) errors.max_discount = 'Maks diskon tidak boleh negatif.';
        if (formValidFrom && formValidUntil && new Date(formValidFrom) > new Date(formValidUntil)) {
            errors.valid_until = 'Tanggal akhir tidak boleh sebelum tanggal mulai.';
        }

        setFormErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setSaving(true);
        try {
            const payload: any = {
                code: formCode.toUpperCase().trim(),
                description: formDescription.trim() || null,
                discount_type: formDiscountType,
                discount_value: Number(formDiscountValue),
                max_discount: formMaxDiscount ? Number(formMaxDiscount) : null,
                min_booking_amount: formMinBooking ? Number(formMinBooking) : 0,
                usage_limit: formUsageLimit ? Number(formUsageLimit) : null,
                valid_from: formValidFrom || null,
                valid_until: formValidUntil || null,
                is_active: formIsActive,
            };

            if (editingVoucher) {
                await axiosClient.put(`/admin/vouchers/${editingVoucher.id}`, payload);
                toast.success('Voucher berhasil diperbarui.');
            } else {
                await axiosClient.post('/admin/vouchers', payload);
                toast.success('Voucher berhasil dibuat.');
            }

            setShowModal(false);
            resetForm();
            fetchVouchers();
        } catch (err: any) {
            const errMsg = err.response?.data?.message || 'Gagal menyimpan voucher.';
            const errData = err.response?.data?.errors;
            if (errData) {
                setFormErrors(Object.fromEntries(Object.entries(errData).map(([k, v]) => [k, (v as string[])[0]])));
            } else {
                toast.error(errMsg);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (voucher: Voucher) => {
        if (!confirm(`Hapus voucher "${voucher.code}"? Tindakan ini tidak dapat dibatalkan.`)) return;
        try {
            await axiosClient.delete(`/admin/vouchers/${voucher.id}`);
            toast.success('Voucher berhasil dihapus.');
            fetchVouchers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menghapus voucher.');
        }
    };

    const handleToggleActive = async (voucher: Voucher) => {
        try {
            await axiosClient.patch(`/admin/vouchers/${voucher.id}/toggle-active`);
            toast.success(`Voucher "${voucher.code}" ${voucher.is_active ? 'dinonaktifkan' : 'diaktifkan'}.`);
            fetchVouchers();
        } catch (err) {
            toast.error('Gagal mengubah status voucher.');
        }
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            toast.success('Kode voucher disalin ke clipboard.');
        }).catch(() => {
            toast.error('Gagal menyalin kode.');
        });
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        try {
            return format(parseISO(dateStr), 'dd MMM yyyy', { locale: localeID });
        } catch {
            return dateStr;
        }
    };

    const formatDateTime = (dateStr: string | null) => {
        if (!dateStr) return '—';
        try {
            return format(parseISO(dateStr), 'dd MMM yyyy HH:mm', { locale: localeID });
        } catch {
            return dateStr;
        }
    };

    const voucherStatus = (v: Voucher) => {
        if (!v.is_active) return { label: 'Nonaktif', color: 'text-slate-400 bg-slate-100' };
        const now = new Date();
        if (v.valid_from && new Date(v.valid_from) > now) return { label: 'Akan Datang', color: 'text-amber-600 bg-amber-50' };
        if (v.valid_until && new Date(v.valid_until) < now) return { label: 'Kadaluarsa', color: 'text-red-600 bg-red-50' };
        if (v.usage_limit !== null && v.used_count >= v.usage_limit) return { label: 'Habis', color: 'text-red-600 bg-red-50' };
        return { label: 'Aktif', color: 'text-emerald-600 bg-emerald-50' };
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#dddddd] pb-5">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#222222] tracking-tight">Voucher Diskon</h1>
                    <p className="text-[#6a6a6a] text-sm mt-1">Kelola kode promo dan voucher diskon untuk pemesanan villa.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs p-2.5 sm:px-4 sm:py-2.5 rounded-[8px] transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
                >
                    <Plus className="w-4.5 h-4.5" />
                    <span className="hidden sm:inline">Tambah Voucher Baru</span>
                </button>
            </div>

            {/* Voucher List */}
            <div className="bg-white border border-[#dddddd] rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] overflow-hidden">
                {loading ? (
                    <LoadingSpinner fullPage={false} />
                ) : vouchers.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Tag className="w-7 h-7 text-blue-500" />
                        </div>
                        <p className="text-slate-500 text-sm mb-4">Belum ada voucher diskon.</p>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-[8px] cursor-pointer"
                        >
                            Buat Voucher Pertama
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-[#dddddd]">
                            {vouchers.map((v) => {
                                const status = voucherStatus(v);
                                return (
                                    <div key={v.id} className="p-4 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 bg-blue-50 rounded-[10px] flex items-center justify-center">
                                                    <Tag className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#222222] text-sm font-mono">{v.code}</p>
                                                    {v.description && (
                                                        <p className="text-[11px] text-slate-500">{v.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs">
                                            <span className="font-bold text-blue-600">
                                                {v.discount_type === 'percentage'
                                                    ? `${v.discount_value}%`
                                                    : formatPrice(v.discount_value)}
                                                {v.discount_type === 'percentage' && v.max_discount && (
                                                    <span className="text-slate-400 font-normal"> (max {formatPrice(v.max_discount)})</span>
                                                )}
                                            </span>
                                            {v.min_booking_amount > 0 && (
                                                <span className="text-slate-400">Min. {formatPrice(v.min_booking_amount)}</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                            <span>Digunakan {v.used_count}x</span>
                                            {v.usage_limit !== null && (
                                                <span> / {v.usage_limit}x</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                            {v.valid_from && <span>Mulai {formatDateTime(v.valid_from)}</span>}
                                            {v.valid_until && <span>· Sampai {formatDateTime(v.valid_until)}</span>}
                                        </div>

                                        <div className="flex items-center justify-between pt-1 border-t border-[#dddddd]">
                                            <button
                                                onClick={() => handleToggleActive(v)}
                                                className="cursor-pointer active:scale-90 transition-transform"
                                                title={v.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                            >
                                                {v.is_active ? (
                                                    <ToggleRight className="w-9 h-6 text-blue-600" />
                                                ) : (
                                                    <ToggleLeft className="w-9 h-6 text-slate-300" />
                                                )}
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleCopyCode(v.code)}
                                                    className="p-1.5 rounded-[8px] bg-[#f7f7f7] hover:bg-[#eeeeee] border border-[#dddddd] transition-all active:scale-90 cursor-pointer"
                                                    title="Salin Kode"
                                                >
                                                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(v)}
                                                    className="p-1.5 rounded-[8px] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all active:scale-90 cursor-pointer"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-3.5 h-3.5 text-blue-600" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(v)}
                                                    className="p-1.5 rounded-[8px] bg-red-50 hover:bg-red-100 border border-red-200 transition-all active:scale-90 cursor-pointer"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-600 border-collapse">
                                <thead>
                                    <tr className="border-b border-[#dddddd] bg-[#f7f7f7] text-slate-500 uppercase font-bold text-[11px] sm:text-xs tracking-wider">
                                        <th className="py-4 px-6">Kode</th>
                                        <th className="py-4 px-6">Keterangan</th>
                                        <th className="py-4 px-6">Diskon</th>
                                        <th className="py-4 px-6">Min. Booking</th>
                                        <th className="py-4 px-6">Pemakaian</th>
                                        <th className="py-4 px-6">Masa Berlaku</th>
                                        <th className="py-4 px-6">Status</th>
                                        <th className="py-4 px-6 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vouchers.map((v) => {
                                        const status = voucherStatus(v);
                                        return (
                                            <tr key={v.id} className="border-b border-[#dddddd] hover:bg-[#f7f7f7] transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-blue-50 rounded-[8px] flex items-center justify-center">
                                                            <Tag className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <span className="font-bold text-[#222222] font-mono text-sm">{v.code}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="text-sm text-slate-600">{v.description || '—'}</span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="font-bold text-blue-600">
                                                        {v.discount_type === 'percentage' ? `${v.discount_value}%` : formatPrice(v.discount_value)}
                                                    </span>
                                                    {v.discount_type === 'percentage' && v.max_discount && (
                                                        <span className="text-xs text-slate-400 block">max {formatPrice(v.max_discount)}</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {v.min_booking_amount > 0
                                                        ? formatPrice(v.min_booking_amount)
                                                        : <span className="text-slate-300">—</span>}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="font-semibold">{v.used_count}</span>
                                                    {v.usage_limit !== null && (
                                                        <span className="text-slate-400"> / {v.usage_limit}</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="text-xs space-y-0.5">
                                                        {v.valid_from && (
                                                            <span className="text-slate-500">Mulai {formatDateTime(v.valid_from)}</span>
                                                        )}
                                                        {v.valid_until && (
                                                            <div>
                                                                <span className="text-slate-500">Sampai {formatDateTime(v.valid_until)}</span>
                                                            </div>
                                                        )}
                                                        {!v.valid_from && !v.valid_until && (
                                                            <span className="text-slate-300 flex items-center gap-1">
                                                                <Infinity className="w-3 h-3" /> Tidak terbatas
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => handleToggleActive(v)}
                                                            className="p-1.5 rounded-[8px] bg-[#f7f7f7] hover:bg-[#eeeeee] border border-[#dddddd] transition-all active:scale-90 cursor-pointer"
                                                            title={v.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                        >
                                                            {v.is_active ? (
                                                                <ToggleRight className="w-4 h-4 text-blue-600" />
                                                            ) : (
                                                                <ToggleLeft className="w-4 h-4 text-slate-400" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleCopyCode(v.code)}
                                                            className="p-1.5 rounded-[8px] bg-[#f7f7f7] hover:bg-[#eeeeee] border border-[#dddddd] transition-all active:scale-90 cursor-pointer"
                                                            title="Salin Kode"
                                                        >
                                                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                                                        </button>
                                                        <button
                                                            onClick={() => openEditModal(v)}
                                                            className="p-1.5 rounded-[8px] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all active:scale-90 cursor-pointer"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-3.5 h-3.5 text-blue-600" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(v)}
                                                            className="p-1.5 rounded-[8px] bg-red-50 hover:bg-red-100 border border-red-200 transition-all active:scale-90 cursor-pointer"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Modal Create/Edit */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-[20px] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-[#dddddd]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-[10px] flex items-center justify-center">
                                    <Gift className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-[#222222] text-lg">
                                        {editingVoucher ? 'Edit Voucher' : 'Buat Voucher Baru'}
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        {editingVoucher ? 'Ubah pengaturan voucher' : 'Buat kode promo diskon untuk pemesanan'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setShowModal(false); resetForm(); }}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                            >
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Kode Voucher */}
                            <div>
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                                    Kode Voucher <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formCode}
                                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                                    placeholder="CONTOH50"
                                    className="w-full border border-[#dddddd] rounded-[10px] px-3.5 py-2.5 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                                {formErrors.code && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.code}</p>}
                            </div>

                            {/* Deskripsi */}
                            <div>
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Deskripsi</label>
                                <input
                                    type="text"
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    placeholder="Diskon spesial untuk pengguna baru"
                                    className="w-full border border-[#dddddd] rounded-[10px] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            {/* Tipe & Nilai Diskon */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                                        Tipe <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formDiscountType}
                                        onChange={(e) => setFormDiscountType(e.target.value as 'percentage' | 'fixed')}
                                        className="w-full border border-[#dddddd] rounded-[10px] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        <option value="percentage">Persentase (%)</option>
                                        <option value="fixed">Nominal (Rp)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                                        Nilai <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={formDiscountValue}
                                            onChange={(e) => setFormDiscountValue(e.target.value)}
                                            placeholder={formDiscountType === 'percentage' ? '10' : '50000'}
                                            min="1"
                                            className="w-full border border-[#dddddd] rounded-[10px] px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                                            {formDiscountType === 'percentage' ? '%' : 'Rp'}
                                        </span>
                                    </div>
                                    {formErrors.discount_value && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.discount_value}</p>}
                                </div>
                            </div>

                            {/* Maks Diskon (for percentage) */}
                            {formDiscountType === 'percentage' && (
                                <div>
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                                        Maksimum Diskon (Rp) <span className="text-slate-400 font-normal normal-case">— opsional</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formMaxDiscount}
                                        onChange={(e) => setFormMaxDiscount(e.target.value)}
                                        placeholder="100000"
                                        min="0"
                                        className="w-full border border-[#dddddd] rounded-[10px] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Batas maksimal nominal diskon. Biarkan kosong untuk tanpa batas.</p>
                                </div>
                            )}

                            {/* Minimum Booking */}
                            <div>
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                                    Minimum Pemesanan (Rp) <span className="text-slate-400 font-normal normal-case">— opsional</span>
                                </label>
                                <input
                                    type="number"
                                    value={formMinBooking}
                                    onChange={(e) => setFormMinBooking(e.target.value)}
                                    placeholder="200000"
                                    min="0"
                                    className="w-full border border-[#dddddd] rounded-[10px] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            {/* Limit Pemakaian */}
                            <div>
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                                    Batas Pemakaian <span className="text-slate-400 font-normal normal-case">— opsional, kosongkan untuk tidak terbatas</span>
                                </label>
                                <input
                                    type="number"
                                    value={formUsageLimit}
                                    onChange={(e) => setFormUsageLimit(e.target.value)}
                                    placeholder="100"
                                    min="1"
                                    className="w-full border border-[#dddddd] rounded-[10px] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            {/* Masa Berlaku */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                                        Berlaku Mulai <span className="text-slate-400 font-normal normal-case">— opsional</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formValidFrom}
                                        onChange={(e) => setFormValidFrom(e.target.value)}
                                        className="w-full border border-[#dddddd] rounded-[10px] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                                        Berlaku Sampai <span className="text-slate-400 font-normal normal-case">— opsional</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formValidUntil}
                                        onChange={(e) => setFormValidUntil(e.target.value)}
                                        className="w-full border border-[#dddddd] rounded-[10px] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    {formErrors.valid_until && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.valid_until}</p>}
                                </div>
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center justify-between pt-2">
                                <div>
                                    <p className="text-sm font-bold text-[#222222]">Aktif</p>
                                    <p className="text-[11px] text-slate-500">Voucher dapat digunakan jika aktif</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormIsActive(!formIsActive)}
                                    className="cursor-pointer active:scale-90 transition-transform"
                                >
                                    {formIsActive ? (
                                        <ToggleRight className="w-10 h-6 text-blue-600" />
                                    ) : (
                                        <ToggleLeft className="w-10 h-6 text-slate-300" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#dddddd] bg-[#f7f7f7] rounded-b-[20px]">
                            <button
                                onClick={() => { setShowModal(false); resetForm(); }}
                                className="px-4 py-2.5 rounded-[10px] text-sm font-bold text-slate-600 hover:bg-white border border-[#dddddd] transition-all cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2.5 rounded-[10px] text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {editingVoucher ? 'Simpan Perubahan' : 'Buat Voucher'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
