<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduled Tasks
|--------------------------------------------------------------------------
|
| Auto-expire pending bookings every 5 minutes.
| Sync iCal feeds from external OTAs every 15 minutes.
|
| cPanel Cron: * * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
|
*/

Schedule::command('bookings:expire-pending --hours=1')->everyFiveMinutes()
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/expire-bookings.log'));

Schedule::command('ical:sync')->everyFifteenMinutes()
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/ical-sync.log'));
