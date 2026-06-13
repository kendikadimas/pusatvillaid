<?php

namespace App\Http\Controllers;

use App\Models\BlockedDate;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Villa;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class BookingController extends Controller
{
    /**
     * Submit a new booking.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'villa_id' => 'required|exists:villas,id',
            'guest_name' => 'required|string|max:255',
            'guest_email' => 'required|email|max:255',
            'guest_phone' => 'required|string|max:20',
            'check_in' => 'required|date|after_or_equal:today',
            'check_out' => 'required|date|after:check_in',
            'num_guests' => 'required|integer|min:1',
            'notes' => 'nullable|string',
            'utm_source' => 'nullable|string|max:100',
            'utm_medium' => 'nullable|string|max:100',
            'utm_campaign' => 'nullable|string|max:100',
            'is_refundable' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $villa = Villa::find($request->villa_id);

        if (!$villa->is_active) {
            return response()->json(['message' => 'Villa ini sedang tidak aktif.'], 422);
        }

        if ($request->num_guests > $villa->max_guests) {
            return response()->json(['message' => "Jumlah tamu melebihi kapasitas maksimal villa ({$villa->max_guests} orang)."], 422);
        }

        $checkIn = Carbon::parse($request->check_in)->toDateString();
        $checkOut = Carbon::parse($request->check_out)->toDateString();

        // Calculate total nights
        $checkInCarbon = Carbon::parse($checkIn);
        $checkOutCarbon = Carbon::parse($checkOut);
        $totalNights = $checkInCarbon->diffInDays($checkOutCarbon);

        if ($totalNights < $villa->min_nights) {
            return response()->json(['message' => "Minimum lama menginap di villa ini adalah {$villa->min_nights} malam."], 422);
        }

        // Wrap availability check and database record insertion in a transaction
        // to prevent race conditions (two people booking the same dates simultaneously)
        try {
            $bookingData = DB::transaction(function () use ($villa, $checkIn, $checkOut, $totalNights, $request) {
                // 1. Lock existing bookings check
                $overlappingBookings = Booking::where('villa_id', $villa->id)
                    ->where('status', '!=', 'cancelled')
                    ->where(function($query) use ($checkIn, $checkOut) {
                        $query->where(function($q) use ($checkIn, $checkOut) {
                            $q->where('check_in', '>=', $checkIn)
                              ->where('check_in', '<', $checkOut);
                        })->orWhere(function($q) use ($checkIn, $checkOut) {
                            $q->where('check_out', '>', $checkIn)
                              ->where('check_out', '<=', $checkOut);
                        })->orWhere(function($q) use ($checkIn, $checkOut) {
                            $q->where('check_in', '<=', $checkIn)
                              ->where('check_out', '>=', $checkOut);
                        });
                    })
                    ->lockForUpdate()
                    ->exists();

                if ($overlappingBookings) {
                    throw new \Exception('Tanggal yang Anda pilih sudah dipesan oleh tamu lain.');
                }

                // 2. Check blocked dates
                $blockedDatesExist = BlockedDate::where('villa_id', $villa->id)
                    ->whereBetween('date', [$checkIn, Carbon::parse($checkOut)->subDay()->toDateString()])
                    ->exists();

                if ($blockedDatesExist) {
                    throw new \Exception('Tanggal yang Anda pilih sedang dalam masa pemeliharaan villa.');
                }

                // 3. Calculate total pricing (weekday vs weekend pricing)
                $totalAmount = 0;
                $period = CarbonPeriod::create($checkIn, Carbon::parse($checkOut)->subDay());
                
                foreach ($period as $date) {
                    $isWeekend = $date->isFriday() || $date->isSaturday();
                    if ($isWeekend && $villa->weekend_price !== null) {
                        $totalAmount += $villa->weekend_price;
                    } else {
                        $totalAmount += $villa->price_per_night;
                    }
                }

                if ($request->input('is_refundable')) {
                    $totalAmount = round($totalAmount * 1.11111);
                }

                // 4. Generate sequential booking code (VB-YYYY-XXXX) — atomic with lock
                $year = now()->year;
                $count = Booking::whereYear('created_at', $year)->lockForUpdate()->count();
                $bookingCode = 'VB-' . $year . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);

                $notes = $request->notes;
                if ($request->input('is_refundable')) {
                    $notes = trim(($notes ? $notes . "\n" : "") . "[Pilihan Tarif: Bisa dikembalikan (Refundable)]");
                } else {
                    $notes = trim(($notes ? $notes . "\n" : "") . "[Pilihan Tarif: Tanpa pengembalian dana (Non-refundable)]");
                }

                // 5. Save Booking
                $booking = Booking::create([
                    'booking_code' => $bookingCode,
                    'villa_id' => $villa->id,
                    'guest_name' => $request->guest_name,
                    'guest_email' => $request->guest_email,
                    'guest_phone' => $request->guest_phone,
                    'check_in' => $checkIn,
                    'check_out' => $checkOut,
                    'total_nights' => $totalNights,
                    'num_guests' => $request->num_guests,
                    'base_price' => $villa->price_per_night,
                    'total_amount' => $totalAmount,
                    'status' => 'pending',
                    'payment_status' => 'unpaid',
                    'notes' => $notes,
                    'utm_source' => $request->utm_source,
                    'utm_medium' => $request->utm_medium,
                    'utm_campaign' => $request->utm_campaign,
                ]);

                return $booking;
            });

            // Request Midtrans Snap Token
            $snapToken = $this->getMidtransSnapToken($bookingData, $villa);

            // Create payment record
            Payment::create([
                'booking_id' => $bookingData->id,
                'midtrans_order_id' => $bookingData->booking_code . '-' . time(),
                'amount' => $bookingData->total_amount,
                'status' => 'pending',
                'snap_token' => $snapToken,
                'expired_at' => now()->addHour(),
            ]);

            return response()->json([
                'booking_code' => $bookingData->booking_code,
                'snap_token' => $snapToken,
                'total_amount' => $bookingData->total_amount,
                'message' => 'Booking berhasil dibuat. Silakan selesaikan pembayaran.'
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Fetch booking details by code and guest email.
     */
    public function show(string $code, Request $request): JsonResponse
    {
        $email = $request->query('email');

        if (!$email) {
            return response()->json(['message' => 'Email verifikasi diperlukan.'], 400);
        }

        $booking = Booking::where('booking_code', $code)
            ->where('guest_email', $email)
            ->with(['villa', 'payment'])
            ->first();

        if (!$booking) {
            return response()->json(['message' => 'Booking tidak ditemukan atau email tidak sesuai.'], 404);
        }

        return response()->json($booking);
    }

    /**
     * Request snap token from Midtrans snap API.
     */
    private function getMidtransSnapToken(Booking $booking, Villa $villa): ?string
    {
        $serverKey = env('MIDTRANS_SERVER_KEY');
        $isProduction = env('MIDTRANS_IS_PRODUCTION', false);

        if (empty($serverKey)) {
            Log::warning('Midtrans server key is not configured. Generating mock token.');
            return 'mock-snap-token-' . uniqid();
        }

        $baseUrl = $isProduction 
            ? 'https://app.midtrans.com/snap/v1/transactions' 
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

        $payload = [
            'transaction_details' => [
                'order_id' => $booking->booking_code . '-' . time(),
                'gross_amount' => (int) $booking->total_amount,
            ],
            'customer_details' => [
                'first_name' => $booking->guest_name,
                'email' => $booking->guest_email,
                'phone' => $booking->guest_phone,
            ],
            'item_details' => [
                [
                    'id' => 'villa-' . $villa->id,
                    'price' => (int) $booking->total_amount,
                    'quantity' => 1,
                    'name' => 'Sewa ' . $villa->name . ' (' . $booking->total_nights . ' malam)',
                ]
            ],
            'expiry' => [
                'start_time' => now()->format('Y-m-d H:i:s O'),
                'unit' => 'minutes',
                'duration' => 60
            ]
        ];

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])
            ->withBasicAuth($serverKey, '')
            ->post($baseUrl, $payload);

            if ($response->successful()) {
                return $response->json('token');
            }

            Log::error('Midtrans API Request failed: ' . $response->body());
            return 'mock-snap-token-' . uniqid(); // Fallback for testing/offline environments
        } catch (\Exception $e) {
            Log::error('Midtrans API Exception: ' . $e->getMessage());
            return 'mock-snap-token-' . uniqid(); // Fallback for testing/offline environments
        }
    }
}
