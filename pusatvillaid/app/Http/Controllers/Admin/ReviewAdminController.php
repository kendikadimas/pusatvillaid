<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

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
            ],
        ]);
    }

    /**
     * Approve a review.
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $review = Review::find($id);

        if (! $review) {
            return response()->json(['message' => 'Review tidak ditemukan.'], 404);
        }

        $review->is_approved = true;
        $review->approved_at = now();
        $review->approved_by = $request->user()->id;
        $review->save();

        return response()->json([
            'review' => $review,
            'message' => 'Review berhasil disetujui dan sekarang tampil di halaman detail villa.',
        ]);
    }

    /**
     * Reject or delete a review.
     */
    public function destroy(int $id): JsonResponse
    {
        $review = Review::find($id);

        if (! $review) {
            return response()->json(['message' => 'Review tidak ditemukan.'], 404);
        }

        $review->delete();

        return response()->json([
            'message' => 'Review berhasil dihapus/ditolak.',
        ]);
    }

    /**
     * Store a manually created review.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'villa_id' => 'required|exists:villas,id',
            'guest_name' => 'required|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|max:2000',
            'guest_avatar' => 'nullable|string|url|max:1000',
            'guest_subtitle' => 'nullable|string|max:255',
            'is_approved' => 'boolean',
            'created_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $review = new Review([
            'villa_id' => (int) $request->villa_id,
            'guest_name' => $request->guest_name,
            'rating' => (int) $request->rating,
            'comment' => $request->comment,
            'guest_avatar' => $request->guest_avatar,
            'guest_subtitle' => $request->guest_subtitle,
            'is_approved' => $request->input('is_approved', true),
        ]);

        if ($request->filled('created_at')) {
            $review->created_at = $request->created_at;
        }

        if ($request->input('is_approved', true)) {
            $review->approved_at = now();
            $review->approved_by = $request->user()->id;
        }

        $review->save();

        return response()->json([
            'review' => $review,
            'message' => 'Ulasan berhasil ditambahkan secara manual.',
        ], 201);
    }

    /**
     * Update an existing review.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $review = Review::find($id);

        if (! $review) {
            return response()->json(['message' => 'Review tidak ditemukan.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'guest_name' => 'required|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|max:2000',
            'guest_avatar' => 'nullable|string|url|max:1000',
            'guest_subtitle' => 'nullable|string|max:255',
            'is_approved' => 'boolean',
            'created_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $isApproved = $request->input('is_approved', $review->is_approved);
        $approvedAt = $review->approved_at;
        $approvedBy = $review->approved_by;

        if ($isApproved && ! $review->is_approved) {
            $approvedAt = now();
            $approvedBy = $request->user()->id;
        } elseif (! $isApproved && $review->is_approved) {
            $approvedAt = null;
            $approvedBy = null;
        }

        $review->fill([
            'guest_name' => $request->guest_name,
            'rating' => (int) $request->rating,
            'comment' => $request->comment,
            'guest_avatar' => $request->guest_avatar,
            'guest_subtitle' => $request->guest_subtitle,
            'is_approved' => $isApproved,
            'approved_at' => $approvedAt,
            'approved_by' => $approvedBy,
        ]);

        if ($request->filled('created_at')) {
            $review->created_at = $request->created_at;
        }

        $review->save();

        return response()->json([
            'review' => $review,
            'message' => 'Ulasan berhasil diperbarui.',
        ]);
    }

    /**
     * Upload avatar for a review guest.
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048', // Max 2MB
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $url = asset('storage/'.$path);

            return response()->json([
                'avatar_url' => $url,
                'message' => 'Avatar berhasil diunggah.',
            ]);
        }

        return response()->json(['message' => 'File avatar tidak ditemukan.'], 400);
    }
}
