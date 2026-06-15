<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $iconMap = [
            'Kolam Renang' => 'Waves',
            'WiFi' => 'Wifi',
            'AC' => 'Wind',
            'Dapur Lengkap' => 'Utensils',
            'Dapur' => 'Utensils',
            'BBQ Area' => 'Flame',
            'Water Heater' => 'Bath',
            'Smart TV' => 'Tv',
            'TV' => 'Tv',
            'Bak mandi' => 'Bath',
            'Private Jacuzzi' => 'Waves',
            'Butler Service' => 'Users',
            'Spa Room' => 'Heart',
            'Floating Breakfast' => 'Coffee',
            'Karaoke' => 'Trophy',
            'Diizinkan menitipkan bawaan' => 'Briefcase',
            'Kamera keamanan di bagian luar di properti' => 'Shield',
            'Alarm karbon monoksida' => 'Shield',
            'Alarm asap' => 'Shield',
            'Sampo' => 'Sparkles',
            'Sabun mandi' => 'Sparkles',
            'Air panas' => 'Thermometer',
            'Sabun mandi cair' => 'Sparkles',
            'Parkir' => 'Car',
            'Parkir gratis' => 'Car',
            'Brankas' => 'Lock',
            'Gym' => 'Dumbbell',
            'Alat masak' => 'CookingPot',
            'Mesin cuci' => 'WashingMachine',
            'Laundry' => 'WashingMachine',
            'EV Charging' => 'ParkingCircle',
            'Valet parking' => 'ParkingCircle',
            'Sound system' => 'Music',
            'Home theater' => 'Music',
            'Perlengkapan mandi' => 'Sparkles',
            'Asuransi' => 'ShieldCheck',
            'Garansi' => 'ShieldCheck',
            'Check-in mandiri' => 'Key',
            'Self check-in' => 'Key',
        ];

        $villas = DB::table('villas')->get(['id', 'amenities']);

        foreach ($villas as $villa) {
            $amenities = json_decode($villa->amenities, true);

            if (! is_array($amenities)) {
                continue;
            }

            // Skip if already converted (first item is an object with 'name' key)
            if (! empty($amenities) && isset($amenities[0]['name'])) {
                continue;
            }

            // Convert string[] to object[]
            $converted = [];
            foreach ($amenities as $amenity) {
                if (is_string($amenity)) {
                    $converted[] = [
                        'name' => $amenity,
                        'icon' => $iconMap[$amenity] ?? 'Check',
                    ];
                }
            }

            DB::table('villas')
                ->where('id', $villa->id)
                ->update(['amenities' => json_encode($converted)]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $villas = DB::table('villas')->get(['id', 'amenities']);

        foreach ($villas as $villa) {
            $amenities = json_decode($villa->amenities, true);

            if (! is_array($amenities)) {
                continue;
            }

            // Convert object[] back to string[]
            $reverted = [];
            foreach ($amenities as $amenity) {
                if (is_array($amenity) && isset($amenity['name'])) {
                    $reverted[] = $amenity['name'];
                }
            }

            DB::table('villas')
                ->where('id', $villa->id)
                ->update(['amenities' => json_encode($reverted)]);
        }
    }
};
