<?php

namespace App\Http\Controllers;

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\BookingConfirmationMail;
use App\Mail\ManualPaymentRejectedMail;
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
        Log::info('[BookingAdmin.index] Request received', [
            'ip' => $request->ip(),
            'admin_id' => $request->user()?->id,
            'filters' => $request->only(['search', 'status', 'payment_status', 'villa_id', 'check_in_from', 'check_in_to', 'created_from', 'created_to']),
            'sort_by' => $request->input('sort_by', 'created_at'),
            'sort_order' => $request->input('sort_order', 'desc'),
        ]);

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
        $sortOrder = in_array($sortOrder, ['asc', 'desc']) ? $sortOrder : 'desc';

        if (in_array($sortBy, ['booking_code', 'check_in', 'check_out', 'total_amount', 'status', 'created_at'])) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $bookings = $query->paginate(20);

        Log::info('[BookingAdmin.index] Returning bookings', [
            'admin_id' => $request->user()?->id,
            'total' => $bookings->total(),
            'current_page' => $bookings->currentPage(),
        ]);

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
        Log::info('[BookingAdmin.show] Request received', [
            'booking_id' => $id,
        ]);

        $booking = Booking::with(['villa', 'payment', 'review'])->find($id);

        if (! $booking) {
            Log::warning('[BookingAdmin.show] Booking not found', [
                'booking_id' => $id,
            ]);

            return response()->json(['message' => 'Booking tidak ditemukan.'], 404);
        }

        Log::info('[BookingAdmin.show] Booking found', [
            'booking_id' => $id,
            'booking_code' => $booking->booking_code,
            'status' => $booking->status,
            'payment_status' => $booking->payment_status,
        ]);

        return response()->json($booking);
    }

    /**
     * Update booking status & payment status.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        Log::info('[BookingAdmin.updateStatus] Request received', [
            'booking_id' => $id,
            'admin_id' => $request->user()?->id,
            'new_status' => $request->status,
            'new_payment_status' => $request->payment_status,
            'ip' => $request->ip(),
        ]);

        $booking = Booking::find($id);

        if (! $booking) {
            Log::warning('[BookingAdmin.updateStatus] Booking not found', [
                'booking_id' => $id,
                'admin_id' => $request->user()?->id,
            ]);

            return response()->json(['message' => 'Booking tidak ditemukan.'], 404);
        }

        // Prevent admin from self-confirming their own booking
        if (($request->status === 'confirmed' || $request->payment_status === 'paid')
            && $request->user()->email === $booking->guest_email) {
            Log::warning('[BookingAdmin.updateStatus] Admin tried to confirm own booking', [
                'booking_id' => $id,
                'admin_id' => $request->user()?->id,
                'booking_code' => $booking->booking_code,
            ]);

            return response()->json(['message' => 'Admin tidak dapat mengkonfirmasi booking milik sendiri.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,confirmed,cancelled,completed',
            'payment_status' => 'required|in:unpaid,pending,paid,refunded,expired',
            'cancel_reason' => 'required_if:status,cancelled|nullable|string',
        ]);

        if ($validator->fails()) {
            Log::warning('[BookingAdmin.updateStatus] Validation failed', [
                'booking_id' => $id,
                'errors' => $validator->errors()->toArray(),
            ]);

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
                Log::warning('[BookingAdmin.updateStatus] Overlapping booking detected', [
                    'booking_id' => $id,
                    'booking_code' => $booking->booking_code,
                    'villa_id' => $booking->villa_id,
                    'check_in' => $booking->check_in,
                    'check_out' => $booking->check_out,
                    'admin_id' => $request->user()?->id,
                ]);

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

        Log::info('[BookingAdmin.updateStatus] Status updated', [
            'booking_id' => $id,
            'booking_code' => $booking->booking_code,
            'status' => $booking->status,
            'payment_status' => $booking->payment_status,
            'admin_id' => $request->user()?->id,
        ]);

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
     * Approve a manual transfer payment for a booking.
     *
     * Marks the linked payment as success, flips the booking to paid/confirmed,
     * and notifies the guest with the standard booking confirmation email.
     */
    public function approveManualPayment(Request $request, int $id): JsonResponse
    {
        Log::info('[BookingAdmin.approveManualPayment] Request received', [
            'booking_id' => $id,
            'admin_id' => $request->user()?->id,
            'ip' => $request->ip(),
        ]);

        $booking = Booking::with(['villa', 'payment'])->find($id);

        if (! $booking) {
            Log::warning('[BookingAdmin.approveManualPayment] Booking not found', [
                'booking_id' => $id,
                'admin_id' => $request->user()?->id,
            ]);

            return response()->json(['message' => 'Booking tidak ditemukan.'], 404);
        }

        // Prevent admin from self-approving their own booking
        if ($request->user()->email === $booking->guest_email) {
            Log::warning('[BookingAdmin.approveManualPayment] Admin tried to approve own booking', [
                'booking_id' => $id,
                'admin_id' => $request->user()?->id,
                'booking_code' => $booking->booking_code,
            ]);

            return response()->json(['message' => 'Admin tidak dapat menyetujui pembayaran booking milik sendiri.'], 403);
        }

        $payment = $booking->payment;

        if (! $payment || ! $payment->payment_proof) {
            Log::warning('[BookingAdmin.approveManualPayment] No payment proof found', [
                'booking_id' => $id,
                'booking_code' => $booking->booking_code,
                'has_payment' => ! is_null($payment),
                'has_proof' => $payment?->payment_proof ? true : false,
            ]);

            return response()->json(['message' => 'Belum ada bukti pembayaran manual untuk disetujui.'], 422);
        }

        if ($booking->payment_status === 'paid') {
            Log::warning('[BookingAdmin.approveManualPayment] Booking already paid', [
                'booking_id' => $id,
                'booking_code' => $booking->booking_code,
            ]);

            return response()->json(['message' => 'Pembayaran booking ini sudah disetujui sebelumnya.'], 422);
        }

        // Overlap guard: don't confirm a booking that clashes with another active booking.
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
            Log::warning('[BookingAdmin.approveManualPayment] Overlapping booking detected', [
                'booking_id' => $id,
                'booking_code' => $booking->booking_code,
                'villa_id' => $booking->villa_id,
                'check_in' => $booking->check_in,
                'check_out' => $booking->check_out,
                'admin_id' => $request->user()?->id,
            ]);

            return response()->json([
                'message' => 'Tidak bisa menyetujui: tanggal bertabrakan dengan booking lain yang sudah dikonfirmasi.',
            ], 422);
        }

        $booking->status = 'confirmed';
        $booking->payment_status = 'paid';
        $booking->save();

        $payment->status = 'success';
        $payment->paid_at = $payment->paid_at ?? now();
        $payment->rejection_reason = null;
        $payment->rejected_at = null;
        $payment->save();

        Log::info('[BookingAdmin.approveManualPayment] Payment approved', [
            'booking_id' => $id,
            'booking_code' => $booking->booking_code,
            'payment_id' => $payment->id,
            'admin_id' => $request->user()?->id,
            'guest_email' => $booking->guest_email,
        ]);

        try {
            Mail::to($booking->guest_email)->send(new BookingConfirmationMail($booking));
        } catch (\Exception $e) {
            Log::error("Gagal mengirim email konfirmasi (approve manual) untuk booking {$booking->booking_code}: ".$e->getMessage());
        }

        return response()->json([
            'booking' => $booking->fresh(['villa', 'payment']),
            'message' => 'Pembayaran manual disetujui & booking dikonfirmasi. Email konfirmasi telah dikirim ke tamu.',
        ]);
    }

    /**
     * Reject a manual transfer payment for a booking.
     *
     * Marks the linked payment as failed with a reason, keeps the booking unpaid
     * so the guest can re-upload, and notifies the guest of the reason.
     */
    public function rejectManualPayment(Request $request, int $id): JsonResponse
    {
        Log::info('[BookingAdmin.rejectManualPayment] Request received', [
            'booking_id' => $id,
            'admin_id' => $request->user()?->id,
            'ip' => $request->ip(),
        ]);

        $booking = Booking::with(['villa', 'payment'])->find($id);

        if (! $booking) {
            Log::warning('[BookingAdmin.rejectManualPayment] Booking not found', [
                'booking_id' => $id,
                'admin_id' => $request->user()?->id,
            ]);

            return response()->json(['message' => 'Booking tidak ditemukan.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'rejection_reason' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            Log::warning('[BookingAdmin.rejectManualPayment] Validation failed', [
                'booking_id' => $id,
                'errors' => $validator->errors()->toArray(),
            ]);

            return response()->json(['errors' => $validator->errors()], 422);
        }

        $payment = $booking->payment;

        if (! $payment || ! $payment->payment_proof) {
            Log::warning('[BookingAdmin.rejectManualPayment] No payment proof found', [
                'booking_id' => $id,
                'booking_code' => $booking->booking_code,
                'has_payment' => ! is_null($payment),
                'has_proof' => $payment?->payment_proof ? true : false,
            ]);

            return response()->json(['message' => 'Belum ada bukti pembayaran manual untuk ditolak.'], 422);
        }

        if ($booking->payment_status === 'paid') {
            Log::warning('[BookingAdmin.rejectManualPayment] Booking already paid, cannot reject', [
                'booking_id' => $id,
                'booking_code' => $booking->booking_code,
            ]);

            return response()->json(['message' => 'Pembayaran sudah disetujui, tidak bisa ditolak.'], 422);
        }

        $payment->status = 'failed';
        $payment->rejection_reason = $request->rejection_reason;
        $payment->rejected_at = now();
        $payment->paid_at = null;
        $payment->save();

        // Keep booking unpaid so the guest can re-upload a new proof.
        $booking->payment_status = 'unpaid';
        $booking->save();

        Log::info('[BookingAdmin.rejectManualPayment] Payment rejected', [
            'booking_id' => $id,
            'booking_code' => $booking->booking_code,
            'payment_id' => $payment->id,
            'admin_id' => $request->user()?->id,
            'guest_email' => $booking->guest_email,
        ]);

        try {
            Mail::to($booking->guest_email)
                ->send(new ManualPaymentRejectedMail($booking, $request->rejection_reason));
        } catch (\Exception $e) {
            Log::error("Gagal mengirim email penolakan pembayaran untuk booking {$booking->booking_code}: ".$e->getMessage());
        }

        return response()->json([
            'booking' => $booking->fresh(['villa', 'payment']),
            'message' => 'Bukti pembayaran ditolak. Tamu telah diberitahu untuk mengunggah ulang.',
        ]);
    }

    /**
     * Delete a booking (super admin only).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'super_admin') {
            return response()->json(['message' => 'Hanya super admin yang dapat menghapus booking.'], 403);
        }

        $booking = Booking::with('villa:id,name')->find($id);

        if (! $booking) {
            return response()->json(['message' => 'Booking tidak ditemukan.'], 404);
        }

        $bookingCode = $booking->booking_code;
        $villaName = $booking->villa?->name;
        $guestName = $booking->guest_name;
        $checkIn = $booking->check_in;
        $checkOut = $booking->check_out;
        $totalAmount = $booking->total_amount;

        $booking->delete();

        Log::info("Booking {$bookingCode} telah dihapus oleh super admin {$user->name} ({$user->email}).", [
            'deleted_by' => $user->id,
            'booking_code' => $bookingCode,
            'villa' => $villaName,
            'guest_name' => $guestName,
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'total_amount' => $totalAmount,
        ]);

        return response()->json([
            'message' => "Booking {$bookingCode} berhasil dihapus.",
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
