<?php

namespace Database\Factories;

use App\Models\Villa;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class VillaFactory extends Factory
{
    protected $model = Villa::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->paragraphs(3, true),
            'short_desc' => fake()->sentence(),
            'location' => fake()->randomElement(['Yogyakarta, Sleman', 'Bogor, Puncak', 'Bali, Ubud']),
            'maps_url' => 'https://maps.google.com/?q=-7.79558,110.36949',
            'bedrooms' => fake()->numberBetween(1, 5),
            'bathrooms' => fake()->numberBetween(1, 4),
            'max_guests' => fake()->numberBetween(2, 12),
            'price_per_night' => fake()->numberBetween(500000, 5000000),
            'weekend_price' => fake()->optional(0.7)->numberBetween(750000, 7500000),
            'min_nights' => 1,
            'amenities' => ['WiFi', 'Pool', 'AC'],
            'photos' => ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'],
            'rules' => 'No smoking indoors',
            'check_in_time' => '14:00',
            'check_out_time' => '12:00',
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => ['is_active' => false]);
    }
}
