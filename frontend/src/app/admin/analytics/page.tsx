'use client';

import React, { useEffect, useState } from 'react';
import axiosClient from '@/lib/axios';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import { formatPrice } from '@/lib/format';
import { 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    PieChart, 
    Pie, 
    Cell 
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { 
    BarChart3, 
    Calendar, 
    Download, 
    Loader2, 
    TrendingUp, 
    DollarSign, 
    BookOpen,
    Clock
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [from, setFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Charts datasets
    const [dailyRevenue, setDailyRevenue] = useState<any[]>([]);
    const [bookingsPerVilla, setBookingsPerVilla] = useState<any[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [leadSources, setLeadSources] = useState<any[]>([]);
    const [funnelData, setFunnelData] = useState<any[]>([]);

    // Summary stats calculated from datasets
    const [summary, setSummary] = useState({
        totalRevenue: 0,
        totalBookings: 0,
        avgOrderValue: 0
    });

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get('/admin/analytics', {
                params: { from, to }
            });

            const data = response.data;
            
            // Format daily revenue dates for better chart labels
            const formattedRevenue = (data.daily_revenue || []).map((item: any) => ({
                ...item,
                formattedDate: format(parseISO(item.date), 'dd MMM', { locale: localeID }),
                revenueAmount: Number(item.revenue)
            }));
            setDailyRevenue(formattedRevenue);

            setBookingsPerVilla(data.bookings_per_villa || []);
            setPaymentMethods(data.payment_methods || []);
            setLeadSources(data.lead_sources || []);
            setFunnelData(data.conversion_funnel || []);

            // Calculate totals
            const totalRevenue = formattedRevenue.reduce((sum: number, item: any) => sum + item.revenueAmount, 0);
            const totalBookings = (data.conversion_funnel || [])
                .filter((item: any) => !item.step.includes('Cancelled'))
                .reduce((sum: number, item: any) => sum + Number(item.value), 0);
            const avgOrderValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

            console.log('Analytics data:', {
                totalRevenue,
                totalBookings,
                avgOrderValue,
                funnelData: data.conversion_funnel,
                dailyRevenue: formattedRevenue
            });

            setSummary({
                totalRevenue,
                totalBookings,
                avgOrderValue
            });

        } catch (err) {
            console.error('Failed to load analytics:', err);
            toast.error('Gagal memuat data analisis keuangan.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [from, to]);

    const handleExport = async () => {
        const token = localStorage.getItem('admin_token');
        
        try {
            const response = await axiosClient.get('/admin/analytics/export', {
                params: { from, to },
                responseType: 'blob',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `laporan-booking-${from}-ke-${to}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success('Laporan booking berhasil diunduh!');
        } catch (err) {
            console.error('Export failed:', err);
            toast.error('Gagal mengunduh laporan. Silakan coba lagi.');
        }
    };

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6b7280', '#ec4899', '#8b5cf6'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#dddddd] pb-5">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight">Analisis & pendapatan</h1>
                    <p className="text-[#6a6a6a] text-xs sm:text-sm mt-1.5 font-medium">Pantau tren omset penyewaan, performa okupansi villa, dan demografi transaksi.</p>
                </div>

                {/* Filter and Export buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center space-x-2 bg-white border border-[#dddddd] rounded-[8px] px-3 py-2 text-xs font-semibold text-[#222222]">
                        <Calendar className="w-4 h-4 text-[#6a6a6a] flex-shrink-0" />
                            <input 
                                type="date" 
                                value={from} 
                                onChange={(e) => setFrom(e.target.value)} 
                                className="bg-transparent border-0 focus:outline-none w-full min-w-0 text-[#222222] font-bold text-xs"
                            />
                            <span className="text-[#6a6a6a] font-normal shrink-0">s/d</span>
                            <input 
                                type="date" 
                                value={to} 
                                onChange={(e) => setTo(e.target.value)} 
                                className="bg-transparent border-0 focus:outline-none w-full min-w-0 text-[#222222] font-bold text-xs"
                            />
                    </div>
                    <button
                        onClick={handleExport}
                        className="w-full sm:w-auto bg-white border border-[#dddddd] hover:bg-slate-50 active:scale-95 text-[#222222] font-extrabold py-2.5 px-4 rounded-[8px] hover:border-slate-300 transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                        <Download className="w-4 h-4 text-[#6a6a6a]" />
                        <span>Ekspor laporan</span>
                    </button>
                </div>
            </div>

            {/* Loading Board */}
            {loading ? (
                <div className="flex justify-center items-center py-32">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <div className="space-y-8">
                    
                    {/* Summary row */}
                    <div className="rounded-[14px] p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[14px] shadow-lg shadow-blue-500/20 p-6 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5">
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0">
                                        <span className="text-[10px] text-blue-100 font-bold block uppercase tracking-wider mb-1.5">Total omset</span>
                                        <span className="text-2xl font-black text-white font-mono tracking-tight tabular-nums">
                                            Rp {summary.totalRevenue.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                                        <DollarSign className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[14px] shadow-lg shadow-indigo-500/20 p-6 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5">
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0">
                                        <span className="text-[10px] text-indigo-100 font-bold block uppercase tracking-wider mb-1.5">Total reservasi aktif</span>
                                        <span className="text-2xl font-black text-white font-mono tracking-tight tabular-nums">
                                            {summary.totalBookings} <span className="font-sans text-sm font-bold text-indigo-200 lowercase">booking</span>
                                        </span>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-sky-600 to-sky-700 rounded-[14px] shadow-lg shadow-sky-500/20 p-6 transition-all duration-200 hover:shadow-xl hover:shadow-sky-500/30 hover:-translate-y-0.5">
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0">
                                        <span className="text-[10px] text-sky-100 font-bold block uppercase tracking-wider mb-1.5">Nilai rata-rata sewa</span>
                                        <span className="text-2xl font-black text-white font-mono tracking-tight tabular-nums">
                                            Rp {Math.round(summary.avgOrderValue).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                                        <TrendingUp className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Rows */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Daily Revenue Bar Chart (2 cols) */}
                        <div className="lg:col-span-2 bg-white rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-6 h-full">
                            <h3 className="text-sm font-bold text-[#222222] border-b border-[#dddddd] pb-3 mb-6 uppercase tracking-wider flex items-center space-x-1.5">
                                <BarChart3 className="w-4.5 h-4.5 text-blue-500" />
                                <span>Tren penjualan harian (IDR)</span>
                            </h3>
                            <div className="h-80 w-full text-xs font-medium text-[#6a6a6a] overflow-x-auto">
                                {dailyRevenue.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-[#6a6a6a]">Belum ada data pendapatan.</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dailyRevenue} margin={{ left: 0, right: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="formattedDate" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" tickFormatter={(v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : v.toLocaleString('id-ID')} />
                                            <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Revenue']} />
                                            <Bar dataKey="revenueAmount" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Booking shares per Villa (1 col) */}
                        <div className="lg:col-span-1 bg-white rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-6 h-full flex flex-col justify-between">
                            <h3 className="text-sm font-bold text-[#222222] border-b border-[#dddddd] pb-3 mb-6 uppercase tracking-wider flex items-center space-x-1.5">
                                <span>Performa penjualan villa</span>
                            </h3>
                            <div className="h-80 w-full flex flex-col justify-between text-xs font-semibold text-[#6a6a6a] overflow-x-auto">
                                {bookingsPerVilla.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-[#6a6a6a]">Belum ada data pesanan.</div>
                                ) : (
                                    <>
                                        <div className="h-56">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={bookingsPerVilla}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={45}
                                                        outerRadius={75}
                                                        paddingAngle={4}
                                                        dataKey="bookings_count"
                                                    >
                                                        {bookingsPerVilla.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(value) => [`${value} Booking`, 'Kuantitas']} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        {/* Custom legend */}
                                        <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold text-[#6a6a6a] pt-2 border-t border-[#dddddd]">
                                            {bookingsPerVilla.map((item, index) => (
                                                <div key={index} className="flex items-center space-x-1.5 truncate">
                                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                    <span className="truncate">{item.villa_name}: <span className="font-mono tabular-nums text-[#222222] font-bold">{item.bookings_count}</span></span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Payment methods donut chart */}
                        <div className="lg:col-span-1 bg-white rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-6 h-full flex flex-col justify-between">
                            <h3 className="text-sm font-bold text-[#222222] border-b border-[#dddddd] pb-3 mb-6 uppercase tracking-wider">
                                Metode pembayaran terfavorit
                            </h3>
                            <div className="h-80 w-full flex flex-col justify-between text-xs font-semibold text-[#6a6a6a] overflow-x-auto">
                                {paymentMethods.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-[#6a6a6a]">Belum ada data pembayaran.</div>
                                ) : (
                                    <>
                                        <div className="h-56">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={paymentMethods}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={45}
                                                        outerRadius={75}
                                                        paddingAngle={4}
                                                        dataKey="count"
                                                    >
                                                        {paymentMethods.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(value) => [`${value} Transaksi`, 'Kuantitas']} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        {/* Custom legend */}
                                        <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold text-[#6a6a6a] pt-2 border-t border-[#dddddd]">
                                            {paymentMethods.map((item, index) => (
                                                <div key={index} className="flex items-center space-x-1.5 truncate">
                                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }} />
                                                    <span className="truncate">{item.method || 'Unknown'}: <span className="font-mono tabular-nums text-[#222222] font-bold">{item.count}</span></span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Conversion Funnel / Status */}
                        <div className="lg:col-span-2 bg-white rounded-[14px] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] p-6 h-full">
                            <h3 className="text-sm font-bold text-[#222222] border-b border-[#dddddd] pb-3 mb-6 uppercase tracking-wider flex items-center space-x-1.5">
                                <Clock className="w-4.5 h-4.5 text-blue-500" />
                                <span>Status rasio pemesanan (kuantitas)</span>
                            </h3>
                            <div className="h-80 w-full text-xs font-medium text-[#6a6a6a] overflow-x-auto">
                                {funnelData.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-[#6a6a6a]">Belum ada data konversi.</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={funnelData} margin={{ left: 0, right: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="step" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" tickFormatter={(v: number) => v.toLocaleString('id-ID')} />
                                            <Tooltip formatter={(value) => [`${value} Booking`, 'Kuantitas']} />
                                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
