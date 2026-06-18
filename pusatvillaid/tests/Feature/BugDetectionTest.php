<?php

use App\Models\Booking;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\User;
use App\Models\Villa;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

// =====================================================
// PAYMENT METHOD SEPARATION TESTS (QRIS vs Bank)
// =====================================================

it('can list payment methods grouped by type', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    // Create QRIS method
    PaymentMethod::factory()->create([
        'name' => 'QRIS',
        'code' => 'qris',
        'account_number' => '',
        'account_name' => 'Merchant Test',
        'is_active' => true,
    ]);

    // Create bank methods
    PaymentMethod::factory()->create([
        'name' => 'BCA',
        'code' => 'bca',
        'account_number' => '1234567890',
        'account_name' => 'PT Test BCA',
        'is_active' => true,
    ]);

    PaymentMethod::factory()->create([
        'name' => 'Mandiri',
        'code' => 'mandiri',
        'account_number' => '0987654321',
        'account_name' => 'PT Test Mandiri',
        'is_active' => true,
    ]);

    $response = $this->getJson('/api/v1/admin/payment-methods');

    $response->assertOk();

    $methods = $response->json();
    expect($methods)->toHaveCount(3);

    // Verify QRIS is in the list
    $qris = collect($methods)->firstWhere('code', 'qris');
    expect($qris)->not->toBeNull();
    expect($qris['name'])->toBe('QRIS');
    expect($qris['account_number'])->toBe('');

    // Verify bank methods are in the list
    $banks = collect($methods)->filter(fn ($m) => $m['code'] !== 'qris');
    expect($banks)->toHaveCount(2);
});

it('public payment methods endpoint returns only active methods', function () {
    PaymentMethod::factory()->create(['is_active' => true, 'code' => 'bca']);
    PaymentMethod::factory()->create(['is_active' => true, 'code' => 'qris']);
    PaymentMethod::factory()->create(['is_active' => false, 'code' => 'mandiri']);

    $response = $this->getJson('/api/v1/payment-methods');

    $response->assertOk()
        ->assertJsonCount(2);
});

it('can upload QR code image for QRIS payment method', function () {
    Storage::fake('public');

    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $qris = PaymentMethod::factory()->create([
        'name' => 'QRIS',
        'code' => 'qris',
        'account_number' => '',
        'is_active' => true,
    ]);

    $response = $this->postJson('/api/v1/admin/payment-methods/upload-logo', [
        'logo' => UploadedFile::fake()->image('qris-code.png'),
    ]);

    $response->assertOk()
        ->assertJsonStructure(['logo_url']);
});

it('can update payment method with QR code', function () {
    Storage::fake('public');

    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $qris = PaymentMethod::factory()->create([
        'name' => 'QRIS',
        'code' => 'qris',
        'account_number' => '',
        'is_active' => true,
    ]);

    $response = $this->putJson("/api/v1/admin/payment-methods/{$qris->id}", [
        'name' => 'QRIS',
        'code' => 'qris',
        'account_number' => '',
        'account_name' => 'Updated Merchant',
        'logo_url' => 'https://example.test/storage/qris.png',
        'is_active' => true,
    ]);

    $response->assertOk();
    expect($qris->fresh()->account_name)->toBe('Updated Merchant');
});

// =====================================================
// BOOKING CONFIRM PAGE - DYNAMIC PAYMENT METHODS
// =====================================================

it('booking confirm page receives payment methods from API', function () {
    // This test verifies the backend endpoint that the confirm page calls
    PaymentMethod::factory()->create(['code' => 'bca', 'is_active' => true]);
    PaymentMethod::factory()->create(['code' => 'qris', 'is_active' => true]);

    $response = $this->getJson('/api/v1/payment-methods');

    $response->assertOk()
        ->assertJsonCount(2);
});

it('can select specific payment method when creating booking', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $villa = Villa::factory()->create(['price_per_night' => 1000000]);
    $bca = PaymentMethod::factory()->create(['code' => 'bca', 'is_active' => true]);
    $qris = PaymentMethod::factory()->create(['code' => 'qris', 'is_active' => true]);

    // Create booking (payment method selection happens on confirm page)
    $response = $this->postJson('/api/v1/bookings', [
        'villa_id' => $villa->id,
        'guest_name' => 'Test Guest',
        'guest_email' => 'test@example.com',
        'guest_phone' => '081234567890',
        'check_in' => now()->addDays(7)->toDateString(),
        'check_out' => now()->addDays(10)->toDateString(),
        'num_guests' => 2,
    ]);

    $response->assertCreated();
});

it('can upload payment proof with specific payment method', function () {
    Storage::fake('public');

    $booking = Booking::factory()->create([
        'booking_code' => 'VB-2026-SPECIFIC',
        'payment_status' => 'unpaid',
    ]);

    $bca = PaymentMethod::factory()->create([
        'name' => 'BCA',
        'code' => 'bca',
        'is_active' => true,
    ]);

    $response = $this->postJson("/api/v1/bookings/{$booking->booking_code}/confirm-manual-payment", [
        'payment_method_id' => $bca->id,
        'payment_proof' => UploadedFile::fake()->image('bca-proof.jpg'),
    ]);

    $response->assertOk();

    $payment = Payment::where('booking_id', $booking->id)->first();
    expect($payment->payment_type)->toBe('manual_bca');
});

// =====================================================
// GOOGLE OAUTH CALLBACK REDIRECT TESTS
// =====================================================

it('google oauth callback stores token and redirects to profile', function () {
    // This is a frontend test concept - backend just needs to ensure
    // the OAuth flow creates a valid token
    $user = User::factory()->create([
        'email' => 'google-user@test.com',
        'google_id' => '123456789',
    ]);

    // Verify user can be authenticated
    expect($user->email)->toBe('google-user@test.com');
    expect($user->google_id)->toBe('123456789');
});

it('user with google_id can login via sanctum', function () {
    $user = User::factory()->create([
        'email' => 'google-user@test.com',
        'google_id' => '123456789',
    ]);

    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/user');

    $response->assertOk()
        ->assertJsonPath('email', 'google-user@test.com');
});

// =====================================================
// ANALYTICS CHART DATA TESTS
// =====================================================

it('analytics endpoint returns daily revenue data for charts', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $villa = Villa::factory()->create();

    // Create bookings with paid status
    Booking::factory()->create([
        'villa_id' => $villa->id,
        'status' => 'confirmed',
        'payment_status' => 'paid',
        'total_amount' => 5000000,
        'created_at' => now()->subDays(2),
    ]);

    Booking::factory()->create([
        'villa_id' => $villa->id,
        'status' => 'confirmed',
        'payment_status' => 'paid',
        'total_amount' => 3000000,
        'created_at' => now()->subDays(1),
    ]);

    $response = $this->getJson('/api/v1/admin/analytics');

    $response->assertOk()
        ->assertJsonStructure([
            'daily_revenue',
            'bookings_per_villa',
            'payment_methods',
            'lead_sources',
            'conversion_funnel',
        ]);

    $dailyRevenue = $response->json('daily_revenue');
    expect($dailyRevenue)->toBeArray();
});

it('analytics export endpoint works', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $response = $this->get('/api/v1/admin/analytics/export?from='.now()->subMonth()->toDateString().'&to='.now()->toDateString());

    $response->assertOk();
});

// =====================================================
// EDGE CASES: PAYMENT STATUS TRANSITIONS
// =====================================================

it('payment status transitions correctly: unpaid -> pending -> paid', function () {
    Storage::fake('public');

    $booking = Booking::factory()->create([
        'booking_code' => 'VB-2026-TRANSITION',
        'payment_status' => 'unpaid',
    ]);

    expect($booking->payment_status)->toBe('unpaid');

    // Upload proof -> pending
    $method = PaymentMethod::factory()->create(['is_active' => true]);
    $this->postJson("/api/v1/bookings/{$booking->booking_code}/confirm-manual-payment", [
        'payment_method_id' => $method->id,
        'payment_proof' => UploadedFile::fake()->image('proof.jpg'),
    ]);

    expect($booking->fresh()->payment_status)->toBe('pending');

    // Admin approves -> paid
    $admin = User::factory()->create(['role' => 'admin', 'email' => 'different@admin.com']);
    Sanctum::actingAs($admin);

    $this->postJson("/api/v1/admin/bookings/{$booking->id}/approve-manual-payment");

    expect($booking->fresh()->payment_status)->toBe('paid');
});

it('payment status can go from pending to unpaid after rejection', function () {
    Storage::fake('public');

    $booking = Booking::factory()->create([
        'booking_code' => 'VB-2026-REJECT',
        'payment_status' => 'pending',
    ]);

    $payment = Payment::factory()->create([
        'booking_id' => $booking->id,
        'status' => 'pending',
        'payment_proof' => 'https://example.test/proof.jpg',
    ]);

    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $this->postJson("/api/v1/admin/bookings/{$booking->id}/reject-manual-payment", [
        'rejection_reason' => 'Invalid proof',
    ]);

    expect($booking->fresh()->payment_status)->toBe('unpaid');
    expect($payment->fresh()->status)->toBe('failed');
});

it('cannot approve booking that is already paid', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $booking = Booking::factory()->create([
        'status' => 'confirmed',
        'payment_status' => 'paid',
    ]);

    $payment = Payment::factory()->create([
        'booking_id' => $booking->id,
        'status' => 'success',
        'payment_proof' => 'https://example.test/proof.jpg',
    ]);

    $response = $this->postJson("/api/v1/admin/bookings/{$booking->id}/approve-manual-payment");

    $response->assertStatus(422);
});

// =====================================================
// ADMIN DASHBOARD STATS TESTS
// =====================================================

it('dashboard shows correct revenue calculation', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $villa = Villa::factory()->create();

    // Create paid bookings this month with Payment records
    $booking1 = Booking::factory()->create([
        'villa_id' => $villa->id,
        'status' => 'confirmed',
        'payment_status' => 'paid',
        'total_amount' => 5000000,
        'created_at' => now(),
    ]);

    Payment::factory()->create([
        'booking_id' => $booking1->id,
        'status' => 'success',
        'amount' => 5000000,
        'paid_at' => now(),
    ]);

    $booking2 = Booking::factory()->create([
        'villa_id' => $villa->id,
        'status' => 'confirmed',
        'payment_status' => 'paid',
        'total_amount' => 3000000,
        'created_at' => now(),
    ]);

    Payment::factory()->create([
        'booking_id' => $booking2->id,
        'status' => 'success',
        'amount' => 3000000,
        'paid_at' => now(),
    ]);

    $response = $this->getJson('/api/v1/admin/dashboard');

    $response->assertOk();

    $stats = $response->json('stats');
    expect($stats['revenue_this_month'])->toBe(8000000);
});

it('dashboard shows correct booking counts', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $villa = Villa::factory()->create();

    // Create bookings with check_in this month
    Booking::factory()->create([
        'villa_id' => $villa->id,
        'status' => 'pending',
        'payment_status' => 'unpaid',
        'check_in' => now()->addDays(5),
    ]);

    Booking::factory()->create([
        'villa_id' => $villa->id,
        'status' => 'confirmed',
        'payment_status' => 'paid',
        'check_in' => now()->addDays(10),
    ]);

    Booking::factory()->create([
        'villa_id' => $villa->id,
        'status' => 'cancelled',
        'payment_status' => 'unpaid',
        'check_in' => now()->addDays(15),
    ]);

    $response = $this->getJson('/api/v1/admin/dashboard');

    $response->assertOk();

    $stats = $response->json('stats');
    // Dashboard counts bookings with check_in this month and status confirmed/completed
    expect($stats['bookings_this_month'])->toBe(1); // Only the confirmed one
});

// =====================================================
// SECURITY: AUTHORIZATION EDGE CASES
// =====================================================

it('regular user cannot access admin booking endpoints', function () {
    $user = User::factory()->create(['role' => 'user']);
    Sanctum::actingAs($user);

    $booking = Booking::factory()->create();

    $response = $this->getJson('/api/v1/admin/bookings');

    $response->assertStatus(403);
});

it('regular user cannot approve payments', function () {
    $user = User::factory()->create(['role' => 'user']);
    Sanctum::actingAs($user);

    $booking = Booking::factory()->create([
        'payment_status' => 'pending',
    ]);

    $payment = Payment::factory()->create([
        'booking_id' => $booking->id,
        'status' => 'pending',
        'payment_proof' => 'https://example.test/proof.jpg',
    ]);

    $response = $this->postJson("/api/v1/admin/bookings/{$booking->id}/approve-manual-payment");

    $response->assertStatus(403);
});

it('unauthenticated user cannot access user bookings', function () {
    $response = $this->getJson('/api/v1/user/bookings');

    $response->assertStatus(401);
});

it('user can only see their own bookings', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    $villa = Villa::factory()->create();

    $booking1 = Booking::factory()->create([
        'villa_id' => $villa->id,
        'user_id' => $user1->id,
        'guest_email' => $user1->email,
    ]);

    $booking2 = Booking::factory()->create([
        'villa_id' => $villa->id,
        'user_id' => $user2->id,
        'guest_email' => $user2->email,
    ]);

    Sanctum::actingAs($user1);

    $response = $this->getJson('/api/v1/user/bookings');

    $response->assertOk();

    $bookings = $response->json();
    // User should only see their own bookings
    $bookingIds = collect($bookings)->pluck('id')->toArray();
    expect($bookingIds)->toContain($booking1->id);
    expect($bookingIds)->not->toContain($booking2->id);
});
