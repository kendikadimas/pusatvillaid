<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('villas', function (Blueprint $table) {
            $table->index('is_active', 'villas_is_active_idx');
            $table->index('created_at', 'villas_created_at_idx');
            $table->index('price_per_night', 'villas_price_per_night_idx');
            $table->index('bedrooms', 'villas_bedrooms_idx');
            $table->index('max_guests', 'villas_max_guests_idx');
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->index(['villa_id', 'is_approved', 'rating'], 'reviews_villa_approved_rating_idx');
        });
    }

    public function down(): void
    {
        Schema::table('villas', function (Blueprint $table) {
            $table->dropIndex('villas_is_active_idx');
            $table->dropIndex('villas_created_at_idx');
            $table->dropIndex('villas_price_per_night_idx');
            $table->dropIndex('villas_bedrooms_idx');
            $table->dropIndex('villas_max_guests_idx');
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex('reviews_villa_approved_rating_idx');
        });
    }
};
