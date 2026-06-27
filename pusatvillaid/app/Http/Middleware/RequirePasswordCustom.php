<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class RequirePasswordCustom
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ?string $redirectToRoute = null): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $confirmedAt = Cache::get('auth.password_confirmed_at.'.$user->id, 0);
        $timeout = config('auth.password_timeout', 10800);

        if (time() - $confirmedAt > $timeout) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Password confirmation required.',
                ], 423);
            }

            return redirect()->guest(route($redirectToRoute ?? 'password.confirm'));
        }

        return $next($request);
    }
}
