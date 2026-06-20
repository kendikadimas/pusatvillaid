<?php

use App\Models\User;
use App\Models\Villa;
use App\Models\VillaIcalLink;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->user = User::factory()->create(['role' => 'admin']);
    $this->villa = Villa::create([
        'name' => 'Cozy Test Villa',
        'slug' => 'cozy-test-villa',
        'location' => 'Seminyak, Bali',
        'price_per_night' => 1500000,
    ]);
});

test('admin can verify a valid ical feed', function () {
    Http::fake([
        'https://www.airbnb.com/*' => Http::response(
            "BEGIN:VCALENDAR\r\n".
            "VERSION:2.0\r\n".
            "X-WR-CALNAME:Airbnb - Cozy Test Villa\r\n".
            'END:VCALENDAR',
            200
        ),
    ]);

    $response = $this->actingAs($this->user)
        ->postJson('/api/v1/admin/ical/verify', [
            'channel_name' => 'Airbnb',
            'ical_url' => 'https://www.airbnb.com/calendar/ical/123456.ics?s=token',
        ]);

    $response->assertStatus(200)
        ->assertJson([
            'calendar_name' => 'Airbnb - Cozy Test Villa',
            'external_listing_id' => '123456',
            'is_already_linked' => false,
            'linked_to_villa' => null,
        ]);
});

test('admin cannot link duplicate listing id for the same channel', function () {
    // Save existing link
    VillaIcalLink::create([
        'villa_id' => $this->villa->id,
        'channel_name' => 'Airbnb',
        'ical_url' => 'https://www.airbnb.com/calendar/ical/123456.ics?s=token',
        'external_listing_id' => '123456',
        'sync_status' => 'active',
    ]);

    // Try storing another one on same/different villa
    $response = $this->actingAs($this->user)
        ->postJson("/api/v1/admin/villas/{$this->villa->id}/ical-links", [
            'channel_name' => 'Airbnb',
            'ical_url' => 'https://www.airbnb.com/calendar/ical/123456.ics?s=another_token',
        ]);

    $response->assertStatus(422)
        ->assertJsonPath('message', 'Kalender dari channel ini sudah dihubungkan ke villa lain.');
});

test('admin can verify duplication details when checking already linked ical', function () {
    // Save existing link
    VillaIcalLink::create([
        'villa_id' => $this->villa->id,
        'channel_name' => 'Airbnb',
        'ical_url' => 'https://www.airbnb.com/calendar/ical/123456.ics?s=token',
        'external_listing_id' => '123456',
        'sync_status' => 'active',
    ]);

    Http::fake([
        'https://www.airbnb.com/*' => Http::response(
            "BEGIN:VCALENDAR\r\n".
            "VERSION:2.0\r\n".
            "X-WR-CALNAME:Airbnb - Cozy Test Villa\r\n".
            'END:VCALENDAR',
            200
        ),
    ]);

    // Verify duplication
    $response = $this->actingAs($this->user)
        ->postJson('/api/v1/admin/ical/verify', [
            'channel_name' => 'Airbnb',
            'ical_url' => 'https://www.airbnb.com/calendar/ical/123456.ics?s=another_token',
        ]);

    $response->assertStatus(200)
        ->assertJson([
            'calendar_name' => 'Airbnb - Cozy Test Villa',
            'external_listing_id' => '123456',
            'is_already_linked' => true,
            'linked_to_villa' => 'Cozy Test Villa',
        ]);
});
