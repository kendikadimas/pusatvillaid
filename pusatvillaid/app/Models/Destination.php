<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Destination extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'city',
        'query',
        'image',
        'count_fallback',
    ];

    public function villas(): HasMany
    {
        return $this->hasMany(Villa::class);
    }
}
