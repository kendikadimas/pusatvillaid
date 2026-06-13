<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VillaIcalLink extends Model
{
    use HasFactory;

    protected $fillable = [
        'villa_id',
        'channel_name',
        'ical_url',
        'external_listing_id',
        'last_synced_at',
        'sync_status',
        'last_error',
    ];

    protected $casts = [
        'last_synced_at' => 'datetime',
    ];

    public function villa(): BelongsTo
    {
        return $this->belongsTo(Villa::class);
    }
}
