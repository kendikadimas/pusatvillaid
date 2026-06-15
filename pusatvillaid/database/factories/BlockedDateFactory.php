<?php

namespace Database\Factories;

use App\Models\BlockedDate;
use App\Models\User;
use App\Models\Villa;
use Illuminate\Database\Eloquent\Factories\Factory;

class BlockedDateFactory extends Factory
{
    protected $model = BlockedDate::class;

    public function definition(): array
    {
        return [
            'villa_id' => Villa::factory(),
            'date' => now()->addDays(fake()->numberBetween(1, 60))->toDateString(),
            'reason' => fake()->optional()->sentence(),
            'created_by' => User::factory()->create()->id,
        ];
    }
}
