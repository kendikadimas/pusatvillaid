<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Villa;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

class BookingFactory extends Factory
{
    protected $model = Booking::class;

    public function definition(): array
    {
        $checkIn = Carbon::now()->addDays(fake()->numberBetween(1, 30))->toDateString();
        $nights = fake()->numberBetween(1, 7);

        return [
            'booking_code' => 'VB-'.now()->year.'-'.str_pad(fake()->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'villa_id' => Villa::factory(),
            'guest_name' => fake()->name(),
            'guest_email' => fake()->unique()->safeEmail(),
            'guest_phone' => '08'.fake()->numerify('##########'),
            'check_in' => $checkIn,
            'check_out' => Carbon::parse($checkIn)->addDays($nights)->toDateString(),
            'total_nights' => $nights,
            'num_guests' => fake()->numberBetween(1, 4),
            'base_price' => 1000000,
            'total_amount' => $nights * 1000000,
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'notes' => null,
        ];
    }

    public function confirmed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'confirmed',
            'payment_status' => 'paid',
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);
    }
}
