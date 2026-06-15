<?php

namespace App\Http\Controllers;

use App\Mail\BookingConfirmationMail;
use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class PaymentController extends Controller
{
    /**
     * Midtrans Webhook Notification Handler.
     */
    public function notification(Request $request): JsonResponse
    {
        $payload = $request->all();

        $orderId = $payload['order_id'] ?? null;
        $statusCode = $payload['status_code'] ?? null;
        $grossAmount = $payload['gross_amount'] ?? null;
        $signatureKey = $payload['signature_key'] ?? null;
        $transactionStatus = $payload['transaction_status'] ?? null;
        $paymentType = $payload['payment_type'] ?? null;
        $transactionId = $payload['transaction_id'] ?? null;

        if (! $orderId || ! $statusCode || ! $grossAmount || ! $signatureKey) {
            return response()->json(['message' => 'Payload tidak lengkap.'], 400);
        }

        // 1. Signature Key Verification (SHA512) - SECURITY: Server key MUST be configured
        $serverKey = env('MIDTRANS_SERVER_KEY');
        if (empty($serverKey)) {
            Log::error('Midtrans Webhook: Server key not configured. Rejecting webhook for security.');

            return response()->json(['message' => 'Server key tidak terkonfigurasi.'], 500);
        }

        $expectedSignature = hash('sha512', $orderId.$statusCode.$grossAmount.$serverKey);
        if ($signatureKey !== $expectedSignature) {
            Log::warning("Midtrans Webhook: Invalid Signature for Order {$orderId}");

            return response()->json(['message' => 'Signature key tidak valid.'], 403);
        }

        // 2. Fetch Payment Record
        $payment = Payment::where('midtrans_order_id', $orderId)->first();
        if (! $payment) {
            Log::warning("Midtrans Webhook: Payment Record Not Found for Order {$orderId}");

            return response()->json(['message' => 'Transaksi tidak ditemukan.'], 404);
        }

        // 3. Prevent Amount Tampering Check
        if (round((float) $grossAmount) !== round((float) $payment->amount)) {
            Log::warning("Midtrans Webhook: Amount Mismatch for Order {$orderId}. Webhook: {$grossAmount}, DB: {$payment->amount}");

            return response()->json(['message' => 'Gross amount tidak cocok.'], 400);
        }

        $booking = $payment->booking;

        // 4. Update Payment and Booking statuses in a Transaction
        try {
            DB::transaction(function () use ($payment, $booking, $transactionStatus, $paymentType, $transactionId, $payload) {
                $payment->midtrans_transaction_id = $transactionId;
                $payment->payment_type = $paymentType;
                $payment->raw_response = $payload;

                if ($transactionStatus === 'capture' || $transactionStatus === 'settlement') {
                    // Success Payment
                    $payment->status = 'success';
                    $payment->paid_at = now();

                    $booking->status = 'confirmed';
                    $booking->payment_status = 'paid';
                } elseif ($transactionStatus === 'deny' || $transactionStatus === 'cancel') {
                    // Failed / Cancelled
                    $payment->status = 'cancel';

                    $booking->status = 'cancelled';
                    $booking->payment_status = 'unpaid';
                    $booking->cancel_reason = 'Dibatalkan dari sistem pembayaran.';
                    $booking->cancelled_at = now();
                } elseif ($transactionStatus === 'expire') {
                    // Expired
                    $payment->status = 'expire';

                    $booking->status = 'cancelled';
                    $booking->payment_status = 'expired';
                    $booking->cancel_reason = 'Batas waktu pembayaran habis (expired).';
                    $booking->cancelled_at = now();
                } elseif ($transactionStatus === 'pending') {
                    // Pending
                    $payment->status = 'pending';
                    $booking->payment_status = 'unpaid';
                }

                $payment->save();
                $booking->save();
            });

            // 5. Send Email Notification if payment succeeded
            if ($booking->status === 'confirmed') {
                $this->sendBookingConfirmationEmail($booking);
            }

            return response()->json(['message' => 'Webhook diproses dengan sukses.']);

        } catch (\Exception $e) {
            Log::error('Midtrans Webhook Error: '.$e->getMessage());

            return response()->json(['message' => 'Kesalahan server saat memproses status.'], 500);
        }
    }

    /**
     * Helper to dispatch booking confirmation email.
     */
    private function sendBookingConfirmationEmail(Booking $booking): void
    {
        try {
            Mail::to($booking->guest_email)
                ->send(new BookingConfirmationMail($booking));

            Log::info("Email konfirmasi berhasil dikirim ke {$booking->guest_email} untuk Booking {$booking->booking_code}");
        } catch (\Exception $e) {
            Log::error("Gagal mengirim email konfirmasi ke {$booking->guest_email}: ".$e->getMessage());
        }
    }

    /**
     * Generate review token for post-stay review invitation.
     */
    private function generateReviewToken(Booking $booking): void
    {
        try {
            // Check if token already exists
            $existing = ReviewToken::where('booking_id', $booking->id)->first();
            if ($existing) {
                return;
            }

            ReviewToken::create([
                'booking_id' => $booking->id,
                'token' => Str::random(64),
                'used' => false,
                'expires_at' => now()->addDays(30),
            ]);

            Log::info("Review token generated for Booking {$booking->booking_code}");
        } catch (\Exception $e) {
            Log::error("Failed to generate review token for Booking {$booking->booking_code}: ".$e->getMessage());
        }
    }
}
