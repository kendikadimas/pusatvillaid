<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'booking_id' => Booking::factory(),
            'midtrans_order_id' => 'ORDER-'.fake()->unique()->numerify('#########'),
            'amount' => fake()->numberBetween(500000, 10000000),
            'status' => 'pending',
            'snap_token' => 'snap-token-'.fake()->uuid(),
            'expired_at' => now()->addHour(),
        ];
    }

    public function success(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'success',
            'paid_at' => now(),
            'payment_type' => 'bank_transfer',
            'midtrans_transaction_id' => 'TX-'.fake()->uuid(),
        ]);
    }
}
