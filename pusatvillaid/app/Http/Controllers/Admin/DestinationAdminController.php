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
    public function index(): JsonResponse
    {
        $destinations = Destination::orderBy('created_at', 'desc')->get();
        return response()->json([
            'data' => $destinations
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'query' => 'required|string|max:255',
            'image' => 'required|string|url|max:1000',
            'count_fallback' => 'nullable|string|max:255',
        ]);

        $destination = Destination::create($validated);

        return response()->json([
            'message' => 'Destinasi berhasil dibuat.',
            'data' => $destination
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): JsonResponse
    {
        $destination = Destination::find($id);

        if (!$destination) {
            return response()->json(['message' => 'Destinasi tidak ditemukan.'], 404);
        }

        return response()->json([
            'data' => $destination
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $destination = Destination::find($id);

        if (!$destination) {
            return response()->json(['message' => 'Destinasi tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'query' => 'required|string|max:255',
            'image' => 'required|string|url|max:1000',
            'count_fallback' => 'nullable|string|max:255',
        ]);

        $destination->update($validated);

        return response()->json([
            'message' => 'Destinasi berhasil diperbarui.',
            'data' => $destination
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $destination = Destination::find($id);

        if (!$destination) {
            return response()->json(['message' => 'Destinasi tidak ditemukan.'], 404);
        }

        $destination->delete();

        return response()->json([
            'message' => 'Destinasi berhasil dihapus.'
        ]);
    }
}
