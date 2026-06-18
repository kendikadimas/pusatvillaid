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
// BUG FIX: Authentication & Authorization Tests
// =====================================================

it('requires authentication to create booking', function () {
    $villa = Villa::factory()->create(['price_per_night' => 1000000]);

    $response = $this->postJson('/api/v1/bookings', [
        'villa_id' => $villa->id,
        'guest_name' => 'Test Guest',
        'guest_email' => 'test@example.com',
        'guest_phone' => '081234567890',
        'check_in' => now()->addDays(7)->toDateString(),
        'check_out' => now()->addDays(10)->toDateString(),
        'num_guests' => 2,
    ]);

    $response->assertStatus(401); // Should require auth
});

it('authenticated user can create booking', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $villa = Villa::factory()->create(['price_per_night' => 1000000]);

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

it('admin role is required for admin endpoints', function () {
    $user = User::factory()->create(['role' => 'user']); // Regular user
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/admin/dashboard');

    $response->assertStatus(403); // Forbidden
});

it('user with admin role can access admin endpoints', function () {
    $user = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/admin/dashboard');

    $response->assertOk();
});

// =====================================================
// BUG FIX: PaymentMethod Factory Tests
// =====================================================

it('can create payment method via factory', function () {
    $method = PaymentMethod::factory()->create([
        'name' => 'BCA Transfer',
        'code' => 'bca',
        'account_number' => '1234567890',
        'account_name' => 'PT Test',
        'is_active' => true,
    ]);

    expect($method)->toBeInstanceOf(PaymentMethod::class);
    expect($method->name)->toBe('BCA Transfer');
});

it('can create QRIS payment method', function () {
    $method = PaymentMethod::factory()->create([
        'name' => 'QRIS',
        'code' => 'qris',
        'account_number' => '',
        'account_name' => 'Merchant Test',
        'is_active' => true,
    ]);

    expect($method->code)->toBe('qris');
});

// =====================================================
// NEW FEATURE: Pending Payment Status Tests
// =====================================================

it('sets payment_status to pending when proof is uploaded', function () {
    Storage::fake('public');

    $booking = Booking::factory()->create([
        'booking_code' => 'VB-2026-TEST1',
        'payment_status' => 'unpaid',
    ]);

    $method = PaymentMethod::factory()->create(['is_active' => true]);

    $response = $this->postJson("/api/v1/bookings/{$booking->booking_code}/confirm-manual-payment", [
        'payment_method_id' => $method->id,
        'payment_proof' => UploadedFile::fake()->image('proof.jpg'),
    ]);

    $response->assertOk();

    // Check that booking payment_status is now 'pending'
    expect($booking->fresh()->payment_status)->toBe('pending');
});

it('admin can see pending payment status in booking list', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $booking = Booking::factory()->create([
        'payment_status' => 'pending',
    ]);

    $response = $this->getJson('/api/v1/admin/bookings?payment_status=pending');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.payment_status', 'pending');
});

it('admin can filter bookings by pending payment status', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    Booking::factory()->create(['payment_status' => 'pending']);
    Booking::factory()->create(['payment_status' => 'unpaid']);
    Booking::factory()->create(['payment_status' => 'paid']);

    $response = $this->getJson('/api/v1/admin/bookings?payment_status=pending');

    $response->assertOk()
        ->assertJsonCount(1, 'data');
});

// =====================================================
// NEW FEATURE: Self-Approval Prevention Tests
// =====================================================

it('admin cannot approve their own booking via approve endpoint', function () {
    $admin = User::factory()->create([
        'email' => 'admin@test.com',
        'role' => 'admin',
    ]);
    Sanctum::actingAs($admin);

    $booking = Booking::factory()->create([
        'guest_email' => 'admin@test.com', // Same email as admin
        'payment_status' => 'pending',
    ]);

    $payment = Payment::factory()->create([
        'booking_id' => $booking->id,
        'status' => 'pending',
        'payment_proof' => 'https://example.test/proof.jpg',
    ]);

    $response = $this->postJson("/api/v1/admin/bookings/{$booking->id}/approve-manual-payment");

    $response->assertStatus(403);
    expect($booking->fresh()->payment_status)->toBe('pending'); // Still pending
});

it('admin cannot confirm their own booking via status update', function () {
    $admin = User::factory()->create([
        'email' => 'admin@test.com',
        'role' => 'admin',
    ]);
    Sanctum::actingAs($admin);

    $booking = Booking::factory()->create([
        'guest_email' => 'admin@test.com', // Same email as admin
        'status' => 'pending',
        'payment_status' => 'pending',
    ]);

    $response = $this->patchJson("/api/v1/admin/bookings/{$booking->id}/status", [
        'status' => 'confirmed',
        'payment_status' => 'paid',
    ]);

    $response->assertStatus(403);
    expect($booking->fresh()->status)->toBe('pending'); // Still pending
});

it('admin can approve booking from different guest', function () {
    $admin = User::factory()->create([
        'email' => 'admin@test.com',
        'role' => 'admin',
    ]);
    Sanctum::actingAs($admin);

    $booking = Booking::factory()->create([
        'guest_email' => 'guest@test.com', // Different email
        'payment_status' => 'pending',
    ]);

    $payment = Payment::factory()->create([
        'booking_id' => $booking->id,
        'status' => 'pending',
        'payment_proof' => 'https://example.test/proof.jpg',
    ]);

    $response = $this->postJson("/api/v1/admin/bookings/{$booking->id}/approve-manual-payment");

    $response->assertOk();
    expect($booking->fresh()->payment_status)->toBe('paid');
});

it('admin can cancel their own booking', function () {
    $admin = User::factory()->create([
        'email' => 'admin@test.com',
        'role' => 'admin',
    ]);
    Sanctum::actingAs($admin);

    $booking = Booking::factory()->create([
        'guest_email' => 'admin@test.com', // Same email
        'status' => 'pending',
    ]);

    $response = $this->patchJson("/api/v1/admin/bookings/{$booking->id}/status", [
        'status' => 'cancelled',
        'payment_status' => 'unpaid',
        'cancel_reason' => 'Admin decided to cancel',
    ]);

    $response->assertOk();
    expect($booking->fresh()->status)->toBe('cancelled');
});

it('admin can reject their own booking payment', function () {
    $admin = User::factory()->create([
        'email' => 'admin@test.com',
        'role' => 'admin',
    ]);
    Sanctum::actingAs($admin);

    $booking = Booking::factory()->create([
        'guest_email' => 'admin@test.com', // Same email
        'payment_status' => 'pending',
    ]);

    $payment = Payment::factory()->create([
        'booking_id' => $booking->id,
        'status' => 'pending',
        'payment_proof' => 'https://example.test/proof.jpg',
    ]);

    $response = $this->postJson("/api/v1/admin/bookings/{$booking->id}/reject-manual-payment", [
        'rejection_reason' => 'Invalid proof',
    ]);

    $response->assertOk();
    expect($payment->fresh()->status)->toBe('failed');
});

// =====================================================
// COMPREHENSIVE: Booking Workflow Tests
// =====================================================

it('complete booking workflow: create -> upload proof -> admin approve', function () {
    Storage::fake('public');

    // 1. Guest creates booking
    $guest = User::factory()->create();
    Sanctum::actingAs($guest);

    $villa = Villa::factory()->create(['price_per_night' => 1000000]);
    $method = PaymentMethod::factory()->create(['is_active' => true]);

    $createResponse = $this->postJson('/api/v1/bookings', [
        'villa_id' => $villa->id,
        'guest_name' => 'Test Guest',
        'guest_email' => 'guest@test.com',
        'guest_phone' => '081234567890',
        'check_in' => now()->addDays(7)->toDateString(),
        'check_out' => now()->addDays(10)->toDateString(),
        'num_guests' => 2,
    ]);

    $createResponse->assertCreated();
    $bookingCode = $createResponse->json('booking_code');
    $booking = Booking::where('booking_code', $bookingCode)->first();

    expect($booking->status)->toBe('pending');
    expect($booking->payment_status)->toBe('unpaid');

    // 2. Guest uploads payment proof
    $uploadResponse = $this->postJson("/api/v1/bookings/{$bookingCode}/confirm-manual-payment", [
        'payment_method_id' => $method->id,
        'payment_proof' => UploadedFile::fake()->image('proof.jpg'),
    ]);

    $uploadResponse->assertOk();
    expect($booking->fresh()->payment_status)->toBe('pending');

    // 3. Admin approves payment
    Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'email' => 'different@admin.com']));

    $approveResponse = $this->postJson("/api/v1/admin/bookings/{$booking->id}/approve-manual-payment");

    $approveResponse->assertOk();
    expect($booking->fresh()->status)->toBe('confirmed');
    expect($booking->fresh()->payment_status)->toBe('paid');
});

it('booking with rejected proof can be re-uploaded', function () {
    Storage::fake('public');

    $guest = User::factory()->create();
    Sanctum::actingAs($guest);

    $booking = Booking::factory()->create([
        'booking_code' => 'VB-2026-REUPLOAD',
        'payment_status' => 'unpaid',
    ]);

    $method = PaymentMethod::factory()->create(['is_active' => true]);

    $payment = Payment::factory()->create([
        'booking_id' => $booking->id,
        'status' => 'failed',
        'rejection_reason' => 'Proof unclear',
        'payment_proof' => 'https://example.test/old-proof.jpg',
    ]);

    // Re-upload proof
    $response = $this->postJson("/api/v1/bookings/{$booking->booking_code}/confirm-manual-payment", [
        'payment_method_id' => $method->id,
        'payment_proof' => UploadedFile::fake()->image('new-proof.jpg'),
    ]);

    $response->assertOk();

    $freshPayment = $payment->fresh();
    expect($freshPayment->status)->toBe('pending');
    expect($freshPayment->rejection_reason)->toBeNull();
    expect($booking->fresh()->payment_status)->toBe('pending');
});

// =====================================================
// EDGE CASES: Validation & Error Handling
// =====================================================

it('prevents booking with check_in in the past', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $villa = Villa::factory()->create();

    $response = $this->postJson('/api/v1/bookings', [
        'villa_id' => $villa->id,
        'guest_name' => 'Test',
        'guest_email' => 'test@test.com',
        'guest_phone' => '081234567890',
        'check_in' => now()->subDays(2)->toDateString(),
        'check_out' => now()->addDays(2)->toDateString(),
        'num_guests' => 2,
    ]);

    $response->assertStatus(422);
});

it('prevents booking with check_out before check_in', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $villa = Villa::factory()->create();

    $response = $this->postJson('/api/v1/bookings', [
        'villa_id' => $villa->id,
        'guest_name' => 'Test',
        'guest_email' => 'test@test.com',
        'guest_phone' => '081234567890',
        'check_in' => now()->addDays(10)->toDateString(),
        'check_out' => now()->addDays(5)->toDateString(),
        'num_guests' => 2,
    ]);

    $response->assertStatus(422);
});

it('prevents booking for inactive villa', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $villa = Villa::factory()->create(['is_active' => false]);

    $response = $this->postJson('/api/v1/bookings', [
        'villa_id' => $villa->id,
        'guest_name' => 'Test',
        'guest_email' => 'test@test.com',
        'guest_phone' => '081234567890',
        'check_in' => now()->addDays(7)->toDateString(),
        'check_out' => now()->addDays(10)->toDateString(),
        'num_guests' => 2,
    ]);

    $response->assertStatus(422);
});

it('prevents uploading proof for already paid booking', function () {
    Storage::fake('public');

    $booking = Booking::factory()->create([
        'booking_code' => 'VB-2026-PAID',
        'payment_status' => 'paid',
    ]);

    $method = PaymentMethod::factory()->create(['is_active' => true]);

    $response = $this->postJson("/api/v1/bookings/{$booking->booking_code}/confirm-manual-payment", [
        'payment_method_id' => $method->id,
        'payment_proof' => UploadedFile::fake()->image('proof.jpg'),
    ]);

    $response->assertStatus(400);
});

it('prevents uploading proof with inactive payment method', function () {
    Storage::fake('public');

    $booking = Booking::factory()->create([
        'booking_code' => 'VB-2026-INACTIVE',
        'payment_status' => 'unpaid',
    ]);

    $method = PaymentMethod::factory()->create(['is_active' => false]);

    $response = $this->postJson("/api/v1/bookings/{$booking->booking_code}/confirm-manual-payment", [
        'payment_method_id' => $method->id,
        'payment_proof' => UploadedFile::fake()->image('proof.jpg'),
    ]);

    $response->assertStatus(422);
});

it('requires valid image format for payment proof', function () {
    Storage::fake('public');

    $booking = Booking::factory()->create([
        'booking_code' => 'VB-2026-INVALID',
        'payment_status' => 'unpaid',
    ]);

    $method = PaymentMethod::factory()->create(['is_active' => true]);

    $response = $this->postJson("/api/v1/bookings/{$booking->booking_code}/confirm-manual-payment", [
        'payment_method_id' => $method->id,
        'payment_proof' => UploadedFile::fake()->create('document.pdf', 100),
    ]);

    $response->assertStatus(422);
});

// =====================================================
// ADMIN OPERATIONS: Comprehensive Tests
// =====================================================

it('admin can update booking to completed status', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $booking = Booking::factory()->create([
        'status' => 'confirmed',
        'payment_status' => 'paid',
    ]);

    $response = $this->patchJson("/api/v1/admin/bookings/{$booking->id}/status", [
        'status' => 'completed',
        'payment_status' => 'paid',
    ]);

    $response->assertOk();
    expect($booking->fresh()->status)->toBe('completed');
});

it('admin can mark booking as refunded', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $booking = Booking::factory()->create([
        'status' => 'confirmed',
        'payment_status' => 'paid',
    ]);

    $response = $this->patchJson("/api/v1/admin/bookings/{$booking->id}/status", [
        'status' => 'cancelled',
        'payment_status' => 'refunded',
        'cancel_reason' => 'Guest requested refund',
    ]);

    $response->assertOk();
    expect($booking->fresh()->payment_status)->toBe('refunded');
});

it('admin can resend confirmation email', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $booking = Booking::factory()->create([
        'status' => 'confirmed',
        'guest_email' => 'guest@test.com',
    ]);

    $response = $this->postJson("/api/v1/admin/bookings/{$booking->id}/resend-email");

    $response->assertOk();
});

it('admin can list bookings with date range filter', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    Booking::factory()->create(['check_in' => '2026-07-01']);
    Booking::factory()->create(['check_in' => '2026-08-15']);
    Booking::factory()->create(['check_in' => '2026-09-20']);

    $response = $this->getJson('/api/v1/admin/bookings?check_in_from=2026-07-01&check_in_to=2026-08-31');

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('admin can search bookings by guest name', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    Booking::factory()->create(['guest_name' => 'John Doe']);
    Booking::factory()->create(['guest_name' => 'Jane Smith']);
    Booking::factory()->create(['guest_name' => 'Bob Johnson']);

    $response = $this->getJson('/api/v1/admin/bookings?search=John');

    $response->assertOk()
        ->assertJsonCount(2, 'data'); // John Doe and Bob Johnson
});
