<?php

use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\BookingAdminController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DestinationAdminController;
use App\Http\Controllers\Admin\PaymentMethodAdminController;
use App\Http\Controllers\Admin\ReviewAdminController;
use App\Http\Controllers\Admin\VillaAdminController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\DestinationController;
use App\Http\Controllers\IcalController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\VillaController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\Admin\SettingAdminController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Laravel\Fortify\Http\Controllers\TwoFactorAuthenticationController;
use Laravel\Fortify\Http\Controllers\TwoFactorQrCodeController;
use Laravel\Fortify\Http\Controllers\TwoFactorSecretKeyController;
use Laravel\Fortify\Http\Controllers\RecoveryCodeController;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Base Path: /api/v1
|
*/

Route::prefix('v1')->withoutMiddleware([ValidateCsrfToken::class])->group(function () {

    // ==========================================
    // Public Endpoints (No Auth)
    // ==========================================
    Route::get('/villas', [VillaController::class, 'index']);
    Route::get('/villas/{slug}', [VillaController::class, 'show']);
    Route::get('/villas/{slug}/availability', [VillaController::class, 'availability']);
    Route::get('/destinations', [DestinationController::class, 'index']);

    Route::get('/bookings/{code}', [BookingController::class, 'show']);
    Route::post('/bookings/{code}/confirm-manual-payment', [BookingController::class, 'confirmManualPayment']);
    Route::get('/payment-methods', [PaymentMethodController::class, 'indexPublic']);
    Route::get('/settings/public', [SettingController::class, 'indexPublic']);

    Route::post('/payment/notification', [PaymentController::class, 'notification']);

    Route::get('/reviews/{villa_slug}', [ReviewController::class, 'getByVilla']);
    Route::get('/review/{token}', [ReviewController::class, 'showByToken']);
    Route::post('/review/{token}', [ReviewController::class, 'storeByToken']);

    // iCal Feed Export (public — OTAs subscribe to this URL)
    Route::get('/villas/{id}/ical.ics', [IcalController::class, 'export']);

    // Auth Public Endpoints
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'userLogin']);
    Route::post('/admin/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])->name('verification.verify');

    // ==========================================
    // Protected User/Guest Endpoints (Sanctum Token Required)
    // ==========================================
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/bookings', [BookingController::class, 'store']);
        Route::get('/user/bookings', [BookingController::class, 'userBookings']);

        // User Settings (Profile, Security, Password)
        Route::get('/settings/profile', [ProfileController::class, 'edit']);
        Route::patch('/settings/profile', [ProfileController::class, 'update']);
        Route::delete('/settings/profile', [ProfileController::class, 'destroy']);
        Route::get('/settings/security', [SecurityController::class, 'edit']);
        Route::put('/settings/password', [SecurityController::class, 'update']);

        // Stateless Email Verification Trigger & Password Confirmation
        Route::post('/email/verification-notification', [AuthController::class, 'sendVerificationEmail']);
        Route::post('/user/confirm-password', [AuthController::class, 'confirmPassword']);

        // Fortify 2FA endpoints under Sanctum
        Route::post('/user/two-factor-authentication', [TwoFactorAuthenticationController::class, 'store']);
        Route::delete('/user/two-factor-authentication', [TwoFactorAuthenticationController::class, 'destroy']);
        Route::get('/user/two-factor-qr-code', [TwoFactorQrCodeController::class, 'show']);
        Route::get('/user/two-factor-secret-key', [TwoFactorSecretKeyController::class, 'show']);
        Route::get('/user/two-factor-recovery-codes', [RecoveryCodeController::class, 'index']);
        Route::post('/user/two-factor-recovery-codes', [RecoveryCodeController::class, 'store']);
    });

    // ==========================================
    // Protected Admin Endpoints (Sanctum Token Required)
    // ==========================================
    Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {

        // Admin Profile Actions
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/settings', [SettingAdminController::class, 'index']);
        Route::post('/settings', [SettingAdminController::class, 'update']);

        // Bookings Management
        Route::get('/bookings', [BookingAdminController::class, 'index']);
        Route::get('/bookings/{id}', [BookingAdminController::class, 'show']);
        Route::patch('/bookings/{id}/status', [BookingAdminController::class, 'updateStatus']);
        Route::post('/bookings/{id}/approve-manual-payment', [BookingAdminController::class, 'approveManualPayment']);
        Route::post('/bookings/{id}/reject-manual-payment', [BookingAdminController::class, 'rejectManualPayment']);
        Route::post('/bookings/{id}/resend-email', [BookingAdminController::class, 'resendEmail']);

        // Villas Management
        Route::get('/villas', [VillaAdminController::class, 'index']);
        Route::post('/villas', [VillaAdminController::class, 'store']);
        Route::post('/villas/upload-image', [VillaAdminController::class, 'uploadImage']);
        Route::get('/villas/{id}', [VillaAdminController::class, 'show']);
        Route::put('/villas/{id}', [VillaAdminController::class, 'update']);
        Route::delete('/villas/{id}', [VillaAdminController::class, 'destroy']);
        Route::post('/villas/{id}/photos', [VillaAdminController::class, 'uploadPhotos']);
        Route::post('/villas/{id}/host-avatar', [VillaAdminController::class, 'uploadHostAvatar']);
        Route::delete('/villas/{id}/photos', [VillaAdminController::class, 'deletePhoto']);

        // Destinations Management
        Route::get('/destinations', [DestinationAdminController::class, 'index']);
        Route::post('/destinations', [DestinationAdminController::class, 'store']);
        Route::post('/destinations/upload-image', [DestinationAdminController::class, 'uploadImage']);
        Route::get('/destinations/{id}', [DestinationAdminController::class, 'show']);
        Route::put('/destinations/{id}', [DestinationAdminController::class, 'update']);
        Route::delete('/destinations/{id}', [DestinationAdminController::class, 'destroy']);

        // Blocked Dates Management
        Route::get('/blocked-dates', [VillaAdminController::class, 'listBlockedDates']);
        Route::post('/blocked-dates', [VillaAdminController::class, 'blockDate']);
        Route::delete('/blocked-dates/{id}', [VillaAdminController::class, 'unblockDate']);

        // Reviews Moderation
        Route::get('/reviews', [ReviewAdminController::class, 'index']);
        Route::post('/reviews', [ReviewAdminController::class, 'store']);
        Route::post('/reviews/upload-avatar', [ReviewAdminController::class, 'uploadAvatar']);
        Route::put('/reviews/{id}', [ReviewAdminController::class, 'update']);
        Route::patch('/reviews/{id}/approve', [ReviewAdminController::class, 'approve']);
        Route::delete('/reviews/{id}', [ReviewAdminController::class, 'destroy']);

        // Analytics & Exports
        Route::get('/analytics', [AnalyticsController::class, 'index']);
        Route::get('/analytics/export', [AnalyticsController::class, 'export']);

        // iCal Links Management (per villa)
        Route::get('/villas/{villaId}/ical-links', [VillaAdminController::class, 'listIcalLinks']);
        Route::post('/villas/{villaId}/ical-links', [VillaAdminController::class, 'storeIcalLink']);
        Route::delete('/ical-links/{id}', [VillaAdminController::class, 'destroyIcalLink']);
        Route::post('/ical-links/{linkId}/sync', [VillaAdminController::class, 'syncIcalLinks']);
        Route::post('/ical/verify', [VillaAdminController::class, 'verifyIcal']);

        // Payment Methods Config CRUD
        Route::get('/payment-methods', [PaymentMethodAdminController::class, 'index']);
        Route::post('/payment-methods', [PaymentMethodAdminController::class, 'store']);
        Route::get('/payment-methods/{id}', [PaymentMethodAdminController::class, 'show']);
        Route::put('/payment-methods/{id}', [PaymentMethodAdminController::class, 'update']);
        Route::delete('/payment-methods/{id}', [PaymentMethodAdminController::class, 'destroy']);
        Route::post('/payment-methods/upload-logo', [PaymentMethodAdminController::class, 'uploadLogo']);
    });
});
