<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('villas', function (Blueprint $table) {
            $table->unsignedTinyInteger('beds')->nullable()->after('bedrooms')->comment('Total jumlah tempat tidur (opsional, berbeda dari jumlah kamar)');
            $table->decimal('cleaning_fee', 12, 2)->nullable()->after('weekend_price')->comment('Biaya kebersihan sekali bayar, opsional');
        });
    }

    public function down(): void
    {
        Schema::table('villas', function (Blueprint $table) {
            $table->dropColumn(['beds', 'cleaning_fee']);
        });
    }
};
