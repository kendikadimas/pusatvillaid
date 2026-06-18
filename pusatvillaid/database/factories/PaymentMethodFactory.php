<?php

namespace Database\Factories;

use App\Models\PaymentMethod;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentMethodFactory extends Factory
{
    protected $model = PaymentMethod::class;

    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['BCA', 'Mandiri', 'BNI', 'BRI', 'QRIS']),
            'code' => fake()->unique()->randomElement(['bca', 'mandiri', 'bni', 'bri', 'qris']),
            'account_number' => fake()->numerify('############'),
            'account_name' => fake()->name(),
            'logo_url' => null,
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function qris(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'QRIS',
            'code' => 'qris',
            'account_number' => '',
            'account_name' => 'Merchant '.fake()->company(),
        ]);
    }
}
