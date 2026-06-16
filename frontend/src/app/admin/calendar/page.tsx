'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axiosClient from '@/lib/axios';
import { Villa, Booking, BlockedDate } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
    format, 
    parseISO, 
    startOfMonth, 
    endOfMonth, 
    eachDayOfInterval, 
    addMonths, 
    subMonths,
    isSameDay,
    startOfDay
} from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { 
    Calendar as CalendarIcon, 
    ChevronLeft, 
    ChevronRight, 
    Loader2, 
    User, 
    Phone, 
    Info, 
    Lock,
    X,
    MessageSquare,
    Eye,
    Search,
    Check
} from 'lucide-react';
import { toast } from 'sonner';

const getErrorMessage = (err: any, fallback: string): string => {
    if (err.response?.data?.message) {
        return err.response.data.message;
    }
    if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const firstKey = Object.keys(errors)[0];
        if (firstKey && Array.isArray(errors[firstKey]) && errors[firstKey].length > 0) {
            return errors[firstKey][0];
        }
    }
    return fallback;
};

export default function AdminCalendarPage() {
    const [villas, setVillas] = useState<Villa[]>([]);
    const [selectedVillaId, setSelectedVillaId] = useState<string>('');
    const [loadingVillas, setLoadingVillas] = useState(true);
    
    // Calendar month focus state
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Search query in sidebar
    const [searchQuery, setSearchQuery] = useState('');

    // Bulk Select Mode states
    const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [bulkBlockReason, setBulkBlockReason] = useState('');
    const [bulkSubmitting, setBulkSubmitting] = useState(false);

    // Selected Villa schedules
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    // Detail Panel state
    const [selectedSlot, setSelectedSlot] = useState<{
        type: 'booking' | 'blocked' | 'free';
        data: any;
    } | null>(null);

    // Single-date block reason
    const [quickBlockReason, setQuickBlockReason] = useState('');
    const [blockingDate, setBlockingDate] = useState(false);

    useEffect(() => {
        const fetchVillas = async () => {
            try {
                const response = await axiosClient.get('/admin/villas');
                const list = response.data || [];
                setVillas(list);
                if (list.length > 0) {
                    setSelectedVillaId(String(list[0].id));
                }
            } catch (err) {
                console.error('Failed to load villas:', err);
                toast.error('Gagal memuat daftar villa.');
            } finally {
                setLoadingVillas(false);
            }
        };

        fetchVillas();
    }, []);

    const fetchVillaSchedules = async () => {
        if (!selectedVillaId) return;
        setLoadingData(true);
        try {
            const bookingsRes = await axiosClient.get('/admin/bookings', {
                params: { villa_id: selectedVillaId, limit: 100 }
            });
            const blockedRes = await axiosClient.get('/admin/blocked-dates', {
                params: { villa_id: selectedVillaId }
            });

            setBookings(bookingsRes.data.data || []);
            setBlockedDates(blockedRes.data || []);
            setSelectedSlot(null);
            setSelectedDates([]);
        } catch (err) {
            console.error('Failed to load schedule data:', err);
            toast.error('Gagal memuat jadwal ketersediaan.');
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        fetchVillaSchedules();
    }, [selectedVillaId]);

    const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
    const handleToday = () => setCurrentMonth(new Date());

    const handleInlineBlockSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlot || selectedSlot.type !== 'free') return;

        setBlockingDate(true);
        try {
            await axiosClient.post('/admin/blocked-dates', {
                villa_id: Number(selectedVillaId),
                date: selectedSlot.data.date,
                reason: quickBlockReason || 'Maintenance / Pemeliharaan'
            });

            toast.success('Tanggal berhasil diblokir.');
            setQuickBlockReason('');
            
            // Re-fetch
            const blockedRes = await axiosClient.get('/admin/blocked-dates', {
                params: { villa_id: selectedVillaId }
            });
            const freshBlocks = blockedRes.data || [];
            setBlockedDates(freshBlocks);
            
            // Set details to show the newly blocked date details
            const newBlock = freshBlocks.find((b: any) => b.date === selectedSlot.data.date);
            if (newBlock) {
                setSelectedSlot({ type: 'blocked', data: newBlock });
            } else {
                setSelectedSlot(null);
            }
        } catch (err: any) {
            console.error('Failed to block date:', err);
            toast.error(getErrorMessage(err, 'Gagal memblokir tanggal.'));
        } finally {
            setBlockingDate(false);
        }
    };

    const handleUnblockDate = async (blockedId: number) => {
        try {
            await axiosClient.delete(`/admin/blocked-dates/${blockedId}`);
            toast.success('Pemblokiran tanggal berhasil dibatalkan.');
            setSelectedSlot(null);
            
            const blockedRes = await axiosClient.get('/admin/blocked-dates', {
                params: { villa_id: selectedVillaId }
            });
            setBlockedDates(blockedRes.data || []);
        } catch (err: any) {
            console.error('Failed to unblock date:', err);
            toast.error(getErrorMessage(err, 'Gagal membatalkan pemblokiran.'));
        }
    };

    const handleBulkBlockSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedDates.length === 0) return;

        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const datesToBlock = selectedDates.filter(date => {
            if (date < todayStr) return false;
            const isAlreadyBlocked = blockedDates.some(bd => {
                const bdDateStr = format(parseISO(bd.date), 'yyyy-MM-dd');
                return bdDateStr === date;
            });
            return !isAlreadyBlocked;
        });

        if (datesToBlock.length === 0) {
            toast.error('Tidak ada tanggal masa depan atau tanggal kosong yang valid untuk diblokir.');
            return;
        }

        setBulkSubmitting(true);
        try {
            const promises = datesToBlock.map(date => 
                axiosClient.post('/admin/blocked-dates', {
                    villa_id: Number(selectedVillaId),
                    date: date,
                    reason: bulkBlockReason || 'Maintenance / Pemeliharaan'
                })
            );
            await Promise.all(promises);
            
            toast.success(`${datesToBlock.length} tanggal berhasil diblokir.`);
            setSelectedDates([]);
            setBulkBlockReason('');
            
            const blockedRes = await axiosClient.get('/admin/blocked-dates', {
                params: { villa_id: selectedVillaId }
            });
            setBlockedDates(blockedRes.data || []);
        } catch (err: any) {
            console.error('Failed to bulk block dates:', err);
            toast.error(getErrorMessage(err, 'Gagal memblokir beberapa tanggal.'));
        } finally {
            setBulkSubmitting(false);
        }
    };

    const handleBulkUnblockSubmit = async () => {
        if (selectedDates.length === 0) return;

        setBulkSubmitting(true);
        try {
            const recordsToDelete = blockedDates.filter(bd => {
                const dateStr = format(parseISO(bd.date), 'yyyy-MM-dd');
                return selectedDates.includes(dateStr);
            });

            if (recordsToDelete.length === 0) {
                toast.error('Tidak ada tanggal terblokir yang dipilih.');
                setBulkSubmitting(false);
                return;
            }

            const promises = recordsToDelete.map(bd => 
                axiosClient.delete(`/admin/blocked-dates/${bd.id}`)
            );
            await Promise.all(promises);
            
            toast.success(`${recordsToDelete.length} tanggal berhasil dibuka kuncinya.`);
            setSelectedDates([]);
            
            const blockedRes = await axiosClient.get('/admin/blocked-dates', {
                params: { villa_id: selectedVillaId }
            });
            setBlockedDates(blockedRes.data || []);
        } catch (err: any) {
            console.error('Failed to bulk unblock dates:', err);
            toast.error(getErrorMessage(err, 'Gagal membuka kunci beberapa tanggal.'));
        } finally {
            setBulkSubmitting(false);
        }
    };

    const toggleBulkSelectMode = () => {
        setIsBulkSelectMode(prev => !prev);
        setSelectedDates([]);
        setSelectedSlot(null);
    };

    // Calculate calendar days
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start, end });
    const startDayOfWeek = start.getDay();
    const paddingDaysCount = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    const paddingDays = paddingDaysCount > 0 ? Array(paddingDaysCount).fill(null) : [];
    const calendarGrid = [...paddingDays, ...daysInMonth];

    // Filtered villas in sidebar (matches name and location query)
    const filteredVillas = villas.filter(v => 
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.location && v.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loadingVillas) {
        return (
            <div className="flex justify-center items-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="border-b border-[#dddddd] pb-5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222]">Kalender Jadwal</h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-1.5 font-medium">Pantau lini masa reservasi masuk, jadwal check-in, dan penutupan tanggal sewa secara real-time.</p>
            </div>

            {/* Main 3-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                
                {/* Column 1: Villa Search & List Sidebar (1/4 width) */}
                <div className="lg:col-span-1 bg-white rounded-[14px] p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] border border-[#dddddd] space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pilih Villa ({filteredVillas.length})</label>
                        <div className="relative">
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama atau lokasi..."
                                className="w-full bg-slate-50 border border-[#dddddd] rounded-[8px] pl-9 pr-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                            />
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                        {filteredVillas.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 text-xs">
                                Tidak ada villa yang cocok.
                            </div>
                        ) : (
                            filteredVillas.map(v => {
                                const isSelected = selectedVillaId === String(v.id);
                                return (
                                    <button
                                        key={v.id}
                                        onClick={() => {
                                            setSelectedVillaId(String(v.id));
                                            setSelectedSlot(null);
                                        }}
                                        className={`w-full flex items-center space-x-3 p-3 rounded-[8px] border text-left transition-all duration-300 active:scale-[0.98] cursor-pointer ${
                                            isSelected 
                                                ? 'border-blue-500 bg-blue-50/20 ring-1 ring-blue-500/20 font-bold' 
                                                : 'border-[#dddddd] bg-slate-50/50 hover:bg-slate-50 hover:border-[#dddddd]'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${
                                            isSelected ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'
                                        }`}>
                                            <CalendarIcon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs text-slate-900 block truncate font-bold">{v.name}</span>
                                            <span className="text-[10px] text-slate-500 block truncate">{v.location}</span>
                                        </div>
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${v.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Column 2: Compact Calendar (2/4 width) */}
                <div className="lg:col-span-2 bg-white rounded-[14px] p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] border border-[#dddddd] space-y-4">
                    {/* Calendar Nav bar */}
                    <div className="flex items-center justify-between border-b border-[#dddddd] pb-3 flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                            <CalendarIcon className="w-4.5 h-4.5 text-blue-600 animate-[pulse_3s_infinite]" />
                            <h2 className="text-base font-bold text-slate-800 capitalize">
                                {format(currentMonth, 'MMMM yyyy', { locale: localeID })}
                            </h2>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={toggleBulkSelectMode}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-[8px] border transition-all duration-300 active:scale-[0.98] cursor-pointer ${
                                    isBulkSelectMode 
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                                        : 'bg-white border-[#dddddd] text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                Pilih Banyak Tanggal
                            </button>

                            <div className="flex items-center space-x-1.5 text-xs font-semibold">
                                <button onClick={handlePrevMonth} className="p-1 rounded-[8px] border border-[#dddddd] hover:bg-slate-50 active:scale-[0.98] transition-all duration-300 cursor-pointer">
                                    <ChevronLeft className="w-4 h-4 text-slate-500" />
                                </button>
                                <button onClick={handleToday} className="px-2.5 py-1 rounded-[8px] border border-[#dddddd] hover:bg-slate-50 active:scale-[0.98] transition-all duration-300 cursor-pointer text-[10px] text-slate-700 font-bold">
                                    Hari Ini
                                </button>
                                <button onClick={handleNextMonth} className="p-1 rounded-[8px] border border-[#dddddd] hover:bg-slate-50 active:scale-[0.98] transition-all duration-300 cursor-pointer">
                                    <ChevronRight className="w-4 h-4 text-slate-500" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Weekly headers */}
                    <div className="grid grid-cols-7 gap-1 text-center font-bold text-[9px] text-slate-400 uppercase tracking-wider">
                        <div>Sen</div>
                        <div>Sel</div>
                        <div>Rab</div>
                        <div>Kam</div>
                        <div>Jum</div>
                        <div>Sab</div>
                        <div>Min</div>
                    </div>

                    {/* Calendar Days */}
                    {loadingData ? (
                        <div className="flex justify-center items-center py-24">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 gap-1">
                            {calendarGrid.map((day, idx) => {
                                if (day === null) {
                                    return <div key={`padding-${idx}`} className="h-14 sm:h-16 bg-slate-50/50 rounded-[8px] border border-[#eeeeee]" />;
                                }

                                const dateStr = format(day, 'yyyy-MM-dd');
                                const dayNum = format(day, 'd');
                                const isChecked = selectedDates.includes(dateStr);
                                
                                // Booking interval matches: check_in <= date < check_out
                                const matchedBooking = bookings.find(b => {
                                    const start = startOfDay(parseISO(b.check_in));
                                    const end = startOfDay(parseISO(b.check_out));
                                    const current = startOfDay(day);
                                    
                                    if (start.getTime() === end.getTime()) {
                                        return isSameDay(current, start);
                                    }
                                    return current >= start && current < end;
                                });

                                // Check if blocked
                                const matchedBlocked = blockedDates.find(bd => isSameDay(parseISO(bd.date), day));

                                let cellClass = "bg-white hover:bg-slate-50/50 border border-[#dddddd]";
                                let textClass = "text-slate-800";
                                let labelText = "";
                                
                                const todayStr = format(new Date(), 'yyyy-MM-dd');
                                const isPast = dateStr < todayStr;

                                if (matchedBooking) {
                                    textClass = "text-white font-extrabold";
                                    labelText = matchedBooking.guest_name;
                                    if (matchedBooking.status === 'confirmed') {
                                        cellClass = "bg-blue-500 border-blue-500";
                                    } else if (matchedBooking.status === 'pending') {
                                        cellClass = "bg-amber-500 border-amber-500";
                                    } else if (matchedBooking.status === 'completed') {
                                        cellClass = "bg-slate-400 border-slate-400";
                                    }
                                } else if (matchedBlocked) {
                                    cellClass = "bg-[#1e293b] border-[#1e293b]";
                                    textClass = "text-white font-extrabold";
                                    labelText = matchedBlocked.reason || 'Blocked';
                                } else if (isPast) {
                                    cellClass = "bg-slate-50/70 border-[#dddddd] cursor-not-allowed opacity-60";
                                    textClass = "text-slate-400";
                                }

                                const handleCellClick = () => {
                                    if (isBulkSelectMode) {
                                        if (matchedBooking) {
                                            toast.info('Tanggal yang telah dibooked tamu tidak dapat dipilih.');
                                            return;
                                        }
                                        if (isPast && !matchedBlocked) {
                                            toast.info('Tanggal di masa lalu tidak dapat dipilih untuk diblokir.');
                                            return;
                                        }
                                        
                                        setSelectedDates(prev => {
                                            if (prev.includes(dateStr)) {
                                                return prev.filter(d => d !== dateStr);
                                            } else {
                                                return [...prev, dateStr];
                                            }
                                        });
                                    } else {
                                        if (matchedBooking) {
                                            setSelectedSlot({ type: 'booking', data: matchedBooking });
                                        } else if (matchedBlocked) {
                                            setSelectedSlot({ type: 'blocked', data: matchedBlocked });
                                        } else {
                                            if (isPast) {
                                                toast.info('Tanggal di masa lalu tidak dapat diblokir.');
                                                return;
                                            }
                                            setSelectedSlot({ type: 'free', data: { date: dateStr } });
                                        }
                                    }
                                };

                                return (
                                    <div 
                                        key={dateStr}
                                        onClick={handleCellClick}
                                        className={`h-14 sm:h-16 rounded-[8px] p-1.5 flex flex-col justify-between cursor-pointer transition-all duration-300 active:scale-[0.98] ease-[cubic-bezier(0.32,0.72,0,1)] relative overflow-hidden border ${cellClass} ${
                                            isBulkSelectMode && isChecked ? 'ring-2 ring-blue-500 ring-offset-1 z-10' : ''
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className={`text-[10px] sm:text-xs font-mono font-bold ${textClass}`}>{dayNum}</span>
                                            {isBulkSelectMode && !matchedBooking && (
                                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                                                    isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'
                                                }`}>
                                                    {isChecked && <Check className="w-2.5 h-2.5" />}
                                                </div>
                                            )}
                                        </div>
                                        {labelText && (
                                            <span className="text-[8px] sm:text-[9px] truncate font-extrabold max-w-full block leading-none pb-0.5 text-white/95">
                                                {labelText}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Legend bar */}
                    <div className="flex flex-wrap items-center justify-start gap-3 text-[8px] font-bold text-slate-500 border-t border-[#dddddd] pt-3 uppercase tracking-wider">
                        <div className="flex items-center space-x-1.5">
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-[4px]" />
                            <span>Confirmed</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <div className="w-2.5 h-2.5 bg-amber-500 rounded-[4px]" />
                            <span>Pending</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <div className="w-2.5 h-2.5 bg-slate-400 rounded-[4px]" />
                            <span>Completed</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <div className="w-2.5 h-2.5 bg-[#1e293b] rounded-[4px]" />
                            <span>Blocked</span>
                        </div>
                    </div>
                </div>

                {/* Column 3: Detail Panel / Action Box (1/4 width) */}
                <div className="lg:col-span-1">
                    {isBulkSelectMode ? (
                        <div className="bg-white rounded-[14px] p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] border border-[#dddddd] space-y-4 animate-in fade-in slide-in-from-right duration-250">
                            <div className="flex items-center justify-between border-b border-[#dddddd] pb-3">
                                <span className="text-xs font-bold text-slate-800">Aksi Massal</span>
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                                    {selectedDates.length} Terpilih
                                </span>
                            </div>

                            {selectedDates.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-xs space-y-2">
                                    <Info className="w-6 h-6 text-slate-350 mx-auto" />
                                    <p className="px-2 leading-relaxed font-semibold">Silakan klik tanggal-tanggal di kalender untuk mulai memilih.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 text-xs">
                                    <div className="space-y-2 max-h-24 overflow-y-auto p-2 border border-[#dddddd] rounded-[8px] bg-slate-50 text-[10px] font-mono scrollbar-thin">
                                        {selectedDates.map(d => (
                                            <div key={d} className="flex justify-between items-center text-slate-650">
                                                <span>{format(parseISO(d), 'dd MMM yyyy', { locale: localeID })}</span>
                                                <button 
                                                    type="button"
                                                    onClick={() => setSelectedDates(prev => prev.filter(x => x !== d))}
                                                    className="text-red-500 hover:text-red-700 font-bold"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <form onSubmit={handleBulkBlockSubmit} className="space-y-3 border-t border-[#dddddd] pt-3">
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Alasan Pemblokiran Massal *</label>
                                            <input 
                                                type="text"
                                                required
                                                placeholder="Contoh: Maintenance Bulanan"
                                                value={bulkBlockReason}
                                                onChange={(e) => setBulkBlockReason(e.target.value)}
                                                className="w-full bg-slate-50 border border-[#dddddd] rounded-[8px] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={bulkSubmitting}
                                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-[8px] text-center flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.98] transition-all duration-300"
                                        >
                                            {bulkSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                            <span>Blokir Semua Terpilih</span>
                                        </button>
                                    </form>

                                    <div className="border-t border-[#dddddd] pt-3 space-y-2">
                                        <button
                                            type="button"
                                            onClick={handleBulkUnblockSubmit}
                                            disabled={bulkSubmitting}
                                            className="w-full bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-red-500 font-bold py-2.5 border border-[#dddddd] rounded-[8px] text-center flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.98] transition-all duration-300"
                                        >
                                            {bulkSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                            <span>Buka Kunci Terpilih</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setSelectedDates([])}
                                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2 rounded-[8px] text-center cursor-pointer active:scale-[0.98] transition-all duration-300"
                                        >
                                            Batalkan Pilihan
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : selectedSlot ? (
                        <div className="bg-white rounded-[14px] p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] border border-[#dddddd] space-y-4 relative animate-in fade-in slide-in-from-right duration-250">
                            <button 
                                onClick={() => setSelectedSlot(null)}
                                className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full text-slate-500 active:scale-[0.98] transition-all duration-300 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {selectedSlot.type === 'booking' && (
                                <div className="space-y-4 text-xs">
                                    <div className="flex items-center space-x-2 font-bold text-slate-850 border-b border-[#dddddd] pb-2.5">
                                        <User className="w-4 h-4 text-blue-500" />
                                        <span className="text-slate-700">Rincian Tamu</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-[10px] text-slate-450 font-bold block uppercase">Nama tamu</span>
                                            <span className="font-bold text-slate-850 text-sm">{selectedSlot.data.guest_name}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-450 font-bold block uppercase">Kontak WhatsApp</span>
                                            <a 
                                                href={`https://api.whatsapp.com/send?phone=${selectedSlot.data.guest_phone.replace(/^0/, '62')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-bold text-blue-600 hover:underline flex items-center space-x-1.5 mt-0.5 active:scale-[0.98] transition-all duration-300 w-fit"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                                                <span className="font-mono tabular-nums">{selectedSlot.data.guest_phone}</span>
                                            </a>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 border-t border-b border-[#dddddd] py-3">
                                            <div>
                                                <span className="text-[9px] text-slate-450 font-bold block">IN</span>
                                                <span className="font-bold font-mono text-slate-850">{selectedSlot.data.check_in}</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] text-slate-450 block font-bold">OUT</span>
                                                <span className="font-bold font-mono text-slate-850">{selectedSlot.data.check_out}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-450 font-bold block">STATUS BOOKING</span>
                                            <span className="font-bold text-slate-850 uppercase">{selectedSlot.data.status}</span>
                                        </div>
                                        <Link
                                            href={`/admin/bookings/detail?id=${selectedSlot.data.id}`}
                                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-extrabold py-2.5 rounded-[8px] text-center flex items-center justify-center space-x-1.5 mt-4 text-xs active:scale-[0.98] transition-all duration-300"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>Lihat Selengkapnya</span>
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {selectedSlot.type === 'blocked' && (
                                <div className="space-y-4 text-xs">
                                    <div className="flex items-center space-x-2 font-bold text-slate-855 border-b border-[#dddddd] pb-2.5">
                                        <Lock className="w-4 h-4 text-[#1e293b]" />
                                        <span className="text-slate-700">Tanggal Ditutup</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-[10px] text-slate-450 font-bold block">TANGGAL</span>
                                            <span className="font-bold text-slate-850 text-sm font-mono tabular-nums">
                                                {format(parseISO(selectedSlot.data.date), 'dd MMMM yyyy', { locale: localeID })}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-450 font-bold block">ALASAN PENUTUPAN</span>
                                            <p className="font-bold text-slate-800 mt-0.5">{selectedSlot.data.reason || 'Pemeliharaan Properti'}</p>
                                        </div>
                                        
                                        <button
                                            onClick={() => handleUnblockDate(selectedSlot.data.id)}
                                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-extrabold py-2.5 rounded-[8px] text-center flex items-center justify-center space-x-1.5 mt-6 cursor-pointer active:scale-[0.98] transition-all duration-300"
                                        >
                                            <X className="w-4 h-4" />
                                            <span>Buka Kunci Tanggal</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {selectedSlot.type === 'free' && (
                                <div className="space-y-4 text-xs">
                                    <div className="flex items-center space-x-2 font-bold text-slate-855 border-b border-[#dddddd] pb-2.5">
                                        <Lock className="w-4 h-4 text-blue-500" />
                                        <span className="text-slate-700">Blokir Tanggal Sewa</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-[10px] text-slate-450 font-bold block">TANGGAL</span>
                                            <span className="font-bold text-slate-855 text-sm font-mono tabular-nums">
                                                {format(parseISO(selectedSlot.data.date), 'dd MMMM yyyy', { locale: localeID })}
                                            </span>
                                        </div>
                                        
                                        <form onSubmit={handleInlineBlockSubmit} className="space-y-4">
                                            <div>
                                                <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Alasan Pemblokiran *</label>
                                                <input 
                                                    type="text"
                                                    required
                                                    placeholder="Contoh: Perbaikan AC"
                                                    value={quickBlockReason}
                                                    onChange={(e) => setQuickBlockReason(e.target.value)}
                                                    className="w-full bg-slate-50 border border-[#dddddd] rounded-[8px] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                                                />
                                            </div>
                                            
                                            <button
                                                type="submit"
                                                disabled={blockingDate}
                                                className="w-full bg-slate-900 hover:bg-slate-850 text-white font-extrabold py-2.5 rounded-[8px] text-center flex items-center justify-center space-x-1.5 mt-2 cursor-pointer active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
                                            >
                                                {blockingDate && <Loader2 className="w-4 h-4 animate-spin" />}
                                                <span>Blokir Tanggal</span>
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[14px] p-5 text-center py-12 shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] border border-[#dddddd] space-y-3 text-xs leading-normal text-slate-500 animate-in fade-in duration-200">
                            <Info className="w-8 h-8 text-blue-500/50 mx-auto" />
                            <p className="font-extrabold text-slate-850 text-sm">Detail Ketersediaan</p>
                            <p className="px-2 leading-relaxed">Klik pada baris tanggal di kalender untuk menampilkan detail reservasi tamu, rincian pemeliharaan, atau memblokir tanggal secara langsung.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
