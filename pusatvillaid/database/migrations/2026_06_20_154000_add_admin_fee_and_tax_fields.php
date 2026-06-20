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
        // 1. Add admin_fee to payment_methods
        Schema::table('payment_methods', function (Blueprint $table) {
            $table->integer('admin_fee')->default(0)->after('logo_url');
        });

        // 2. Add billing details to bookings
        Schema::table('bookings', function (Blueprint $table) {
            $table->unsignedBigInteger('payment_method_id')->nullable()->after('user_id');
            $table->integer('tax_amount')->default(0)->after('base_price');
            $table->integer('admin_fee')->default(0)->after('tax_amount');

            $table->foreign('payment_method_id')->references('id')->on('payment_methods')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['payment_method_id']);
            $table->dropColumn(['payment_method_id', 'tax_amount', 'admin_fee']);
        });

        Schema::table('payment_methods', function (Blueprint $table) {
            $table->dropColumn('admin_fee');
        });
    }
};
