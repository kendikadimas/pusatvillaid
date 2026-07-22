<?php

namespace App\Http\Controllers;

use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VoucherController extends Controller
{
    /**
     * Validate a voucher code and return discount info.
     * Public endpoint — called from the checkout page before submitting.
     */
    public function validate(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|max:50',
            'booking_amount' => 'required|integer|min:0',
        ]);

        $code = Str::upper(trim($request->code));
        $voucher = Voucher::where('code', $code)->first();

        if (! $voucher) {
            return response()->json(['message' => 'Kode voucher tidak valid.'], 404);
        }

        if (! $voucher->isValid()) {
            if (! $voucher->is_active) {
                return response()->json(['message' => 'Voucher ini sudah tidak aktif.'], 422);
            }
            if ($voucher->valid_until && now()->gt($voucher->valid_until)) {
                return response()->json(['message' => 'Voucher ini sudah kadaluarsa.'], 422);
            }
            if ($voucher->valid_from && now()->lt($voucher->valid_from)) {
                return response()->json(['message' => 'Voucher ini belum dapat digunakan.'], 422);
            }
            if ($voucher->usage_limit !== null && $voucher->used_count >= $voucher->usage_limit) {
                return response()->json(['message' => 'Voucher ini sudah mencapai batas penggunaan.'], 422);
            }

            return response()->json(['message' => 'Voucher tidak dapat digunakan saat ini.'], 422);
        }

        $bookingAmount = (int) $request->booking_amount;

        if ($bookingAmount < $voucher->min_booking_amount) {
            return response()->json([
                'message' => 'Minimum pemesanan untuk voucher ini adalah Rp '.number_format($voucher->min_booking_amount, 0, ',', '.').'.',
            ], 422);
        }

        $discountAmount = $voucher->calculateDiscount($bookingAmount);

        return response()->json([
            'voucher' => [
                'id' => $voucher->id,
                'code' => $voucher->code,
                'description' => $voucher->description,
                'discount_type' => $voucher->discount_type,
                'discount_value' => $voucher->discount_value,
                'max_discount' => $voucher->max_discount,
            ],
            'discount_amount' => $discountAmount,
            'message' => 'Voucher berhasil diterapkan.',
        ]);
    }
}
