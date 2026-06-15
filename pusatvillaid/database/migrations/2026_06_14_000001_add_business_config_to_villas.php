<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('villas', function (Blueprint $table) {
            $table->decimal('refundable_surcharge_rate', 5, 4)->default(0.1111)->comment('Surcharge rate for refundable bookings, e.g. 0.1111 = 11.11%');
            $table->integer('cancellation_free_days')->default(5)->comment('Days before check-in where cancellation is free');
        });
    }

    public function down(): void
    {
        Schema::table('villas', function (Blueprint $table) {
            $table->dropColumn(['refundable_surcharge_rate', 'cancellation_free_days']);
        });
    }
};
