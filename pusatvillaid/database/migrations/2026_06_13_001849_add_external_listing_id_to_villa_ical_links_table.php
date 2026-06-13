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
        Schema::table('villa_ical_links', function (Blueprint $table) {
            $table->string('external_listing_id')->nullable()->after('ical_url');
            $table->unique(['channel_name', 'external_listing_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('villa_ical_links', function (Blueprint $table) {
            $table->dropUnique(['channel_name', 'external_listing_id']);
            $table->dropColumn('external_listing_id');
        });
    }
};
