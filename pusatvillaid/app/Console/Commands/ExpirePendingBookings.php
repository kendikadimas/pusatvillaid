<?php

namespace App\Console\Commands;

use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExpirePendingBookings extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'bookings:expire-pending
                            {--hours=1 : Hours after which pending bookings expire}
                            {--dry-run : Show what would be expired without actually changing anything}';

    /**
     * The console command description.
     */
    protected $description = 'Auto-cancel pending bookings that have not been paid within the configured hold time.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $hours = (int) $this->option('hours');
        $dryRun = $this->option('dry-run');
        $cutoff = Carbon::now()->subHours($hours);

        $query = Booking::where('status', 'pending')
            ->where('payment_status', 'unpaid')
            ->where('created_at', '<', $cutoff);

        $count = $query->count();

        if ($count === 0) {
            $this->info('No pending bookings to expire.');

            return self::SUCCESS;
        }

        if ($dryRun) {
            $this->warn("[DRY RUN] Would expire {$count} pending booking(s) created before {$cutoff->toDateTimeString()}:");
            $query->get(['id', 'booking_code', 'villa_id', 'check_in', 'check_out', 'created_at'])
                ->each(function ($booking) {
                    $this->line("  - {$booking->booking_code} | Villa #{$booking->villa_id} | {$booking->check_in} → {$booking->check_out} | Created: {$booking->created_at}");
                });

            return self::SUCCESS;
        }

        // Expire in bulk within a transaction
        DB::transaction(function () use ($query) {
            $query->update([
                'status' => 'cancelled',
                'payment_status' => 'expired',
                'cancel_reason' => 'Batas waktu pembayaran habis (auto-expire).',
                'cancelled_at' => now(),
            ]);
        });

        // Also expire related payment records
        $expiredBookingIds = Booking::where('status', 'cancelled')
            ->where('cancel_reason', 'like', '%auto-expire%')
            ->where('cancelled_at', '>=', now()->subMinutes(1))
            ->pluck('id');

        if ($expiredBookingIds->isNotEmpty()) {
            DB::table('payments')
                ->whereIn('booking_id', $expiredBookingIds)
                ->where('status', 'pending')
                ->update(['status' => 'expire']);
        }

        $this->info("Successfully expired {$count} pending booking(s) created before {$cutoff->toDateTimeString()}.");
        Log::info("ExpirePendingBookings: Expired {$count} booking(s) older than {$hours} hour(s).");

        return self::SUCCESS;
    }
}
