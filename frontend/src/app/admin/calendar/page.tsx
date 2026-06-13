'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axiosClient from '@/lib/axios';
import { Villa, Booking, BlockedDate } from '@/types';
import { 
    format, 
    parseISO, 
    startOfMonth, 
    endOfMonth, 
    eachDayOfInterval, 
    addMonths, 
    subMonths,
    isSameDay,
    isWithinInterval,
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
    Eye
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCalendarPage() {
    const [villas, setVillas] = useState<Villa[]>([]);
    const [selectedVillaId, setSelectedVillaId] = useState<string>('');
    const [loadingVillas, setLoadingVillas] = useState(true);
    
    // Calendar month focus state
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Selected Villa data
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    // Detail Panel state
    const [selectedSlot, setSelectedSlot] = useState<{
        type: 'booking' | 'blocked';
        data: any;
    } | null>(null);

    // Quick block modal state
    const [quickBlockDate, setQuickBlockDate] = useState<string | null>(null);
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

    useEffect(() => {
        if (!selectedVillaId) return;

        const fetchVillaSchedules = async () => {
            setLoadingData(true);
            try {
                // Fetch bookings
                const bookingsRes = await axiosClient.get('/admin/bookings', {
                    params: { villa_id: selectedVillaId, limit: 100 }
                });
                
                // Fetch blocked dates
                const blockedRes = await axiosClient.get('/admin/blocked-dates', {
                    params: { villa_id: selectedVillaId }
                });

                setBookings(bookingsRes.data.data || []);
                setBlockedDates(blockedRes.data || []);
                setSelectedSlot(null); // Clear panel
            } catch (err) {
                console.error('Failed to load schedule data:', err);
                toast.error('Gagal memuat jadwal ketersediaan.');
            } finally {
                setLoadingData(false);
            }
        };

        fetchVillaSchedules();
    }, [selectedVillaId]);

    const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
    const handleToday = () => setCurrentMonth(new Date());

    const handleQuickBlockSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickBlockDate) return;

        setBlockingDate(true);
        try {
            await axiosClient.post('/admin/blocked-dates', {
                villa_id: Number(selectedVillaId),
                date: quickBlockDate,
                reason: quickBlockReason || 'Maintenance / Pemeliharaan'
            });

            toast.success('Tanggal berhasil diblokir.');
            setQuickBlockDate(null);
            setQuickBlockReason('');
            
            // Re-fetch
            const blockedRes = await axiosClient.get('/admin/blocked-dates', {
                params: { villa_id: selectedVillaId }
            });
            setBlockedDates(blockedRes.data || []);
        } catch (err: any) {
            console.error('Failed to block date:', err);
            toast.error(err.response?.data?.message || 'Gagal memblokir tanggal.');
        } finally {
            setBlockingDate(false);
        }
    };

    const handleUnblockDate = async (blockedId: number) => {
        try {
            await axiosClient.delete(`/admin/blocked-dates/${blockedId}`);
            toast.success('Pemblokiran tanggal berhasil dibatalkan.');
            setSelectedSlot(null);
            
            // Re-fetch
            const blockedRes = await axiosClient.get('/admin/blocked-dates', {
                params: { villa_id: selectedVillaId }
            });
            setBlockedDates(blockedRes.data || []);
        } catch (err) {
            console.error('Failed to unblock date:', err);
            toast.error('Gagal membatalkan pemblokiran.');
        }
    };

    // Calculate calendar days for the current focus month
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start, end });

    // Generate padding days at start of week
    const startDayOfWeek = start.getDay(); // 0 is Sunday, 1 is Monday...
    const paddingDaysCount = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Align to Monday start
    const paddingDays = paddingDaysCount > 0 ? Array(paddingDaysCount).fill(null) : [];

    const calendarGrid = [...paddingDays, ...daysInMonth];

    if (loadingVillas) {
        return (
            <div className="flex justify-center items-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Kalender Jadwal</h1>
                    <p className="text-slate-500 text-sm mt-1">Pantau lini masa reservasi masuk, jadwal check-in, dan penutupan tanggal sewa.</p>
                </div>

                {/* Villa Filter dropdown */}
                <div className="w-full sm:w-64">
                    <select
                        value={selectedVillaId}
                        onChange={(e) => setSelectedVillaId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                    >
                        {villas.map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Left side: Calendar Grid (3 columns) */}
                <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-6">
                    {/* Calendar Nav bar */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center space-x-2">
                            <CalendarIcon className="w-5 h-5 text-rose-600" />
                            <h2 className="text-lg font-bold text-slate-900">
                                {format(currentMonth, 'MMMM yyyy', { locale: localeID })}
                            </h2>
                        </div>

                        <div className="flex items-center space-x-2 text-xs font-semibold">
                            <button onClick={handlePrevMonth} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={handleToday} className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                                Hari Ini
                            </button>
                            <button onClick={handleNextMonth} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Weekly headers */}
                    <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-400 uppercase tracking-wider">
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
                        <div className="flex justify-center items-center py-32">
                            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 gap-1">
                            {calendarGrid.map((day, idx) => {
                                if (day === null) {
                                    return <div key={`padding-${idx}`} className="aspect-square bg-slate-50/50 rounded-xl" />;
                                }

                                const dateStr = format(day, 'yyyy-MM-dd');
                                const dayNum = format(day, 'd');
                                
                                // Check if this day matches any booking
                                // Booking interval matches: check_in <= date < check_out (exclusive of checkout night)
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

                                let cellClass = "bg-white hover:bg-slate-50 border border-slate-150";
                                let textClass = "text-slate-800";
                                let labelText = "";
                                
                                if (matchedBooking) {
                                    textClass = "text-white font-bold";
                                    labelText = matchedBooking.guest_name;
                                    if (matchedBooking.status === 'confirmed') {
                                        cellClass = "bg-rose-600 border-rose-600 shadow-sm";
                                    } else if (matchedBooking.status === 'pending') {
                                        cellClass = "bg-amber-500 border-amber-500 shadow-sm";
                                    } else if (matchedBooking.status === 'completed') {
                                        cellClass = "bg-slate-500 border-slate-500 shadow-sm";
                                    }
                                } else if (matchedBlocked) {
                                    cellClass = "bg-red-500 border-red-500 shadow-sm";
                                    textClass = "text-white font-bold";
                                    labelText = matchedBlocked.reason || 'Blocked';
                                }

                                const handleCellClick = () => {
                                    if (matchedBooking) {
                                        setSelectedSlot({ type: 'booking', data: matchedBooking });
                                    } else if (matchedBlocked) {
                                        setSelectedSlot({ type: 'blocked', data: matchedBlocked });
                                    } else {
                                        setQuickBlockDate(dateStr);
                                    }
                                };

                                return (
                                    <div 
                                        key={dateStr}
                                        onClick={handleCellClick}
                                        className={`aspect-square rounded-xl p-2 flex flex-col justify-between cursor-pointer transition-all duration-150 ${cellClass}`}
                                    >
                                        <span className={`text-[10px] sm:text-xs font-bold ${textClass}`}>{dayNum}</span>
                                        {labelText && (
                                            <span className="text-[8px] sm:text-[9px] truncate drop-shadow-sm font-semibold max-w-full block text-white/95">
                                                {labelText}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Color Legend bar */}
                    <div className="flex flex-wrap items-center justify-start gap-4 text-[10px] font-bold text-slate-500 border-t border-slate-100 pt-4 uppercase tracking-wider">
                        <div className="flex items-center space-x-1.5">
                            <div className="w-3.5 h-3.5 bg-rose-600 rounded-md" />
                            <span>Confirmed (Lunas)</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <div className="w-3.5 h-3.5 bg-amber-500 rounded-md" />
                            <span>Pending (Belum Bayar)</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <div className="w-3.5 h-3.5 bg-slate-500 rounded-md" />
                            <span>Selesai (Completed)</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <div className="w-3.5 h-3.5 bg-red-500 rounded-md" />
                            <span>Ditutup (Maintenance)</span>
                        </div>
                    </div>
                </div>

                {/* Right side: Detail Panel / Action box (1 column) */}
                <div className="lg:col-span-1 space-y-6">
                    {selectedSlot ? (
                        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-5 relative">
                            <button 
                                onClick={() => setSelectedSlot(null)}
                                className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full text-slate-500 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {selectedSlot.type === 'booking' ? (
                                <div className="space-y-4 text-xs">
                                    <div className="flex items-center space-x-2 font-bold text-slate-900 border-b border-slate-100 pb-3">
                                        <User className="w-4.5 h-4.5 text-rose-500" />
                                        <span>Rincian Tamu</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold block uppercase">NAMA TAMU</span>
                                            <span className="font-bold text-slate-900 text-sm">{selectedSlot.data.guest_name}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold block uppercase">KONTAK WHATSAPP</span>
                                            <a 
                                                href={`https://wa.me/${selectedSlot.data.guest_phone.replace(/^0/, '62')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-bold text-rose-600 hover:underline flex items-center space-x-1 mt-0.5"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                <span>{selectedSlot.data.guest_phone}</span>
                                            </a>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-100 py-3">
                                            <div>
                                                <span className="text-[9px] text-slate-400 font-bold block">IN</span>
                                                <span className="font-bold text-slate-800">{selectedSlot.data.check_in}</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] text-slate-400 block">OUT</span>
                                                <span className="font-bold text-slate-800">{selectedSlot.data.check_out}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold block">STATUS BOOKING</span>
                                            <span className="font-bold text-slate-850 uppercase">{selectedSlot.data.status}</span>
                                        </div>
                                        <Link
                                            href={`/admin/bookings/${selectedSlot.data.id}`}
                                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl text-center flex items-center justify-center space-x-1 mt-4 text-xs"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>Lihat Selengkapnya</span>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 text-xs">
                                    <div className="flex items-center space-x-2 font-bold text-slate-900 border-b border-slate-100 pb-3">
                                        <Lock className="w-4.5 h-4.5 text-red-500" />
                                        <span>Tanggal Ditutup</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold block">TANGGAL</span>
                                            <span className="font-bold text-slate-900 text-sm">
                                                {format(parseISO(selectedSlot.data.date), 'dd MMMM yyyy', { locale: localeID })}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold block">ALASAN PENUTUPAN</span>
                                            <p className="font-bold text-slate-800 mt-0.5">{selectedSlot.data.reason || 'Pemeliharaan Properti'}</p>
                                        </div>
                                        
                                        <button
                                            onClick={() => handleUnblockDate(selectedSlot.data.id)}
                                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-center flex items-center justify-center space-x-1 mt-6 cursor-pointer"
                                        >
                                            <X className="w-4 h-4" />
                                            <span>Buka Kunci Tanggal</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-sm text-center py-12 text-slate-400 space-y-2 text-xs leading-normal">
                            <Info className="w-8 h-8 text-rose-500/60 mx-auto" />
                            <p className="font-bold text-slate-800">Detail Ketersediaan</p>
                            <p className="px-4">Klik pada baris tanggal yang berwarna di kalender untuk menampilkan detail reservasi tamu atau rincian pemeliharaan.</p>
                        </div>
                    )}
                </div>

            </div>

            {/* Quick Block Modal */}
            {quickBlockDate && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 relative">
                        <button 
                            onClick={() => setQuickBlockDate(null)}
                            className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full text-slate-500 cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-1.5">
                                <Lock className="w-4.5 h-4.5 text-red-500" />
                                <span>Blokir Jadwal Sewa</span>
                            </h3>
                            <p className="text-slate-500 text-xs mt-1">
                                Tutup ketersediaan untuk tanggal: <span className="font-bold text-slate-700">{format(parseISO(quickBlockDate), 'dd MMMM yyyy', { locale: localeID })}</span>
                            </p>
                        </div>

                        <form onSubmit={handleQuickBlockSubmit} className="space-y-4 text-xs text-left">
                            <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Alasan Pemblokiran *</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="Contoh: Pembersihan Kolam Renang atau Perbaikan AC"
                                    value={quickBlockReason}
                                    onChange={(e) => setQuickBlockReason(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                                <button 
                                    type="button"
                                    onClick={() => setQuickBlockDate(null)}
                                    className="bg-slate-105 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={blockingDate}
                                    className="bg-slate-900 hover:bg-slate-850 text-white font-bold px-4 py-2 rounded-xl flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
                                >
                                    {blockingDate && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
                                    <span>Simpan Pemblokiran</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
