<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Review;
use App\Models\Villa;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Get statistics overview for the admin dashboard.
     */
    public function index(): JsonResponse
    {
        $todayStr = Carbon::today()->toDateString();
        $startOfMonth = Carbon::now()->startOfMonth()->toDateString();
        $endOfMonth = Carbon::now()->endOfMonth()->toDateString();

        // 1. Stats Cards
        // Booking Check-in Today
        $checkInsToday = Booking::where('check_in', $todayStr)
            ->where('status', '!=', 'cancelled')
            ->count();

        // Bookings confirmed/completed with check-in this month
        $bookingsThisMonth = Booking::whereBetween('check_in', [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()])
            ->whereIn('status', ['confirmed', 'completed'])
            ->count();

        // Revenue this month (from payments + bookings marked paid)
        $paymentRevenue = Payment::where('status', 'success')
            ->whereBetween('paid_at', [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()])
            ->sum('amount');

        // Also count bookings manually marked as paid (even without payment record)
        $bookingRevenue = Booking::where('payment_status', 'paid')
            ->whereBetween('updated_at', [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()])
            ->sum('total_amount');

        $revenueThisMonth = max((float) $paymentRevenue, (float) $bookingRevenue);

        // Pending Payment Count
        $pendingPayments = Booking::where('status', 'pending')
            ->where('payment_status', 'unpaid')
            ->count();

        // Pending Reviews Count
        $pendingReviews = Review::where('is_approved', false)->count();

        // Occupancy Rate calculation
        $activeVillasCount = Villa::where('is_active', true)->count();
        $daysInMonth = Carbon::now()->daysInMonth;
        $totalCapacityDays = $activeVillasCount * $daysInMonth;

        $occupiedNightsThisMonth = 0;
        if ($totalCapacityDays > 0) {
            $bookingsOverlap = Booking::whereIn('status', ['confirmed', 'completed'])
                ->where(function ($query) use ($startOfMonth, $endOfMonth) {
                    $query->whereBetween('check_in', [$startOfMonth, $endOfMonth])
                        ->orWhereBetween('check_out', [$startOfMonth, $endOfMonth])
                        ->orWhere(function ($q) use ($startOfMonth, $endOfMonth) {
                            $q->where('check_in', '<=', $startOfMonth)
                                ->where('check_out', '>=', $endOfMonth);
                        });
                })->get(['check_in', 'check_out']);

            foreach ($bookingsOverlap as $b) {
                $checkIn = Carbon::parse($b->check_in);
                $checkOut = Carbon::parse($b->check_out);

                // Clamp dates to current month boundaries
                $start = $checkIn->isBefore(Carbon::now()->startOfMonth()) ? Carbon::now()->startOfMonth() : $checkIn;
                $end = $checkOut->isAfter(Carbon::now()->endOfMonth()) ? Carbon::now()->endOfMonth() : $checkOut;

                $nights = $start->diffInDays($end);
                $occupiedNightsThisMonth += max(0, $nights);
            }

            $occupancyRate = round(($occupiedNightsThisMonth / $totalCapacityDays) * 100, 1);
        } else {
            $occupancyRate = 0.0;
        }

        // 2. Activity Lists
        // 5 Recent Bookings
        $recentBookings = Booking::with('villa:id,name')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Check-in list today
        $todayCheckIns = Booking::with('villa:id,name')
            ->where('check_in', $todayStr)
            ->where('status', '!=', 'cancelled')
            ->get(['id', 'booking_code', 'guest_name', 'guest_phone', 'villa_id']);

        // Check-out list today
        $todayCheckOuts = Booking::with('villa:id,name')
            ->where('check_out', $todayStr)
            ->where('status', '!=', 'cancelled')
            ->get(['id', 'booking_code', 'guest_name', 'guest_phone', 'villa_id']);

        return response()->json([
            'stats' => [
                'checkins_today' => $checkInsToday,
                'bookings_this_month' => $bookingsThisMonth,
                'revenue_this_month' => (float) $revenueThisMonth,
                'pending_payments' => $pendingPayments,
                'pending_reviews' => $pendingReviews,
                'occupancy_rate' => $occupancyRate,
            ],
            'recent_bookings' => $recentBookings,
            'today_checkins' => $todayCheckIns,
            'today_checkouts' => $todayCheckOuts,
        ]);
    }
}
