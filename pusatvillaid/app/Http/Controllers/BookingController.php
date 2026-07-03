<?php

namespace App\Http\Controllers;

use App\Mail\AdminNewBookingMail;
use App\Models\BlockedDate;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Setting;
use App\Models\User;
use App\Models\Villa;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    /**
     * Submit a new booking.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'villa_id' => 'required|exists:villas,id',
            'payment_method_id' => 'sometimes|nullable|exists:payment_methods,id',
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
            'ktp_image' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $villa = Villa::find($request->villa_id);

        if (! $villa) {
            return response()->json(['message' => 'Villa tidak ditemukan.'], 404);
        }

        if (! $villa->is_active) {
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
            // Upload KTP image to private disk (not publicly accessible)
            $ktpImagePath = null;
            if ($request->hasFile('ktp_image')) {
                $ktpImagePath = $request->file('ktp_image')->store('ktp-images', 'private');
            }

            $bookingData = DB::transaction(function () use ($villa, $checkIn, $checkOut, $totalNights, $request, $ktpImagePath) {
                // 1. Check overlapping bookings (confirmed/completed, or pending with proof uploaded)
                $overlappingBookings = Booking::where('villa_id', $villa->id)
                    ->where(function ($q) {
                        $q->whereIn('status', ['confirmed', 'completed'])
                            ->orWhere(function ($q2) {
                                $q2->where('status', 'pending')
                                    ->where('payment_status', 'pending');
                            });
                    })
                    ->where(function ($query) use ($checkIn, $checkOut) {
                        $query->where(function ($q) use ($checkIn, $checkOut) {
                            $q->where('check_in', '>=', $checkIn)
                                ->where('check_in', '<', $checkOut);
                        })->orWhere(function ($q) use ($checkIn, $checkOut) {
                            $q->where('check_out', '>', $checkIn)
                                ->where('check_out', '<=', $checkOut);
                        })->orWhere(function ($q) use ($checkIn, $checkOut) {
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
                $baseAmount = 0;
                $period = CarbonPeriod::create($checkIn, Carbon::parse($checkOut)->subDay());

                foreach ($period as $date) {
                    $isWeekend = $date->isFriday() || $date->isSaturday();
                    if ($isWeekend && $villa->weekend_price !== null) {
                        $baseAmount += $villa->weekend_price;
                    } else {
                        $baseAmount += $villa->price_per_night;
                    }
                }

                if ($request->input('is_refundable')) {
                    $baseAmount = round($baseAmount * 1.11111);
                }

                // Load tax percentage from settings
                $taxPercentage = (int) Setting::getValue('tax_percentage', 0);
                $taxAmount = round(($taxPercentage / 100) * $baseAmount);

                // Load admin fee from payment method
                $paymentMethod = PaymentMethod::find($request->payment_method_id);
                $adminFee = $paymentMethod ? $paymentMethod->admin_fee : 0;

                // Final total amount
                $totalAmount = $baseAmount + $taxAmount + $adminFee;

                // 4. Generate random booking code (VB-YYYY-XXXXXX) — atomic with lock and retry
                $year = now()->year;
                $maxRetries = 10;
                $bookingCode = null;

                for ($retry = 0; $retry < $maxRetries; $retry++) {
                    $randomPart = strtoupper(Str::random(6));
                    $candidateCode = 'VB-'.$year.'-'.$randomPart;

                    // Check if this code already exists (collision check)
                    if (! Booking::where('booking_code', $candidateCode)->exists()) {
                        $bookingCode = $candidateCode;
                        break;
                    }

                    // Small delay before retry
                    usleep(10000); // 10ms
                }

                if (! $bookingCode) {
                    throw new \Exception('Gagal menghasilkan kode booking. Silakan coba lagi.');
                }

                $notes = $request->notes;
                if ($request->input('is_refundable')) {
                    $notes = trim(($notes ? $notes."\n" : '').'[Pilihan Tarif: Bisa dikembalikan (Refundable)]');
                } else {
                    $notes = trim(($notes ? $notes."\n" : '').'[Pilihan Tarif: Tanpa pengembalian dana (Non-refundable)]');
                }

                // 5. Save Booking
                $booking = Booking::create([
                    'booking_code' => $bookingCode,
                    'villa_id' => $villa->id,
                    'user_id' => $request->user()?->id,
                    'payment_method_id' => $request->payment_method_id,
                    'guest_name' => $request->guest_name,
                    'guest_email' => $request->guest_email,
                    'guest_phone' => $request->guest_phone,
                    'check_in' => $checkIn,
                    'check_out' => $checkOut,
                    'total_nights' => $totalNights,
                    'num_guests' => $request->num_guests,
                    'base_price' => $villa->price_per_night,
                    'tax_amount' => $taxAmount,
                    'admin_fee' => $adminFee,
                    'total_amount' => $totalAmount,
                    'status' => 'pending',
                    'payment_status' => 'unpaid',
                    'notes' => $notes,
                    'utm_source' => $request->utm_source,
                    'utm_medium' => $request->utm_medium,
                    'utm_campaign' => $request->utm_campaign,
                    'ktp_image' => $ktpImagePath,
                ]);

                return $booking;
            });

            // Send notification email to admin(s)
            try {
                $adminEmails = User::where('role', 'admin')->pluck('email')->toArray();
                if (empty($adminEmails)) {
                    $adminEmails = ['admin@example.com'];
                }
                Mail::to($adminEmails)->send(new AdminNewBookingMail($bookingData));
                Log::info('Email notifikasi booking baru berhasil dikirim ke admin: '.implode(', ', $adminEmails));
            } catch (\Exception $mailEx) {
                Log::error('Gagal mengirim email notifikasi booking baru ke admin: '.$mailEx->getMessage());
            }

            $bookingData->load(['villa', 'payment', 'paymentMethod']);

            return response()->json([
                'booking_code' => $bookingData->booking_code,
                'total_amount' => $bookingData->total_amount,
                'message' => 'Booking berhasil dibuat. Silakan unggah bukti pembayaran.',
                'booking' => $bookingData,
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Fetch booking details by code and optional guest email (if authenticated owner/admin).
     */
    public function show(string $code, Request $request): JsonResponse
    {
        $email = $request->query('email');

        // Retrieve authenticated user using sanctum guard (if token header exists)
        $user = auth('sanctum')->user() ?? $request->user('sanctum');

        $query = Booking::where('booking_code', $code);

        if ($user) {
            // If admin/super_admin, can view any booking.
            // If regular user, can view if they are the owner OR if email parameter matches guest_email.
            if ($user->role !== 'admin' && $user->role !== 'super_admin') {
                $query->where(function ($q) use ($email, $user) {
                    $q->where('user_id', $user->id);
                    if ($email) {
                        $q->orWhere('guest_email', $email);
                    }
                });
            }
        } else {
            if (! $email) {
                return response()->json(['message' => 'Email verifikasi diperlukan.'], 400);
            }
            $query->where('guest_email', $email);
        }

        $booking = $query->with(['villa', 'payment', 'paymentMethod'])->first();

        if (! $booking) {
            return response()->json(['message' => 'Booking tidak ditemukan atau Anda tidak memiliki akses.'], 404);
        }

        return response()->json($booking);
    }

    /**
     * Confirm manual payment upload for a booking.
     */
    public function confirmManualPayment(Request $request, string $code): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'payment_method_id' => 'required|exists:payment_methods,id',
            'payment_proof' => 'required|image|mimes:jpeg,png,jpg,webp|max:10240', // Max 10MB
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $booking = Booking::where('booking_code', $code)->first();

        if (! $booking) {
            return response()->json(['message' => 'Booking tidak ditemukan.'], 404);
        }

        if ($booking->payment_status === 'paid') {
            return response()->json(['message' => 'Booking ini sudah dibayar.'], 400);
        }

        $paymentMethod = PaymentMethod::find($request->payment_method_id);

        if (! $paymentMethod || ! $paymentMethod->is_active) {
            return response()->json(['message' => 'Metode pembayaran tidak aktif.'], 422);
        }

        // Handle file upload to private disk
        $proofPath = null;
        if ($request->hasFile('payment_proof')) {
            $proofPath = $request->file('payment_proof')->store('payment-proofs', 'private');
        }

        if (! $proofPath) {
            return response()->json(['message' => 'Gagal mengunggah bukti pembayaran.'], 400);
        }

        // Fetch or create payment record
        $payment = $booking->payment;

        if ($payment) {
            // Delete old proof if it exists
            if ($payment->payment_proof && Storage::disk('private')->exists($payment->payment_proof)) {
                Storage::disk('private')->delete($payment->payment_proof);
            }

            $payment->update([
                'payment_type' => 'manual_'.$paymentMethod->code,
                'status' => 'pending',
                'payment_proof' => $proofPath,
                'rejection_reason' => null,
                'rejected_at' => null,
            ]);
        } else {
            $payment = Payment::create([
                'booking_id' => $booking->id,
                'midtrans_order_id' => 'manual-'.$booking->booking_code.'-'.time(),
                'amount' => $booking->total_amount,
                'status' => 'pending',
                'payment_type' => 'manual_'.$paymentMethod->code,
                'payment_proof' => $proofPath,
            ]);
        }

        // Update booking payment_status to indicate proof is awaiting verification
        $booking->update([
            'payment_status' => 'pending',
        ]);

        return response()->json([
            'payment' => $payment,
            'message' => 'Bukti pembayaran transfer manual berhasil diunggah. Menunggu konfirmasi admin.',
        ]);
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

            return 'mock-snap-token-'.uniqid();
        }

        $baseUrl = $isProduction
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

        $payload = [
            'transaction_details' => [
                'order_id' => $booking->booking_code.'-'.time(),
                'gross_amount' => (int) $booking->total_amount,
            ],
            'customer_details' => [
                'first_name' => $booking->guest_name,
                'email' => $booking->guest_email,
                'phone' => $booking->guest_phone,
            ],
            'item_details' => [
                [
                    'id' => 'villa-'.$villa->id,
                    'price' => (int) $booking->total_amount,
                    'quantity' => 1,
                    'name' => 'Sewa '.$villa->name.' ('.$booking->total_nights.' malam)',
                ],
            ],
            'expiry' => [
                'start_time' => now()->format('Y-m-d H:i:s O'),
                'unit' => 'minutes',
                'duration' => 60,
            ],
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

            Log::error('Midtrans API Request failed: '.$response->body());

            return 'mock-snap-token-'.uniqid(); // Fallback for testing/offline environments
        } catch (\Exception $e) {
            Log::error('Midtrans API Exception: '.$e->getMessage());

            return 'mock-snap-token-'.uniqid(); // Fallback for testing/offline environments
        }
    }

    /**
     * Fetch list of bookings for the authenticated user.
     */
    public function userBookings(Request $request): JsonResponse
    {
        $user = $request->user();
        $bookings = Booking::where('user_id', $user->id)
            ->with(['villa', 'payment'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($bookings);
    }

    /**
     * Serve KTP image securely (authenticated access only).
     */
    public function showKtp(string $code, Request $request)
    {
        $user = auth('sanctum')->user() ?? $request->user('sanctum');

        $query = Booking::where('booking_code', $code);

        if ($user) {
            if ($user->role !== 'admin' && $user->role !== 'super_admin') {
                $query->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                        ->orWhere('guest_email', $user->email);
                });
            }
        } else {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $booking = $query->first();

        if (! $booking || ! $booking->ktp_image) {
            return response()->json(['message' => 'KTP tidak ditemukan.'], 404);
        }

        if (! Storage::disk('private')->exists($booking->ktp_image)) {
            return response()->json(['message' => 'File KTP tidak tersedia.'], 404);
        }

        return Storage::disk('private')->response($booking->ktp_image);
    }

    /**
     * Serve payment proof image securely (authenticated access only).
     */
    public function showPaymentProof(string $code, Request $request)
    {
        $user = auth('sanctum')->user() ?? $request->user('sanctum');

        $query = Booking::where('booking_code', $code);

        if ($user) {
            if ($user->role !== 'admin' && $user->role !== 'super_admin') {
                $query->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                        ->orWhere('guest_email', $user->email);
                });
            }
        } else {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $booking = $query->with('payment')->first();

        if (! $booking || ! $booking->payment || ! $booking->payment->payment_proof) {
            return response()->json(['message' => 'Bukti pembayaran tidak ditemukan.'], 404);
        }

        if (! Storage::disk('private')->exists($booking->payment->payment_proof)) {
            return response()->json(['message' => 'File bukti pembayaran tidak tersedia.'], 404);
        }

        return Storage::disk('private')->response($booking->payment->payment_proof);
    }
}
