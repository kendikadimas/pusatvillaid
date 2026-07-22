<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class VoucherAdminController extends Controller
{
    /**
     * Display a listing of vouchers.
     */
    public function index(): JsonResponse
    {
        $vouchers = Voucher::orderByDesc('created_at')->get();

        return response()->json($vouchers);
    }

    /**
     * Store a newly created voucher.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:50|unique:vouchers,code',
            'description' => 'nullable|string|max:255',
            'discount_type' => 'required|in:percentage,fixed',
            'discount_value' => 'required|integer|min:1',
            'max_discount' => 'nullable|integer|min:0',
            'min_booking_amount' => 'nullable|integer|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // percentage cap at 100
        if ($request->discount_type === 'percentage' && $request->discount_value > 100) {
            return response()->json(['errors' => ['discount_value' => ['Diskon persentase tidak boleh lebih dari 100%.']]], 422);
        }

        $voucher = Voucher::create([
            'code' => Str::upper(trim($request->code)),
            'description' => $request->description,
            'discount_type' => $request->discount_type,
            'discount_value' => $request->discount_value,
            'max_discount' => $request->max_discount,
            'min_booking_amount' => $request->input('min_booking_amount', 0),
            'usage_limit' => $request->usage_limit,
            'used_count' => 0,
            'valid_from' => $request->valid_from,
            'valid_until' => $request->valid_until,
            'is_active' => $request->input('is_active', true),
        ]);

        return response()->json([
            'voucher' => $voucher,
            'message' => 'Voucher berhasil dibuat.',
        ], 201);
    }

    /**
     * Display the specified voucher.
     */
    public function show(int $id): JsonResponse
    {
        $voucher = Voucher::find($id);

        if (! $voucher) {
            return response()->json(['message' => 'Voucher tidak ditemukan.'], 404);
        }

        return response()->json($voucher);
    }

    /**
     * Update the specified voucher.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $voucher = Voucher::find($id);

        if (! $voucher) {
            return response()->json(['message' => 'Voucher tidak ditemukan.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:50|unique:vouchers,code,'.$id,
            'description' => 'nullable|string|max:255',
            'discount_type' => 'required|in:percentage,fixed',
            'discount_value' => 'required|integer|min:1',
            'max_discount' => 'nullable|integer|min:0',
            'min_booking_amount' => 'nullable|integer|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->discount_type === 'percentage' && $request->discount_value > 100) {
            return response()->json(['errors' => ['discount_value' => ['Diskon persentase tidak boleh lebih dari 100%.']]], 422);
        }

        $voucher->update([
            'code' => Str::upper(trim($request->code)),
            'description' => $request->description,
            'discount_type' => $request->discount_type,
            'discount_value' => $request->discount_value,
            'max_discount' => $request->max_discount,
            'min_booking_amount' => $request->input('min_booking_amount', 0),
            'usage_limit' => $request->usage_limit,
            'valid_from' => $request->valid_from,
            'valid_until' => $request->valid_until,
            'is_active' => $request->input('is_active', true),
        ]);

        return response()->json([
            'voucher' => $voucher->fresh(),
            'message' => 'Voucher berhasil diperbarui.',
        ]);
    }

    /**
     * Remove the specified voucher.
     */
    public function destroy(int $id): JsonResponse
    {
        $voucher = Voucher::find($id);

        if (! $voucher) {
            return response()->json(['message' => 'Voucher tidak ditemukan.'], 404);
        }

        if ($voucher->used_count > 0) {
            return response()->json(['message' => 'Voucher yang sudah pernah digunakan tidak dapat dihapus.'], 422);
        }

        $voucher->delete();

        return response()->json(['message' => 'Voucher berhasil dihapus.']);
    }

    /**
     * Toggle active status.
     */
    public function toggleActive(int $id): JsonResponse
    {
        $voucher = Voucher::find($id);

        if (! $voucher) {
            return response()->json(['message' => 'Voucher tidak ditemukan.'], 404);
        }

        $voucher->update(['is_active' => ! $voucher->is_active]);

        $status = $voucher->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json([
            'voucher' => $voucher,
            'message' => "Voucher berhasil {$status}.",
        ]);
    }
}
