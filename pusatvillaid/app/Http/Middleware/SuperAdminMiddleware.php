<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards endpoints that are exclusive to super_admin users.
 * Must be used AFTER the 'admin' middleware (which already validates
 * Sanctum token and admin-access ability).
 */
class SuperAdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isSuperAdmin()) {
            return response()->json([
                'message' => 'Akses ditolak. Fitur ini hanya tersedia untuk Super Admin.',
            ], 403);
        }

        return $next($request);
    }
}
