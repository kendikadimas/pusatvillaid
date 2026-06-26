<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlockedDate;
use App\Models\Villa;
use App\Models\VillaIcalLink;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class VillaAdminController extends Controller
{
    /**
     * List all villas (active and inactive).
     */
    public function index(): JsonResponse
    {
        $villas = Villa::orderBy('created_at', 'desc')->get();

        return response()->json($villas);
    }

    /**
     * Store a new villa.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'short_desc' => 'required|string|max:500',
            'location' => 'required|string|max:255',
            'destination_id' => 'required|exists:destinations,id',
            'maps_url' => 'nullable|string',
            'bedrooms' => 'required|integer|min:1',
            'bathrooms' => 'required|integer|min:1',
            'max_guests' => 'required|integer|min:1',
            'price_per_night' => 'required|numeric|min:0',
            'weekend_price' => 'nullable|numeric|min:0',
            'min_nights' => 'required|integer|min:1',
            'amenities' => 'nullable|array',
            'amenities.*.name' => 'required|string|max:255',
            'amenities.*.icon' => 'required|string|max:100',
            'rules' => 'nullable|string',
            'check_in_time' => 'required|string',
            'check_out_time' => 'required|string',
            'is_active' => 'boolean',
            'host_name' => 'nullable|string|max:255',
            'host_years' => 'nullable|integer|min:0',
            'host_avatar' => 'nullable|string|url|max:1000',
            'host_phone' => 'nullable|string|max:50',
            'highlights' => 'nullable|array',
            'bedrooms_info' => 'nullable|array',
            'host_joined_label' => 'nullable|string|max:255',
            'host_is_verified' => 'boolean',
            'host_about' => 'nullable|array',
            'cancellation_policy' => 'nullable|string',
            'safety_property' => 'nullable|array',
            'neighborhood_desc' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $slug = Str::slug($request->name);

        // Ensure slug is unique
        $originalSlug = $slug;
        $count = 1;
        while (Villa::where('slug', $slug)->exists()) {
            $slug = $originalSlug.'-'.$count;
            $count++;
        }

        $villa = Villa::create(array_merge($request->all(), [
            'slug' => $slug,
            'amenities' => $request->amenities ?? [],
            'photos' => [], // Start with empty photos
            'is_active' => $request->input('is_active', true),
            'highlights' => $request->highlights ?? [],
            'bedrooms_info' => $request->bedrooms_info ?? [],
            'accessibility_features' => [],
            'host_about' => $request->host_about ?? [],
            'co_hosts' => [],
            'safety_property' => $request->safety_property ?? [],
        ]));

        return response()->json([
            'villa' => $villa,
            'message' => 'Villa berhasil ditambahkan.',
        ], 201);
    }

    /**
     * Get single villa details (for edit view).
     */
    public function show(int $id): JsonResponse
    {
        $villa = Villa::with(['blockedDates', 'destination'])->find($id);

        if (! $villa) {
            return response()->json(['message' => 'Villa tidak ditemukan.'], 404);
        }

        return response()->json($villa);
    }

    /**
     * Update an existing villa.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $villa = Villa::find($id);

        if (! $villa) {
            return response()->json(['message' => 'Villa tidak ditemukan.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'short_desc' => 'required|string|max:500',
            'location' => 'required|string|max:255',
            'destination_id' => 'required|exists:destinations,id',
            'maps_url' => 'nullable|string',
            'bedrooms' => 'required|integer|min:1',
            'bathrooms' => 'required|integer|min:1',
            'max_guests' => 'required|integer|min:1',
            'price_per_night' => 'required|numeric|min:0',
            'weekend_price' => 'nullable|numeric|min:0',
            'min_nights' => 'required|integer|min:1',
            'amenities' => 'nullable|array',
            'amenities.*.name' => 'required|string|max:255',
            'amenities.*.icon' => 'required|string|max:100',
            'rules' => 'nullable|string',
            'check_in_time' => 'required|string',
            'check_out_time' => 'required|string',
            'is_active' => 'boolean',
            'photos' => 'nullable|array', // Allow updating photos list reordering
            'host_name' => 'nullable|string|max:255',
            'host_years' => 'nullable|integer|min:0',
            'host_avatar' => 'nullable|string|url|max:1000',
            'host_phone' => 'nullable|string|max:50',
            'highlights' => 'nullable|array',
            'bedrooms_info' => 'nullable|array',
            'host_joined_label' => 'nullable|string|max:255',
            'host_is_verified' => 'boolean',
            'host_about' => 'nullable|array',
            'cancellation_policy' => 'nullable|string',
            'safety_property' => 'nullable|array',
            'neighborhood_desc' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Auto regenerate slug if name changed
        if ($villa->name !== $request->name) {
            $slug = Str::slug($request->name);
            $originalSlug = $slug;
            $count = 1;
            while (Villa::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                $slug = $originalSlug.'-'.$count;
                $count++;
            }
            $villa->slug = $slug;
        }

        $villa->update(array_merge($request->all(), [
            'amenities' => $request->amenities ?? [],
            'photos' => $request->photos ?? $villa->photos,
            'highlights' => $request->highlights ?? $villa->highlights ?? [],
            'bedrooms_info' => $request->bedrooms_info ?? $villa->bedrooms_info ?? [],
            'accessibility_features' => [],
            'host_about' => $request->host_about ?? $villa->host_about ?? [],
            'co_hosts' => [],
            'safety_property' => $request->safety_property ?? $villa->safety_property ?? [],
        ]));

        return response()->json([
            'villa' => $villa,
            'message' => 'Detail villa berhasil diperbarui.',
        ]);
    }

    /**
     * Delete/Deactivate villa.
     */
    public function destroy(int $id): JsonResponse
    {
        $villa = Villa::find($id);

        if (! $villa) {
            return response()->json(['message' => 'Villa tidak ditemukan.'], 404);
        }

        // Instead of hard deleting, we toggle is_active as per cPanel safe practice,
        // or support hard deletion if requested. Let's toggle is_active to false.
        $villa->is_active = false;
        $villa->save();

        return response()->json([
            'message' => 'Villa telah dinonaktifkan.',
        ]);
    }

    /**
     * Upload photos for a villa.
     */
    public function uploadPhotos(Request $request, int $id): JsonResponse
    {
        $villa = Villa::find($id);

        if (! $villa) {
            return response()->json(['message' => 'Villa tidak ditemukan.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'photos' => 'required|array',
            'photos.*' => 'image|mimes:jpeg,png,jpg,webp|max:5120', // Max 5MB
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $uploadedPhotos = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $file) {
                // Save to public storage disk (storage/app/public/villas)
                $path = $file->store('villas', 'public');
                $uploadedPhotos[] = [
                    'url' => asset('storage/'.$path),
                    'description' => '',
                    'category' => 'Lainnya',
                ];
            }
        }

        // Merge with existing photos
        $currentPhotos = $villa->photos ?? [];
        $newPhotos = array_merge($currentPhotos, $uploadedPhotos);
        $villa->photos = $newPhotos;
        $villa->save();

        return response()->json([
            'photos' => $villa->photos,
            'message' => 'Foto villa berhasil diunggah.',
        ]);
    }

    /**
     * Delete a single photo from villa.
     */
    public function deletePhoto(Request $request, int $id): JsonResponse
    {
        $villa = Villa::find($id);

        if (! $villa) {
            return response()->json(['message' => 'Villa tidak ditemukan.'], 404);
        }

        $photoUrl = $request->input('photo_url');

        if (! $photoUrl) {
            return response()->json(['message' => 'URL foto diperlukan.'], 400);
        }

        $photos = $villa->photos ?? [];
        $foundKey = null;

        foreach ($photos as $key => $photo) {
            $currentUrl = is_array($photo) ? ($photo['url'] ?? '') : (is_object($photo) ? ($photo->url ?? '') : $photo);
            if ($currentUrl === $photoUrl) {
                $foundKey = $key;
                break;
            }
        }

        if ($foundKey !== null) {
            unset($photos[$foundKey]);

            // Delete actual file from storage if it is local
            $pathPrefix = asset('storage/');
            if (Str::startsWith($photoUrl, $pathPrefix)) {
                $relativePath = Str::after($photoUrl, $pathPrefix);
                Storage::disk('public')->delete($relativePath);
            }
        }

        $villa->photos = array_values($photos);
        $villa->save();

        return response()->json([
            'photos' => $villa->photos,
            'message' => 'Foto villa berhasil dihapus.',
        ]);
    }

    /**
     * List blocked dates.
     */
    public function listBlockedDates(Request $request): JsonResponse
    {
        $query = BlockedDate::with('villa:id,name');

        if ($request->filled('villa_id')) {
            $query->where('villa_id', $request->villa_id);
        }

        $blockedDates = $query->orderBy('date', 'asc')->get();

        return response()->json($blockedDates);
    }

    /**
     * Block a date for a villa.
     */
    public function blockDate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'villa_id' => 'required|exists:villas,id',
            'date' => 'required|date|after_or_equal:today',
            'reason' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Check if date is already blocked
        $exists = BlockedDate::where('villa_id', $request->villa_id)
            ->where('date', $request->date)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Tanggal ini sudah diblokir sebelumnya.'], 422);
        }

        // Check if date is already booked
        $booked = BlockedDate::join('bookings', 'bookings.villa_id', '=', 'blocked_dates.villa_id')
            ->where('bookings.villa_id', $request->villa_id)
            ->where('bookings.status', '!=', 'cancelled')
            ->where('bookings.check_in', '<=', $request->date)
            ->where('bookings.check_out', '>', $request->date)
            ->exists();

        if ($booked) {
            return response()->json(['message' => 'Gagal memblokir: Tanggal ini sedang aktif dalam pesanan tamu.'], 422);
        }

        $blockedDate = BlockedDate::create([
            'villa_id' => $request->villa_id,
            'date' => $request->date,
            'reason' => $request->reason,
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'blocked_date' => $blockedDate,
            'message' => 'Tanggal berhasil diblokir.',
        ], 201);
    }

    /**
     * Remove block from a date.
     */
    public function unblockDate(int $id): JsonResponse
    {
        $blockedDate = BlockedDate::find($id);

        if (! $blockedDate) {
            return response()->json(['message' => 'Data pemblokiran tidak ditemukan.'], 404);
        }

        $blockedDate->delete();

        return response()->json([
            'message' => 'Pemblokiran tanggal berhasil dibatalkan.',
        ]);
    }

    // ==========================================
    // iCal Links Management
    // ==========================================

    /**
     * List all iCal links for a specific villa.
     */
    public function listIcalLinks(int $villaId): JsonResponse
    {
        $villa = Villa::find($villaId);

        if (! $villa) {
            return response()->json(['message' => 'Villa tidak ditemukan.'], 404);
        }

        $links = $villa->icalLinks()->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $links,
            'export_url' => url("/api/v1/villas/{$villaId}/ical.ics"),
        ]);
    }

    /**
     * Add a new iCal link for a villa.
     */
    public function storeIcalLink(Request $request, int $villaId): JsonResponse
    {
        $villa = Villa::find($villaId);

        if (! $villa) {
            return response()->json(['message' => 'Villa tidak ditemukan.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'channel_name' => 'required|string|max:100',
            'ical_url' => 'required|url|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $url = $request->ical_url;
        $channelName = $request->channel_name;

        // Extract listing ID
        $externalId = null;
        if (preg_match('/ical\/([a-zA-Z0-9_\-]+)\.ics/', $url, $idMatches)) {
            $externalId = $idMatches[1];
        } elseif (preg_match('/ical\/([a-zA-Z0-9_\-]+)/', $url, $idMatches)) {
            $externalId = $idMatches[1];
        }

        // Cek duplikasi di DB sebelum menyimpan
        if ($externalId) {
            $exists = VillaIcalLink::where('channel_name', $channelName)
                ->where('external_listing_id', $externalId)
                ->exists();
            if ($exists) {
                return response()->json(['message' => 'Kalender dari channel ini sudah dihubungkan ke villa lain.'], 422);
            }
        }

        $link = VillaIcalLink::create([
            'villa_id' => $villaId,
            'channel_name' => $channelName,
            'ical_url' => $url,
            'external_listing_id' => $externalId,
            'sync_status' => 'active',
        ]);

        return response()->json([
            'data' => $link,
            'message' => "iCal link dari {$channelName} berhasil ditambahkan.",
        ], 201);
    }

    /**
     * Verify an iCal feed and check for duplicates.
     */
    public function verifyIcal(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'channel_name' => 'required|string|max:100',
            'ical_url' => 'required|url|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $url = $request->input('ical_url');
        $channelName = $request->input('channel_name');

        try {
            // 1. Fetch iCal content
            $response = Http::timeout(10)->get($url);
            if (! $response->successful()) {
                return response()->json(['message' => 'URL iCal tidak valid atau tidak dapat diakses.'], 400);
            }

            $body = $response->body();

            // 2. Parse metadata (mencari nama kalender)
            $calName = null;
            if (preg_match('/^X-WR-CALNAME:(.*)$/m', $body, $matches)) {
                $calName = trim($matches[1]);
            }

            // 3. Ekstrak listing ID
            $externalId = null;
            if (preg_match('/ical\/([a-zA-Z0-9_\-]+)\.ics/', $url, $idMatches)) {
                $externalId = $idMatches[1];
            } elseif (preg_match('/ical\/([a-zA-Z0-9_\-]+)/', $url, $idMatches)) {
                $externalId = $idMatches[1];
            }

            // 4. Cek duplikasi di DB
            $exists = null;
            if ($externalId) {
                $exists = VillaIcalLink::where('channel_name', $channelName)
                    ->where('external_listing_id', $externalId)
                    ->with('villa:id,name')
                    ->first();
            }

            return response()->json([
                'calendar_name' => $calName ?? 'Tidak diketahui',
                'external_listing_id' => $externalId,
                'is_already_linked' => ! is_null($exists),
                'linked_to_villa' => $exists ? $exists->villa->name : null,
                'message' => 'iCal feed verified successfully.',
            ]);
        } catch (\Exception $e) {
            Log::error('iCal verification failed: '.$e->getMessage());

            return response()->json(['message' => 'Gagal memverifikasi feed iCal. Pastikan URL valid dan dapat diakses.'], 400);
        }
    }

    /**
     * Delete an iCal link.
     */
    public function destroyIcalLink(int $id): JsonResponse
    {
        $link = VillaIcalLink::find($id);

        if (! $link) {
            return response()->json(['message' => 'iCal link tidak ditemukan.'], 404);
        }

        $channelName = $link->channel_name;
        $link->delete();

        return response()->json([
            'message' => "iCal link {$channelName} berhasil dihapus.",
        ]);
    }

    /**
     * Trigger manual iCal sync for a specific link ID.
     */
    public function syncIcalLinks(int $linkId): JsonResponse
    {
        $link = VillaIcalLink::find($linkId);

        if (! $link) {
            return response()->json(['message' => 'iCal link tidak ditemukan.'], 404);
        }

        if ($link->sync_status !== 'active') {
            return response()->json(['message' => 'iCal link tidak aktif.'], 422);
        }

        // Run sync command for this specific link ID
        Artisan::call('ical:sync', ['--link-id' => $linkId]);

        // Refresh link to show updated sync status
        $link->refresh();

        return response()->json([
            'data' => $link,
            'message' => "Sync selesai untuk iCal feed {$link->channel_name}.",
        ]);
    }

    /**
     * Upload host avatar for a villa.
     */
    public function uploadHostAvatar(Request $request, int $id): JsonResponse
    {
        $villa = Villa::find($id);

        if (! $villa) {
            return response()->json(['message' => 'Villa tidak ditemukan.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048', // Max 2MB
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->hasFile('avatar')) {
            // Delete old avatar if it exists and is local
            $oldAvatar = $villa->host_avatar;
            $pathPrefix = asset('storage/');
            if ($oldAvatar && Str::startsWith($oldAvatar, $pathPrefix)) {
                $relativePath = Str::after($oldAvatar, $pathPrefix);
                Storage::disk('public')->delete($relativePath);
            }

            // Store new avatar in public storage disk under avatars
            $path = $request->file('avatar')->store('avatars', 'public');
            $villa->host_avatar = asset('storage/'.$path);
            $villa->save();
        }

        return response()->json([
            'host_avatar' => $villa->host_avatar,
            'message' => 'Avatar tuan rumah berhasil diunggah.',
        ]);
    }

    /**
     * Upload a general image for bedrooms or accessibility features.
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // Max 5MB
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->hasFile('image')) {
            // Save to public storage disk (storage/app/public/villas/extras)
            $path = $request->file('image')->store('villas/extras', 'public');
            $url = asset('storage/'.$path);

            return response()->json([
                'url' => $url,
                'message' => 'Gambar berhasil diunggah.',
            ]);
        }

        return response()->json(['message' => 'File tidak ditemukan.'], 400);
    }
}
