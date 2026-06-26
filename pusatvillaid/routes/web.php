<?php

use App\Http\Controllers\OAuthController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

Route::prefix('auth')->group(function () {
    Route::get('/google/redirect', [OAuthController::class, 'redirectToGoogle']);
    Route::get('/google/callback', [OAuthController::class, 'handleGoogleCallback']);
});

Route::post('/auth/exchange-code', [OAuthController::class, 'exchangeCode']);

require __DIR__.'/settings.php';
