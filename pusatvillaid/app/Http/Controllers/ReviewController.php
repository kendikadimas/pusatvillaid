<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\ReviewToken;
use App\Models\Villa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ReviewController extends Controller
{
    /**
     * Get approved reviews for a villa.
     */
    public function getByVilla(string $villaSlug): JsonResponse
    {
        $villa = Villa::where('slug', $villaSlug)->first();

        if (! $villa) {
            return response()->json(['message' => 'Villa tidak ditemukan.'], 404);
        }

        $reviews = $villa->reviews()
            ->where('is_approved', true)
            ->orderBy('created_at', 'desc')
            ->paginate(5);

        return response()->json([
            'data' => $reviews->items(),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ],
        ]);
    }

    /**
     * Validate a review token.
     */
    public function showByToken(string $token): JsonResponse
    {
        $reviewToken = ReviewToken::where('token', $token)
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (! $reviewToken) {
            return response()->json([
                'valid' => false,
                'message' => 'Token review tidak valid, sudah digunakan, atau telah kadaluarsa.',
            ], 400);
        }

        $booking = $reviewToken->booking()->with('villa:id,name,slug,photos')->first();

        return response()->json([
            'valid' => true,
            'booking' => $booking,
        ]);
    }

    /**
     * Submit guest review via token.
     */
    public function storeByToken(string $token, Request $request): JsonResponse
    {
        $reviewToken = ReviewToken::where('token', $token)
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (! $reviewToken) {
            return response()->json(['message' => 'Token review tidak valid atau telah kadaluarsa.'], 400);
        }

        $validator = Validator::make($request->all(), [
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|min:20|max:500',
        ], [
            'rating.required' => 'Rating bintang wajib dipilih.',
            'comment.required' => 'Komentar ulasan wajib diisi.',
            'comment.min' => 'Komentar minimal berisi 20 karakter.',
            'comment.max' => 'Komentar maksimal berisi 500 karakter.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $booking = $reviewToken->booking;

        try {
            DB::transaction(function () use ($reviewToken, $booking, $request) {
                // 1. Create review
                Review::create([
                    'booking_id' => $booking->id,
                    'villa_id' => $booking->villa_id,
                    'guest_name' => $booking->guest_name,
                    'rating' => (int) $request->rating,
                    'comment' => $request->comment,
                    'is_approved' => false, // Requires admin moderation
                ]);

                // 2. Mark token as used
                $reviewToken->used = true;
                $reviewToken->save();
            });

            return response()->json([
                'message' => 'Terima kasih atas ulasan Anda! Ulasan Anda telah diterima dan akan segera ditampilkan setelah diverifikasi admin.',
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Kesalahan saat menyimpan ulasan.'], 500);
        }
    }
}
