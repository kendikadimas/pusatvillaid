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
        Schema::create('villas', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('short_desc', 500)->nullable();
            $table->string('location');
            $table->text('maps_url')->nullable();
            $table->tinyInteger('bedrooms')->default(1);
            $table->tinyInteger('bathrooms')->default(1);
            $table->tinyInteger('max_guests')->default(2);
            $table->decimal('price_per_night', 12, 2);
            $table->decimal('weekend_price', 12, 2)->nullable();
            $table->tinyInteger('min_nights')->default(1);
            $table->json('amenities')->nullable(); // JSON array of strings
            $table->json('photos')->nullable(); // JSON array of photo URLs
            $table->text('rules')->nullable();
            $table->time('check_in_time')->default('14:00:00');
            $table->time('check_out_time')->default('12:00:00');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('villas');
    }
};
