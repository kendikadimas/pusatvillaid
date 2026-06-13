<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewAdminController extends Controller
{
    /**
     * List all reviews with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Review::with(['villa:id,name,slug', 'booking:id,booking_code,check_in,check_out']);

        if ($request->filled('status')) {
            $isApproved = $request->status === 'approved';
            $query->where('is_approved', $isApproved);
        }

        if ($request->filled('villa_id')) {
            $query->where('villa_id', $request->villa_id);
        }

        $reviews = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'data' => $reviews->items(),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ]
        ]);
    }

    /**
     * Approve a review.
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $review = Review::find($id);

        if (!$review) {
            return response()->json(['message' => 'Review tidak ditemukan.'], 404);
        }

        $review->is_approved = true;
        $review->approved_at = now();
        $review->approved_by = $request->user()->id;
        $review->save();

        return response()->json([
            'review' => $review,
            'message' => 'Review berhasil disetujui dan sekarang tampil di halaman detail villa.'
        ]);
    }

    /**
     * Reject or delete a review.
     */
    public function destroy(int $id): JsonResponse
    {
        $review = Review::find($id);

        if (!$review) {
            return response()->json(['message' => 'Review tidak ditemukan.'], 404);
        }

        $review->delete();

        return response()->json([
            'message' => 'Review berhasil dihapus/ditolak.'
        ]);
    }

    /**
     * Store a manually created review.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'villa_id' => 'required|exists:villas,id',
            'guest_name' => 'required|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|max:2000',
            'guest_avatar' => 'nullable|string|url|max:1000',
            'guest_subtitle' => 'nullable|string|max:255',
            'is_approved' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $review = Review::create([
            'villa_id' => (int) $request->villa_id,
            'guest_name' => $request->guest_name,
            'rating' => (int) $request->rating,
            'comment' => $request->comment,
            'guest_avatar' => $request->guest_avatar,
            'guest_subtitle' => $request->guest_subtitle,
            'is_approved' => $request->input('is_approved', true),
            'approved_at' => $request->input('is_approved', true) ? now() : null,
            'approved_by' => $request->input('is_approved', true) ? $request->user()->id : null,
        ]);

        return response()->json([
            'review' => $review,
            'message' => 'Ulasan berhasil ditambahkan secara manual.'
        ], 201);
    }

    /**
     * Update an existing review.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $review = Review::find($id);

        if (!$review) {
            return response()->json(['message' => 'Review tidak ditemukan.'], 404);
        }

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'guest_name' => 'required|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|max:2000',
            'guest_avatar' => 'nullable|string|url|max:1000',
            'guest_subtitle' => 'nullable|string|max:255',
            'is_approved' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $isApproved = $request->input('is_approved', $review->is_approved);
        $approvedAt = $review->approved_at;
        $approvedBy = $review->approved_by;

        if ($isApproved && !$review->is_approved) {
            $approvedAt = now();
            $approvedBy = $request->user()->id;
        } elseif (!$isApproved && $review->is_approved) {
            $approvedAt = null;
            $approvedBy = null;
        }

        $review->update([
            'guest_name' => $request->guest_name,
            'rating' => (int) $request->rating,
            'comment' => $request->comment,
            'guest_avatar' => $request->guest_avatar,
            'guest_subtitle' => $request->guest_subtitle,
            'is_approved' => $isApproved,
            'approved_at' => $approvedAt,
            'approved_by' => $approvedBy,
        ]);

        return response()->json([
            'review' => $review,
            'message' => 'Ulasan berhasil diperbarui.'
        ]);
    }
}
