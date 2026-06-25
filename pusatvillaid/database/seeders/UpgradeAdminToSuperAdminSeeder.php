<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Upgrades all existing 'admin' role users to 'super_admin'.
 *
 * Run once after deploying the multi-admin management feature.
 * Usage: php artisan db:seed --class=UpgradeAdminToSuperAdminSeeder
 */
class UpgradeAdminToSuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $updated = User::where('role', 'admin')->update(['role' => 'super_admin']);

        $this->command->info("Upgraded {$updated} admin(s) to super_admin.");
    }
}
