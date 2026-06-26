<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PaymentMethodAdminController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $methods = PaymentMethod::all();

        return response()->json($methods);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $isQris = Str::slug($request->code) === 'qris';

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:100|unique:payment_methods,code',
            'account_number' => $isQris ? 'nullable|string|max:100' : 'required|string|max:100',
            'account_name' => 'required|string|max:255',
            'logo_url' => 'nullable|string|max:1000',
            'admin_fee' => 'sometimes|integer|min:0',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $method = PaymentMethod::create([
            'name' => $request->name,
            'code' => Str::slug($request->code),
            'account_number' => $isQris ? '' : $request->account_number,
            'account_name' => $request->account_name,
            'logo_url' => $request->logo_url,
            'admin_fee' => $request->input('admin_fee', 0),
            'is_active' => $request->input('is_active', true),
        ]);

        return response()->json([
            'payment_method' => $method,
            'message' => 'Metode pembayaran berhasil ditambahkan.',
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): JsonResponse
    {
        $method = PaymentMethod::find($id);

        if (! $method) {
            return response()->json(['message' => 'Metode pembayaran tidak ditemukan.'], 404);
        }

        return response()->json($method);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $method = PaymentMethod::find($id);

        if (! $method) {
            return response()->json(['message' => 'Metode pembayaran tidak ditemukan.'], 404);
        }

        $isQris = Str::slug($request->code) === 'qris';

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:100|unique:payment_methods,code,'.$id,
            'account_number' => $isQris ? 'nullable|string|max:100' : 'required|string|max:100',
            'account_name' => 'required|string|max:255',
            'logo_url' => 'nullable|string|max:1000',
            'admin_fee' => 'sometimes|integer|min:0',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $method->update([
            'name' => $request->name,
            'code' => Str::slug($request->code),
            'account_number' => $isQris ? '' : $request->account_number,
            'account_name' => $request->account_name,
            'logo_url' => $request->logo_url,
            'admin_fee' => $request->input('admin_fee', 0),
            'is_active' => $request->input('is_active', true),
        ]);

        return response()->json([
            'payment_method' => $method,
            'message' => 'Metode pembayaran berhasil diperbarui.',
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $method = PaymentMethod::find($id);

        if (! $method) {
            return response()->json(['message' => 'Metode pembayaran tidak ditemukan.'], 404);
        }

        // Delete any local logo file too
        $logoUrl = $method->logo_url;
        $pathPrefix = asset('storage/');
        if ($logoUrl && Str::startsWith($logoUrl, $pathPrefix)) {
            $relativePath = Str::after($logoUrl, $pathPrefix);
            Storage::disk('public')->delete($relativePath);
        }

        $method->delete();

        return response()->json([
            'message' => 'Metode pembayaran berhasil dihapus.',
        ]);
    }

    /**
     * Upload logo for a payment method.
     */
    public function uploadLogo(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif,webp,svg|max:5120', // Max 5MB
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('payment-logos', 'public');
            $url = asset('storage/'.$path);

            return response()->json([
                'logo_url' => $url,
                'message' => 'Logo berhasil diunggah.',
            ]);
        }

        return response()->json(['message' => 'File logo tidak ditemukan.'], 400);
    }
}
