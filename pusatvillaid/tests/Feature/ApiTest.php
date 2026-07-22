<?php

use App\Mail\BookingConfirmationMail;
use App\Mail\ManualPaymentRejectedMail;
use App\Models\BlockedDate;
use App\Models\Booking;
use App\Models\Destination;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Review;
use App\Models\ReviewToken;
use App\Models\User;
use App\Models\Villa;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

// =====================================================
// Villa Public API Tests
// =====================================================

it('can list active villas', function () {
    Villa::factory()->count(5)->create(['is_active' => true]);
    Villa::factory()->count(2)->create(['is_active' => false]);

    $response = $this->getJson('/api/v1/villas');

    $response->assertOk()
        ->assertJsonCount(5, 'data');
});

it('can list active villas in slim mode', function () {
    $villa = Villa::factory()->create([
        'is_active' => true,
        'description' => 'A very long description that should be excluded in slim mode.',
        'amenities' => ['wifi', 'pool', 'kitchen'],
    ]);

    $response = $this->getJson('/api/v1/villas?fields=slim');

    $response->assertOk();
    $data = $response->json('data');
    expect($data)->toHaveCount(1);

    // Assert included fields
    expect($data[0])->toHaveKey('id')
        ->toHaveKey('name')
        ->toHaveKey('slug')
        ->toHaveKey('location')
        ->toHaveKey('photos');

    // Assert excluded fields
    expect($data[0])->not->toHaveKey('description')
        ->not->toHaveKey('amenities')
        ->not->toHaveKey('rules');
});

it('can filter villas by location', function () {
    Villa::factory()->create(['location' => 'Bogor, Puncak', 'is_active' => true]);
    Villa::factory()->create(['location' => 'Yogyakarta, Sleman', 'is_active' => true]);

    $response = $this->getJson('/api/v1/villas?location=Bogor');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.location', 'Bogor, Puncak');
});

it('can filter villas by bedrooms', function () {
    Villa::factory()->create(['bedrooms' => 2, 'is_active' => true]);
    Villa::factory()->create(['bedrooms' => 4, 'is_active' => true]);

    $response = $this->getJson('/api/v1/villas?bedrooms=3');

    $response->assertOk()
        ->assertJsonCount(1, 'data');
});

it('can filter villas by guest capacity', function () {
    Villa::factory()->create(['max_guests' => 4, 'is_active' => true]);
    Villa::factory()->create(['max_guests' => 8, 'is_active' => true]);

    $response = $this->getJson('/api/v1/villas?guests=6');

    $response->assertOk()
        ->assertJsonCount(1, 'data');
});

it('can filter villas by price range', function () {
    Villa::factory()->create(['price_per_night' => 500000, 'is_active' => true]);
    Villa::factory()->create(['price_per_night' => 1500000, 'is_active' => true]);
    Villa::factory()->create(['price_per_night' => 3000000, 'is_active' => true]);

    $response = $this->getJson('/api/v1/villas?min_price=1000000&max_price=2000000');

    $response->assertOk()
        ->assertJsonCount(1, 'data');
});

it('can show villa detail by slug', function () {
    $villa = Villa::factory()->create(['name' => 'Villa Mewah', 'is_active' => true]);

    $response = $this->getJson("/api/v1/villas/{$villa->slug}");

    $response->assertOk()
        ->assertJsonPath('villa.name', 'Villa Mewah')
        ->assertJsonStructure(['villa', 'reviews', 'stats']);
});

it('returns 404 for inactive villa', function () {
    $villa = Villa::factory()->create(['is_active' => false]);

    $response = $this->getJson("/api/v1/villas/{$villa->slug}");

    $response->assertNotFound();
});

it('can get villa availability with blocked dates', function () {
    $villa = Villa::factory()->create();
    // Create a booking that covers specific dates
    Booking::factory()->create([
        'villa_id' => $villa->id,
        'check_in' => '2026-07-01',
        'check_out' => '2026-07-04',
        'status' => 'confirmed',
    ]);
    // And a blocked date
    BlockedDate::factory()->create([
        'villa_id' => $villa->id,
        'date' => '2026-07-15',
    ]);

    $response = $this->getJson("/api/v1/villas/{$villa->slug}/availability");

    $response->assertOk()
        ->assertJsonStructure(['disabled_dates'])
        ->assertJsonCount(3 + 1, 'disabled_dates'); // 3 booking dates + 1 blocked
});

it('does not include cancelled bookings in availability', function () {
    $villa = Villa::factory()->create();
    Booking::factory()->create([
        'villa_id' => $villa->id,
        'check_in' => '2026-07-01',
        'check_out' => '2026-07-04',
        'status' => 'cancelled',
    ]);

    $response = $this->getJson("/api/v1/villas/{$villa->slug}/availability");

    $response->assertOk()
        ->assertJsonCount(0, 'disabled_dates');
});

// =====================================================
// Destination Public API Tests
// =====================================================

it('can list destinations', function () {
    Destination::factory()->count(3)->create();

    $response = $this->getJson('/api/v1/destinations');

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

// =====================================================
// Booking Public API Tests
// =====================================================

it('can create a booking', function () {
    Sanctum::actingAs(User::factory()->create());
    $villa = Villa::factory()->create(['price_per_night' => 1000000, 'weekend_price' => null]);

    $response = $this->postJson('/api/v1/bookings', [
        'villa_id' => $villa->id,
        'guest_name' => 'Test Guest',
        'guest_email' => 'test@example.com',
        'guest_phone' => '081234567890',
        'check_in' => now()->addDays(7)->toDateString(),
        'check_out' => now()->addDays(10)->toDateString(),
        'num_guests' => 2,
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['booking_code', 'snap_token', 'total_amount']);

    $this->assertDatabaseHas('bookings', [
        'guest_name' => 'Test Guest',
        'guest_email' => 'test@example.com',
        'status' => 'pending',
    ]);
});

it('validates required booking fields', function () {
    Sanctum::actingAs(User::factory()->create());
    $response = $this->postJson('/api/v1/bookings', []);

    $response->assertStatus(422)
        ->assertJsonStructure(['errors']);
});

it('prevents booking if guest count exceeds capacity', function () {
    Sanctum::actingAs(User::factory()->create());
    $villa = Villa::factory()->create(['max_guests' => 4]);

    $response = $this->postJson('/api/v1/bookings', [
        'villa_id' => $villa->id,
        'guest_name' => 'Test',
        'guest_email' => 'test@test.com',
        'guest_phone' => '081234567890',
        'check_in' => now()->addDays(7)->toDateString(),
        'check_out' => now()->addDays(10)->toDateString(),
        'num_guests' => 10,
    ]);

    $response->assertStatus(422);
});

it('prevents overlapping bookings', function () {
    Sanctum::actingAs(User::factory()->create());
    $villa = Villa::factory()->create();
    Booking::factory()->create([
        'villa_id' => $villa->id,
        'check_in' => '2026-07-10',
        'check_out' => '2026-07-15',
        'status' => 'confirmed',
    ]);

    $response = $this->postJson('/api/v1/bookings', [
        'villa_id' => $villa->id,
        'guest_name' => 'Guest 2',
        'guest_email' => 'guest2@test.com',
        'guest_phone' => '089876543210',
        'check_in' => '2026-07-12',
        'check_out' => '2026-07-17',
        'num_guests' => 2,
    ]);

    $response->assertStatus(422);
});

it('prevents booking on blocked dates', function () {
    Sanctum::actingAs(User::factory()->create());
    $villa = Villa::factory()->create();
    BlockedDate::factory()->create([
        'villa_id' => $villa->id,
        'date' => '2026-08-01',
    ]);

    $response = $this->postJson('/api/v1/bookings', [
        'villa_id' => $villa->id,
        'guest_name' => 'Guest',
        'guest_email' => 'guest@test.com',
        'guest_phone' => '081234567890',
        'check_in' => '2026-08-01',
        'check_out' => '2026-08-03',
        'num_guests' => 2,
    ]);

    $response->assertStatus(422);
});

it('can fetch booking by code and email', function () {
    $booking = Booking::factory()->create([
        'booking_code' => 'VB-2025-0100',
        'guest_email' => 'findme@test.com',
        'status' => 'confirmed',
    ]);

    $response = $this->getJson('/api/v1/bookings/VB-2025-0100?email=findme@test.com');

    $response->assertOk()
        ->assertJsonPath('booking_code', 'VB-2025-0100');
});

it('returns 400 for booking lookup without email', function () {
    $response = $this->getJson('/api/v1/bookings/TEST-CODE');

    $response->assertStatus(400);
});

it('returns 404 for invalid booking code/email', function () {
    $response = $this->getJson('/api/v1/bookings/INVALID?email=nonexistent@test.com');

    $response->assertNotFound();
});

it('calculates weekday vs weekend pricing', function () {
    Sanctum::actingAs(User::factory()->create());
    $villa = Villa::factory()->create([
        'price_per_night' => 1000000,
        'weekend_price' => 1500000,
    ]);

    // Tue 2026-09-01 to Sat 2026-09-05 = 4 nights: Tue, Wed, Thu, Fri
    // Tue-Thu = weekdays, Fri = weekend
    $response = $this->postJson('/api/v1/bookings', [
        'villa_id' => $villa->id,
        'guest_name' => 'Pricing Test',
        'guest_email' => 'pricing@test.com',
        'guest_phone' => '081111111111',
        'check_in' => '2026-09-01',
        'check_out' => '2026-09-05',
        'num_guests' => 2,
    ]);

    $response->assertCreated();
    // 3 weekdays * 1M + 1 weekend * 1.5M = 4.5M
    expect((int) $response->json('total_amount'))->toBe(4500000);
});

// =====================================================
// Review Public API Tests
// =====================================================

it('can list approved reviews for a villa', function () {
    $villa = Villa::factory()->create();
    $booking = Booking::factory()->create(['villa_id' => $villa->id]);

    Review::factory()->create(['villa_id' => $villa->id, 'booking_id' => $booking->id, 'rating' => 5, 'is_approved' => true]);
    Review::factory()->create(['villa_id' => $villa->id, 'booking_id' => $booking->id, 'rating' => 2, 'is_approved' => false]);

    $response = $this->getJson("/api/v1/reviews/{$villa->slug}");

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.rating', 5);
});

it('can validate and submit review via token', function () {
    $booking = Booking::factory()->create();
    $reviewToken = ReviewToken::factory()->create([
        'booking_id' => $booking->id,
        'token' => 'valid-submit-token',
        'used' => false,
    ]);

    $response = $this->postJson('/api/v1/review/valid-submit-token', [
        'rating' => 5,
        'comment' => 'Amazing experience! Best villa ever. Highly recommended for families.',
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['message']);

    $this->assertDatabaseHas('reviews', [
        'booking_id' => $booking->id,
        'rating' => 5,
        'is_approved' => false,
    ]);

    // Token should be marked as used
    expect($reviewToken->fresh()->used)->toBeTrue();
});

it('prevents double review submission with same token', function () {
    $booking = Booking::factory()->create();
    $reviewToken = ReviewToken::factory()->create([
        'booking_id' => $booking->id,
        'token' => 'one-time-token',
        'used' => true, // Already used
    ]);

    $response = $this->postJson('/api/v1/review/one-time-token', [
        'rating' => 4,
        'comment' => 'Another review attempt with same token.',
    ]);

    $response->assertStatus(400);
});

it('validates review comment min 20 characters', function () {
    $booking = Booking::factory()->create();
    ReviewToken::factory()->create([
        'booking_id' => $booking->id,
        'token' => 'short-comment-token',
    ]);

    $response = $this->postJson('/api/v1/review/short-comment-token', [
        'rating' => 4,
        'comment' => 'Too short',
    ]);

    $response->assertStatus(422)
        ->assertJsonStructure(['errors']);
});

// =====================================================
// Admin Auth API Tests
// =====================================================

it('can login as admin', function () {
    $user = User::factory()->create([
        'role' => 'admin',
        'email' => 'admin@pusatvilla.id',
        'password' => bcrypt('password123'),
    ]);

    $response = $this->postJson('/api/v1/admin/login', [
        'email' => 'admin@pusatvilla.id',
        'password' => 'password123',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['token', 'user']);
});

it('rejects invalid admin credentials', function () {
    $user = User::factory()->create([
        'email' => 'admin@test.com',
        'password' => bcrypt('correct-password'),
    ]);

    $response = $this->postJson('/api/v1/admin/login', [
        'email' => 'admin@test.com',
        'password' => 'wrong-password',
    ]);

    $response->assertStatus(401);
});

// =====================================================
// Admin API Tests (Authenticated)
// =====================================================

it('can access dashboard with valid admin token', function () {
    $user = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($user);
    Villa::factory()->count(3)->create();

    $response = $this->getJson('/api/v1/admin/dashboard');

    $response->assertOk()
        ->assertJsonStructure([
            'stats' => ['checkins_today', 'bookings_this_month', 'revenue_this_month', 'occupancy_rate'],
            'recent_bookings',
        ]);
});

it('can list bookings with filters', function () {
    $user = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($user);

    Booking::factory()->count(3)->confirmed()->create();
    Booking::factory()->cancelled()->create();

    $response = $this->getJson('/api/v1/admin/bookings?status=confirmed');

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

it('can view booking detail', function () {
    $user = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($user);

    $booking = Booking::factory()->create(['guest_name' => 'Detail Guest']);
    Payment::factory()->create(['booking_id' => $booking->id]);

    $response = $this->getJson("/api/v1/admin/bookings/{$booking->id}");

    $response->assertOk()
        ->assertJsonPath('guest_name', 'Detail Guest')
        ->assertJsonStructure(['villa', 'payment']);
});

it('can update booking status', function () {
    $user = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($user);

    $booking = Booking::factory()->create([
        'status' => 'pending',
        'payment_status' => 'unpaid',
    ]);

    $response = $this->patchJson("/api/v1/admin/bookings/{$booking->id}/status", [
        'status' => 'confirmed',
        'payment_status' => 'paid',
    ]);

    $response->assertOk()
        ->assertJsonPath('booking.status', 'confirmed');

    expect($booking->fresh()->status)->toBe('confirmed');
});

it('can cancel a booking with reason', function () {
    $user = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($user);

    $booking = Booking::factory()->create();

    $response = $this->patchJson("/api/v1/admin/bookings/{$booking->id}/status", [
        'status' => 'cancelled',
        'payment_status' => 'unpaid',
        'cancel_reason' => 'Tamu melakukan pembatalan via telepon.',
    ]);

    $response->assertOk();
    expect($booking->fresh()->cancel_reason)->toBe('Tamu melakukan pembatalan via telepon.');
});

it('can list all villas for admin', function () {
    $user = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($user);

    Villa::factory()->count(4)->create();

    $response = $this->getJson('/api/v1/admin/villas');

    $response->assertOk()
        ->assertJsonCount(4);
});

it('can create a villa via admin API', function () {
    $user = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($user);
    $destination = Destination::factory()->create();

    $response = $this->postJson('/api/v1/admin/villas', [
        'name' => 'New Admin Villa',
        'description' => 'A beautiful test villa',
        'short_desc' => 'Test villa',
        'location' => 'Bali, Ubud',
        'destination_id' => $destination->id,
        'bedrooms' => 3,
        'bathrooms' => 2,
        'max_guests' => 6,
        'price_per_night' => 2000000,
        'min_nights' => 2,
        'check_in_time' => '14:00',
        'check_out_time' => '12:00',
    ]);

    $response->assertCreated()
        ->assertJsonPath('villa.name', 'New Admin Villa');

    expect(Villa::where('name', 'New Admin Villa')->exists())->toBeTrue();
});

it('can update a villa', function () {
    $user = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($user);
    $destination = Destination::factory()->create();

    $villa = Villa::factory()->create(['name' => 'Old Name']);

    $response = $this->putJson("/api/v1/admin/villas/{$villa->id}", [
        'name' => 'Updated Name',
        'description' => 'Updated description',
        'short_desc' => 'Updated short',
        'location' => 'Updated location',
        'destination_id' => $destination->id,
        'bedrooms' => 4,
        'bathrooms' => 3,
        'max_guests' => 8,
        'price_per_night' => 3000000,
        'min_nights' => 1,
        'check_in_time' => '15:00',
        'check_out_time' => '11:00',
    ]);

    $response->assertOk()
        ->assertJsonPath('villa.name', 'Updated Name');

    expect($villa->fresh()->name)->toBe('Updated Name');
});

it('can block and unblock dates', function () {
    $user = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($user);

    $villa = Villa::factory()->create();

    // Block
    $blockResponse = $this->postJson('/api/v1/admin/blocked-dates', [
        'villa_id' => $villa->id,
        'date' => '2026-12-25',
        'reason' => 'Pemeliharaan Natal',
    ]);

    $blockResponse->assertCreated();
    expect(BlockedDate::where('villa_id', $villa->id)->where('date', '2026-12-25')->exists())->toBeTrue();

    // Unblock
    $blockedDate = BlockedDate::first();
    $unblockResponse = $this->deleteJson("/api/v1/admin/blocked-dates/{$blockedDate->id}");

    $unblockResponse->assertOk();
    expect(BlockedDate::where('villa_id', $villa->id)->where('date', '2026-12-25')->exists())->toBeFalse();
});

it('can approve and reject reviews', function () {
    $user = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($user);

    $review = Review::factory()->create(['is_approved' => false]);

    // Approve
    $approveResponse = $this->patchJson("/api/v1/admin/reviews/{$review->id}/approve");
    $approveResponse->assertOk();
    expect($review->fresh()->is_approved)->toBeTrue();

    // Reject/Delete
    $review2 = Review::factory()->create(['is_approved' => false]);
    $deleteResponse = $this->deleteJson("/api/v1/admin/reviews/{$review2->id}");
    $deleteResponse->assertOk();
    expect(Review::find($review2->id))->toBeNull();
});

it('can list analytics data', function () {
    $user = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/admin/analytics');

    $response->assertOk()
        ->assertJsonStructure([
            'period',
            'daily_revenue',
            'bookings_per_villa',
            'payment_methods',
            'lead_sources',
            'conversion_funnel',
        ]);
});

it('rejects unauthenticated admin requests', function () {
    $response = $this->getJson('/api/v1/admin/dashboard');

    $response->assertStatus(401);
});

// =====================================================
// Manual Payment Verification API Tests
// =====================================================

it('lets a guest upload a manual payment proof', function () {
    Storage::fake('public');

    $booking = Booking::factory()->create([
        'booking_code' => 'VB-2026-9001',
        'payment_status' => 'unpaid',
    ]);
    $method = PaymentMethod::factory()->create(['is_active' => true]);

    $response = $this->postJson("/api/v1/bookings/{$booking->booking_code}/confirm-manual-payment", [
        'payment_method_id' => $method->id,
        'payment_proof' => UploadedFile::fake()->image('proof.jpg'),
    ]);

    $response->assertOk()
        ->assertJsonStructure(['payment', 'message']);

    $this->assertDatabaseHas('payments', [
        'booking_id' => $booking->id,
        'status' => 'pending',
    ]);
});

it('admin can approve a manual payment', function () {
    Mail::fake();

    $user = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($user);

    $booking = Booking::factory()->create([
        'status' => 'pending',
        'payment_status' => 'unpaid',
    ]);
    $payment = Payment::factory()->create([
        'booking_id' => $booking->id,
        'status' => 'pending',
        'payment_proof' => 'https://example.test/storage/payment-proofs/proof.jpg',
    ]);

    $response = $this->postJson("/api/v1/admin/bookings/{$booking->id}/approve-manual-payment");

    $response->assertOk()
        ->assertJsonPath('booking.payment_status', 'paid');

    expect($booking->fresh()->status)->toBe('confirmed');
    expect($payment->fresh()->status)->toBe('success');
    Mail::assertSent(BookingConfirmationMail::class);
});

it('admin cannot approve a manual payment without proof', function () {
    $user = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($user);

    $booking = Booking::factory()->create(['payment_status' => 'unpaid']);
    Payment::factory()->create([
        'booking_id' => $booking->id,
        'status' => 'pending',
        'payment_proof' => null,
    ]);

    $response = $this->postJson("/api/v1/admin/bookings/{$booking->id}/approve-manual-payment");

    $response->assertStatus(422);
});

it('admin can reject a manual payment with a reason', function () {
    Mail::fake();

    $user = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($user);

    $booking = Booking::factory()->create(['payment_status' => 'unpaid']);
    $payment = Payment::factory()->create([
        'booking_id' => $booking->id,
        'status' => 'pending',
        'payment_proof' => 'https://example.test/storage/payment-proofs/proof.jpg',
    ]);

    $response = $this->postJson("/api/v1/admin/bookings/{$booking->id}/reject-manual-payment", [
        'rejection_reason' => 'Nominal transfer tidak sesuai dengan total tagihan.',
    ]);

    $response->assertOk();

    $fresh = $payment->fresh();
    expect($fresh->status)->toBe('failed');
    expect($fresh->rejection_reason)->toBe('Nominal transfer tidak sesuai dengan total tagihan.');
    expect($booking->fresh()->payment_status)->toBe('unpaid');
    Mail::assertSent(ManualPaymentRejectedMail::class);
});

it('admin reject requires a rejection reason', function () {
    $user = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($user);

    $booking = Booking::factory()->create(['payment_status' => 'unpaid']);
    Payment::factory()->create([
        'booking_id' => $booking->id,
        'status' => 'pending',
        'payment_proof' => 'https://example.test/storage/payment-proofs/proof.jpg',
    ]);

    $response = $this->postJson("/api/v1/admin/bookings/{$booking->id}/reject-manual-payment", []);

    $response->assertStatus(422)
        ->assertJsonStructure(['errors']);
});

it('guest re-upload after rejection resets payment to pending', function () {
    Storage::fake('public');

    $booking = Booking::factory()->create([
        'booking_code' => 'VB-2026-9002',
        'payment_status' => 'unpaid',
    ]);
    $method = PaymentMethod::factory()->create(['is_active' => true]);
    $payment = Payment::factory()->create([
        'booking_id' => $booking->id,
        'status' => 'failed',
        'rejection_reason' => 'Bukti tidak jelas.',
        'rejected_at' => now(),
        'payment_proof' => 'https://example.test/storage/payment-proofs/old.jpg',
    ]);

    $response = $this->postJson("/api/v1/bookings/{$booking->booking_code}/confirm-manual-payment", [
        'payment_method_id' => $method->id,
        'payment_proof' => UploadedFile::fake()->image('new-proof.jpg'),
    ]);

    $response->assertOk();

    $fresh = $payment->fresh();
    expect($fresh->status)->toBe('pending');
    expect($fresh->rejection_reason)->toBeNull();
});
