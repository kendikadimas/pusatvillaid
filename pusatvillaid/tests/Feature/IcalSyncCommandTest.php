<?php

use App\Models\BlockedDate;
use App\Models\User;
use App\Models\Villa;
use App\Models\VillaIcalLink;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->villa = Villa::create([
        'name' => 'Cozy Test Villa',
        'slug' => 'cozy-test-villa',
        'location' => 'Seminyak, Bali',
        'price_per_night' => 1500000,
    ]);
});

test('sync command imports blocked dates and preserves manual blocked dates', function () {
    $link = VillaIcalLink::create([
        'villa_id' => $this->villa->id,
        'channel_name' => 'Airbnb',
        'ical_url' => 'https://www.airbnb.com/calendar/ical/123456.ics?s=token',
        'external_listing_id' => '123456',
        'sync_status' => 'active',
    ]);

    // Create a manual blocked date
    $manualDate = Carbon::today()->addDays(5)->toDateString();
    BlockedDate::create([
        'villa_id' => $this->villa->id,
        'date' => $manualDate,
        'reason' => 'Manual blocking',
        'created_by' => $this->user->id,
        'source' => 'manual',
    ]);

    // Mock iCal response with two future events:
    // Event 1: today + 1 to today + 3
    // Event 2: today + 7 to today + 9
    $start1 = Carbon::today()->addDays(1)->format('Ymd');
    $end1 = Carbon::today()->addDays(3)->format('Ymd');
    $start2 = Carbon::today()->addDays(7)->format('Ymd');
    $end2 = Carbon::today()->addDays(9)->format('Ymd');

    Http::fake([
        'https://www.airbnb.com/*' => Http::response(
            "BEGIN:VCALENDAR\r\n".
            "VERSION:2.0\r\n".
            "X-WR-CALNAME:Airbnb - Cozy Test Villa\r\n".
            "BEGIN:VEVENT\r\n".
            "DTSTART;VALUE=DATE:{$start1}\r\n".
            "DTEND;VALUE=DATE:{$end1}\r\n".
            "SUMMARY:Reserved\r\n".
            "END:VEVENT\r\n".
            "BEGIN:VEVENT\r\n".
            "DTSTART;VALUE=DATE:{$start2}\r\n".
            "DTEND;VALUE=DATE:{$end2}\r\n".
            "SUMMARY:Reserved\r\n".
            "END:VEVENT\r\n".
            'END:VCALENDAR',
            200
        ),
    ]);

    // Run the sync command
    $this->artisan('ical:sync')
        ->assertExitCode(0);

    // Verify manual blocked date is preserved
    $this->assertDatabaseHas('blocked_dates', [
        'villa_id' => $this->villa->id,
        'date' => $manualDate,
        'source' => 'manual',
    ]);

    // Verify imported blocked dates from Airbnb (source: airbnb)
    // Event 1 blocks: start1, start1+1 (dtend is checkout, which is free)
    $this->assertDatabaseHas('blocked_dates', [
        'villa_id' => $this->villa->id,
        'date' => Carbon::today()->addDays(1)->toDateString(),
        'source' => 'airbnb',
    ]);
    $this->assertDatabaseHas('blocked_dates', [
        'villa_id' => $this->villa->id,
        'date' => Carbon::today()->addDays(2)->toDateString(),
        'source' => 'airbnb',
    ]);
    $this->assertDatabaseMissing('blocked_dates', [
        'villa_id' => $this->villa->id,
        'date' => Carbon::today()->addDays(3)->toDateString(),
        'source' => 'airbnb',
    ]);

    // Event 2 blocks: start2, start2+1
    $this->assertDatabaseHas('blocked_dates', [
        'villa_id' => $this->villa->id,
        'date' => Carbon::today()->addDays(7)->toDateString(),
        'source' => 'airbnb',
    ]);
    $this->assertDatabaseHas('blocked_dates', [
        'villa_id' => $this->villa->id,
        'date' => Carbon::today()->addDays(8)->toDateString(),
        'source' => 'airbnb',
    ]);
});

test('sync command removes old platform blocked dates on subsequent sync (cancellations)', function () {
    $link = VillaIcalLink::create([
        'villa_id' => $this->villa->id,
        'channel_name' => 'Airbnb',
        'ical_url' => 'https://www.airbnb.com/calendar/ical/123456.ics?s=token',
        'external_listing_id' => '123456',
        'sync_status' => 'active',
    ]);

    // Create a manual blocked date
    $manualDate = Carbon::today()->addDays(5)->toDateString();
    BlockedDate::create([
        'villa_id' => $this->villa->id,
        'date' => $manualDate,
        'reason' => 'Manual blocking',
        'created_by' => $this->user->id,
        'source' => 'manual',
    ]);

    // Sequence mock: Initial sync returns Event 1, subsequent sync returns Event 2 (cancellation of Event 1)
    $start1 = Carbon::today()->addDays(1)->format('Ymd');
    $end1 = Carbon::today()->addDays(3)->format('Ymd');
    $start2 = Carbon::today()->addDays(7)->format('Ymd');
    $end2 = Carbon::today()->addDays(9)->format('Ymd');

    Http::fake([
        'https://www.airbnb.com/*' => Http::sequence()
            ->push(
                "BEGIN:VCALENDAR\r\n".
                "VERSION:2.0\r\n".
                "BEGIN:VEVENT\r\n".
                "DTSTART;VALUE=DATE:{$start1}\r\n".
                "DTEND;VALUE=DATE:{$end1}\r\n".
                "END:VEVENT\r\n".
                'END:VCALENDAR',
                200
            )
            ->push(
                "BEGIN:VCALENDAR\r\n".
                "VERSION:2.0\r\n".
                "BEGIN:VEVENT\r\n".
                "DTSTART;VALUE=DATE:{$start2}\r\n".
                "DTEND;VALUE=DATE:{$end2}\r\n".
                "END:VEVENT\r\n".
                'END:VCALENDAR',
                200
            ),
    ]);

    $this->artisan('ical:sync')->assertExitCode(0);

    // Assert dates are blocked
    $this->assertDatabaseHas('blocked_dates', [
        'villa_id' => $this->villa->id,
        'date' => Carbon::today()->addDays(1)->toDateString(),
        'source' => 'airbnb',
    ]);

    $this->artisan('ical:sync')->assertExitCode(0);

    // Verify manual blocked date is still there
    $this->assertDatabaseHas('blocked_dates', [
        'villa_id' => $this->villa->id,
        'date' => $manualDate,
        'source' => 'manual',
    ]);

    // Verify old Airbnb blocked dates are removed
    $this->assertDatabaseMissing('blocked_dates', [
        'villa_id' => $this->villa->id,
        'date' => Carbon::today()->addDays(1)->toDateString(),
        'source' => 'airbnb',
    ]);

    // Verify new Airbnb blocked dates are added
    $this->assertDatabaseHas('blocked_dates', [
        'villa_id' => $this->villa->id,
        'date' => Carbon::today()->addDays(7)->toDateString(),
        'source' => 'airbnb',
    ]);
});

test('sync command with --link-id only syncs the specified link', function () {
    $villa2 = Villa::create([
        'name' => 'Second Test Villa',
        'slug' => 'second-test-villa',
        'location' => 'Ubud, Bali',
        'price_per_night' => 1200000,
    ]);

    $link1 = VillaIcalLink::create([
        'villa_id' => $this->villa->id,
        'channel_name' => 'Airbnb',
        'ical_url' => 'https://www.airbnb.com/calendar/ical/111.ics?s=token',
        'external_listing_id' => '111',
        'sync_status' => 'active',
    ]);

    $link2 = VillaIcalLink::create([
        'villa_id' => $villa2->id,
        'channel_name' => 'Airbnb',
        'ical_url' => 'https://www.airbnb.com/calendar/ical/222.ics?s=token',
        'external_listing_id' => '222',
        'sync_status' => 'active',
    ]);

    $dateStr = Carbon::today()->addDays(2)->format('Ymd');

    Http::fake([
        'https://www.airbnb.com/calendar/ical/111*' => Http::response(
            "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:{$dateStr}\r\nDTEND;VALUE=DATE:20261231\r\nEND:VEVENT\r\nEND:VCALENDAR", 200
        ),
        'https://www.airbnb.com/calendar/ical/222*' => Http::response(
            "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:{$dateStr}\r\nDTEND;VALUE=DATE:20261231\r\nEND:VEVENT\r\nEND:VCALENDAR", 200
        ),
    ]);

    // Sync only link1
    $this->artisan("ical:sync --link-id={$link1->id}")
        ->assertExitCode(0);

    // Verify villa 1 is blocked
    $this->assertDatabaseHas('blocked_dates', [
        'villa_id' => $this->villa->id,
        'date' => Carbon::today()->addDays(2)->toDateString(),
    ]);

    // Verify villa 2 is NOT blocked
    $this->assertDatabaseMissing('blocked_dates', [
        'villa_id' => $villa2->id,
        'date' => Carbon::today()->addDays(2)->toDateString(),
    ]);
});
