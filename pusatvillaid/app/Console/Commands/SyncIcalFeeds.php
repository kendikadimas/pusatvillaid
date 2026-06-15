<?php

namespace App\Console\Commands;

use App\Models\BlockedDate;
use App\Models\User;
use App\Models\VillaIcalLink;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SyncIcalFeeds extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'ical:sync
                            {--villa= : Sync only a specific villa ID}
                            {--link-id= : Sync only a specific iCal link ID}
                            {--dry-run : Show parsed events without saving}';

    /**
     * The console command description.
     */
    protected $description = 'Pull and parse iCal feeds from external OTA channels (Agoda, Traveloka, etc.) and block booked dates.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if ($linkId = $this->option('link-id')) {
            $link = VillaIcalLink::where('id', $linkId)->with('villa:id,name')->first();
            if (! $link) {
                $this->error("iCal link with ID {$linkId} not found.");

                return 1;
            }
            if ($link->sync_status !== 'active') {
                $this->error("iCal link with ID {$linkId} is not active.");

                return 1;
            }
            $links = collect([$link]);
        } else {
            $query = VillaIcalLink::where('sync_status', 'active');

            if ($villaId = $this->option('villa')) {
                $query->where('villa_id', $villaId);
            }

            $links = $query->with('villa:id,name')->get();
        }

        if ($links->isEmpty()) {
            $this->info('No active iCal links to sync.');

            return self::SUCCESS;
        }

        $this->info("Syncing {$links->count()} iCal feed(s)...");
        $totalBlocked = 0;

        foreach ($links as $link) {
            $this->line("  → [{$link->channel_name}] Villa: {$link->villa->name} (ID: {$link->villa_id})");

            try {
                $response = Http::timeout(15)->get($link->ical_url);

                if (! $response->successful()) {
                    throw new \Exception("HTTP {$response->status()}: Failed to fetch iCal feed.");
                }

                $icalContent = $response->body();
                $events = $this->parseIcal($icalContent);

                if ($this->option('dry-run')) {
                    $this->warn('    [DRY RUN] Found '.count($events).' event(s):');
                    foreach ($events as $event) {
                        $this->line("      {$event['start']} → {$event['end']} | {$event['summary']}");
                    }

                    continue;
                }

                $blockedCount = DB::transaction(function () use ($link, $events) {
                    $platformSource = str_replace(' ', '_', strtolower($link->channel_name));

                    // Delete existing blocked dates for this source and villa that are in the future
                    BlockedDate::where('villa_id', $link->villa_id)
                        ->where('source', $platformSource)
                        ->where('date', '>=', Carbon::today()->toDateString())
                        ->delete();

                    // Insert the newly parsed dates
                    return $this->blockDatesFromEvents($link->villa_id, $link->channel_name, $events);
                });

                $totalBlocked += $blockedCount;

                // Update sync status (only after transaction commits successfully)
                $link->update([
                    'last_synced_at' => now(),
                    'sync_status' => 'active',
                    'last_error' => null,
                ]);

                $this->info("    ✓ Blocked {$blockedCount} date(s) from {$link->channel_name}.");

            } catch (\Exception $e) {
                $errorMsg = $e->getMessage();
                $link->update([
                    'last_synced_at' => now(),
                    'sync_status' => 'error',
                    'last_error' => $errorMsg,
                ]);

                $this->error("    ✗ Error: {$errorMsg}");
                Log::error("SyncIcalFeeds: Error syncing link #{$link->id} ({$link->channel_name}): {$errorMsg}");
            }
        }

        $this->newLine();
        $this->info("Sync complete. Total new dates blocked: {$totalBlocked}.");
        Log::info("SyncIcalFeeds: Synced {$links->count()} feed(s), blocked {$totalBlocked} date(s).");

        return self::SUCCESS;
    }

    /**
     * Parse iCal (.ics) content into an array of events with start/end dates.
     *
     * Supports standard VEVENT blocks with DTSTART/DTEND properties.
     * Handles both date-only (YYYYMMDD) and datetime (YYYYMMDDTHHMMSS) formats.
     */
    private function parseIcal(string $content): array
    {
        $events = [];
        $lines = preg_split('/\r\n|\r|\n/', $content);

        // Handle line folding (lines starting with space or tab are continuations)
        $unfoldedLines = [];
        foreach ($lines as $line) {
            if (preg_match('/^[ \t]/', $line) && count($unfoldedLines) > 0) {
                $unfoldedLines[count($unfoldedLines) - 1] .= ltrim($line);
            } else {
                $unfoldedLines[] = $line;
            }
        }

        $inEvent = false;
        $currentEvent = [];

        foreach ($unfoldedLines as $line) {
            $line = trim($line);

            if ($line === 'BEGIN:VEVENT') {
                $inEvent = true;
                $currentEvent = ['summary' => 'Reserved'];

                continue;
            }

            if ($line === 'END:VEVENT') {
                $inEvent = false;
                if (! empty($currentEvent['start']) && ! empty($currentEvent['end'])) {
                    $events[] = $currentEvent;
                }

                continue;
            }

            if (! $inEvent) {
                continue;
            }

            // Parse DTSTART
            if (str_starts_with($line, 'DTSTART')) {
                $currentEvent['start'] = $this->parseIcalDate($line);
            }

            // Parse DTEND
            if (str_starts_with($line, 'DTEND')) {
                $currentEvent['end'] = $this->parseIcalDate($line);
            }

            // Parse SUMMARY
            if (str_starts_with($line, 'SUMMARY')) {
                $parts = explode(':', $line, 2);
                $currentEvent['summary'] = trim($parts[1] ?? 'Reserved');
            }
        }

        return $events;
    }

    /**
     * Extract a Y-m-d date from an iCal DTSTART/DTEND line.
     *
     * Handles formats like:
     *   DTSTART;VALUE=DATE:20260720
     *   DTSTART:20260720T140000Z
     *   DTSTART;TZID=Asia/Jakarta:20260720T140000
     */
    private function parseIcalDate(string $line): ?string
    {
        $parts = explode(':', $line, 2);
        $dateStr = trim($parts[1] ?? '');

        if (empty($dateStr)) {
            return null;
        }

        // Remove trailing Z (UTC indicator)
        $dateStr = rtrim($dateStr, 'Z');

        // Date-only format: YYYYMMDD
        if (strlen($dateStr) === 8 && ctype_digit($dateStr)) {
            return Carbon::createFromFormat('Ymd', $dateStr)->toDateString();
        }

        // DateTime format: YYYYMMDDTHHMMSS
        if (strlen($dateStr) === 15 && str_contains($dateStr, 'T')) {
            return Carbon::createFromFormat('Ymd\THis', $dateStr)->toDateString();
        }

        // Fallback: try Carbon parse
        try {
            return Carbon::parse($dateStr)->toDateString();
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Block dates from parsed iCal events.
     * Uses upsert to avoid duplicates — only inserts new blocked dates.
     */
    private function blockDatesFromEvents(int $villaId, string $channelName, array $events): int
    {
        $blockedCount = 0;
        $today = Carbon::today()->toDateString();
        $platformSource = str_replace(' ', '_', strtolower($channelName));

        foreach ($events as $event) {
            $start = Carbon::parse($event['start']);
            $end = Carbon::parse($event['end']);

            // Skip past events
            if ($end->toDateString() < $today) {
                continue;
            }

            // Block each night from start to end-1 (checkout day is free)
            $current = $start->copy();
            while ($current->lt($end)) {
                $dateStr = $current->toDateString();

                // Only block future dates
                if ($dateStr >= $today) {
                    $reason = "Booked via {$channelName}";

                    // Find a fallback user to satisfy the foreign key constraint
                    $userId = User::first()?->id ?? 1;

                    // Use firstOrCreate to avoid duplicates (villa_id + date is unique)
                    $created = BlockedDate::firstOrCreate(
                        [
                            'villa_id' => $villaId,
                            'date' => $dateStr,
                        ],
                        [
                            'reason' => $reason,
                            'created_by' => $userId,
                            'source' => $platformSource,
                        ]
                    );

                    if ($created->wasRecentlyCreated) {
                        $blockedCount++;
                    }
                }

                $current->addDay();
            }
        }

        return $blockedCount;
    }
}
