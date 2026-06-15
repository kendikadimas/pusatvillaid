<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\ReviewToken;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReviewTokenFactory extends Factory
{
    protected $model = ReviewToken::class;

    public function definition(): array
    {
        return [
            'booking_id' => Booking::factory(),
            'token' => fake()->uuid(),
            'used' => false,
            'expires_at' => now()->addDays(30),
        ];
    }
}
