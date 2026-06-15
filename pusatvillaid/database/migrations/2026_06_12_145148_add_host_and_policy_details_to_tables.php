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
        Schema::table('villas', function (Blueprint $table) {
            $table->string('host_joined_label')->nullable();
            $table->boolean('host_is_verified')->default(true);
            $table->json('host_about')->nullable();
            $table->json('co_hosts')->nullable();
            $table->text('cancellation_policy')->nullable();
            $table->json('safety_property')->nullable();
            $table->text('neighborhood_desc')->nullable();
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->string('guest_avatar', 1000)->nullable();
            $table->string('guest_subtitle')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('villas', function (Blueprint $table) {
            $table->dropColumn([
                'host_joined_label',
                'host_is_verified',
                'host_about',
                'co_hosts',
                'cancellation_policy',
                'safety_property',
                'neighborhood_desc',
            ]);
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropColumn([
                'guest_avatar',
                'guest_subtitle',
            ]);
        });
    }
};
