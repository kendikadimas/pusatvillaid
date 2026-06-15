<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Villa;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AnalyticsController extends Controller
{
    /**
     * Get analytics charts data.
     */
    public function index(Request $request): JsonResponse
    {
        $from = $request->query('from', Carbon::now()->subDays(30)->toDateString());
        $to = $request->query('to', Carbon::now()->toDateString());

        // Validate date range - max 365 days to prevent performance issues
        $fromDate = Carbon::parse($from);
        $toDate = Carbon::parse($to);
        if ($fromDate->greaterThan($toDate)) {
            return response()->json(['message' => 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir.'], 422);
        }
        if ($fromDate->diffInDays($toDate) > 365) {
            return response()->json(['message' => 'Rentang tanggal maksimal 365 hari.'], 422);
        }

        // 1. Daily Revenue Chart (last 30 days default)
        $dailyRevenue = Payment::where('status', 'success')
            ->whereBetween('paid_at', [Carbon::parse($from)->startOfDay(), Carbon::parse($to)->endOfDay()])
            ->select(
                DB::raw('DATE(paid_at) as date'),
                DB::raw('SUM(amount) as revenue')
            )
            ->groupBy(DB::raw('DATE(paid_at)'))
            ->orderBy('date', 'asc')
            ->get();

        // 2. Bookings count per villa
        $bookingsPerVilla = Booking::whereIn('status', ['confirmed', 'completed'])
            ->whereBetween('check_in', [$from, $to])
            ->select('villa_id', DB::raw('COUNT(*) as count'))
            ->groupBy('villa_id')
            ->get();

        $villaIds = $bookingsPerVilla->pluck('villa_id')->toArray();
        $villasMap = Villa::whereIn('id', $villaIds)->pluck('name', 'id')->toArray();

        $bookingsPerVillaFormatted = $bookingsPerVilla->map(fn ($item) => [
            'villa_name' => $villasMap[$item->villa_id] ?? 'Unknown Villa',
            'bookings_count' => $item->count,
        ]);

        // 3. Payment Methods share
        $paymentMethods = Payment::where('status', 'success')
            ->whereBetween('paid_at', [Carbon::parse($from)->startOfDay(), Carbon::parse($to)->endOfDay()])
            ->select('payment_type', DB::raw('COUNT(*) as count'), DB::raw('SUM(amount) as total_amount'))
            ->groupBy('payment_type')
            ->get()
            ->map(fn ($item) => [
                'method' => $item->payment_type ?? 'Lainnya',
                'count' => $item->count,
                'revenue' => (float) $item->total_amount,
            ]);

        // 4. Lead Sources
        $leadSources = Booking::whereIn('status', ['confirmed', 'completed'])
            ->whereBetween('created_at', [Carbon::parse($from)->startOfDay(), Carbon::parse($to)->endOfDay()])
            ->select('utm_source', DB::raw('COUNT(*) as count'))
            ->groupBy('utm_source')
            ->get()
            ->map(fn ($item) => [
                'source' => $item->utm_source ?? 'Direct / Langsung',
                'count' => $item->count,
            ]);

        // 5. Conversion Funnel (Pending -> Confirmed -> Completed)
        $funnelStats = Booking::whereBetween('created_at', [Carbon::parse($from)->startOfDay(), Carbon::parse($to)->endOfDay()])
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $funnelData = [
            ['step' => 'Pending (Unpaid)', 'value' => $funnelStats['pending'] ?? 0],
            ['step' => 'Confirmed (Paid)', 'value' => $funnelStats['confirmed'] ?? 0],
            ['step' => 'Completed', 'value' => $funnelStats['completed'] ?? 0],
            ['step' => 'Cancelled', 'value' => $funnelStats['cancelled'] ?? 0],
        ];

        return response()->json([
            'period' => ['from' => $from, 'to' => $to],
            'daily_revenue' => $dailyRevenue,
            'bookings_per_villa' => $bookingsPerVillaFormatted,
            'payment_methods' => $paymentMethods,
            'lead_sources' => $leadSources,
            'conversion_funnel' => $funnelData,
        ]);
    }

    /**
     * Export bookings to CSV/Excel report.
     */
    public function export(Request $request): StreamedResponse
    {
        $from = $request->query('from', Carbon::now()->subDays(30)->toDateString());
        $to = $request->query('to', Carbon::now()->toDateString());

        $bookings = Booking::with(['villa', 'payment'])
            ->whereBetween('created_at', [Carbon::parse($from)->startOfDay(), Carbon::parse($to)->endOfDay()])
            ->orderBy('created_at', 'asc')
            ->get();

        $response = new StreamedResponse(function () use ($bookings) {
            $handle = fopen('php://output', 'w');

            // Add UTF-8 BOM for Excel to open CSV correctly with special characters
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            // CSV Header
            fputcsv($handle, [
                'Kode Booking',
                'Nama Villa',
                'Nama Tamu',
                'Email',
                'Telepon',
                'Check-in',
                'Check-out',
                'Total Malam',
                'Jumlah Tamu',
                'Base Price (IDR)',
                'Total Bayar (IDR)',
                'Status Booking',
                'Status Pembayaran',
                'Metode Pembayaran',
                'Tanggal Dibuat',
                'UTM Source',
                'UTM Medium',
                'UTM Campaign',
            ]);

            // CSV Data
            foreach ($bookings as $b) {
                fputcsv($handle, [
                    $b->booking_code,
                    $b->villa->name ?? '-',
                    $b->guest_name,
                    $b->guest_email,
                    $b->guest_phone,
                    $b->check_in->toDateString(),
                    $b->check_out->toDateString(),
                    $b->total_nights,
                    $b->num_guests,
                    $b->base_price,
                    $b->total_amount,
                    $b->status,
                    $b->payment_status,
                    $b->payment->payment_type ?? '-',
                    $b->created_at->toDateTimeString(),
                    $b->utm_source ?? '-',
                    $b->utm_medium ?? '-',
                    $b->utm_campaign ?? '-',
                ]);
            }

            fclose($handle);
        });

        $fileName = "laporan-booking-{$from}-ke-{$to}.csv";

        $response->headers->set('Content-Type', 'text/csv; charset=utf-8');
        $response->headers->set('Content-Disposition', 'attachment; filename="'.$fileName.'"');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', '0');

        return $response;
    }
}
