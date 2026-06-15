<?php

use App\Http\Controllers\OAuthController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

Route::prefix('auth')->group(function () {
    Route::get('/google/redirect', [OAuthController::class, 'redirectToGoogle']);
    Route::match(['get', 'post'], '/google/callback', [OAuthController::class, 'handleGoogleCallback']);
});

require __DIR__.'/settings.php';
