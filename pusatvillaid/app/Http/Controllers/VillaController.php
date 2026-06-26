<?php

namespace App\Http\Controllers;

use App\Models\Villa;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VillaController extends Controller
{
    /**
     * List all active villas with optional filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Villa::where('is_active', true)
            ->with('destination')
            ->withAvg(['reviews' => function ($q) {
                $q->where('is_approved', true);
            }], 'rating')
            ->withCount(['reviews' => function ($q) {
                $q->where('is_approved', true);
            }]);

        // Filter by location / destination
        if ($request->filled('location')) {
            $location = $request->location;
            $query->where(function ($q) use ($location) {
                $q->where('location', 'like', '%'.$location.'%')
                    ->orWhereHas('destination', function ($dq) use ($location) {
                        $dq->where('name', 'like', '%'.$location.'%')
                            ->orWhere('city', 'like', '%'.$location.'%')
                            ->orWhere('query', 'like', '%'.$location.'%');
                    });
            });
        }

        // Strict filter by destination_id
        if ($request->filled('destination_id')) {
            $query->where('destination_id', $request->destination_id);
        }

        // Filter by bedrooms
        if ($request->filled('bedrooms')) {
            $query->where('bedrooms', '>=', (int) $request->bedrooms);
        }

        // Filter by guest capacity
        if ($request->filled('guests')) {
            $query->where('max_guests', '>=', (int) $request->guests);
        }

        // Filter by price range
        if ($request->filled('min_price')) {
            $query->where('price_per_night', '>=', (float) $request->min_price);
        }
        if ($request->filled('max_price')) {
            $query->where('price_per_night', '<=', (float) $request->max_price);
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');

        if (in_array($sortBy, ['price_per_night', 'created_at', 'bedrooms', 'max_guests'])) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = $request->input('per_page', 50);
        $villas = $query->paginate(min((int) $perPage, 50));

        // Format pagination metadata
        return response()->json([
            'data' => $villas->items(),
            'meta' => [
                'current_page' => $villas->currentPage(),
                'last_page' => $villas->lastPage(),
                'per_page' => $villas->perPage(),
                'total' => $villas->total(),
            ],
        ]);
    }

    /**
     * Show single villa details with average rating.
     */
    public function show(string $slug): JsonResponse
    {
        $villa = Villa::where('slug', $slug)
            ->where('is_active', true)
            ->with('destination')
            ->first();

        if (! $villa) {
            return response()->json(['message' => 'Villa tidak ditemukan.'], 404);
        }

        // Load approved reviews
        $reviews = $villa->reviews()
            ->where('is_approved', true)
            ->orderBy('created_at', 'desc')
            ->get();

        $avgRating = $reviews->avg('rating') ?? 0.0;
        $totalReviews = $reviews->count();

        return response()->json([
            'villa' => $villa,
            'reviews' => $reviews,
            'stats' => [
                'rating_avg' => round($avgRating, 1),
                'reviews_count' => $totalReviews,
            ],
        ]);
    }

    /**
     * Get disabled dates for the booking calendar.
     */
    public function availability(string $slug): JsonResponse
    {
        $villa = Villa::where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (! $villa) {
            return response()->json(['message' => 'Villa tidak ditemukan.'], 404);
        }

        $disabledDates = [];

        // 1. Get dates from confirmed/completed bookings only (pending does not block)
        $bookings = $villa->bookings()
            ->whereIn('status', ['confirmed', 'completed'])
            ->where('check_out', '>=', now()->toDateString())
            ->get(['check_in', 'check_out']);

        foreach ($bookings as $booking) {
            // Loop from check_in to check_out - 1 (exclusive of checkout night)
            $checkIn = Carbon::parse($booking->check_in);
            $checkOut = Carbon::parse($booking->check_out);

            if ($checkIn->equalTo($checkOut)) {
                $disabledDates[] = $checkIn->toDateString();
            } else {
                $period = CarbonPeriod::create($checkIn, $checkOut->copy()->subDay());
                foreach ($period as $date) {
                    $disabledDates[] = $date->toDateString();
                }
            }
        }

        // 2. Get dates from blocked dates table
        $blockedDates = $villa->blockedDates()
            ->where('date', '>=', now()->toDateString())
            ->pluck('date')
            ->map(fn ($date) => Carbon::parse($date)->toDateString())
            ->toArray();

        // Merge and clean up
        $allDisabledDates = array_unique(array_merge($disabledDates, $blockedDates));
        sort($allDisabledDates);

        return response()->json([
            'disabled_dates' => $allDisabledDates,
        ]);
    }
}
