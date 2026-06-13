'use client';

import React, { useEffect, useState } from 'react';
import axiosClient from '@/lib/axios';
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
                .filter((item: any) => item.step !== 'Cancelled')
                .reduce((sum: number, item: any) => sum + item.value, 0);
            const avgOrderValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

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

    const handleExport = () => {
        const token = localStorage.getItem('admin_token');
        window.open(`${axiosClient.defaults.baseURL}/admin/analytics/export?from=${from}&to=${to}&token=${token}`, '_blank');
        toast.info('Laporan booking sedang diunduh...');
    };

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6b7280', '#ec4899', '#8b5cf6'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Analisis & Pendapatan</h1>
                    <p className="text-slate-500 text-sm mt-1">Pantau tren omset penyewaan, performa okupansi villa, dan demografi transaksi.</p>
                </div>

                {/* Filter and Export buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm text-xs font-semibold">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <input 
                            type="date" 
                            value={from} 
                            onChange={(e) => setFrom(e.target.value)} 
                            className="bg-transparent border-0 focus:outline-none w-28 text-slate-700 font-bold"
                        />
                        <span className="text-slate-400 font-normal">s/d</span>
                        <input 
                            type="date" 
                            value={to} 
                            onChange={(e) => setTo(e.target.value)} 
                            className="bg-transparent border-0 focus:outline-none w-28 text-slate-700 font-bold"
                        />
                    </div>
                    <button
                        onClick={handleExport}
                        className="w-full sm:w-auto bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                        <Download className="w-4 h-4" />
                        <span>Ekspor Laporan</span>
                    </button>
                </div>
            </div>

            {/* Loading Board */}
            {loading ? (
                <div className="flex justify-center items-center py-32">
                    <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                </div>
            ) : (
                <div className="space-y-8">
                    
                    {/* Summary row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Total Omset</span>
                                <span className="text-2xl font-extrabold text-slate-900">
                                    Rp {summary.totalRevenue.toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Total Reservasi Aktif</span>
                                <span className="text-2xl font-extrabold text-slate-900">
                                    {summary.totalBookings} Booking
                                </span>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Nilai Rata-Rata Sewa</span>
                                <span className="text-2xl font-extrabold text-slate-900">
                                    Rp {Math.round(summary.avgOrderValue).toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Chart Rows */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Daily Revenue Bar Chart (2 cols) */}
                        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6 uppercase tracking-wider flex items-center space-x-1.5">
                                <BarChart3 className="w-4.5 h-4.5 text-rose-500" />
                                <span>Tren Penjualan Harian (IDR)</span>
                            </h3>
                            <div className="h-80 w-full text-xs font-medium text-slate-500">
                                {dailyRevenue.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-slate-400">Belum ada data pendapatan.</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dailyRevenue} margin={{ left: -10, right: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="formattedDate" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" />
                                            <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Revenue']} />
                                            <Bar dataKey="revenueAmount" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Booking shares per Villa (1 col) */}
                        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6 uppercase tracking-wider flex items-center space-x-1.5">
                                <span>Performa Penjualan Villa</span>
                            </h3>
                            <div className="h-80 w-full flex flex-col justify-between text-xs font-semibold text-slate-600">
                                {bookingsPerVilla.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-slate-400">Belum ada data pesanan.</div>
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
                                        <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold text-slate-500 pt-2 border-t border-slate-50">
                                            {bookingsPerVilla.map((item, index) => (
                                                <div key={index} className="flex items-center space-x-1.5 truncate">
                                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                    <span className="truncate">{item.villa_name}: {item.bookings_count}</span>
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
                        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6 uppercase tracking-wider">
                                Metode Pembayaran Terfavorit
                            </h3>
                            <div className="h-80 w-full flex flex-col justify-between text-xs font-semibold text-slate-600">
                                {paymentMethods.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-slate-400">Belum ada data pembayaran.</div>
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
                                        <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold text-slate-500 pt-2 border-t border-slate-50">
                                            {paymentMethods.map((item, index) => (
                                                <div key={index} className="flex items-center space-x-1.5 truncate">
                                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }} />
                                                    <span className="truncate">{item.method || 'Unknown'}: {item.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Conversion Funnel / Status */}
                        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6 uppercase tracking-wider flex items-center space-x-1.5">
                                <Clock className="w-4.5 h-4.5 text-rose-500" />
                                <span>Status Rasio Pemesanan (Kuantitas)</span>
                            </h3>
                            <div className="h-80 w-full text-xs font-medium text-slate-500">
                                {funnelData.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-slate-400">Belum ada data konversi.</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={funnelData} margin={{ left: -10, right: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="step" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" />
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
