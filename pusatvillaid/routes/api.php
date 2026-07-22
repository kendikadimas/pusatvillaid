<?php

use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\BookingAdminController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DestinationAdminController;
use App\Http\Controllers\Admin\PaymentMethodAdminController;
use App\Http\Controllers\Admin\ReviewAdminController;
use App\Http\Controllers\Admin\SettingAdminController;
use App\Http\Controllers\Admin\VillaAdminController;
use App\Http\Controllers\Admin\VoucherAdminController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\DestinationController;
use App\Http\Controllers\IcalController;
use App\Http\Controllers\OAuthController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use App\Http\Controllers\VillaController;
use App\Http\Controllers\VoucherController;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Http\Controllers\RecoveryCodeController;
use Laravel\Fortify\Http\Controllers\TwoFactorAuthenticationController;
use Laravel\Fortify\Http\Controllers\TwoFactorQrCodeController;
use Laravel\Fortify\Http\Controllers\TwoFactorSecretKeyController;

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
    Route::post('/vouchers/validate', [VoucherController::class, 'validate'])->middleware('throttle:20,1');

    Route::post('/payment/notification', [PaymentController::class, 'notification']);

    Route::get('/reviews/{villa_slug}', [ReviewController::class, 'getByVilla']);
    Route::get('/review/{token}', [ReviewController::class, 'showByToken']);
    Route::post('/review/{token}', [ReviewController::class, 'storeByToken']);

    // iCal Feed Export (public — OTAs subscribe to this URL)
    Route::get('/villas/{id}/ical.ics', [IcalController::class, 'export']);

    // Auth Public Endpoints (rate-limited)
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:3,1');
    Route::post('/login', [AuthController::class, 'userLogin'])->middleware('throttle:5,1');
    Route::post('/admin/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:3,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:3,1');
    Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])->name('api.verification.verify');
    Route::post('/auth/exchange-code', [OAuthController::class, 'exchangeCode']);

    // ==========================================
    // Protected User/Guest Endpoints (Sanctum Token Required)
    // ==========================================
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/bookings', [BookingController::class, 'store']);
        Route::get('/user/bookings', [BookingController::class, 'userBookings']);
        Route::get('/bookings/{code}/ktp', [BookingController::class, 'showKtp']);
        Route::get('/bookings/{code}/payment-proof', [BookingController::class, 'showPaymentProof']);

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

        // Admin Profile Actions (always accessible)
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);

        // ── Dashboard (requires analytics.view) ──
        Route::get('/dashboard', [DashboardController::class, 'index'])->middleware('permission:analytics.view');

        // ── Settings (requires settings.view / settings.manage) ──
        Route::get('/settings', [SettingAdminController::class, 'index'])->middleware('permission:settings.view');
        Route::post('/settings', [SettingAdminController::class, 'update'])->middleware('permission:settings.manage');

        // ── Bookings (requires bookings.view / bookings.manage) ──
        Route::get('/bookings', [BookingAdminController::class, 'index'])->middleware('permission:bookings.view');
        Route::get('/bookings/{id}', [BookingAdminController::class, 'show'])->middleware('permission:bookings.view');
        Route::patch('/bookings/{id}/status', [BookingAdminController::class, 'updateStatus'])->middleware('permission:bookings.manage');
        Route::post('/bookings/{id}/approve-manual-payment', [BookingAdminController::class, 'approveManualPayment'])->middleware('permission:bookings.manage');
        Route::post('/bookings/{id}/reject-manual-payment', [BookingAdminController::class, 'rejectManualPayment'])->middleware('permission:bookings.manage');
        Route::post('/bookings/{id}/resend-email', [BookingAdminController::class, 'resendEmail'])->middleware('permission:bookings.manage');
        Route::delete('/bookings/{id}', [BookingAdminController::class, 'destroy']);

        // ── Villas (requires villas.view / villas.manage) ──
        Route::get('/villas', [VillaAdminController::class, 'index'])->middleware('permission:villas.view');
        Route::get('/villas/{id}', [VillaAdminController::class, 'show'])->middleware('permission:villas.view');
        Route::post('/villas', [VillaAdminController::class, 'store'])->middleware('permission:villas.manage');
        Route::post('/villas/upload-image', [VillaAdminController::class, 'uploadImage'])->middleware('permission:villas.manage');
        Route::put('/villas/{id}', [VillaAdminController::class, 'update'])->middleware('permission:villas.manage');
        Route::delete('/villas/{id}', [VillaAdminController::class, 'destroy'])->middleware('permission:villas.manage');
        Route::post('/villas/{id}/photos', [VillaAdminController::class, 'uploadPhotos'])->middleware('permission:villas.manage');
        Route::post('/villas/{id}/host-avatar', [VillaAdminController::class, 'uploadHostAvatar'])->middleware('permission:villas.manage');
        Route::delete('/villas/{id}/photos', [VillaAdminController::class, 'deletePhoto'])->middleware('permission:villas.manage');

        // ── Blocked Dates & iCal (requires villas.manage) ──
        Route::get('/blocked-dates', [VillaAdminController::class, 'listBlockedDates'])->middleware('permission:villas.manage');
        Route::post('/blocked-dates', [VillaAdminController::class, 'blockDate'])->middleware('permission:villas.manage');
        Route::delete('/blocked-dates/{id}', [VillaAdminController::class, 'unblockDate'])->middleware('permission:villas.manage');
        Route::get('/villas/{villaId}/ical-links', [VillaAdminController::class, 'listIcalLinks'])->middleware('permission:villas.manage');
        Route::post('/villas/{villaId}/ical-links', [VillaAdminController::class, 'storeIcalLink'])->middleware('permission:villas.manage');
        Route::delete('/ical-links/{id}', [VillaAdminController::class, 'destroyIcalLink'])->middleware('permission:villas.manage');
        Route::post('/ical-links/{linkId}/sync', [VillaAdminController::class, 'syncIcalLinks'])->middleware('permission:villas.manage');
        Route::post('/ical/verify', [VillaAdminController::class, 'verifyIcal'])->middleware('permission:villas.manage');

        // ── Destinations (requires destinations.view / destinations.manage) ──
        Route::get('/destinations', [DestinationAdminController::class, 'index'])->middleware('permission:destinations.view');
        Route::get('/destinations/{id}', [DestinationAdminController::class, 'show'])->middleware('permission:destinations.view');
        Route::post('/destinations', [DestinationAdminController::class, 'store'])->middleware('permission:destinations.manage');
        Route::post('/destinations/upload-image', [DestinationAdminController::class, 'uploadImage'])->middleware('permission:destinations.manage');
        Route::put('/destinations/{id}', [DestinationAdminController::class, 'update'])->middleware('permission:destinations.manage');
        Route::delete('/destinations/{id}', [DestinationAdminController::class, 'destroy'])->middleware('permission:destinations.manage');

        // ── Vouchers ──
        Route::get('/vouchers', [VoucherAdminController::class, 'index']);
        Route::post('/vouchers', [VoucherAdminController::class, 'store']);
        Route::get('/vouchers/{id}', [VoucherAdminController::class, 'show']);
        Route::put('/vouchers/{id}', [VoucherAdminController::class, 'update']);
        Route::delete('/vouchers/{id}', [VoucherAdminController::class, 'destroy']);
        Route::patch('/vouchers/{id}/toggle-active', [VoucherAdminController::class, 'toggleActive']);

        // ── Reviews (requires reviews.view / reviews.manage) ──
        Route::get('/reviews', [ReviewAdminController::class, 'index'])->middleware('permission:reviews.view');
        Route::post('/reviews', [ReviewAdminController::class, 'store'])->middleware('permission:reviews.manage');
        Route::post('/reviews/upload-avatar', [ReviewAdminController::class, 'uploadAvatar'])->middleware('permission:reviews.manage');
        Route::put('/reviews/{id}', [ReviewAdminController::class, 'update'])->middleware('permission:reviews.manage');
        Route::patch('/reviews/{id}/approve', [ReviewAdminController::class, 'approve'])->middleware('permission:reviews.manage');
        Route::delete('/reviews/{id}', [ReviewAdminController::class, 'destroy'])->middleware('permission:reviews.manage');

        // ── Analytics (requires analytics.view) ──
        Route::get('/analytics', [AnalyticsController::class, 'index'])->middleware('permission:analytics.view');
        Route::get('/analytics/export', [AnalyticsController::class, 'export'])->middleware('permission:analytics.view');

        // ── Payment Methods (requires payment_methods.view / payment_methods.manage) ──
        Route::get('/payment-methods', [PaymentMethodAdminController::class, 'index'])->middleware('permission:payment_methods.view');
        Route::get('/payment-methods/{id}', [PaymentMethodAdminController::class, 'show'])->middleware('permission:payment_methods.view');
        Route::post('/payment-methods', [PaymentMethodAdminController::class, 'store'])->middleware('permission:payment_methods.manage');
        Route::put('/payment-methods/{id}', [PaymentMethodAdminController::class, 'update'])->middleware('permission:payment_methods.manage');
        Route::delete('/payment-methods/{id}', [PaymentMethodAdminController::class, 'destroy'])->middleware('permission:payment_methods.manage');
        Route::post('/payment-methods/upload-logo', [PaymentMethodAdminController::class, 'uploadLogo'])->middleware('permission:payment_methods.manage');

        // ==========================================
        // Super Admin Only — Admin User Management
        // ==========================================
        Route::middleware('super_admin')->group(function () {
            // Available permissions reference
            Route::get('/permissions', [AdminUserController::class, 'availablePermissions']);

            // Admin sub-account CRUD
            Route::get('/admins', [AdminUserController::class, 'index']);
            Route::post('/admins', [AdminUserController::class, 'store']);
            Route::get('/admins/{id}', [AdminUserController::class, 'show']);
            Route::put('/admins/{id}', [AdminUserController::class, 'update']);
            Route::delete('/admins/{id}', [AdminUserController::class, 'destroy']);

            // Session management for admin sub-accounts
            Route::get('/admins/{id}/sessions', [AdminUserController::class, 'sessions']);
            Route::delete('/admins/{id}/sessions', [AdminUserController::class, 'revokeAllSessions']);
            Route::delete('/sessions/{tokenId}', [AdminUserController::class, 'revokeSession']);
        });
    });
});
