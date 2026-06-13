<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('villa_ical_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('villa_id')->constrained('villas')->onDelete('cascade');
            $table->string('channel_name'); // e.g. "Agoda", "Traveloka", "Booking.com", "Airbnb"
            $table->text('ical_url');       // The remote iCal feed URL to import
            $table->timestamp('last_synced_at')->nullable();
            $table->enum('sync_status', ['active', 'error', 'paused'])->default('active');
            $table->text('last_error')->nullable();
            $table->timestamps();

            $table->index(['villa_id', 'sync_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('villa_ical_links');
    }
};
