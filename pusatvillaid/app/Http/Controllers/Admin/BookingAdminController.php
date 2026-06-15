<?php

namespace App\Http\Controllers;

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\BookingConfirmationMail;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class BookingAdminController extends Controller
{
    /**
     * List all bookings with filtering, sorting, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Booking::with('villa:id,name');

        // Search by code, guest name, or guest email
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('booking_code', 'like', "%{$search}%")
                    ->orWhere('guest_name', 'like', "%{$search}%")
                    ->orWhere('guest_email', 'like', "%{$search}%");
            });
        }

        // Filter by booking status
        if ($request->filled('status')) {
            $statuses = is_array($request->status) ? $request->status : explode(',', $request->status);
            $query->whereIn('status', $statuses);
        }

        // Filter by payment status
        if ($request->filled('payment_status')) {
            $paymentStatuses = is_array($request->payment_status) ? $request->payment_status : explode(',', $request->payment_status);
            $query->whereIn('payment_status', $paymentStatuses);
        }

        // Filter by villa
        if ($request->filled('villa_id')) {
            $query->where('villa_id', $request->villa_id);
        }

        // Filter by check-in range
        if ($request->filled('check_in_from') && $request->filled('check_in_to')) {
            $query->whereBetween('check_in', [$request->check_in_from, $request->check_in_to]);
        }

        // Filter by created-at range
        if ($request->filled('created_from') && $request->filled('created_to')) {
            $query->whereBetween('created_at', [$request->created_from, $request->created_to]);
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');

        if (in_array($sortBy, ['booking_code', 'check_in', 'check_out', 'total_amount', 'status', 'created_at'])) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $bookings = $query->paginate(20);

        return response()->json([
            'data' => $bookings->items(),
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    /**
     * Get detail of a single booking + payment history.
     */
    public function show(int $id): JsonResponse
    {
        $booking = Booking::with(['villa', 'payment', 'review'])->find($id);

        if (! $booking) {
            return response()->json(['message' => 'Booking tidak ditemukan.'], 404);
        }

        return response()->json($booking);
    }

    /**
     * Update booking status & payment status.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $booking = Booking::find($id);

        if (! $booking) {
            return response()->json(['message' => 'Booking tidak ditemukan.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,confirmed,cancelled,completed',
            'payment_status' => 'required|in:unpaid,paid,refunded,expired',
            'cancel_reason' => 'required_if:status,cancelled|nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $booking->status = $request->status;
        $booking->payment_status = $request->payment_status;

        // Overlap guard: prevent confirming a booking that clashes with another active booking
        if ($request->status === 'confirmed') {
            $overlapping = Booking::where('villa_id', $booking->villa_id)
                ->where('id', '!=', $booking->id)
                ->whereIn('status', ['confirmed', 'completed'])
                ->where(function ($query) use ($booking) {
                    $query->where(function ($q) use ($booking) {
                        $q->where('check_in', '>=', $booking->check_in)
                            ->where('check_in', '<', $booking->check_out);
                    })->orWhere(function ($q) use ($booking) {
                        $q->where('check_out', '>', $booking->check_in)
                            ->where('check_out', '<=', $booking->check_out);
                    })->orWhere(function ($q) use ($booking) {
                        $q->where('check_in', '<=', $booking->check_in)
                            ->where('check_out', '>=', $booking->check_out);
                    });
                })
                ->exists();

            if ($overlapping) {
                return response()->json([
                    'message' => 'Tidak bisa konfirmasi: tanggal bertabrakan dengan booking lain yang sudah dikonfirmasi.',
                ], 422);
            }
        }

        if ($request->status === 'cancelled') {
            $booking->cancel_reason = $request->cancel_reason;
            $booking->cancelled_at = now();
        }

        $booking->save();

        // If payment status was manually marked as paid, update the payment record as well
        if ($booking->payment) {
            $payment = $booking->payment;
            if ($request->payment_status === 'paid') {
                $payment->status = 'success';
                $payment->paid_at = $payment->paid_at ?? now();
            } elseif ($request->payment_status === 'refunded') {
                $payment->status = 'cancel'; // Treat refund as cancel in payment status
            } elseif ($request->payment_status === 'expired') {
                $payment->status = 'expire';
            }
            $payment->save();
        }

        return response()->json([
            'booking' => $booking,
            'message' => 'Status booking berhasil diperbarui.',
        ]);
    }

    /**
     * Resend booking confirmation email.
     */
    public function resendEmail(int $id): JsonResponse
    {
        $booking = Booking::with(['villa', 'payment'])->find($id);

        if (! $booking) {
            return response()->json(['message' => 'Booking tidak ditemukan.'], 404);
        }

        try {
            Mail::to($booking->guest_email)
                ->send(new BookingConfirmationMail($booking));

            Log::info("Admin resend email konfirmasi untuk Booking Code: {$booking->booking_code} ke {$booking->guest_email}");

            return response()->json([
                'message' => "Email konfirmasi untuk booking {$booking->booking_code} berhasil dikirim ulang ke {$booking->guest_email}.",
            ]);
        } catch (\Exception $e) {
            Log::error("Gagal mengirim email konfirmasi untuk booking {$booking->booking_code}: ".$e->getMessage());

            return response()->json([
                'message' => 'Gagal mengirim email. Silakan coba lagi.',
            ], 500);
        }
    }
}
