'use client';

import React, { useEffect, useState } from 'react';
import axiosClient from '@/lib/axios';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import { 
    Plus, 
    Loader2, 
    Search,
    X,
    Shield,
    UserCog,
    Trash2,
    Key,
    LogOut,
    Check
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: string;
    permissions: string[];
    active_sessions: number;
    created_at: string;
}

interface PermissionGroup {
    [key: string]: string[];
}

export default function AdminUsersPage() {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [availablePermissions, setAvailablePermissions] = useState<PermissionGroup>({});
    const [submitting, setSubmitting] = useState(false);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get('/admin/admins');
            setAdmins(response.data.data || []);
        } catch (err) {
            console.error('Failed to load admins:', err);
            toast.error('Gagal memuat daftar admin.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissions = async () => {
        try {
            const response = await axiosClient.get('/admin/permissions');
            setAvailablePermissions(response.data.permissions || {});
        } catch (err) {
            console.error('Failed to load permissions:', err);
        }
    };

    useEffect(() => {
        fetchAdmins();
        fetchPermissions();
    }, []);

    const handleOpenCreate = () => {
        setEditingId(null);
        setName('');
        setEmail('');
        setPassword('');
        setSelectedPermissions([]);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (admin: AdminUser) => {
        setEditingId(admin.id);
        setName(admin.name);
        setEmail(admin.email);
        setPassword('');
        setSelectedPermissions(admin.permissions || []);
        setIsModalOpen(true);
    };

    const togglePermission = (perm: string) => {
        setSelectedPermissions(prev =>
            prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) {
            toast.error('Nama dan email wajib diisi.');
            return;
        }
        if (!editingId && !password.trim()) {
            toast.error('Password wajib diisi untuk admin baru.');
            return;
        }

        setSubmitting(true);
        const payload: any = {
            name: name.trim(),
            email: email.trim(),
            permissions: selectedPermissions,
        };
        if (password.trim()) payload.password = password;

        try {
            if (editingId) {
                await axiosClient.put(`/admin/admins/${editingId}`, payload);
                toast.success('Admin berhasil diperbarui.');
            } else {
                await axiosClient.post('/admin/admins', payload);
                toast.success('Admin baru berhasil ditambahkan.');
            }
            setIsModalOpen(false);
            fetchAdmins();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Gagal menyimpan admin.';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (admin: AdminUser) => {
        if (!confirm(`Hapus admin "${admin.name}" (${admin.email})?`)) return;
        try {
            await axiosClient.delete(`/admin/admins/${admin.id}`);
            toast.success('Admin berhasil dihapus.');
            fetchAdmins();
        } catch (err) {
            toast.error('Gagal menghapus admin.');
        }
    };

    const handleRevokeSessions = async (admin: AdminUser) => {
        if (!confirm(`Putuskan semua sesi aktif ${admin.name}?`)) return;
        try {
            await axiosClient.delete(`/admin/admins/${admin.id}/sessions`);
            toast.success('Semua sesi admin diputuskan.');
            fetchAdmins();
        } catch (err) {
            toast.error('Gagal memutuskan sesi.');
        }
    };

    const filteredAdmins = admins.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-3xl font-black text-[#222222] tracking-tight">Manajemen Admin</h1>
                    <p className="text-[#6a6a6a] text-xs mt-1.5 font-medium">
                        Kelola akun administrator untuk mengakses panel.
                    </p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs p-2.5 sm:px-5 sm:py-3 rounded-[8px] transition-all duration-200 flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer shrink-0"
                >
                    <Plus className="w-4.5 h-4.5" />
                    <span className="hidden sm:inline">Tambah Admin</span>
                </button>
            </div>

            <div className="flex items-center bg-white border border-[#dddddd] rounded-[8px] px-4 py-2.5 max-w-md transition-colors focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                <Search className="w-4 h-4 text-slate-500 mr-2.5 flex-shrink-0" />
                <input
                    type="text"
                    placeholder="Cari admin berdasarkan nama atau email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none text-xs text-[#222222] placeholder-slate-400 focus:outline-none focus:ring-0 p-0"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer">
                        <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredAdmins.map(admin => (
                        <div key={admin.id} className="bg-white border border-[#dddddd] rounded-[14px] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                                    {admin.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-[#222222]">{admin.name}</span>
                                        <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">Admin</span>
                                    </div>
                                    <span className="text-xs text-slate-500">{admin.email}</span>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {admin.permissions.length} izin
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {admin.active_sessions} sesi aktif
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:flex-shrink-0">
                                <button
                                    onClick={() => handleOpenEdit(admin)}
                                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                                    title="Edit"
                                >
                                    <UserCog className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleRevokeSessions(admin)}
                                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
                                    title="Putuskan sesi"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(admin)}
                                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                                    title="Hapus"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredAdmins.length === 0 && (
                        <div className="text-center py-16 text-slate-400 text-sm font-medium">
                            Tidak ada admin ditemukan.
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-base font-bold text-[#222222]">
                                {editingId ? 'Edit Admin' : 'Tambah Admin Baru'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-full cursor-pointer">
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Nama Lengkap</label>
                                <input type="text" required value={name} onChange={e => setName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Email</label>
                                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                                    Password {editingId ? '(kosongkan jika tidak diubah)' : ''}
                                </label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-2">Izin Akses</label>
                                <div className="space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
                                    {Object.entries(availablePermissions).map(([group, perms]) => (
                                        <div key={group}>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                                                {group.replace('_', ' ')}
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {perms.map(perm => {
                                                    const isSelected = selectedPermissions.includes(perm);
                                                    return (
                                                        <button
                                                            key={perm}
                                                            type="button"
                                                            onClick={() => togglePermission(perm)}
                                                            className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                                                                isSelected
                                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                                            }`}
                                                        >
                                                            {isSelected && <Check className="w-3 h-3" />}
                                                            {perm.split('.').pop()}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer">
                                    Batal
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {editingId ? 'Simpan' : 'Tambah Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
