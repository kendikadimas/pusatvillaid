<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Destination;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DestinationAdminController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 50);
        $destinations = Destination::orderBy('created_at', 'desc')->paginate(min($perPage, 100));

        return response()->json($destinations);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'query' => 'nullable|string|max:255',
            'image' => 'required|string|max:1000',
            'count_fallback' => 'nullable|string|max:255',
        ]);

        if (empty($validated['query'])) {
            $validated['query'] = $validated['name'];
        }

        $existing = Destination::where('name', $validated['name'])->first();
        if ($existing) {
            return response()->json([
                'message' => 'Destinasi sudah ada, menggunakan destinasi yang sudah tersedia.',
                'data' => $existing,
            ]);
        }

        $destination = Destination::create($validated);

        return response()->json([
            'message' => 'Destinasi berhasil dibuat.',
            'data' => $destination,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): JsonResponse
    {
        $destination = Destination::find($id);

        if (! $destination) {
            return response()->json(['message' => 'Destinasi tidak ditemukan.'], 404);
        }

        return response()->json([
            'data' => $destination,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $destination = Destination::find($id);

        if (! $destination) {
            return response()->json(['message' => 'Destinasi tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'query' => 'nullable|string|max:255',
            'image' => 'required|string|max:1000',
            'count_fallback' => 'nullable|string|max:255',
        ]);

        if (empty($validated['query'])) {
            $validated['query'] = $validated['name'];
        }

        $destination->update($validated);

        return response()->json([
            'message' => 'Destinasi berhasil diperbarui.',
            'data' => $destination,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $destination = Destination::find($id);

        if (! $destination) {
            return response()->json(['message' => 'Destinasi tidak ditemukan.'], 404);
        }

        $destination->delete();

        return response()->json([
            'message' => 'Destinasi berhasil dihapus.',
        ]);
    }

    /**
     * Upload image for a destination.
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048', // Max 2MB
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('destinations', 'public');
            $url = asset('storage/'.$path);

            return response()->json([
                'image_url' => $url,
                'message' => 'Foto destinasi berhasil diunggah.',
            ]);
        }

        return response()->json(['message' => 'File gambar tidak ditemukan.'], 400);
    }
}
