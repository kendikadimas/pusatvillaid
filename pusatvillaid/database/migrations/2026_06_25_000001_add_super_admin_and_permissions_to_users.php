<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds a JSON `permissions` column to the users table.
     * This column is only meaningful for users with role = 'admin' (limited access).
     * Users with role = 'super_admin' implicitly have all permissions.
     * Users with role = 'user' have no permissions (guest/customer).
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // JSON array of permission slugs, e.g. ["bookings.view","villas.manage"]
            // Null = no explicit permissions (super_admin ignores this column)
            $table->json('permissions')->nullable()->after('role');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('permissions');
        });
    }
};
