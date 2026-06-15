<?php

namespace Database\Factories;

use App\Models\Villa;
use App\Models\VillaIcalLink;
use Illuminate\Database\Eloquent\Factories\Factory;

class VillaIcalLinkFactory extends Factory
{
    protected $model = VillaIcalLink::class;

    public function definition(): array
    {
        $channels = ['Airbnb', 'Booking.com', 'Agoda', 'Traveloka'];

        return [
            'villa_id' => Villa::factory(),
            'channel_name' => fake()->randomElement($channels),
            'ical_url' => 'https://www.airbnb.com/calendar/ical/'.fake()->uuid().'.ics',
            'external_listing_id' => fake()->uuid(),
            'sync_status' => 'active',
        ];
    }
}
