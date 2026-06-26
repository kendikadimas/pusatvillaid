<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class OAuthController extends Controller
{
    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback(Request $request): RedirectResponse
    {
        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000'));

        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            return redirect($frontendUrl.'/auth/callback?error='.urlencode('Gagal autentikasi dengan Google.'));
        }

        $user = User::where('email', $googleUser->getEmail())->first();

        if (! $user) {
            $user = User::create([
                'name' => $googleUser->getName(),
                'email' => $googleUser->getEmail(),
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
                'password' => Hash::make(Str::password(32)),
                'role' => 'user',
            ]);
        } else {
            $user->update([
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
            ]);
        }

        // Generate a short-lived one-time authorization code (valid for 60 seconds)
        $code = Str::random(64);
        Cache::put('oauth_code:'.$code, $user->id, 60);

        return redirect($frontendUrl.'/auth/callback?code='.$code);
    }

    /**
     * Exchange a one-time OAuth authorization code for a Sanctum token.
     */
    public function exchangeCode(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string']);

        $code = $request->input('code');
        $userId = Cache::pull('oauth_code:'.$code);

        if (! $userId) {
            return response()->json(['message' => 'Kode otorisasi tidak valid atau kedaluwarsa.'], 401);
        }

        $user = User::find($userId);

        if (! $user) {
            return response()->json(['message' => 'User tidak ditemukan.'], 404);
        }

        $token = $user->createToken('user-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }
}
