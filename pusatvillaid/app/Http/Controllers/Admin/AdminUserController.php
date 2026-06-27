<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Manages admin sub-accounts.
 * All endpoints in this controller are restricted to super_admin via middleware.
 */
class AdminUserController extends Controller
{
    /**
     * List all admin (limited) accounts.
     * Does NOT include super_admin accounts or regular users.
     *
     * GET /admin/admins
     */
    public function index(): JsonResponse
    {
        $admins = User::where('role', 'admin')
            ->select(['id', 'name', 'email', 'role', 'permissions', 'created_at'])
            ->get()
            ->map(function ($admin) {
                return [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'role' => $admin->role,
                    'permissions' => $admin->permissions ?? [],
                    'active_sessions' => $admin->tokens()
                        ->where('name', 'admin-token')
                        ->count(),
                    'created_at' => $admin->created_at,
                ];
            });

        return response()->json([
            'data' => $admins,
            'total' => $admins->count(),
        ]);
    }

    /**
     * Create a new limited admin account.
     *
     * POST /admin/admins
     * Body: { name, email, password, permissions[] }
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|in:'.implode(',', User::PERMISSIONS),
        ], [
            'name.required' => 'Nama wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah digunakan.',
            'password.required' => 'Password wajib diisi.',
            'password.min' => 'Password minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
            'permissions.array' => 'Permissions harus berupa array.',
            'permissions.*.in' => 'Permission tidak valid.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $admin = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'admin',
            'permissions' => $request->permissions ?? [],
        ]);

        return response()->json([
            'message' => 'Admin berhasil dibuat.',
            'data' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role,
                'permissions' => $admin->permissions ?? [],
                'created_at' => $admin->created_at,
            ],
        ], 201);
    }

    /**
     * Get a single admin's detail.
     *
     * GET /admin/admins/{id}
     */
    public function show(int $id): JsonResponse
    {
        $admin = User::where('id', $id)->where('role', 'admin')->first();

        if (! $admin) {
            return response()->json(['message' => 'Admin tidak ditemukan.'], 404);
        }

        $sessions = $admin->tokens()
            ->where('name', 'admin-token')
            ->select(['id', 'last_used_at', 'created_at'])
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'last_used_at' => $t->last_used_at,
                'created_at' => $t->created_at,
            ]);

        return response()->json([
            'id' => $admin->id,
            'name' => $admin->name,
            'email' => $admin->email,
            'role' => $admin->role,
            'permissions' => $admin->permissions ?? [],
            'sessions' => $sessions,
            'created_at' => $admin->created_at,
        ]);
    }

    /**
     * Update an admin's name, email, password, and/or permissions.
     *
     * PUT /admin/admins/{id}
     * Body: { name?, email?, password?, password_confirmation?, permissions[]? }
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $admin = User::where('id', $id)->where('role', 'admin')->first();

        if (! $admin) {
            return response()->json(['message' => 'Admin tidak ditemukan.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,'.$admin->id,
            'password' => 'sometimes|string|min:8|confirmed',
            'permissions' => 'sometimes|array',
            'permissions.*' => 'string|in:'.implode(',', User::PERMISSIONS),
        ], [
            'email.unique' => 'Email sudah digunakan.',
            'password.min' => 'Password minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
            'permissions.*.in' => 'Permission tidak valid.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $updateData = $request->only(['name', 'email', 'permissions']);

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $admin->update($updateData);

        // If permissions changed, force-logout all active sessions
        // so the new permissions take effect immediately
        if ($request->has('permissions')) {
            $admin->tokens()->where('name', 'admin-token')->delete();
        }

        return response()->json([
            'message' => 'Admin berhasil diperbarui.'.
                ($request->has('permissions') ? ' Semua sesi admin ini telah diakhiri.' : ''),
            'data' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role,
                'permissions' => $admin->permissions ?? [],
            ],
        ]);
    }

    /**
     * Delete an admin account and revoke all their sessions.
     *
     * DELETE /admin/admins/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $admin = User::where('id', $id)->where('role', 'admin')->first();

        if (! $admin) {
            return response()->json(['message' => 'Admin tidak ditemukan.'], 404);
        }

        // Revoke all tokens before deleting the account
        $admin->tokens()->delete();
        $admin->delete();

        return response()->json([
            'message' => 'Admin berhasil dihapus dan semua sesinya telah diakhiri.',
        ]);
    }

    /**
     * List active sessions for a specific admin.
     *
     * GET /admin/admins/{id}/sessions
     */
    public function sessions(int $id): JsonResponse
    {
        $admin = User::where('id', $id)->where('role', 'admin')->first();

        if (! $admin) {
            return response()->json(['message' => 'Admin tidak ditemukan.'], 404);
        }

        $sessions = $admin->tokens()
            ->where('name', 'admin-token')
            ->select(['id', 'last_used_at', 'created_at'])
            ->latest()
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'last_used_at' => $t->last_used_at,
                'created_at' => $t->created_at,
            ]);

        return response()->json([
            'admin_id' => $admin->id,
            'admin_name' => $admin->name,
            'sessions' => $sessions,
        ]);
    }

    /**
     * Force-logout all sessions of a specific admin.
     *
     * DELETE /admin/admins/{id}/sessions
     */
    public function revokeAllSessions(int $id): JsonResponse
    {
        $admin = User::where('id', $id)->where('role', 'admin')->first();

        if (! $admin) {
            return response()->json(['message' => 'Admin tidak ditemukan.'], 404);
        }

        $count = $admin->tokens()->where('name', 'admin-token')->count();
        $admin->tokens()->where('name', 'admin-token')->delete();

        return response()->json([
            'message' => "Berhasil mengakhiri {$count} sesi aktif admin {$admin->name}.",
        ]);
    }

    /**
     * Revoke a single session by token ID.
     *
     * DELETE /admin/sessions/{tokenId}
     */
    public function revokeSession(Request $request, int $tokenId): JsonResponse
    {
        $token = PersonalAccessToken::find($tokenId);

        if (! $token) {
            return response()->json(['message' => 'Sesi tidak ditemukan.'], 404);
        }

        // Make sure the token belongs to an admin (not a super_admin or user)
        $owner = User::find($token->tokenable_id);
        if (! $owner || $owner->role !== 'admin') {
            return response()->json(['message' => 'Sesi tidak ditemukan.'], 404);
        }

        $token->delete();

        return response()->json([
            'message' => 'Sesi berhasil diakhiri.',
        ]);
    }

    /**
     * List all available permission slugs (helper for the frontend).
     *
     * GET /admin/permissions
     */
    public function availablePermissions(): JsonResponse
    {
        $grouped = [
            'bookings' => ['bookings.view', 'bookings.manage'],
            'villas' => ['villas.view', 'villas.manage'],
            'reviews' => ['reviews.view', 'reviews.manage'],
            'destinations' => ['destinations.view', 'destinations.manage'],
            'payment_methods' => ['payment_methods.view', 'payment_methods.manage'],
            'analytics' => ['analytics.view'],
            'settings' => ['settings.view', 'settings.manage'],
        ];

        return response()->json([
            'permissions' => $grouped,
            'all' => User::PERMISSIONS,
        ]);
    }
}
