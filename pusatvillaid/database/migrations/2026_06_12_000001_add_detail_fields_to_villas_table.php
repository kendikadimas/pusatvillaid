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
            $table->string('host_name')->default('Admin');
            $table->integer('host_years')->default(1);
            $table->string('host_avatar', 1000)->nullable();
            $table->json('highlights')->nullable();
            $table->json('bedrooms_info')->nullable();
            $table->json('accessibility_features')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('villas', function (Blueprint $table) {
            $table->dropColumn([
                'host_name',
                'host_years',
                'host_avatar',
                'highlights',
                'bedrooms_info',
                'accessibility_features',
            ]);
        });
    }
};
