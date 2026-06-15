<?php

namespace Database\Factories;

use App\Models\Destination;
use Illuminate\Database\Eloquent\Factories\Factory;

class DestinationFactory extends Factory
{
    protected $model = Destination::class;

    public function definition(): array
    {
        return [
            'name' => fake()->city().', '.fake()->state(),
            'city' => fake()->city(),
            'query' => fake()->city(),
            'image' => 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
            'count_fallback' => fake()->numberBetween(5, 20).'+ Villa',
        ];
    }
}
